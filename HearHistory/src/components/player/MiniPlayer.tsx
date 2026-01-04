// 听见历史 - 迷你播放器组件 (全局底部栏)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography, borderRadius, shadow } from '../../theme';
import { usePlayerStore } from '../../stores';
import {
  togglePlayPause,
  usePlaybackState,
  useProgress,
  State,
} from '../../services/playbackService';
import type { RootStackParamList } from '../../types';
import { getDynastyByYear } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 64;

export default function MiniPlayer() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const currentPodcast = usePlayerStore(s => s.currentPodcast);
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();

  // 如果没有播放中的播客，不显示
  if (!currentPodcast) {
    return null;
  }

  const isPlaying = playbackState.state === State.Playing;
  const dynasty = getDynastyByYear(currentPodcast.eventYear);
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handlePress = () => {
    navigation.navigate('Player', { podcastId: currentPodcast.id });
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { bottom: insets.bottom + 80 }, // 在 TabBar 上方
      ]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* 进度条 */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: dynasty?.color || colors.primary,
            },
          ]}
        />
      </View>

      {/* 内容 */}
      <View style={styles.content}>
        {/* 左侧：信息 */}
        <View style={styles.info}>
          <View style={styles.radioIcon}>
            <Text style={styles.radioEmoji}>📻</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentPodcast.eventTitle}
            </Text>
            <Text style={styles.subtitle}>
              FM {dynasty?.frequency?.toFixed(1) || '98.6'} • {dynasty?.chineseName || ''}
            </Text>
          </View>
        </View>

        {/* 右侧：播放控制 */}
        <TouchableOpacity
          style={[
            styles.playButton,
            { backgroundColor: dynasty?.color || colors.primary },
          ]}
          onPress={handlePlayPause}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: colors.gray[900],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadow.lg,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.gray[700],
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.gray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioEmoji: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  subtitle: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: colors.white,
  },
});
