// 听见历史 - 文稿同步显示组件

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { colors, spacing, typography, borderRadius } from '../../theme';
import type { ScriptSegment } from '../../types';

interface TranscriptViewProps {
  segments: ScriptSegment[];
  currentPosition: number; // 当前播放位置（秒）
  onSegmentPress?: (segment: ScriptSegment, index: number) => void;
}

export default function TranscriptView({
  segments,
  currentPosition,
  onSegmentPress,
}: TranscriptViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // 计算每段的时间范围
  const segmentsWithTime = useMemo(() => {
    let accumulatedTime = 0;
    return segments.map((segment, index) => {
      const startTime = segment.startTime ?? accumulatedTime;
      const duration = segment.estimatedDuration ?? 5;
      accumulatedTime = startTime + duration;
      return {
        ...segment,
        calculatedStart: startTime,
        calculatedEnd: accumulatedTime,
        index,
      };
    });
  }, [segments]);

  // 找到当前播放的段落索引
  const currentIndex = useMemo(() => {
    for (let i = 0; i < segmentsWithTime.length; i++) {
      const seg = segmentsWithTime[i];
      if (currentPosition >= seg.calculatedStart && currentPosition < seg.calculatedEnd) {
        return i;
      }
    }
    // 如果超出所有段落，返回最后一个
    if (currentPosition >= segmentsWithTime[segmentsWithTime.length - 1]?.calculatedEnd) {
      return segmentsWithTime.length - 1;
    }
    return 0;
  }, [currentPosition, segmentsWithTime]);

  // 自动滚动到当前段落
  useEffect(() => {
    // 简单实现：根据索引估算滚动位置
    // 实际项目中可使用 onLayout 测量每个段落高度
    const estimatedItemHeight = 80;
    const scrollY = Math.max(0, currentIndex * estimatedItemHeight - 100);

    scrollViewRef.current?.scrollTo({
      y: scrollY,
      animated: true,
    });
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>文稿</Text>
        <Text style={styles.headerHint}>点击跳转</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {segmentsWithTime.map((segment, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.segmentItem,
                isCurrent && styles.segmentItemCurrent,
              ]}
              onPress={() => onSegmentPress?.(segment, index)}
              activeOpacity={0.7}
            >
              {/* 说话者头像 */}
              <View
                style={[
                  styles.speakerAvatar,
                  segment.speaker === 'male' ? styles.maleAvatar : styles.femaleAvatar,
                  isCurrent && styles.avatarCurrent,
                ]}
              >
                <Text style={styles.speakerEmoji}>
                  {segment.speaker === 'male' ? '👨' : '👩'}
                </Text>
              </View>

              {/* 文本内容 */}
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.segmentText,
                    isCurrent && styles.segmentTextCurrent,
                    isPast && styles.segmentTextPast,
                  ]}
                >
                  {segment.text}
                </Text>

                {/* 时间标记 */}
                <Text style={styles.timeLabel}>
                  {formatTime(segment.calculatedStart)}
                </Text>
              </View>

              {/* 当前指示器 */}
              {isCurrent && (
                <View style={styles.currentIndicator}>
                  <View style={styles.indicatorDot} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
  },
  headerHint: {
    ...typography.caption,
    color: colors.gray[500],
  },
  scrollView: {
    maxHeight: 300,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  segmentItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  segmentItemCurrent: {
    backgroundColor: colors.gray[700],
    borderLeftColor: colors.radio.dialText,
  },
  speakerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  maleAvatar: {
    backgroundColor: colors.info + '30',
  },
  femaleAvatar: {
    backgroundColor: colors.primary + '30',
  },
  avatarCurrent: {
    borderWidth: 2,
    borderColor: colors.radio.dialText,
  },
  speakerEmoji: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  segmentText: {
    ...typography.transcript,
    color: colors.gray[400],
    lineHeight: 24,
  },
  segmentTextCurrent: {
    color: colors.white,
    fontWeight: '500',
  },
  segmentTextPast: {
    color: colors.gray[600],
  },
  timeLabel: {
    ...typography.caption,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  currentIndicator: {
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.radio.dialText,
  },
});
