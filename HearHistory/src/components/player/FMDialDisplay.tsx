// 听见历史 - FM 调频显示屏组件

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { colors, spacing, typography, borderRadius } from '../../theme';
import { DYNASTY_FREQUENCIES } from '../../types';

interface FMDialDisplayProps {
  frequency: number;
  dynastyName: string;
  dynastyColor: string;
  isPlaying: boolean;
}

export default function FMDialDisplay({
  frequency,
  dynastyName,
  dynastyColor,
  isPlaying,
}: FMDialDisplayProps) {
  // 信号灯闪烁动画
  const signalOpacity = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      signalOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      signalOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isPlaying]);

  const signalStyle = useAnimatedStyle(() => ({
    opacity: signalOpacity.value,
  }));

  // 计算指针位置（88-108 MHz 映射到 0-100%）
  const pointerPosition = ((frequency - 88) / 20) * 100;

  return (
    <View style={styles.container}>
      {/* 外框 - 复古收音机面板 */}
      <View style={styles.panel}>
        {/* 顶部装饰 */}
        <View style={styles.topDecoration}>
          <Text style={styles.brandText}>HISTORY FM</Text>
          <Animated.View style={[styles.signalLight, signalStyle]}>
            <View style={[styles.signalDot, { backgroundColor: dynastyColor }]} />
          </Animated.View>
        </View>

        {/* 频率显示 */}
        <View style={styles.frequencyDisplay}>
          <Text style={[styles.frequencyNumber, { color: dynastyColor }]}>
            {frequency.toFixed(1)}
          </Text>
          <Text style={styles.frequencyUnit}>MHz</Text>
        </View>

        {/* 朝代标签 */}
        <View style={[styles.dynastyBadge, { backgroundColor: dynastyColor }]}>
          <Text style={styles.dynastyText}>{dynastyName}</Text>
        </View>

        {/* 刻度尺 */}
        <View style={styles.dialContainer}>
          {/* 朝代刻度 */}
          <View style={styles.dynastyScale}>
            {DYNASTY_FREQUENCIES.slice(0, -1).map((d) => {
              const position = ((d.frequency - 88) / 20) * 100;
              return (
                <View
                  key={d.id}
                  style={[styles.dynastyMark, { left: `${position}%` }]}
                >
                  <View style={[styles.markLine, { backgroundColor: d.color }]} />
                  <Text style={[styles.markLabel, { color: d.color }]}>
                    {d.chineseName}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 频率刻度 */}
          <View style={styles.frequencyScale}>
            {[88, 92, 96, 100, 104, 108].map((freq) => {
              const position = ((freq - 88) / 20) * 100;
              return (
                <View key={freq} style={[styles.freqMark, { left: `${position}%` }]}>
                  <View style={styles.freqLine} />
                  <Text style={styles.freqLabel}>{freq}</Text>
                </View>
              );
            })}
          </View>

          {/* 指针 */}
          <View style={[styles.pointer, { left: `${pointerPosition}%` }]}>
            <View style={[styles.pointerHead, { backgroundColor: dynastyColor }]} />
            <View style={[styles.pointerLine, { backgroundColor: dynastyColor }]} />
          </View>

          {/* 刻度轨道 */}
          <View style={styles.dialTrack} />
        </View>

        {/* 年份显示 */}
        <View style={styles.yearDisplay}>
          <Text style={styles.yearLabel}>年份</Text>
          <Text style={styles.yearRange}>-2070 ────────────────────── 2025</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  panel: {
    backgroundColor: colors.radio.dial,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.radio.chrome,
  },
  topDecoration: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandText: {
    ...typography.label,
    color: colors.radio.chrome,
    letterSpacing: 2,
  },
  signalLight: {
    padding: 4,
  },
  signalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  frequencyDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  frequencyNumber: {
    fontFamily: 'Courier',
    fontSize: 56,
    fontWeight: 'bold',
  },
  frequencyUnit: {
    ...typography.label,
    color: colors.gray[500],
    marginLeft: spacing.sm,
  },
  dynastyBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  dynastyText: {
    ...typography.button,
    color: colors.white,
  },
  dialContainer: {
    height: 80,
    position: 'relative',
    marginVertical: spacing.md,
  },
  dynastyScale: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  dynastyMark: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -12 }],
  },
  markLine: {
    width: 2,
    height: 8,
  },
  markLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  frequencyScale: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
  },
  freqMark: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  freqLine: {
    width: 1,
    height: 6,
    backgroundColor: colors.gray[600],
  },
  freqLabel: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  pointer: {
    position: 'absolute',
    top: 25,
    alignItems: 'center',
    transform: [{ translateX: -1 }],
    zIndex: 10,
  },
  pointerHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pointerLine: {
    width: 2,
    height: 20,
    marginTop: -2,
  },
  dialTrack: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gray[700],
    borderRadius: 2,
  },
  yearDisplay: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  yearLabel: {
    ...typography.caption,
    color: colors.gray[600],
    marginBottom: 2,
  },
  yearRange: {
    fontSize: 8,
    color: colors.gray[600],
    letterSpacing: 1,
  },
});
