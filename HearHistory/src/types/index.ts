// 听见历史 - 类型定义
// 基于 History River Web 项目扩展

// ==================== 朝代相关 ====================

export interface Dynasty {
  id: string;
  name: string;
  chineseName: string;
  startYear: number;
  endYear: number;
  color: string;
  description?: string;
}

// FM 频率映射 - 朝代 = 频道
export interface DynastyFrequency extends Dynasty {
  frequency: number; // FM 频率 88.0 - 108.0
  eventCount?: number; // 该朝代的播客数量
}

export const DYNASTY_FREQUENCIES: DynastyFrequency[] = [
  { id: 'xia', name: 'Xia', chineseName: '夏', frequency: 88.0, startYear: -2070, endYear: -1600, color: '#8B4513' },
  { id: 'shang', name: 'Shang', chineseName: '商', frequency: 89.5, startYear: -1600, endYear: -1046, color: '#CD853F' },
  { id: 'zhou', name: 'Zhou', chineseName: '周', frequency: 91.0, startYear: -1046, endYear: -256, color: '#DAA520' },
  { id: 'qin', name: 'Qin', chineseName: '秦', frequency: 93.0, startYear: -221, endYear: -206, color: '#2F4F4F' },
  { id: 'han', name: 'Han', chineseName: '汉', frequency: 94.5, startYear: -206, endYear: 220, color: '#DC143C' },
  { id: 'jin', name: 'Jin', chineseName: '晋', frequency: 96.0, startYear: 265, endYear: 420, color: '#9370DB' },
  { id: 'sui', name: 'Sui', chineseName: '隋', frequency: 97.5, startYear: 581, endYear: 618, color: '#4682B4' },
  { id: 'tang', name: 'Tang', chineseName: '唐', frequency: 98.6, startYear: 618, endYear: 907, color: '#FFD700' },
  { id: 'song', name: 'Song', chineseName: '宋', frequency: 100.5, startYear: 960, endYear: 1279, color: '#87CEEB' },
  { id: 'yuan', name: 'Yuan', chineseName: '元', frequency: 102.0, startYear: 1271, endYear: 1368, color: '#228B22' },
  { id: 'ming', name: 'Ming', chineseName: '明', frequency: 104.0, startYear: 1368, endYear: 1644, color: '#FF4500' },
  { id: 'qing', name: 'Qing', chineseName: '清', frequency: 106.5, startYear: 1644, endYear: 1912, color: '#4169E1' },
  { id: 'modern', name: 'Modern', chineseName: '近现代', frequency: 108.0, startYear: 1912, endYear: 2025, color: '#FF0000' },
];

// ==================== 事件相关 ====================

export type EventType = 'war' | 'culture' | 'politics' | 'science';

export interface HistoricalEvent {
  id?: number;
  year: number;
  title: string;
  titleEn?: string;
  titleZh?: string;
  type: EventType;
  description?: string;
  importance: number; // 1-10, 1 = 最重要
  dynastyId?: string;
  hasPodcast?: boolean;
}

// ==================== 播客相关 ====================

export interface EventPodcast {
  id: string;
  eventYear: number;
  eventTitle: string;
  podcastUuid: string;
  bookTitle: string;
  doubanRating?: number | null;
  duration?: number; // 秒
  audioUrl?: string;
  coverUrl?: string;
}

export interface ScriptSegment {
  speaker: 'male' | 'female';
  text: string;
  startTime?: number;
  estimatedDuration?: number;
}

export interface PodcastDetail extends EventPodcast {
  script?: ScriptSegment[];
  slides?: string[]; // 暂不使用，但保留类型
}

// ==================== 播放器状态 ====================

export type PlaybackState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'buffering'
  | 'error';

export interface PlayerState {
  currentPodcast: PodcastDetail | null;
  playbackState: PlaybackState;
  position: number; // 当前播放位置（秒）
  duration: number; // 总时长（秒）
  playbackRate: number; // 0.5, 1, 1.25, 1.5, 2
  currentSegmentIndex: number; // 当前文稿段落索引
}

// ==================== 下载相关 ====================

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';

export interface DownloadTask {
  podcastId: string;
  podcast: EventPodcast;
  status: DownloadStatus;
  progress: number; // 0-100
  localPath?: string;
  fileSize?: number;
  downloadedAt?: number;
  error?: string;
}

export interface OfflineData {
  dynasties: Dynasty[];
  events: HistoricalEvent[];
  podcasts: EventPodcast[];
  lastSyncAt: number;
}

// ==================== 用户设置 ====================

export type PlayerVisualStyle =
  | 'fm-radio'       // FM 收音机 (默认/推荐)
  | 'cassette'       // 磁带机
  | 'liquid-glass'   // 液态玻璃
  | 'vinyl'          // 黑胶唱片
  | 'ocean'          // 声波海洋
  | 'cosmic'         // 星空粒子
  | 'ink-wash'       // 水墨山水
  | 'neon-spectrum'  // 霓虹频谱
  | 'hourglass'      // 时光沙漏
  | 'shadow-puppet'  // 皮影戏
  | 'minimal-ring';  // 极简呼吸环

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  language: 'zh' | 'en';
  themeMode: ThemeMode;
  playerVisualStyle: PlayerVisualStyle;
  defaultPlaybackRate: number;
  autoDownloadOnWifi: boolean;
  maxStorageSize: number; // MB
  showTranscript: boolean;
}

// ==================== 导航相关 ====================

export type RootStackParamList = {
  MainTabs: undefined;
  Player: { podcastId: string };
  EventDetail: { eventId: number };
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Timeline: { dynastyId?: string };
  Downloads: undefined;
  Profile: undefined;
};

// ==================== 工具函数类型 ====================

// 年份 → FM 频率
export const yearToFrequency = (year: number): number => {
  const minYear = -2070;
  const maxYear = 2025;
  const minFreq = 88.0;
  const maxFreq = 108.0;
  return minFreq + ((year - minYear) / (maxYear - minYear)) * (maxFreq - minFreq);
};

// FM 频率 → 年份
export const frequencyToYear = (freq: number): number => {
  const minYear = -2070;
  const maxYear = 2025;
  const minFreq = 88.0;
  const maxFreq = 108.0;
  return Math.round(minYear + ((freq - minFreq) / (maxFreq - minFreq)) * (maxYear - minYear));
};

// 根据年份获取朝代
export const getDynastyByYear = (year: number): DynastyFrequency | undefined => {
  return DYNASTY_FREQUENCIES.find(d => year >= d.startYear && year <= d.endYear);
};

// 根据频率获取朝代
export const getDynastyByFrequency = (freq: number): DynastyFrequency | undefined => {
  const year = frequencyToYear(freq);
  return getDynastyByYear(year);
};
