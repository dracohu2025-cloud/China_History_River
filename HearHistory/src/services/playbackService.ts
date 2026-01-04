// 听见历史 - 播放服务 (react-native-track-player)

import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import type { PodcastDetail } from '../types';

// 是否已初始化
let isInitialized = false;

/**
 * 初始化 TrackPlayer
 */
export const setupPlayer = async (): Promise<boolean> => {
  if (isInitialized) return true;

  try {
    await TrackPlayer.setupPlayer({
      // 播放器选项
      minBuffer: 15,
      maxBuffer: 50,
      playBuffer: 2.5,
      backBuffer: 30,
    });

    // 设置播放能力
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      forwardJumpInterval: 15,
      backwardJumpInterval: 15,
      progressUpdateEventInterval: 1,
    });

    await TrackPlayer.setRepeatMode(RepeatMode.Off);

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[PlaybackService] setupPlayer error:', error);
    return false;
  }
};

/**
 * 加载并播放播客
 */
export const loadAndPlayPodcast = async (podcast: PodcastDetail): Promise<boolean> => {
  try {
    // 确保播放器已初始化
    await setupPlayer();

    // 清除当前队列
    await TrackPlayer.reset();

    // 添加曲目
    await TrackPlayer.add({
      id: podcast.id,
      url: podcast.audioUrl || '',
      title: podcast.eventTitle,
      artist: '听见历史',
      album: podcast.bookTitle || '历史播客',
      artwork: podcast.coverUrl,
      duration: podcast.duration,
    });

    // 开始播放
    await TrackPlayer.play();

    return true;
  } catch (error) {
    console.error('[PlaybackService] loadAndPlayPodcast error:', error);
    return false;
  }
};

/**
 * 播放/暂停切换
 */
export const togglePlayPause = async (): Promise<void> => {
  const state = await TrackPlayer.getPlaybackState();
  if (state.state === State.Playing) {
    await TrackPlayer.pause();
  } else {
    await TrackPlayer.play();
  }
};

/**
 * 跳转到指定时间
 */
export const seekTo = async (seconds: number): Promise<void> => {
  await TrackPlayer.seekTo(seconds);
};

/**
 * 快进
 */
export const jumpForward = async (seconds: number = 15): Promise<void> => {
  const { position } = await TrackPlayer.getProgress();
  await TrackPlayer.seekTo(position + seconds);
};

/**
 * 快退
 */
export const jumpBackward = async (seconds: number = 15): Promise<void> => {
  const { position } = await TrackPlayer.getProgress();
  await TrackPlayer.seekTo(Math.max(0, position - seconds));
};

/**
 * 设置播放速度
 */
export const setPlaybackRate = async (rate: number): Promise<void> => {
  await TrackPlayer.setRate(rate);
};

/**
 * 停止播放
 */
export const stopPlayback = async (): Promise<void> => {
  await TrackPlayer.stop();
  await TrackPlayer.reset();
};

/**
 * 获取当前播放状态
 */
export const getPlaybackState = async (): Promise<State> => {
  const { state } = await TrackPlayer.getPlaybackState();
  return state;
};

/**
 * 播放器事件服务（后台播放）
 */
export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, () => jumpForward(15));
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, () => jumpBackward(15));
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
};

// 导出 hooks
export { usePlaybackState, useProgress, useTrackPlayerEvents };
export { State, Event };
