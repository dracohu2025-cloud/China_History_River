// 听见历史 - 首页

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, typography, borderRadius, shadow } from '../theme';
import { getDynasties, getPodcasts } from '../services/dataService';
import { useSettingsStore, usePlayerStore } from '../stores';
import type { RootStackParamList, Dynasty, EventPodcast } from '../types';
import { DYNASTY_FREQUENCIES } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [dynasties, setDynasties] = useState<Dynasty[]>([]);
  const [podcasts, setPodcasts] = useState<EventPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const playbackHistory = useSettingsStore(s => s.playbackHistory);
  const currentPodcast = usePlayerStore(s => s.currentPodcast);

  const loadData = async () => {
    try {
      const [dynastiesData, podcastsData] = await Promise.all([
        getDynasties(),
        getPodcasts(),
      ]);
      setDynasties(dynastiesData);
      setPodcasts(podcastsData);
    } catch (error) {
      console.error('[HomeScreen] loadData error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 继续收听（最近播放的播客）
  const recentPodcasts = playbackHistory
    .slice(0, 5)
    .map(h => podcasts.find(p => p.id === h.podcastId))
    .filter(Boolean) as EventPodcast[];

  // 最新上线
  const latestPodcasts = podcasts.slice(-5).reverse();

  const handlePodcastPress = (podcast: EventPodcast) => {
    navigation.navigate('Player', { podcastId: podcast.id });
  };

  const handleDynastyPress = (dynasty: Dynasty) => {
    navigation.navigate('MainTabs', {
      screen: 'Timeline',
      params: { dynastyId: dynasty.id },
    } as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>听见历史</Text>
          <Text style={styles.subtitle}>FM 88.0 - 108.0 | 穿越五千年</Text>
        </View>

        {/* 继续收听 */}
        {recentPodcasts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>继续收听</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {recentPodcasts.map((podcast) => {
                const history = playbackHistory.find(h => h.podcastId === podcast.id);
                const progress = history ? Math.round((history.position / 1800) * 100) : 0;

                return (
                  <TouchableOpacity
                    key={podcast.id}
                    style={styles.continueCard}
                    onPress={() => handlePodcastPress(podcast)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.continueEmoji}>🎧</Text>
                    <Text style={styles.continueTitle} numberOfLines={1}>
                      {podcast.eventTitle}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 按朝代浏览 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>按朝代浏览</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {DYNASTY_FREQUENCIES.slice(0, -1).map((dynasty) => (
              <TouchableOpacity
                key={dynasty.id}
                style={[styles.dynastyChip, { backgroundColor: dynasty.color + '20' }]}
                onPress={() => handleDynastyPress(dynasty)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dynastyChipText, { color: dynasty.color }]}>
                  {dynasty.chineseName}
                </Text>
                <Text style={styles.dynastyFreq}>FM {dynasty.frequency.toFixed(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 最新上线 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最新上线</Text>
          {latestPodcasts.map((podcast) => (
            <TouchableOpacity
              key={podcast.id}
              style={styles.latestItem}
              onPress={() => handlePodcastPress(podcast)}
              activeOpacity={0.7}
            >
              <View style={styles.latestInfo}>
                <Text style={styles.latestTitle}>{podcast.eventTitle}</Text>
                <Text style={styles.latestMeta}>
                  {podcast.eventYear}年 • {podcast.bookTitle || '历史播客'}
                </Text>
              </View>
              {podcast.doubanRating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {podcast.doubanRating}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 统计信息 */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{podcasts.length}</Text>
            <Text style={styles.statLabel}>期播客</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dynasties.length}</Text>
            <Text style={styles.statLabel}>个朝代</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5000</Text>
            <Text style={styles.statLabel}>年历史</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  horizontalScroll: {
    paddingLeft: spacing.xl,
  },
  continueCard: {
    width: 120,
    padding: spacing.md,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadow.base,
  },
  continueEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  continueTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...typography.caption,
    color: colors.gray[500],
    textAlign: 'center',
  },
  dynastyChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  dynastyChipText: {
    ...typography.button,
    marginBottom: 2,
  },
  dynastyFreq: {
    ...typography.caption,
    color: colors.gray[500],
  },
  latestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  latestInfo: {
    flex: 1,
  },
  latestTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  latestMeta: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginHorizontal: spacing.xl,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
});
