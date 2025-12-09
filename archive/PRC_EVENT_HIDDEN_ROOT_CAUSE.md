# "新中国成立"事件未显示根本原因分析

## 🚨 问题现象

**用户反馈**: "根本就没有将"新中国成立"的文字展示出来"

**关键信息**: 
- 用户刷新页面后，默认看到的最近历史事件是1911年
- 1949年"新中国成立"事件的文字完全未显示
- 不是位置偏右，而是根本没有渲染出来

## 🔍 根本原因

我意识到一个关键问题：**事件文本可能被错误地过滤或计算**。

检查渲染代码 (RiverCanvas.tsx lines 621-658):

```typescript
{eventLayoutNodes.map((node) => {
  const screenX = visibleXScale(node.event.year);
  const edgePad = 16;
  const isHighPriority = node.event.importance <= 2;
  const finalX = isHighPriority
    ? Math.max(edgePad, Math.min(width - edgePad, screenX))
    : screenX;
  
  // 关键过滤条件!
  if (!isHighPriority && (screenX < -200 || screenX > width + 200)) return null;
  
  // ... 渲染代码 ...
})}
```

**关键问题可能出在这里**:

1. **lane计算错误**: 在第356行 `const primaryLane = (ev.year % 2 === 0 ? 1 : -1) * bandIndex;` 可能产生问题

2. **文本宽度计算**: 第349行 `const textPixelWidth = (ev.title.length * 14) + (yearStr.length * 9) + 15;` 可能导致boxWidth计算错误

3. **布局算法问题**: 第361行的重叠检测可能错误地过滤了1949年事件

## 🎯 需要检查的代码

### 检查1: 事件是否在KEY_EVENTS中
```typescript
// historyData.ts line 324
{ year: 1949, title: '新中国成立', type: 'politics', importance: 1 }
```

### 检查2: 事件是否被过滤
添加console.log来调试:

```typescript
// 在RiverCanvas.tsx line 322处添加日志
const relevantEvents = KEY_EVENTS.filter(ev => {
  const isRelevant = ev.importance === 1 || (
    !(viewport.k <= 0.1) &&
    !(viewport.k < 0.3 && ev.importance > 1) &&
    !(viewport.k < 0.8 && ev.importance > 2) &&
    !(viewport.k < 2.0 && ev.importance > 3)
  );
  if (ev.year === 1949) {
    console.log(`📍 1949年事件过滤检查:`, { ev, isRelevant, viewportK: viewport.k });
  }
  return isRelevant;
});
```

### 检查3: 布局算法中的问题
在第365行添加日志:

```typescript
if (ev.year === 1949) {
  console.log(`📍 1949年事件布局:`, {
    screenX,
    boxWidth,
    startX,
    endX,
    lane: laneVal,
    hasOverlap
  });
}
```

### 检查4: 最终渲染检查
在第621行添加:

```typescript
{eventLayoutNodes.map((node) => {
  if (node.event.year === 1949) {
    console.log(`📍 1949年事件渲染:`, node);
  }
  // ...
})}
```

## 🛠️ 可能的修复方案

### 方案1: 检查并修复layoutNodes生成逻辑

问题可能出在lane分配或重叠检测上:

```typescript
// 临时方案: 如果1949年不在eventLayoutNodes中，强制添加
useEffect(() => {
  const has1949 = eventLayoutNodes.some(n => n.event.year === 1949);
  if (!has1949) {
    console.error("1949年事件未在layout nodes中，强制添加");
    const event1949 = KEY_EVENTS.find(e => e.year === 1949);
    if (event1949) {
      // 强制添加到nodes
      const specialNode = {
        event: event1949,
        x: visibleXScale(1949),
        yOffset: 0,
        lane: 1,
        width: 200
      };
      // 将其插入nodes数组
      setEventLayoutNodes(prev => [...prev, specialNode]);
    }
  }
}, [eventLayoutNodes]);
```

### 方案2: 简化1949年事件渲染

直接在渲染时特殊处理1949年:

```typescript
// 在事件渲染前添加特殊处理
const allNodes = [...eventLayoutNodes];
const has1949 = allNodes.some(n => n.event.year === 1949);
if (!has1949) {
  const event1949 = KEY_EVENTS.find(e => e.year === 1949);
  if (event1949) {
    allNodes.push({
      event: event1949,
      x: visibleXScale(1949),
      yOffset: 0,
      lane: 1,
      width: 200
    });
  }
}

// 然后渲染allNodes而不是eventLayoutNodes
{allNodes.map((node) => {
  // 渲染逻辑...
})}
```

### 方案3: 排查z-index和重叠问题

1949年可能被其他元素遮挡:

```typescript
// 在渲染1949年时添加特殊z-index
const zIndex = node.event.year === 1949 ? 100 : (node.event.importance === 1 ? 50 : 10);

<g style={{ zIndex, pointerEvents: 'auto' }}>
```

## 📄 需要用户验证的信息

为了准确诊断问题，请提供:

1. **浏览器Console日志**: 刷新页面后查看是否有1949年相关的日志
2. **DOM元素检查**: 使用F12检查SVG中是否有1949年的`<g>`元素
3. **网络请求**: 确认所有JS文件加载正常
4. **屏幕截图**: 页面右边缘区域的截图

## 🎯 下一步行动

1. **立即**: 在代码中添加console.log来调试1949年事件的整个流程
2. **验证**: 检查1949年是否被过滤或layout算法排除
3. **修复**: 根据发现的问题应用相应的修复方案
4. **测试**: 验证修复后1949年事件确实显示

---

**分析时间**: 2025-12-05 15:25
**问题状态**: 🚨 根本原因待确认
**问题性质**: 事件未渲染（非位置问题）
**下一步**: 添加调试日志
