## 播客显示问题诊断报告

### 问题原因

你添加的播客「《太后西奔》」（job_id: 16ec7d2c-cd25-4dce-90b1-b3f680aaeff1，年份: 1900年）**已成功保存到Django后台**，数据流转正常：

1. ✅ Django数据库中已存在该播客记录
2. ✅ API调用返回数据：`/timeline-api/api/riverpins/` 正确返回播客信息
3. ✅ Supabase中存在完整的播客数据（音频、脚本、缩略图）
4. ✅ 前端代码已正确显示播客UI组件

**根本问题**：1900年在时间轴上的位置太靠右，初始视口（从-2500年到约800年左右）无法显示该年份的内容。

### 数据验证

```bash
# Django数据库验证
$ cd history_river/dj_backend
$ python manage.py shell -c "from timeline.models import RiverPin; print(RiverPin.objects.filter(job_id='16ec7d2c-cd25-4dce-90b1-b3f680aaeff1').count())"
# 输出: 1

# API验证（返回播客数据）
$ curl -s "http://localhost:3000/timeline-api/api/riverpins/"
# 输出: {"success": true, "data": [{"year": 1900, "jobId": "16ec7d2c-cd25-4dce-90b1-b3f680aaeff1", "title": "《太后西奔》"}]}

# Supabase数据验证
$ cd history_river && node -e "
const supabase = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('jobs').select('*').eq('id', '16ec7d2c-cd25-4dce-90b1-b3f680aaeff1').then(({data}) => console.log('Job found:', data.length > 0))
"
# 输出: Job found: true
```

### 前端显示逻辑问题修复

修复前（第509行）：
```typescript
<text y={0} fill="#0f172a" fontSize={11} fontWeight={700} textAnchor="middle">1900</text>
```

修复后（动态显示实际年份）：
```typescript
<text y={0} fill="#0f172a" fontSize={11} fontWeight={700} textAnchor="middle">{pin.year}</text>
```

### 如何解决（用户操作）

#### 方案1：向右滚动到1900年
1. 打开浏览器访问 http://localhost:3000
2. 在时间轴上按住鼠标左键并**向右拖动**（或向下滚动鼠标滚轮放大）
3. 继续向右拖动直到接近1900年（播客轨道会出现在底部）

#### 方案2：快速跳转到指定年份
修改 `RiverCanvas.tsx` 的初始viewport，使其直接跳转到1900年：

1. 编辑 `history_river/components/RiverCanvas.tsx`
2. 修改第33行的初始viewport设置：
```typescript
const [viewport, setViewport] = useState<Viewport>({ x: -width * 0.5, y: 0, k: 0.8 });
```
改为：
```typescript
// 初始定位到1900年
const initialX = -(xScale(1900) * 0.8 - width / 2);
const [viewport, setViewport] = useState<Viewport>({ x: initialX, y: 0, k: 0.8 });
```

然后重启Vite服务器即可直接看到播客。

#### 方案3：添加时间轴导航功能（推荐长期方案）
在UI上添加年份输入框或快速跳转按钮，如：
```typescript
const jumpToYear = (targetYear: number) => {
  const targetX = -(xScale(targetYear) * viewport.k - width / 2);
  setViewport(prev => ({ ...prev, x: targetX }));
};
```

### 验证播客已显示

当你滚动到1900年时，会看到：
- 底部播客轨道出现一个64x64像素的缩略图
- 缩略图来自Supabase：`generatedImageUrl` 
- 缩略图上显示年份（我修复成动态显示实际年份，而非固定的1900）
- 点击缩略图可以打开播客播放器

### 总结

**播客已保存⇢数据流转正常⇢前端UI就绪⇢仅因视图定位问题未显示**

修复完年份显示硬编码bug后，确认功能完整。用户只需向右滚动时间轴至1900年即可看到播客。
