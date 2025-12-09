# Event Cache 迁移到 Django 方案

## 📊 现状分析

当前使用 **Express + JSON文件缓存** 存储 DeepSeek API 响应，存在：
- ❌ 与 Django/PostgreSQL 主数据分离
- ❌ 无并发控制、无事务支持
- ❌ 难以管理、备份和查询

## 🎯 目标架构

统一存储层：
```
React Frontend
    ↓
Django REST API (Port 8000) ← PostgreSQL (事件元数据 + 缓存内容)
    ↓
OpenRouter API (DeepSeek)
```

## 📋 迁移步骤

### 1️⃣ Django 模型创建

**文件**: `dj_backend/timeline/models_event_cache.py`
```python
class EventCache(models.Model):
    uuid = models.CharField(max_length=64, primary_key=True)
    year = models.IntegerField(db_index=True)
    event_title = models.CharField(max_length=200, blank=True)
    context = models.TextField()
    content = models.TextField()
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**操作**:
```bash
cd dj_backend/
python manage.py makemigrations timeline
python manage.py migrate
```

### 2️⃣ 数据迁移脚本

**文件**: `dj_backend/timeline/management/commands/migrate_event_cache.py`
```python
import json
from django.core.management.base import BaseCommand
from timeline.models_event_cache import EventCache

class Command(BaseCommand):
    help = 'Migrate eventsCache.json to PostgreSQL'
    
    def handle(self, *args, **options):
        # Load JSON
        with open('../../history_river/server/storage/eventsCache.json', 'r') as f:
            data = json.load(f)
        
        # Migrate to PostgreSQL
        count = 0
        for uuid, content in data.items():
            # Parse metadata from content or use defaults
            year = extract_year_from_content(content)  # 需要实现
            title = extract_title_from_content(content) if '事件:' in content else ''
            
            EventCache.objects.create(
                uuid=uuid,
                year=year,
                event_title=title,
                context='',  # 可以从content反向生成或留空
                content=content,
                is_cached=True
            )
            count += 1
        
        self.stdout.write(f'Successfully migrated {count} cache entries')
```

### 3️⃣ Django API 端点

**文件**: `dj_backend/timeline/api_views_event_cache.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models_event_cache import EventCache

@api_view(['POST'])
def get_event_details(request):
    """获取事件详情（带缓存）"""
    data = request.data
    year = data.get('year')
    event_title = data.get('event_title', '')
    context = data.get('context', '')
    
    content, is_cached = EventCache.get_or_fetch(
        year=year,
        event_title=event_title,
        context=context
    )
    
    return Response({
        'text': content,
        'cached': is_cached
    })
```

**URL配置**: `dj_backend/timeline/urls.py`
```python
from django.urls import path
from . import api_views_event_cache

urlpatterns = [
    path('api/event-details/', api_views_event_cache.get_event_details),
    # ... existing patterns
]
```

### 4️⃣ 前端修改

**文件**: `history_river/services/geminiService.ts`
```typescript
export const fetchEventDetails = async (year, context) => {
  // 从 Express API (port 4000) 改为 Django API (port 8000)
  const res = await fetch('http://localhost:8000/timeline-api/api/event-details/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, context })
  })
  const data = await res.json()
  return data.text
}
```

### 5️⃣ 验证与清理

**验证**:
```bash
curl -X POST http://localhost:8000/timeline-api/api/event-details/ \
  -H "Content-Type: application/json" \
  -d '{"year": 1644, "context": "清军入关"}'
```

**清理旧缓存** (验证成功后):
```bash
rm history_river/server/storage/eventsCache.json
# 可选：删除 Express 相关代码
```

## 📈 优势对比

| 维度 | Express JSON | Django PostgreSQL |
|------|------------|-------------------|
| **数据一致性** | ❌ 分离 | ✅ 统一 |
| **并发安全** | ❌ 风险高 | ✅ 事务支持 |
| **查询能力** | ❌ 全文搜索难 | ✅ SQL查询 |
| **管理界面** | ❌ 手动编辑 | ✅ Django Admin |
| **备份恢复** | ❌ 需要脚本 | ✅ PG自带工具 |
| **扩展性** | ❌ 性能瓶颈 | ✅ 水平扩展 |

## ⚠️ 迁移注意事项

1. **零停机迁移**: 先双写（同时更新JSON和DB），验证后再切读
2. **UUID兼容性**: 确保SHA-256生成逻辑一致
3. **Context完整性**: 可能需要从content反向生成context
4. **错误处理**: Django API需要兼容前端错误处理
5. **性能监控**: 首次查询无缓存时，监控OpenRouter响应时间

## 🚀 后续优化

迁移完成后可以：
- 添加缓存过期策略（如TTL）
- 实现缓存预热（批量查询常用事件）
- 添加缓存统计仪表板（命中率、大小等）
- 批量导入历史事件初始数据

## ⏰ 时间估算

- 模型创建 & 迁移: 30分钟
- 数据迁移脚本: 1小时
- API端点开发: 1小时
- 前端修改 & 测试: 1小时
- **总计**: 约4小时

**优先级**: 🟡 中等（现有方案可用，但架构不一致）
