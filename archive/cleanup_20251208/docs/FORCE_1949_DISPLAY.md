# 1949年强制显示紧急解决方案

## 🚨 问题确认

**现象**: 只有在zoom out到最远处时才能看到1949年"新中国成立"

**根本原因**: 
- eventLayoutNodes算法在大多数zoom level下排除了1949年
- 过滤条件(viewport.k阈值)导致事件不被渲染
- 这不是位置问题，而是**渲染过滤**问题

## 💡 解决方案: 绕过布局算法

不修改复杂的eventLayoutNodes算法，直接在UI层**强制渲染**1949年事件。

## 🛠️ 实施步骤

### 方案: 在UI渲染层强制添加1949年

在 `RiverCanvas.tsx` 的渲染逻辑中，在 `eventLayoutNodes.map` **之前**手动渲染1949年事件。

找到位置 (约 line 620):
```typescript
{/* UI & MARKERS LAYER */}
<g>
  {eventLayoutNodes.map((node) => {
```

**替换为**:

```typescript
{/* UI & MARKERS LAYER */}
<g>
  {/* ===== 强制显示1949年事件 (绕过布局算法) ===== */}
  {(() => {
    // DEBUG: Log when rendering 1949
    console.log('🚀 FORCE RENDER: 1949 event is being rendered externally');
    
    const event1949 = KEY_EVENTS.find(e => e.year === 1949);
    if (!event1949) {
      console.error('❌ 1949 event not found in KEY_EVENTS');
      return null;
    }
    
    const screenX_1949 = visibleXScale(1949);
    
    // DEBUG: Log position
    console.log('📍 FORCE RENDER: 1949 screenX:', screenX_1949);
    
    return (
      <g>
        {/* 1949年专属轨道背景 */}
        <rect 
          x={0} 
          y={60} 
          width={width} 
          height={56} 
          fill="#fee2e2" 
          stroke="#fecaca" 
          opacity={0.8}
        />
        
        {/* 轨道标签 */}
        <g transform={`translate(20, ${60 + 56 / 2})`}>
          <text 
            fill="#b91c1c" 
            fontSize={12} 
            fontWeight={700}
            textAnchor="start"
          >
            1949年·新中国成立 (强制显示)
          </text>
          <line 
            x1={0} 
            y1={8} 
            x2={180} 
            y2={8} 
            stroke="#b91c1c" 
            strokeWidth={1}
          />
        </g>
        
        {/* 1949年事件标记 */}
        <g transform={`translate(${screenX_1949}, ${60 + 56 / 2})`}>
          {/* 红旗图标 */}
          <g transform="translate(0, -15)">
            <rect x={-15} y={0} width={30} height={20} fill="#e11d48" rx={2} />
            <text x={0} y={14} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">★</text>
          </g>
          
          {/* 年份 */}
          <text y={20} fill="#b91c1c" fontSize={14} fontWeight={700} textAnchor="middle">1949</text>
          
          {/* 标题 */}
          <text y={36} fill="#1f2937" fontSize={12} fontWeight={600} textAnchor="middle">新中国成立</text>
        </g>
      </g>
    );
  })()}
  {/* ===== END 1949年强制显示 ===== */}

  {/* 原有的事件渲染逻辑 */}
  {eventLayoutNodes.map((node) => {
    const screenX = visibleXScale(node.event.year);
    const edgePad = 16;
    const isHighPriority = node.event.importance <= 2;
    const finalX = isHighPriority
      ? Math.max(edgePad, Math.min(width - edgePad, screenX))
      : screenX;
    if (!isHighPriority && (screenX < -200 || screenX > width + 200)) return null;

    const centerY = (height / 2) * viewport.k + viewport.y;
    const marginTop = 140;
    const marginBottom = 48;
    const deltaTop = (centerY - marginTop) / 5;
    const deltaBottom = (height - marginBottom - centerY) / 5;
    const band = Math.min(5, Math.max(1, Math.abs(node.lane)));
    const sideTop = node.lane > 0;
    let desiredY = sideTop ? centerY - deltaTop * band : centerY + deltaBottom * band;
    let clampedY = Math.max(marginTop, Math.min(height - marginBottom, desiredY));
    const bottomClamped = clampedY === height - marginBottom;
    const topClamped = clampedY === marginTop;
    let spread = (band * 8) + (12 - node.event.importance * 2);
    if (spread < 6) spread = 6;
    const bandSpacing = 22;
    const bandBase = node.event.importance <= 2 ? 2 : 0;
    const bandIndex = (Math.abs(node.lane) % 3) + bandBase;
    const jitter = ((Math.abs(node.lane) * 7 + Math.abs(node.event.year)) % 8) - 4;
    if (bottomClamped) clampedY = Math.max(marginTop, clampedY - spread - bandSpacing * bandIndex - jitter);
    if (topClamped) clampedY = Math.min(height - marginBottom, clampedY + spread + bandSpacing * bandIndex + jitter);
    if (!topClamped && desiredY < marginTop + 30) clampedY = Math.min(height - marginBottom, marginTop + 30 + spread + bandSpacing);
    const effectiveYOffset = clampedY - centerY;
    
    const color = getEventColor(node.event.type);
    const isHovered = hoverEvent === node.event;
    
    const baseScale = Math.min(1.2, Math.max(0.8, viewport.k));
    const renderScale = isHovered ? baseScale * 1.1 : baseScale;

    return (
      <g 
        key={`${node.event.year}-${node.event.title}`} 
        transform={`translate(${finalX}, ${centerY})`}
        className="cursor-pointer"
        onClick={(e) => handleEventClick(e, node.event)}
        style={{ zIndex: node.event.importance === 1 ? 50 : 10, pointerEvents: 'auto' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') handleEventClick(e as any, node.event) }}
      >
        {/* ... 原有的事件渲染代码 ... */}
      </g>
    );
  })}
</g>
```

## 📝 快速修复命令

**直接替换渲染逻辑**:

```bash
cd /home/ubuntu/history_river_2025/history_river_November_2025/history_river

# 备份文件
cp components/RiverCanvas.tsx components/RiverCanvas.tsx.backup

# 使用sed快速替换（需要精确行号）
sed -i '620s/{eventLayoutNodes.map((node) => {/{(() => {\n            const event1949 = KEY_EVENTS.find(e => e.year === 1949);\n            if (!event1949) return null;\n            const screenX_1949 = visibleXScale(1949);\n            return (\n              <g>\n                <rect x={0} y={60} width={width} height={56} fill="#fee2e2" stroke="#fecaca" opacity={0.8} />\n                <g transform={`translate(20, ${60 + 56 / 2})`}><text fill="#b91c1c" fontSize={12} fontWeight={700} textAnchor="start">1949年·新中国成立</text><line x1={0} y1={8} x2={180} y2={8} stroke="#b91c1c" strokeWidth={1} /></g>\n                {(() => {const screenX_1949 = visibleXScale(1949); const y = 60 + 56 / 2; return (<g transform={`translate(${screenX_1949}, ${y})`}><g transform="translate(0, -15)"><rect x={-15} y={0} width={30} height={20} fill="#e11d48" rx={2} /><text x={0} y={14} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">★</text></g><text y={20} fill="#b91c1c" fontSize={14} fontWeight={700} textAnchor="middle">1949</text><text y={36} fill="#1f2937" fontSize={12} fontWeight={600} textAnchor="middle">新中国成立</text></g>);})()}\n              </g>\n            );\n          })()}\n          {eventLayoutNodes.map((node) => {' components/RiverCanvas.tsx

# 重新构建
npm run build

# 验证
# 打开页面，1949年应该立即显示在顶部
```

## ✅ 预期效果

**修改后**:
- 1949年事件将**永远显示**在屏幕顶部
- 不受zoom level影响
- 不受布局算法影响
- 无论zoom in/zoom out都能看到
- 红色轨道背景，非常醒目

**视觉效果**:
```
┌─────────────────────────────────────────┐
│ 1949年·新中国成立  [★]1949 新中国成立  │  <-- 永远可见
├─────────────────────────────────────────┤
│                                         │
│  其他历史事件渲染                       │
│  [1911]辛亥革命  [1840]鸦片战争        │
└─────────────────────────────────────────┘
```

---

**这是一个绕过根本问题的紧急修复，但可以立即使1949年可见！**
