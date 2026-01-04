// 听见历史 - 下载状态管理

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DownloadTask, EventPodcast, DownloadStatus } from '../types';

interface DownloadStore {
  // 下载任务
  tasks: Map<string, DownloadTask>;

  // 下载队列（待下载）
  queue: string[];

  // 当前正在下载
  activeDownloadId: string | null;

  // 已下载总大小
  totalDownloadedSize: number;

  // Actions
  addDownload: (podcast: EventPodcast) => void;
  removeDownload: (podcastId: string) => void;
  updateProgress: (podcastId: string, progress: number) => void;
  setStatus: (podcastId: string, status: DownloadStatus, error?: string) => void;
  setLocalPath: (podcastId: string, localPath: string, fileSize: number) => void;

  // 队列操作
  startNextDownload: () => string | null;
  pauseDownload: (podcastId: string) => void;
  resumeDownload: (podcastId: string) => void;
  cancelDownload: (podcastId: string) => void;

  // 查询
  getDownloadedPodcasts: () => DownloadTask[];
  isDownloaded: (podcastId: string) => boolean;
  getLocalPath: (podcastId: string) => string | null;

  // 清理
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      tasks: new Map(),
      queue: [],
      activeDownloadId: null,
      totalDownloadedSize: 0,

      addDownload: (podcast) => {
        const { tasks, queue } = get();
        if (tasks.has(podcast.id)) return;

        const task: DownloadTask = {
          podcastId: podcast.id,
          podcast,
          status: 'pending',
          progress: 0,
        };

        const newTasks = new Map(tasks);
        newTasks.set(podcast.id, task);

        set({
          tasks: newTasks,
          queue: [...queue, podcast.id],
        });
      },

      removeDownload: (podcastId) => {
        const { tasks, queue, totalDownloadedSize } = get();
        const task = tasks.get(podcastId);
        if (!task) return;

        const newTasks = new Map(tasks);
        newTasks.delete(podcastId);

        const newSize = task.fileSize
          ? totalDownloadedSize - task.fileSize
          : totalDownloadedSize;

        set({
          tasks: newTasks,
          queue: queue.filter(id => id !== podcastId),
          totalDownloadedSize: Math.max(0, newSize),
        });
      },

      updateProgress: (podcastId, progress) => {
        const { tasks } = get();
        const task = tasks.get(podcastId);
        if (!task) return;

        const newTasks = new Map(tasks);
        newTasks.set(podcastId, { ...task, progress });
        set({ tasks: newTasks });
      },

      setStatus: (podcastId, status, error) => {
        const { tasks } = get();
        const task = tasks.get(podcastId);
        if (!task) return;

        const newTasks = new Map(tasks);
        newTasks.set(podcastId, { ...task, status, error });
        set({ tasks: newTasks });
      },

      setLocalPath: (podcastId, localPath, fileSize) => {
        const { tasks, totalDownloadedSize } = get();
        const task = tasks.get(podcastId);
        if (!task) return;

        const newTasks = new Map(tasks);
        newTasks.set(podcastId, {
          ...task,
          localPath,
          fileSize,
          status: 'completed',
          progress: 100,
          downloadedAt: Date.now(),
        });

        set({
          tasks: newTasks,
          totalDownloadedSize: totalDownloadedSize + fileSize,
        });
      },

      startNextDownload: () => {
        const { queue, tasks, activeDownloadId } = get();
        if (activeDownloadId) return null;

        const nextId = queue.find(id => {
          const task = tasks.get(id);
          return task && task.status === 'pending';
        });

        if (nextId) {
          const newTasks = new Map(tasks);
          const task = newTasks.get(nextId)!;
          newTasks.set(nextId, { ...task, status: 'downloading' });
          set({ tasks: newTasks, activeDownloadId: nextId });
        }

        return nextId || null;
      },

      pauseDownload: (podcastId) => {
        const { tasks, activeDownloadId } = get();
        const task = tasks.get(podcastId);
        if (!task || task.status !== 'downloading') return;

        const newTasks = new Map(tasks);
        newTasks.set(podcastId, { ...task, status: 'paused' });

        set({
          tasks: newTasks,
          activeDownloadId: activeDownloadId === podcastId ? null : activeDownloadId,
        });
      },

      resumeDownload: (podcastId) => {
        const { tasks, queue } = get();
        const task = tasks.get(podcastId);
        if (!task || task.status !== 'paused') return;

        const newTasks = new Map(tasks);
        newTasks.set(podcastId, { ...task, status: 'pending' });

        // 移到队列前面
        const newQueue = [podcastId, ...queue.filter(id => id !== podcastId)];

        set({ tasks: newTasks, queue: newQueue });
      },

      cancelDownload: (podcastId) => {
        const { tasks, queue, activeDownloadId } = get();
        const task = tasks.get(podcastId);
        if (!task) return;

        const newTasks = new Map(tasks);
        newTasks.delete(podcastId);

        set({
          tasks: newTasks,
          queue: queue.filter(id => id !== podcastId),
          activeDownloadId: activeDownloadId === podcastId ? null : activeDownloadId,
        });
      },

      getDownloadedPodcasts: () => {
        const { tasks } = get();
        return Array.from(tasks.values()).filter(t => t.status === 'completed');
      },

      isDownloaded: (podcastId) => {
        const { tasks } = get();
        const task = tasks.get(podcastId);
        return task?.status === 'completed';
      },

      getLocalPath: (podcastId) => {
        const { tasks } = get();
        const task = tasks.get(podcastId);
        return task?.localPath || null;
      },

      clearCompleted: () => {
        const { tasks, queue } = get();
        const newTasks = new Map(tasks);
        const completedIds: string[] = [];

        newTasks.forEach((task, id) => {
          if (task.status === 'completed') {
            completedIds.push(id);
          }
        });

        completedIds.forEach(id => newTasks.delete(id));

        set({
          tasks: newTasks,
          queue: queue.filter(id => !completedIds.includes(id)),
        });
      },

      clearAll: () => {
        set({
          tasks: new Map(),
          queue: [],
          activeDownloadId: null,
          totalDownloadedSize: 0,
        });
      },
    }),
    {
      name: 'hear-history-downloads',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: Array.from(state.tasks.entries()),
        totalDownloadedSize: state.totalDownloadedSize,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        tasks: new Map(persisted?.tasks || []),
        totalDownloadedSize: persisted?.totalDownloadedSize || 0,
      }),
    }
  )
);
