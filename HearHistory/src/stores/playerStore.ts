// 听见历史 - 播放器状态管理

import { create } from 'zustand';
import type { PodcastDetail, PlaybackState, ScriptSegment } from '../types';

interface PlayerStore {
  // 当前播客
  currentPodcast: PodcastDetail | null;

  // 播放状态
  playbackState: PlaybackState;
  position: number;
  duration: number;
  playbackRate: number;

  // 文稿
  currentSegmentIndex: number;

  // 播放队列
  queue: PodcastDetail[];
  queueIndex: number;

  // Actions
  setCurrentPodcast: (podcast: PodcastDetail | null) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackRate: (rate: number) => void;
  setCurrentSegmentIndex: (index: number) => void;

  // 队列操作
  addToQueue: (podcast: PodcastDetail) => void;
  removeFromQueue: (podcastId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;

  // 重置
  reset: () => void;
}

const initialState = {
  currentPodcast: null,
  playbackState: 'idle' as PlaybackState,
  position: 0,
  duration: 0,
  playbackRate: 1,
  currentSegmentIndex: 0,
  queue: [],
  queueIndex: -1,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...initialState,

  setCurrentPodcast: (podcast) => set({
    currentPodcast: podcast,
    position: 0,
    currentSegmentIndex: 0,
  }),

  setPlaybackState: (playbackState) => set({ playbackState }),

  setPosition: (position) => set({ position }),

  setDuration: (duration) => set({ duration }),

  setPlaybackRate: (playbackRate) => set({ playbackRate }),

  setCurrentSegmentIndex: (currentSegmentIndex) => set({ currentSegmentIndex }),

  addToQueue: (podcast) => set((state) => ({
    queue: [...state.queue, podcast],
  })),

  removeFromQueue: (podcastId) => set((state) => ({
    queue: state.queue.filter(p => p.id !== podcastId),
  })),

  clearQueue: () => set({ queue: [], queueIndex: -1 }),

  playNext: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      set({
        queueIndex: nextIndex,
        currentPodcast: queue[nextIndex],
        position: 0,
        currentSegmentIndex: 0,
      });
    }
  },

  playPrevious: () => {
    const { queue, queueIndex, position } = get();
    // 如果播放超过3秒，重新开始当前曲目
    if (position > 3) {
      set({ position: 0, currentSegmentIndex: 0 });
      return;
    }
    // 否则切换到上一首
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      set({
        queueIndex: prevIndex,
        currentPodcast: queue[prevIndex],
        position: 0,
        currentSegmentIndex: 0,
      });
    }
  },

  reset: () => set(initialState),
}));
