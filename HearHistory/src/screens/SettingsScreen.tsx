// 听见历史 - 设置页面

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography, borderRadius } from '../theme';
import { useSettingsStore } from '../stores';
import type { PlayerVisualStyle, ThemeMode } from '../types';

const VISUAL_STYLES: { value: PlayerVisualStyle; label: string; emoji: string }[] = [
  { value: 'fm-radio', label: 'FM 收音机', emoji: '📻' },
  { value: 'cassette', label: '复古磁带机', emoji: '📼' },
  { value: 'liquid-glass', label: '液态玻璃', emoji: '🧊' },
  { value: 'vinyl', label: '黑胶唱片', emoji: '💿' },
  { value: 'ocean', label: '声波海洋', emoji: '🌊' },
  { value: 'cosmic', label: '星空粒子', emoji: '🔮' },
  { value: 'ink-wash', label: '水墨山水', emoji: '🏔' },
  { value: 'neon-spectrum', label: '霓虹频谱', emoji: '📊' },
  { value: 'hourglass', label: '时光沙漏', emoji: '⏳' },
  { value: 'shadow-puppet', label: '皮影戏剧场', emoji: '🎭' },
  { value: 'minimal-ring', label: '极简呼吸环', emoji: '🌀' },
];

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function SettingsScreen() {
  const {
    language,
    themeMode,
    playerVisualStyle,
    defaultPlaybackRate,
    autoDownloadOnWifi,
    showTranscript,
    setLanguage,
    setThemeMode,
    setPlayerVisualStyle,
    setDefaultPlaybackRate,
    setAutoDownloadOnWifi,
    setShowTranscript,
    resetToDefaults,
    clearPlaybackHistory,
  } = useSettingsStore();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const SettingRow = ({
    label,
    value,
    onPress,
    trailing,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    trailing?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !trailing}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {trailing}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>设置</Text>
        </View>

        {/* 外观 */}
        <Section title="外观">
          <SettingRow
            label="语言"
            value={language === 'zh' ? '中文' : 'English'}
            onPress={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          />
          <SettingRow
            label="主题"
            value={themeMode === 'system' ? '跟随系统' : themeMode === 'dark' ? '深色' : '浅色'}
            onPress={() => {
              const modes: ThemeMode[] = ['system', 'light', 'dark'];
              const currentIndex = modes.indexOf(themeMode);
              setThemeMode(modes[(currentIndex + 1) % modes.length]);
            }}
          />
        </Section>

        {/* 播放器风格 */}
        <Section title="播放器视觉风格">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.styleScroll}
          >
            {VISUAL_STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.styleOption,
                  playerVisualStyle === style.value && styles.styleOptionActive,
                ]}
                onPress={() => setPlayerVisualStyle(style.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text
                  style={[
                    styles.styleLabel,
                    playerVisualStyle === style.value && styles.styleLabelActive,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Section>

        {/* 播放 */}
        <Section title="播放">
          <SettingRow
            label="默认播放速度"
            value={`${defaultPlaybackRate}x`}
            onPress={() => {
              const currentIndex = PLAYBACK_RATES.indexOf(defaultPlaybackRate);
              const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
              setDefaultPlaybackRate(PLAYBACK_RATES[nextIndex]);
            }}
          />
          <SettingRow
            label="显示文稿"
            trailing={
              <Switch
                value={showTranscript}
                onValueChange={setShowTranscript}
                trackColor={{ false: colors.gray[300], true: colors.primary }}
              />
            }
          />
        </Section>

        {/* 下载 */}
        <Section title="下载">
          <SettingRow
            label="WiFi 下自动下载"
            trailing={
              <Switch
                value={autoDownloadOnWifi}
                onValueChange={setAutoDownloadOnWifi}
                trackColor={{ false: colors.gray[300], true: colors.primary }}
              />
            }
          />
        </Section>

        {/* 关于 */}
        <Section title="关于">
          <SettingRow
            label="版本"
            value="1.0.0"
          />
          <SettingRow
            label="反馈问题"
            onPress={() => Linking.openURL('https://github.com/anthropics/claude-code/issues')}
          />
          <SettingRow
            label="开源许可"
            onPress={() => {}}
          />
        </Section>

        {/* 数据管理 */}
        <Section title="数据管理">
          <SettingRow
            label="清除播放历史"
            onPress={clearPlaybackHistory}
          />
          <SettingRow
            label="恢复默认设置"
            onPress={resetToDefaults}
          />
        </Section>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>听见历史 • History FM</Text>
          <Text style={styles.footerSubtext}>穿越五千年华夏文明</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.gray[500],
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  settingValue: {
    ...typography.body,
    color: colors.gray[500],
  },
  styleScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
  },
  styleOption: {
    width: 80,
    alignItems: 'center',
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  styleEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  styleLabel: {
    ...typography.caption,
    color: colors.gray[600],
    textAlign: 'center',
  },
  styleLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  footerText: {
    ...typography.body,
    color: colors.gray[400],
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.gray[300],
    marginTop: spacing.xs,
  },
});
