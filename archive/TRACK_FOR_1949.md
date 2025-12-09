# "新中国成立"专属轨道设计方案

## 🎯 需求

为用户创建"新中国成立"事件的专属轨道，显示在当前所有轨道的上方。

## 📐 实现方案

### 在RiverCanvas.tsx中添加新轨道

在现有的事件渲染之前，添加1949年专属轨道：

```typescript
{/* 1949年专属轨道 (最上层) */}
<g>
  {/* 轨道背景 */}
  <rect 
    x={0} 
    y={TOP_TRACK_Y} 
    width={width} 
    height={TOP_TRACK_HEIGHT} 
    fill="#fee2e2" 
    stroke="#fecaca" 
    opacity={0.7}
  />
  
  {/* 轨道标签 */}
  <g transform={`translate(${20}, ${TOP_TRACK_Y + TOP_TRACK_HEIGHT / 2})`}>
    <text 
      fill="#b91c1c" 
      fontSize={14} 
      fontWeight={700}
      textAnchor="start"
    >
      1949年·新中国成立
    </text>
    <line 
      x1={0} 
      y1={8} 
      x2={150} 
      y2={8} 
      stroke="#b91c1c" 
      strokeWidth={1.5}
    />
  </g>
  
  {/* 1949年事件标记 */}
  {(() => {
    const screenX_1949 = visibleXScale(1949);
    const y = TOP_TRACK_Y + TOP_TRACK_HEIGHT / 2;
    
    return (
      <g transform={`translate(${screenX_1949}, ${y})`}>
        {/* 红旗图标 */}
        <g transform="translate(0, -15)">
          <rect x={-15} y={0} width={30} height={20} fill="#e11d48" rx={2} />
          <text x={0} y={14} fill="white" fontSize={12} fontWeight="bold" textAnchor="middle">★</text>
        </g>
        
        {/* 年份文字 */}
        <text y={20} fill="#b91c1c" fontSize={16} fontWeight={700} textAnchor="middle">1949</text>
        
        {/* 事件标题 */}
        <text y={38} fill="#1f2937" fontSize={14} fontWeight={600} textAnchor="middle">新中国成立</text>
      </g>
    );
  })()}
</g>
```

### 轨道参数

```typescript
const TOP_TRACK_Y = 60;        // 轨道顶部位置 (距离屏幕顶部60px)
const TOP_TRACK_HEIGHT = 56;   // 轨道高度
const TOP_TRACK_MARGIN = 8;    // 轨道间距
```

### 位置计算

1949年事件位置：
```typescript
const screenX_1949 = visibleXScale(1949);
// 根据当前viewport参数 (centerYear=900, k=0.12)
// screenX_1949 ≈ 867px (在1200px宽度下)
```

## 🎨 视觉效果

### 轨道样式
- **背景**: 浅红色 (#fee2e2)
- **边框**: 红色 (#fecaca)
- **透明度**: 0.7
- **标签文字**: 红色 (#b91c1c)
- **标签下划线**: 红色

### 1949年标记
- **图标**: 红色矩形 + 白色五角星
- **年份**: 红色大字号 (16px)
- **标题**: 黑色粗体 (14px)
- **位置**: 轨道垂直居中

## 📝 修改位置

在RiverCanvas.tsx中，添加在：

```typescript
// 大约在 line 620-710 (事件渲染区域)

{/* 1949年专属轨道 */}
<g>
  {/* 轨道背景和标签 */}
  {/* 1949年事件标记 */}
</g>

{/* 现有的事件渲染 */}
<g>
  {eventLayoutNodes.map((node) => {
    // ... existing code ...
  })}
</g>
```

## 📊 最终效果

页面布局（从上到下）：
```
┌─────────────────────────────────────┐
│  1949年·新中国成立  [红旗]1949    │  <-- 新轨道 (最上层)
│                                      │
├─────────────────────────────────────┤
│  历史事件轨道 (1840-2025年)        │  <-- 现有轨道
│  [1840] 鸦片战争  [1894] 甲午      │
│                                      │
├─────────────────────────────────────┤
│  历史河流 (各朝代)                  │  <-- 河流主体
│                                      │
├─────────────────────────────────────┤
│  播客轨道 (1279-1900年)            │  <-- 播客轨道
│  [1279] 崖山  [1516] 失去的三百年  │
└─────────────────────────────────────┘
```

## ✅ 优势

1. **绝对可见**: 1949年在最上层，绝对不会被遮挡
2. **特殊标记**: 红色主题，突出显示
3. **独立轨道**: 不受其他事件布局影响
4. **永久显示**: 不会被过滤或裁剪
5. **视觉焦点**: 用户一眼就能看到

## 🔧 实现步骤

1. **修改RiverCanvas.tsx**:
   - 添加TOP_TRACK_Y, TOP_TRACK_HEIGHT常量
   - 在事件渲染前添加1949年轨道
   - 计算visibleXScale(1949)位置

2. **样式调整**:
   - 调整现有轨道位置 (向下移动TOP_TRACK_HEIGHT + 20px)
   - 确保各轨道不重叠

3. **测试验证**:
   - 确认1949年轨道可见
   - 确认不会影响其他事件
   - 确认响应式正常工作

## 📞 补充说明

这个方案确保了"新中国成立"事件绝对可见，解决了用户关心的核心问题。

---

**设计方案状态**: ✅ 已完成
**实现复杂度**: 🟡 中等
**视觉效果**: 🟢 优秀
**用户满意度**: 预期🟢 高
