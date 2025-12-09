# 拖拽跳帧问题修复记录

## 🐛 问题症状
拖拽 history_river 时偶尔出现跳帧现象，鼠标明明drag住了，但river会突然移动到屏幕其他地方。

## 🔍 根本原因分析

### 1. 状态重置时机错误
- **原代码**: `handleMouseDown` 中每次重置 `isDragging.current = false`
- **问题**: 可能丢失有效的拖拽状态

### 2. 坐标累积误差
- **原代码**: 使用 `lastX/Y` 记录上一次鼠标位置，计算 `dx = e.clientX - lastX.current`
- **问题**: 当鼠标移动过快或事件被跳过时，`lastX/Y` 会与实际位置不同步，导致下次计算时 `dx/dy` 突然变大

### 3. 缺少状态清理
- **原代码**: `handleMouseUp` 中没有重置 `isDragging`
- **问题**: 可能导致拖拽状态残留在下一次操作中

## 💊 修复方案

### 方案1: 改进拖拽检测逻辑
```typescript
// 拖拽检测：鼠标按下且移动超过3像素阈值
if (e.buttons === 1) {
  const moveDist = Math.abs(e.clientX - dragStartPos.current.x) + Math.abs(e.clientY - dragStartPos.current.y);
  if (moveDist > 3) isDragging.current = true;  // 降低阈值，更敏感
}
```

### 方案2: 使用相对位移计算（消除累积误差）
```typescript
// 保存初始viewport位置
const handleMouseDown = (e) => {
  lastX.current = viewport.x;  // 当前viewport.x
  lastY.current = viewport.y;  // 当前viewport.y
};

// 计算相对于拖拽起点的累计位移
const dx = e.clientX - dragStartPos.current.x;
const dy = e.clientY - dragStartPos.current.y;

setViewport({
  x: lastX.current + dx,  // 初始位置 + 累计位移
  y: lastY.current + dy
});
```

### 方案3: 拖拽时隐藏悬停效果
```typescript
if (isDragging.current) {
  setCursorX(null);
  setHoverYear(null);
  setHoverEvent(null);
  setHoverEpisodeId(null);
}
```

### 方案4: 正确重置拖拽状态
```typescript
const handleMouseUp = () => {
  isDragging.current = false;  // 拖拽结束时重置
  document.body.style.cursor = 'default';
};
```

## ✅ 预期效果

修复后应该：
- 🎯 拖拽更流畅，不再跳帧
- 🎯 鼠标位置与river移动完全同步
- 🎯 快速拖拽也能保持连贯
- 🎯 拖拽时不显示悬停光标，避免视觉干扰

## 🧪 测试方法

1. **慢速拖拽**: 缓慢移动鼠标，观察是否平滑
2. **快速拖拽**: 快速晃动鼠标，观察是否跳帧
3. **边界测试**: 拖拽到边缘后快速改变方向
4. **连续拖拽**: 多次拖拽不松开鼠标，观察是否累积误差

如果修复有效，请关闭此问题。如果仍有跳帧，可能需要进一步排查：
- 浏览器性能分析
- 事件监听器冲突
- React重渲染导致的闪烁