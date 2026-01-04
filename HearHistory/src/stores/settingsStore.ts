// 听见历史 - 用户设置状态管理

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSettings, PlayerVisualStyle, ThemeMode } from '../types';

interface SettingsStore extends UserSettings {
  // 播放历史
  playbackHistory: {
    podcastId: string;
    position: number;
    lastPlayedAt: number;
  }[];

  // Actions
  setLanguage: (language: 'zh' | 'en') => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPlayerVisualStyle: (style: PlayerVisualStyle) => void;
  setDefaultPlaybackRate: (rate: number) => void;
  setAutoDownloadOnWifi: (enabled: boolean) => void;
  setMaxStorageSize: (sizeMB: number) => void;
  setShowTranscript: (show: boolean) => void;

  // 播放历史
  savePlaybackPosition: (podcastId: string, position: number) => void;
  getPlaybackPosition: (podcastId: string) => number;
  clearPlaybackHistory: () => void;

  // 重置
  resetToDefaults: () => void;
}

const defaultSettings: UserSettings = {
  language: 'zh',
  themeMode: 'system',
  playerVisualStyle: 'fm-radio',
  defaultPlaybackRate: 1,
  autoDownloadOnWifi: false,
  maxStorageSize: 5000, // 5GB
  showTranscript: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      playbackHistory: [],

      setLanguage: (language) => set({ language }),

      setThemeMode: (themeMode) => set({ themeMode }),

      setPlayerVisualStyle: (playerVisualStyle) => set({ playerVisualStyle }),

      setDefaultPlaybackRate: (defaultPlaybackRate) => set({ defaultPlaybackRate }),

      setAutoDownloadOnWifi: (autoDownloadOnWifi) => set({ autoDownloadOnWifi }),

      setMaxStorageSize: (maxStorageSize) => set({ maxStorageSize }),

      setShowTranscript: (showTranscript) => set({ showTranscript }),

      savePlaybackPosition: (podcastId, position) => {
        const { playbackHistory } = get();
        const existingIndex = playbackHistory.findIndex(h => h.podcastId === podcastId);

        const newHistory = [...playbackHistory];
        const entry = {
          podcastId,
          position,
          lastPlayedAt: Date.now(),
        };

        if (existingIndex >= 0) {
          newHistory[existingIndex] = entry;
        } else {
          newHistory.unshift(entry);
          // 保留最近100条记录
          if (newHistory.length > 100) {
            newHistory.pop();
          }
        }

        set({ playbackHistory: newHistory });
      },

      getPlaybackPosition: (podcastId) => {
        const { playbackHistory } = get();
        const entry = playbackHistory.find(h => h.podcastId === podcastId);
        return entry?.position || 0;
      },

      clearPlaybackHistory: () => set({ playbackHistory: [] }),

      resetToDefaults: () => set({ ...defaultSettings, playbackHistory: [] }),
    }),
    {
      name: 'hear-history-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
