// 首页

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
import { router } from 'expo-router';

import { getDynasties, getPodcasts } from '../src/services/dataService';
import type { Dynasty, EventPodcast } from '../src/types';
import { DYNASTY_FREQUENCIES } from '../src/types';

const colors = {
  primary: '#DC143C',
  white: '#FFFFFF',
  background: '#FAFAFA',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    500: '#737373',
  },
  text: {
    primary: '#171717',
  },
};

export default function HomeScreen() {
  const [dynasties, setDynasties] = useState<Dynasty[]>([]);
  const [podcasts, setPodcasts] = useState<EventPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // 最新上线
  const latestPodcasts = podcasts.slice(-5).reverse();

  const handlePodcastPress = (podcast: EventPodcast) => {
    router.push(`/player/${podcast.id}`);
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
                onPress={() => router.push('/timeline')}
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
    backgroundColor: colors.background,
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
    padding: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingLeft: 24,
  },
  dynastyChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  dynastyChipText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  dynastyFreq: {
    fontSize: 10,
    color: colors.gray[500],
  },
  latestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  latestInfo: {
    flex: 1,
  },
  latestTitle: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  latestMeta: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    color: colors.text.primary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 24,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
});
