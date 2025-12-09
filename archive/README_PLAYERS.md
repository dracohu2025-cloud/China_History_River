# History River - 播客播放页NavBar显示指南

## 🎧 功能说明

播客播放页NavBar现在显示以下信息（从左到右）：

1. **← 返回按钮**：点击返回主页
2. **书籍名称**：从Django后台配置（如：《崖山》）
3. **⭐ 豆瓣评分**：绿色徽章显示评分（如：8.4）
4. **ID**：播客任务ID（如：6c33d2b5-...）

## 🎯 快速开始

### 测试链接（点击前请清除缓存）

1. **1279年 - 《崖山》 ⭐ 8.4**
   https://history.aigc24.com/player.html?episode=6c33d2b5-5b4a-4109-a757-192937b07440

2. **1516年 - 《失去的三百年》 ⭐ 8.2**
   https://history.aigc24.com/player.html?episode=6bf2ef04-1e42-451e-b9e9-62b4cfaed13e

3. **1641年 - 《崩盘》 ⭐ 8.2**
   https://history.aigc24.com/player.html?episode=1a338d50-5b8b-4091-ab81-60fe7f03a532

4. **1716年 - 《康熙的红票》 ⭐ 9.3**
   https://history.aigc24.com/player.html?episode=7374f516-37e7-4d7b-beb4-19bd6fa1ba22

5. **1900年 - 《太后西奔》 ⭐ 8.1**
   https://history.aigc24.com/player.html?episode=16ec7d2c-cd25-4dce-90b1-b3f680aaeff1

### 🧹 清除缓存方法

#### 方法1：硬刷新（最快）
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + F5` 或 `Ctrl + Shift + R`

#### 方法2：清除缓存工具
访问：https://history.aigc24.com/clear-cache.html

#### 方法3：禁用缓存
1. 打开浏览器DevTools (F12)
2. Network标签页
3. 勾选"Disable cache"
4. 刷新页面

#### 方法4：添加版本参数
在URL后添加 `&v=1` 参数强制刷新：
https://history.aigc24.com/player.html?episode=6c33d2b5-5b4a-4109-a757-192937b07440&v=1

## 🔧 Django后台配置

管理地址：http://localhost:8000/admin/timeline/riverpin/

### 可配置字段

| 字段 | 说明 | 显示位置 |
|------|------|----------|
| 书籍名称 | 播客标题 | NavBar中央 |
| 豆瓣评分 | 0-10的评分 | NavBar右侧（⭐徽章） |
| 年份 | 历史事件年份 | 时间轴位置 |
| 任务ID | Supabase播客ID | 关联播客 |

### 配置示例

**崖山播客配置：**
```
书籍名称: 《崖山》
豆瓣评分: 8.4
年份: 1279
任务ID: 6c33d2b5-5b4a-4109-a757-192937b07440
```

**效果：**
播放页NavBar显示：《崖山》 ⭐ 8.4

## 📱 移动端显示

在移动设备上，NavBar会自动适配：
- 书籍名称过长会截断显示
- 豆瓣评分徽章保持完整显示
- 所有元素保持可点击状态

## 🐛 问题排查

如果NavBar不显示书籍名称和豆瓣评分：

1. **检查API返回**
   ```bash
   curl https://history.aigc24.com/api/timeline/api/riverpins/?job_id=YOUR_JOB_ID
   ```
   应该返回包含`title`和`doubanRating`的JSON

2. **检查浏览器缓存**
   - 打开DevTools → Network
   - 找到player-*.js文件
   - 检查Size列显示为"(disk cache)"还是实际大小
   - 如果是缓存，需要硬刷新

3. **检查Django后台**
   - 确认已创建RiverPin记录
   - 确认任务ID正确匹配Supabase
   - 确认书籍名称和豆瓣评分已填写

## 📊 数据流

```
用户访问播客播放页
    ↓
PlayerPage.tsx 加载
    ↓
同时调用两个API:
    - getPodcastById(episode) → 获取播客数据
    - getRiverPinByJobId(episode) → 获取Django配置
    ↓
渲染NavBar:
    - 显示riverPin.title（书籍名称）
    - 显示riverPin.doubanRating（豆瓣评分）
    - 显示job.id（任务ID）
```

## 🎬 播放器功能

播客播放页包含：

✅ **NavBar信息**
- 书籍名称和豆瓣评分

✅ **音频播放**
- 播放/暂停控制
- 进度条
- 音量控制

✅ **视觉内容**
- 封面图片（随播放进度切换）
- 全黑背景，专注观看

✅ **文稿显示**
- 右侧显示完整文稿
- 每段显示说话者和时间戳
- 点击可跳转到对应时间点

✅ **响应式设计**
- 桌面端：左右布局（图片+文稿）
- 移动端：上下布局

## 🔗 相关链接

- **主站**: https://history.aigc24.com
- **清除缓存**: https://history.aigc24.com/clear-cache.html
- **强制刷新工具**: https://history.aigc24.com/force-refresh-player.html
- **调试手册**: https://history.aigc24.com/DEBUG_PLAYBOOK.md

## 📞 技术支持

如果以上方法都无法解决问题：
1. 记录浏览器版本和操作系统
2. 截图Network面板中的请求
3. 截图Console中的错误信息
4. 提供访问的完整URL
5. 检查Django后台配置是否正确
