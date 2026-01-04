// 听见历史 - 播放器页面 (FM 收音机风格)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { colors, spacing, typography, borderRadius, shadow } from '../theme';
import { usePlayerStore, useSettingsStore } from '../stores';
import { getPodcastDetail } from '../services/podcastService';
import {
  loadAndPlayPodcast,
  togglePlayPause,
  seekTo,
  jumpForward,
  jumpBackward,
  setPlaybackRate,
  usePlaybackState,
  useProgress,
  State,
} from '../services/playbackService';
import type { RootStackParamList, PodcastDetail, ScriptSegment } from '../types';
import { DYNASTY_FREQUENCIES, getDynastyByYear, yearToFrequency } from '../types';

// 组件导入
import TranscriptView from '../components/player/TranscriptView';
import FMDialDisplay from '../components/player/FMDialDisplay';

type PlayerRouteProp = RouteProp<RootStackParamList, 'Player'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute<PlayerRouteProp>();
  const { podcastId } = route.params;

  const [podcast, setPodcast] = useState<PodcastDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();

  const { setCurrentPodcast, playbackRate, setPlaybackRate: setStorePlaybackRate } = usePlayerStore();
  const showTranscript = useSettingsStore(s => s.showTranscript);
  const savePlaybackPosition = useSettingsStore(s => s.savePlaybackPosition);

  // 当前朝代信息
  const dynasty = useMemo(() => {
    if (!podcast) return null;
    return getDynastyByYear(podcast.eventYear);
  }, [podcast]);

  // FM 频率
  const frequency = useMemo(() => {
    if (!podcast) return 98.6;
    return yearToFrequency(podcast.eventYear);
  }, [podcast]);

  // 加载播客
  useEffect(() => {
    const loadPodcast = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getPodcastDetail(podcastId);
        if (data) {
          setPodcast(data);
          setCurrentPodcast(data);
          await loadAndPlayPodcast(data);
        } else {
          setError('播客加载失败');
        }
      } catch (err) {
        console.error('[PlayerScreen] loadPodcast error:', err);
        setError('播客加载失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadPodcast();
  }, [podcastId]);

  // 保存播放进度
  useEffect(() => {
    if (podcast && position > 0) {
      savePlaybackPosition(podcast.id, position);
    }
  }, [podcast, position, savePlaybackPosition]);

  // 播放/暂停
  const handlePlayPause = useCallback(() => {
    togglePlayPause();
  }, []);

  // 进度条拖动
  const handleSeek = useCallback((value: number) => {
    seekTo(value);
  }, []);

  // 播放速度切换
  const handleRateChange = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setStorePlaybackRate(nextRate);
    setPlaybackRate(nextRate);
  }, [playbackRate, setStorePlaybackRate]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlaying = playbackState.state === State.Playing;
  const isBuffering = playbackState.state === State.Buffering;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>调频中...</Text>
      </View>
    );
  }

  if (error || !podcast) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || '加载失败'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>听见历史 FM</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 扬声器网格 */}
          <View style={styles.speakerGrill}>
            {Array.from({ length: 6 }).map((_, row) => (
              <View key={row} style={styles.speakerRow}>
                {Array.from({ length: 40 }).map((_, col) => (
                  <View key={col} style={styles.speakerDot} />
                ))}
              </View>
            ))}
          </View>

          {/* FM 调频显示屏 */}
          <FMDialDisplay
            frequency={frequency}
            dynastyName={dynasty?.chineseName || '未知'}
            dynastyColor={dynasty?.color || colors.primary}
            isPlaying={isPlaying}
          />

          {/* 当前节目信息 */}
          <View style={styles.nowPlaying}>
            <Text style={styles.nowPlayingLabel}>正在播放</Text>
            <Text style={styles.nowPlayingTitle}>{podcast.eventTitle}</Text>
            <Text style={styles.nowPlayingMeta}>
              {podcast.eventYear < 0 ? '前' : ''}{Math.abs(podcast.eventYear)}年 •{' '}
              {dynasty?.chineseName || ''} •{' '}
              {podcast.doubanRating ? `⭐ ${podcast.doubanRating}` : podcast.bookTitle}
            </Text>
          </View>

          {/* 双主播头像 */}
          <View style={styles.hosts}>
            <View style={[styles.hostAvatar, isPlaying && styles.hostAvatarActive]}>
              <Text style={styles.hostEmoji}>👨</Text>
              <Text style={styles.hostLabel}>男主播</Text>
            </View>

            {/* 声波动画 */}
            <View style={styles.soundWave}>
              {isPlaying ? (
                <>
                  <View style={[styles.waveBar, styles.waveBar1]} />
                  <View style={[styles.waveBar, styles.waveBar2]} />
                  <View style={[styles.waveBar, styles.waveBar3]} />
                  <View style={[styles.waveBar, styles.waveBar2]} />
                  <View style={[styles.waveBar, styles.waveBar1]} />
                </>
              ) : (
                <View style={styles.wavePaused} />
              )}
            </View>

            <View style={[styles.hostAvatar, isPlaying && styles.hostAvatarActive]}>
              <Text style={styles.hostEmoji}>👩</Text>
              <Text style={styles.hostLabel}>女主播</Text>
            </View>
          </View>

          {/* 进度条 */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' },
                ]}
              />
              <View
                style={[
                  styles.progressHandle,
                  { left: duration > 0 ? `${(position / duration) * 100}%` : '0%' },
                ]}
              />
            </View>
            <View style={styles.timeLabels}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* 播放控制 */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => jumpBackward(15)}
            >
              <Text style={styles.controlIcon}>⏪</Text>
              <Text style={styles.controlLabel}>15秒</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: dynasty?.color || colors.primary }]}
              onPress={handlePlayPause}
              disabled={isBuffering}
            >
              {isBuffering ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => jumpForward(15)}
            >
              <Text style={styles.controlIcon}>⏩</Text>
              <Text style={styles.controlLabel}>15秒</Text>
            </TouchableOpacity>
          </View>

          {/* 播放速度 */}
          <View style={styles.speedSection}>
            {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
              <TouchableOpacity
                key={rate}
                style={[
                  styles.speedButton,
                  playbackRate === rate && styles.speedButtonActive,
                ]}
                onPress={() => {
                  setStorePlaybackRate(rate);
                  setPlaybackRate(rate);
                }}
              >
                <Text
                  style={[
                    styles.speedText,
                    playbackRate === rate && styles.speedTextActive,
                  ]}
                >
                  {rate}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 文稿区域 */}
          {showTranscript && podcast.script && (
            <TranscriptView
              segments={podcast.script}
              currentPosition={position}
              onSegmentPress={(segment, index) => {
                if (segment.startTime !== undefined) {
                  handleSeek(segment.startTime);
                }
              }}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
  },
  loadingText: {
    ...typography.body,
    color: colors.radio.dialText,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.white,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.label,
    color: colors.radio.dialText,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  speakerGrill: {
    backgroundColor: colors.radio.speaker,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 2,
  },
  speakerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.radio.speakerGrill,
  },
  nowPlaying: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  nowPlayingLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  nowPlayingTitle: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  nowPlayingMeta: {
    ...typography.bodySmall,
    color: colors.gray[400],
    textAlign: 'center',
  },
  hosts: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  hostAvatar: {
    alignItems: 'center',
    opacity: 0.5,
  },
  hostAvatarActive: {
    opacity: 1,
  },
  hostEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  hostLabel: {
    ...typography.caption,
    color: colors.gray[400],
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 40,
    marginHorizontal: spacing.lg,
  },
  waveBar: {
    width: 4,
    backgroundColor: colors.radio.dialText,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  waveBar1: {
    height: 12,
  },
  waveBar2: {
    height: 24,
  },
  waveBar3: {
    height: 32,
  },
  wavePaused: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray[600],
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[700],
    borderRadius: 3,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.radio.dialText,
    borderRadius: 3,
  },
  progressHandle: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
    marginLeft: -7,
    ...shadow.sm,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    ...typography.caption,
    color: colors.gray[500],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing['2xl'],
    ...shadow.md,
  },
  playIcon: {
    fontSize: 28,
    color: colors.white,
  },
  speedSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  speedButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[800],
  },
  speedButtonActive: {
    backgroundColor: colors.radio.dialText,
  },
  speedText: {
    ...typography.bodySmall,
    color: colors.gray[400],
  },
  speedTextActive: {
    color: colors.gray[900],
    fontWeight: '600',
  },
});
