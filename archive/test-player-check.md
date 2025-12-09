# 播客播放页测试 - NavBar显示书籍名称和豆瓣评分

## 测试步骤

### 1. 清除浏览器缓存
- Mac: Cmd + Shift + Delete
- Windows/Linux: Ctrl + Shift + Delete

### 2. 访问播客播放页
打开以下链接：
https://history.aigc24.com/player.html?episode=16ec7d2c-cd25-4dce-90b1-b3f680aaeff1

### 3. 验证显示内容
顶部NavBar应该显示：
- ← 返回按钮
- 《太后西奔》 (书籍名称)
- ⭐ 8.1 (豆瓣评分)
- ID: 16ec7d2c-cd25-4dce-90b1-b3f680aaeff1

### 4. 测试其他播客
- 1279年: https://history.aigc24.com/player.html?episode=6c33d2b5-5b4a-4109-a757-192937b07440
  - 应该显示：《崖山》 ⭐ 8.4

- 1516年: https://history.aigc24.com/player.html?episode=6bf2ef04-1e42-451e-b9e9-62b4cfaed13e
  - 应该显示：《失去的三百年》 ⭐ 8.2

- 1641年: https://history.aigc24.com/player.html?episode=1a338d50-5b8b-4091-ab81-60fe7f03a532
  - 应该显示：《崩盘：小冰期与大明王朝的衰落》 ⭐ 8.2

- 1716年: https://history.aigc24.com/player.html?episode=7374f516-37e7-4d7b-beb4-19bd6fa1ba22
  - 应该显示：《康熙的红票》 ⭐ 9.3

### 5. 预期播放页功能
✅ 左上角显示书籍名称（来自Django后台）
✅ 书籍名称右侧显示豆瓣评分（⭐ + 评分）
✅ 点击底部播客轨道跳转播放页
✅ 播客封面图片随音频进度切换
✅ 右侧显示完整文稿
✅ 点击文稿可跳转到对应时间点
✅ 音频播放/暂停控制

## 问题排查

如果NavBar没有显示书籍名称和豆瓣评分：
1. 检查浏览器控制台有无错误
2. 检查Network标签页中`/api/timeline/api/riverpins/?job_id=xxx`请求
3. 确认返回JSON包含：`title`和`doubanRating`字段
4. 如果返回null，说明Django后台没有配置该播客的信息

## Django后台管理
管理地址：http://localhost:8000/admin/timeline/riverpin/

可以配置：
- 书籍名称（显示在NavBar）
- 豆瓣评分（显示⭐+评分）
- 年份（决定播客在时间轴上的位置）
