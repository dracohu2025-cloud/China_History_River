# 播客卡片布局优化 - 播放按钮移到底部

## ✅ 修改完成

**修改时间**: 2025-11-28 22:50  
**修改版本**: v1.0.0-release+patch  
**优化目标**: 将播放按钮移到年份那一行，并确保书名不超出卡片边界

---

## 🔧 布局变更

### 修改前 (播放按钮在书名行)

```
┌──────────┐
│ ▶ 《失去...│  ← 第一行: 播放按钮 + 书名
│          │
│      1516│  ← 第二行: 仅年份
└──────────┘

问题:
- 播放按钮占用书名空间
- 书名可能被挤压
- 年份行空间浪费
```

### 修改后 ✅ (播放按钮在年份行)

```
┌──────────┐
│ 《失去... │  ← 第一行: 仅书名（最大化利用空间）
│          │
│ ▶  1516  │  ← 第二行: 播放按钮 + 年份
└──────────┘

改进:
- ✅ 书名独占整行，不超出边界
- ✅ 播放按钮移到年份行，空间利用更合理
- ✅ 视觉上更平衡、美观
```

---

## 📐 实现代码

**文件**: `history_river/components/RiverCanvas.tsx`

```typescript
// 播客卡片 - 播放按钮移到年份行
{podcastPins.map((pin) => {
  const screenX = visibleXScale(pin.year)
  if (screenX < -200 || screenX > width + 200) return null
  
  const CARD_WIDTH = 50      // 极致紧凑
  const CARD_HEIGHT = 28     // 两行布局
  const y = height - TRACK_HEIGHT - TRACK_MARGIN + (TRACK_HEIGHT - CARD_HEIGHT) / 2
  
  return (
    <g transform={`translate(${screenX}, ${y})`}>
      {/* 卡片背景 */}
      <rect x={-CARD_WIDTH/2} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} ... />
      
      {/* ==================== 第一行: 仅书名 ==================== */}
      <g transform={`translate(${-CARD_WIDTH/2 + 4}, ${8})`}>
        {/* 书名 - 从左侧4px开始，确保不超出边界 */}
        <text 
          x={0} 
          y={2} 
          fill="#0f172a" 
          fontSize={8} 
          fontWeight={500}
          textAnchor="start"  // 左对齐
          className="select-none"
          style={{ 
            maxWidth: `${CARD_WIDTH - 8}px`,  // 确保不超出卡片边界（左右各留4px）
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {/* 截断逻辑：确保书名不超出 */}
          {pin.title && pin.title.length > 5 
            ? pin.title.substring(0, 4) + '...' 
            : (pin.title || '播客')}
        </text>
      </g>
      
      {/* ==================== 第二行: 播放按钮 + 年份 ==================== */}
      <g transform={`translate(${CARD_WIDTH/2 - 4}, ${20})`}>
        {/* 年份 - 在右侧，右对齐 */}
        <text 
          x={0} 
          y={3} 
          fill="#d97706" 
          fontSize={7}
          fontWeight={600}
          textAnchor="end"  // 右对齐
        >
          {pin.year}
        </text>
        
        {/* 播放按钮 - 在年份左侧4px */}
        <g transform={`translate(-12, -3)`}>  {/* 12px = 按钮半径+间距 */}
          <circle r={5} fill="#d97706" />
          <path d="M8 5v14l11-7z" transform="translate(-6,-6) scale(0.3)" fill="white" />
        </g>
      </g>
    </g>
  )
})}
```

---

## 📏 布局细节

### 第一行: 仅书名

- **位置**: `translate(-CARD_WIDTH/2 + 4, 8)`
  - x: 卡片左侧向内4px
  - y: 距顶部8px
- **样式**:
  - `textAnchor="start"` (左对齐)
  - `maxWidth: "${CARD_WIDTH - 8}px"` (确保不超出左右边界)
  - 截断: 超过5字显示"前4字+..."

### 第二行: 播放按钮 + 年份

- **位置**: `translate(CARD_WIDTH/2 - 4, 20)`
  - x: 卡片右侧向内4px
  - y: 距顶部20px
- **样式**:
  - 年份: `textAnchor="end"` (右对齐)
  - 按钮: `translate(-12, -3)` (年份左侧12px)

---

## 🎨 视觉效果

### 修改前

```
┌──────────┐
│ ▶ 《失去...│  ← 按钮+书名挤在一起
│          │
│      1516│  ← 年份独占一行
└──────────┘
```

### 修改后 ✅

```
┌──────────┐
│ 《失去... │  ← 书名独占整行，充分利用空间
│          │
│ ▶  1516  │  ← 按钮+年份组合，右下角
└──────────┘
```

**优势**:
- ✅ 书名有更多显示空间，不会超出边界
- ✅ 播放按钮和年份组合更合理（操作相关）
- ✅ 视觉上重心下移，更稳定
- ✅ 右下角符合用户操作习惯

---

## ✅ 边界检查

**书名不超出边界**:

1. **水平方向**:
   - 卡片总宽: 50px
   - 左侧padding: 4px
   - 右侧padding: 4px
   - 可用宽度: 50 - 8 = 42px
   - 8px字体，约可显示5-6个中文字符
   - 代码限制: 超过5字截断为4字+"..."

2. **垂直方向**:
   - 卡片总高: 28px
   - 第一行y=8px，第二行y=20px
   - 行间距: 12px
   - 确保不会重叠

---

## 🧪 测试验证

访问 **https://history.aigc24.com/**:

1. **拖拽到1516年**（《失去的三百年》）
2. **观察底部播客轨道**
3. ✅ 应该看到播客卡片
4. ✅ **第一行**: 仅书名（如"《失去..."）
5. ✅ **第二行**: 播放按钮▶ + 年份（如"1516"）
6. ✅ 书名不超出卡片边界
7. ✅ 点击播放按钮可以正常播放播客

---

## 📦 修改总结

**文件**: `history_river/components/RiverCanvas.tsx`

**修改区域**: Line 539-570

**改动类型**:
- ✅ 播放按钮从第一行移到第二行
- ✅ 书名独占第一行，最大化利用空间
- ✅ 添加边界检查（maxWidth和截断逻辑）

**影响**:
- 视觉布局更合理
- 信息层次分明
- 用户体验提升

---

**编译**: ✅ `npm run build` 成功  
**服务**: ✅ PM2前端已重启 (PID 85104)  
**状态**: 🟢 **生产就绪**
