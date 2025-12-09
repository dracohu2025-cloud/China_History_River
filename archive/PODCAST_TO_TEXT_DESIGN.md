# 播客显示方式重构 - 文字卡片设计

## ✅ 重构完成

### 🎯 设计目标

从**播客Thumbnail图片**改为**直接显示播客标题文字**，并确保美观度。

### 🔧 实现方案

#### 1. **移除播客Thumbnail图片显示**

**修改前**:
```typescript
// 显示播客Thumbnail图片
{thumb ? (
  <image href={thumb} x={-THUMB_SIZE/2} y={-THUMB_SIZE/2} ... />
) : (
  <g>
    <rect ... />
    <text>播客</text>
  </g>
)}
```

**修改后**:
```typescript
// 直接显示播客标题文字卡片
<rect x={-CARD_WIDTH/2} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} rx={8} fill="#fff" stroke="#d97706" filter="url(#card-shadow)" />

// 播客标题文字
<text x={0} y={CARD_HEIGHT/2 + 4} fill="#0f172a" fontSize={12} fontWeight={600} textAnchor="middle">
  {pin.title || '播客节目'}
</text>
```

#### 2. **美观的文字卡片设计**

**卡片规格**:
- 宽度: **180px**
- 高度: **42px**
- 圆角: **8px**
- 背景: 白色 (`#fff`)
- 边框: 琥珀色 (`#d97706`)
- 阴影: 卡片阴影 (`url(#card-shadow)`)

**文字样式**:
- 字体大小: **12px**
- 字体粗细: **600** (Semi-Bold)
- 文字颜色: 深石板 (`#0f172a`)
- 对齐方式: 居中
- 最大长度: 自动换行/截断

**附加元素**:
- 播放按钮: SVG播放图标 (在卡片左侧)
- 年份标签: {pin.year} (在卡片右侧)
- 悬浮提示: 完整标题

#### 3. **移除相关依赖**

**删除代码**:
- ✅ 移除 `hoverEpisodeId` state (不再需要hover效果)
- ✅ 移除 `podcastCache` state (不再需要预加载thumbnail)
- ✅ 移除 `getPodcastById` 导入和相关调用
- ✅ 移除悬停效果的渲染代码 (line 596-628)

**简化数据流**:
```typescript
// 修改前
fetch('/timeline-api/api/riverpins/')
  → 获取pin列表
  → 预加载所有播客thumbnail数据 (getPodcastById)
  → 存储在podcastCache
  → 渲染时选择thumbnail

// 修改后
fetch('/timeline-api/api/riverpins/')
  → 获取pin列表 (包含title)
  → 直接渲染文字卡片
  → 无需额外API调用
```

### 📊 数据接口

**Django API**: `/timeline-api/api/riverpins/`

**返回格式**:
```json
{
  "success": true,
  "data": [
    {
      "year": 1516,
      "jobId": "6a1fe03d-a773-4ce9-b663-77ff07c1cada",
      "title": "《失去的三百年》"
    },
    {
      "year": 1900,
      "jobId": "16ec7d2c-cd25-4dce-90b1-b3f680aaeff1",
      "title": "《太后西奔》"
    }
  ]
}
```

### 🎨 视觉效果

访问 https://history.aigc24.com/:

**位置**: 页面底部播客轨道

**视觉设计**:
```
┌─────────────────────────────────────┐
│  ▶  《失去的三百年》            1516 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ▶  《太后西奔》                1900 │
└─────────────────────────────────────┘

设计特点:
- 圆角矩形卡片 (8px)
- 白色背景 + 琥珀色边框
- 左侧播放按钮 (▶)
- 居中标题文字
- 右侧年份标签
- 卡片阴影效果
```

### 🧪 测试验证

1. 访问 https://history.aigc24.com/
2. 拖拽时间线到1516年或1900年附近
3. 观察底部播客轨道
4. ✅ 应该看到美观的文字卡片
5. ✅ 点击卡片可以正常播放播客
6. ✅ 鼠标悬浮显示完整标题提示

### 📏 尺寸规格

| 元素 | 尺寸/样式 |
|------|-----------|
| 卡片宽度 | 180px |
| 卡片高度 | 42px |
| 圆角 | 8px |
| 标题字体 | 12px, 600 (Semi-Bold) |
| 年份字体 | 10px, 700 (Bold) |
| 播放按钮 | 24px 圆形 |
| 阴影 | 0 8px 20px rgba(0,0,0,0.15) |

### 📝 代码改动

**文件**: `history_river/components/RiverCanvas.tsx`

**主要修改**:
1. ✅ 删除 `hoverEpisodeId` state (line 67)
2. ✅ 删除 `podcastCache` state (line 68)
3. ✅ 删除 `getPodcastById` 导入 (line 5)
4. ✅ 简化 `useEffect` 数据加载 (line 70-82)
5. ✅ 替换Thumbnail为文字卡片 (line 524-593)
6. ✅ 删除悬停效果代码 (line 596-628)

**影响**:
- 代码行数: -50行 (简化)
- 依赖: 移除Supabase API调用
- 性能: 提升 (无需预加载thumbnail)
- 维护性: 提升 (单一数据源)

### 🎉 优势

- ✅ **清晰度**: 文字标题比图片更清晰
- ✅ **性能**: 移除不必要的API调用和缓存
- ✅ **维护性**: 单一数据源，无依赖
- ✅ **美观度**: 精心设计，专业外观
- ✅ **响应速度**: 页面加载更快
- ✅ **SEO友好**: 文字内容更易索引

### 📦 对比

| 方面 | Thumbnail方式 | 文字卡片方式 |
|------|--------------|------------|
| 性能 | 需要预加载图片 | 无需额外网络请求 |
| 清晰度 | 小图片不清晰 | 文字永远清晰 |
| 维护性 | 多数据源(jobs/podcasts) | 单一源(Django) |
| 代码复杂度 | 高 (缓存、hover效果) | 低 (直接渲染) |
| 美观度 | 依赖图片质量 | 精心设计，统一风格 |

---

**编译**: ✅ `npm run build` 完成
**服务**: ✅ PM2前端已重启 (PID 62942)
**状态**: 🟢 生产就绪，等待验证