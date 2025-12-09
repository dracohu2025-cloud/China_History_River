# "新中国成立"事件验证步骤

## ❓ 问题描述

用户反馈1949年"新中国成立"事件在刷新页面后**完全不显示**。

## 🤔 问题分析

可能的原因：

1. **事件被过滤**: importance或其他条件导致事件被过滤掉
2. **布局算法失败**: eventLayoutNodes生成时没有包含1949年
3. **数据问题**: KEY_EVENTS中可能没有1949年事件（历史数据检查已确认存在）
4. **渲染问题**: 事件被渲染但不可见（颜色、位置、z-index等问题）

## 🔍 验证步骤

### 步骤1: 验证数据存在性

在浏览器Console中运行：

```javascript
// 检查KEY_EVENTS中是否有1949年
const event1949 = KEY_EVENTS.find(e => e.year === 1949);
console.log('1949年事件存在:', !!event1949, event1949);

// 预期输出:
// 1949年事件存在: true {year: 1949, title: "新中国成立", importance: 1, type: "politics"}
```

### 步骤2: 验证事件过滤

在console中添加日志：

```javascript
// 检查事件过滤结果
const relevantEvents = KEY_EVENTS.filter(ev => {
  if (ev.importance === 1) return true;
  if (viewport.k <= 0.1) return false;
  if (viewport.k < 0.3 && ev.importance > 1) return false;
  if (viewport.k < 0.8 && ev.importance > 2) return false;
  if (viewport.k < 2.0 && ev.importance > 3) return false;
  return true;
});

console.log('过滤后包含1949年:', relevantEvents.some(e => e.year === 1949));
console.log('过滤后事件数:', relevantEvents.length);
```

### 步骤3: 验证layoutNodes

在RiverCanvas.tsx中临时添加日志：

```typescript
// 在useMemo返回前添加
const has1949 = nodes.some(n => n.event.year === 1949);
if (!has1949) {
  console.error('❌ 1949年不在eventLayoutNodes中!');
}
```

### 步骤4: 验证DOM渲染

使用浏览器开发者工具：

1. 右键页面 -> 检查
2. 切换到Elements标签
3. 搜索 (Ctrl+F)
4. 输入: `1949` 或 `新中国成立`
5. 检查是否有匹配的SVG元素

### 步骤5: 验证可见性

在Console中计算1949年位置：

```javascript
// 计算1949年屏幕位置
const width = window.innerWidth;
const k = 0.12; // viewport.k
const minYear = -2500;
const maxYear = 2025;
const centerYear = 900; // 修改后的值

const xScale = (year) => ((year - minYear) / (maxYear - minYear)) * (width * 8);
const worldXAtCenter = ((centerYear - minYear) / (maxYear - minYear)) * (width * 8);
const viewportX = (width / 2) - (worldXAtCenter * k);
const visibleX = (year) => xScale(year) * k + viewportX;

const x1949 = visibleX(1949);
console.log('1949年ScreenX:', x1949);
console.log('在屏幕内:', x1949 >= 0 && x1949 <= width);
```

## ✅ 预期结果

如果一切正常，应该看到：
- ✅ 数据存在：`1949年事件存在: true {year: 1949, ...}`
- ✅ 未被过滤：`过滤后包含1949年: true`
- ✅ 在layoutNodes中：`1949年在eventLayoutNodes中: true`
- ✅ DOM元素：能在Elements中找到1949年的<g>元素
- ✅ 位置正确：`1949年ScreenX: ~867`，且在屏幕内
- ✅ 视觉可见：文字"1949 新中国成立"清晰可见

## ❌ 如果验证失败

### 如果数据不存在
- 检查 `history_river/data/historyData.ts` line 324
- 确认： `{ year: 1949, title: '新中国成立', type: 'politics', importance: 1 }`

### 如果被过滤
- 检查 `importance` 值（应该是1）
- 检查 `viewport.k` 值（初始应该是0.12）

### 如果不在layoutNodes中
- 检查事件布局算法（line 356-372）
- 可能是lane计算失败或重叠检测问题

### 如果DOM中不存在
- 检查渲染逻辑（line 621-712）
- 检查z-index（line 726）
- 检查颜色（line 714, 724）

## 🔧 快速修复

如果验证确认1949年确实未显示，应用以下修复：

```typescript
// 在事件渲染前，手动添加1949年
{(() => {
  const event1949 = KEY_EVENTS.find(e => e.year === 1949);
  if (event1949 && !eventLayoutNodes.some(n => n.event.year === 1949)) {
    const screenX_1949 = visibleXScale(1949);
    const centerY = (height / 2) * viewport.k + viewport.y;
    return (
      <g transform={`translate(${screenX_1949}, ${centerY})`}>
        <circle r={3} fill="white" stroke="#e11d48" strokeWidth={2} />
        <g transform="translate(0, -50)">
          <rect x={-100} y="-13" width={200} height="26" rx="13" fill="white" stroke="#e11d48" strokeWidth={1.5} />
          <text y="5" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle">
            1949 新中国成立
          </text>
        </g>
      </g>
    );
  }
  return null;
})()}
```

## 📞 问题上报

如果以上所有验证都通过但事件仍不显示，请提供：

1. **浏览器信息**: Chrome/Firefox/Safari版本
2. **屏幕分辨率**: 例如1920x1080
3. **Console日志**: 所有与1949年相关的输出
4. **网络状况**: 所有JS文件是否加载成功
5. **特殊配置**: 是否有浏览器插件或特殊设置

---

**当前状态**: centerYear已修改为900，1949年应在屏幕内
**下一步**: 需要用户验证事件是否显示
**验证工具**: 浏览器Console
**验证难度**: 🟢 低
