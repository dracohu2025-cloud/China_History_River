# Transcript高度调整测试报告

## 修改内容

在 `player.html` 中修改了Transcript区域的高度：

**修改前:**
```html
<div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
```

**修改后:**
```html
<div className="space-y-3 overflow-y-auto min-h-[46vh] lg:min-h-[60vh] max-h-[46vh] lg:max-h-[60vh] pr-2">
```

## 修改说明

### 视频区域高度:
- 移动端: `min-h-[46vh]`
- 桌面端: `lg:min-h-[60vh]`

### Transcript区域高度(调整后):
- 移动端: `min-h-[46vh] lg:min-h-[60vh] max-h-[46vh] lg:max-h-[60vh]`
- 桌面端: `min-h-[60vh] max-h-[60vh]`

现在Transcript区域的最小高度和最大高度都与视频区域保持一致。

## 验证方法

### 生产环境测试:

访问以下链接查看效果（需要清除浏览器缓存）:

1. **崖山 (1279年)**:
   https://history.aigc24.com/player.html?episode=6c33d2b5-5b4a-4109-a757-192937b07440&v=4

2. **康熙的红票 (1716年)**:
   https://history.aigc24.com/player.html?episode=7374f516-37e7-4d7b-beb4-19bd6fa1ba22&v=4

3. **太后西奔 (1900年)**:
   https://history.aigc24.com/player.html?episode=16ec7d2c-cd25-4dce-90b1-b3f680aaeff1&v=4

### 需要清除缓存:

**Mac用户:**
```bash
Cmd + Shift + R
```

**Windows/Linux用户:**
```bash
Ctrl + F5
```

### 预期效果:

✅ **桌面端 (lg: 1024px以上):**
- 左侧视频区域高度: 60vh
- 右侧Transcript区域高度: 60vh
- 两个区域垂直对齐，高度一致

✅ **移动端 (小于1024px):**
- 上侧视频区域高度: 46vh
- 下侧Transcript区域高度: 46vh (当内容不足时)
- Transcript区域最大高度: 46vh (当内容过多时，可滚动)

### 检查重点:

1. **两个区域高度一致**: 视频播放卡片和Transcript卡片应该有相同的视觉高度
2. **滚动功能正常**: Transcript内容超出高度时，应该可以垂直滚动
3. **响应式正常**: 在桌面端和移动端都应该正确显示
4. **NavBar显示正常**: 顶部应该显示书籍名称和豆瓣评分

### 浏览器检查:

1. 打开 DevTools (F12)
2. 检查右侧Transcript区域的高度
3. 确认最小高度和最大高度都已正确设置
4. 检查 overflow-y 是否设置为 auto

## 已知问题:

⚠️ **需要清除浏览器缓存**: 由于文件名没有hash，浏览器可能会使用缓存的旧版本。必须硬刷新才能看到最新效果。

## 如果仍然无效:

如果清除缓存后仍然看不到效果，请执行以下操作:
1. 打开浏览器控制台查看错误
2. 在Network面板中检查 player-*.js 文件的缓存状态
3. 确认文件是否从服务器加载 (而不是disk cache)
4. 如果还是缓存，尝试在页面URL后添加 `&v=5` 参数
