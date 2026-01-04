# 听见历史 (Hear History)

基于 History River 项目的 iOS 历史播客应用，采用 FM 收音机风格的创新交互设计。

## 特色功能

- **FM 收音机风格 UI** - 朝代 = 频道，拖动调频穿越五千年
- **双人对谈播客** - 男女主播对话形式讲述历史
- **文稿同步** - 播放时实时高亮当前文字
- **离线收听** - 下载播客随时随地收听
- **11 种视觉风格** - FM 收音机、磁带机、黑胶唱片等

## 技术栈

- React Native 0.73
- TypeScript
- Supabase (后端)
- react-native-track-player (音频)
- Zustand (状态管理)
- react-native-reanimated (动画)

## 项目结构

```
HearHistory/
├── src/
│   ├── app/           # 入口和导航
│   ├── screens/       # 页面组件
│   ├── components/    # UI 组件
│   ├── services/      # 数据服务
│   ├── stores/        # 状态管理
│   ├── hooks/         # 自定义 Hooks
│   ├── types/         # TypeScript 类型
│   ├── theme/         # 主题样式
│   └── i18n/          # 国际化
├── ios/               # iOS 原生代码
└── android/           # Android 原生代码
```

## 开始使用

### 1. 安装依赖

```bash
cd HearHistory
npm install
```

### 2. iOS 配置

```bash
cd ios
pod install
cd ..
```

### 3. 配置环境变量

创建 `.env` 文件：

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. 运行

```bash
# iOS
npm run ios

# Android
npm run android
```

## 朝代频率映射

| 朝代 | FM 频率 | 年份范围 |
|------|---------|----------|
| 夏 | 88.0 | -2070 ~ -1600 |
| 商 | 89.5 | -1600 ~ -1046 |
| 周 | 91.0 | -1046 ~ -256 |
| 秦 | 93.0 | -221 ~ -206 |
| 汉 | 94.5 | -206 ~ 220 |
| 晋 | 96.0 | 265 ~ 420 |
| 隋 | 97.5 | 581 ~ 618 |
| 唐 | 98.6 | 618 ~ 907 |
| 宋 | 100.5 | 960 ~ 1279 |
| 元 | 102.0 | 1271 ~ 1368 |
| 明 | 104.0 | 1368 ~ 1644 |
| 清 | 106.5 | 1644 ~ 1912 |
| 近现代 | 108.0 | 1912 ~ 2025 |

## 播放器视觉风格

1. 📻 FM 收音机 (默认推荐)
2. 📼 复古磁带机
3. 🧊 液态玻璃
4. 💿 黑胶唱片
5. 🌊 声波海洋
6. 🔮 星空粒子
7. 🏔 水墨山水
8. 📊 霓虹频谱
9. ⏳ 时光沙漏
10. 🎭 皮影戏剧场
11. 🌀 极简呼吸环

## License

MIT
