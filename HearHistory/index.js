import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './src/app/App';
import { PlaybackService } from './src/services/playbackService';
import { name as appName } from './app.json';

// 注册 App
AppRegistry.registerComponent(appName, () => App);

// 注册播放服务（后台播放）
TrackPlayer.registerPlaybackService(() => PlaybackService);
