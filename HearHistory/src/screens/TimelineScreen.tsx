// 听见历史 - 时间线页面

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, typography, borderRadius, shadow } from '../theme';
import { getDynasties, getEvents, getPodcasts } from '../services/dataService';
import type { RootStackParamList, MainTabParamList, Dynasty, HistoricalEvent, EventPodcast } from '../types';
import { DYNASTY_FREQUENCIES, yearToFrequency } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TimelineRouteProp = RouteProp<MainTabParamList, 'Timeline'>;

interface SectionData {
  dynasty: Dynasty;
  frequency: number;
  data: (HistoricalEvent & { podcast?: EventPodcast })[];
}

export default function TimelineScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TimelineRouteProp>();
  const initialDynastyId = route.params?.dynastyId;

  const [dynasties, setDynasties] = useState<Dynasty[]>([]);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [podcasts, setPodcasts] = useState<EventPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDynasties, setExpandedDynasties] = useState<Set<string>>(new Set());

  const loadData = async () => {
    try {
      const [dynastiesData, eventsData, podcastsData] = await Promise.all([
        getDynasties(),
        getEvents(),
        getPodcasts(),
      ]);
      setDynasties(dynastiesData);
      setEvents(eventsData);
      setPodcasts(podcastsData);

      // 如果有初始朝代ID，展开它
      if (initialDynastyId) {
        setExpandedDynasties(new Set([initialDynastyId]));
      }
    } catch (error) {
      console.error('[TimelineScreen] loadData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 创建播客年份映射
  const podcastsByYear = useMemo(() => {
    const map = new Map<number, EventPodcast>();
    podcasts.forEach(p => map.set(p.eventYear, p));
    return map;
  }, [podcasts]);

  // 按朝代分组数据
  const sections: SectionData[] = useMemo(() => {
    return dynasties.map(dynasty => {
      const dynastyFreq = DYNASTY_FREQUENCIES.find(d => d.id === dynasty.id);
      const dynastyEvents = events
        .filter(e => e.year >= dynasty.startYear && e.year <= dynasty.endYear)
        .map(e => ({
          ...e,
          podcast: podcastsByYear.get(e.year),
        }));

      return {
        dynasty,
        frequency: dynastyFreq?.frequency || 88,
        data: expandedDynasties.has(dynasty.id) ? dynastyEvents : [],
      };
    }).filter(s => events.some(e =>
      e.year >= s.dynasty.startYear && e.year <= s.dynasty.endYear
    ));
  }, [dynasties, events, podcastsByYear, expandedDynasties]);

  const toggleDynasty = useCallback((dynastyId: string) => {
    setExpandedDynasties(prev => {
      const next = new Set(prev);
      if (next.has(dynastyId)) {
        next.delete(dynastyId);
      } else {
        next.add(dynastyId);
      }
      return next;
    });
  }, []);

  const handleEventPress = useCallback((event: HistoricalEvent & { podcast?: EventPodcast }) => {
    if (event.podcast) {
      navigation.navigate('Player', { podcastId: event.podcast.id });
    }
  }, [navigation]);

  const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => {
    const isExpanded = expandedDynasties.has(section.dynasty.id);
    const eventCount = events.filter(e =>
      e.year >= section.dynasty.startYear && e.year <= section.dynasty.endYear
    ).length;
    const podcastCount = podcasts.filter(p =>
      p.eventYear >= section.dynasty.startYear && p.eventYear <= section.dynasty.endYear
    ).length;

    return (
      <TouchableOpacity
        style={[styles.sectionHeader, { borderLeftColor: section.dynasty.color }]}
        onPress={() => toggleDynasty(section.dynasty.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          <View>
            <Text style={styles.dynastyName}>
              {section.dynasty.chineseName}
              <Text style={styles.dynastyYears}>
                {' '}({section.dynasty.startYear < 0 ? '前' + Math.abs(section.dynasty.startYear) : section.dynasty.startYear}-
                {section.dynasty.endYear < 0 ? '前' + Math.abs(section.dynasty.endYear) : section.dynasty.endYear})
              </Text>
            </Text>
            <Text style={styles.dynastyMeta}>
              FM {section.frequency.toFixed(1)} • {eventCount} 事件 • {podcastCount} 🎧
            </Text>
          </View>
        </View>
        <View style={[styles.signalBars, { opacity: podcastCount > 0 ? 1 : 0.3 }]}>
          {[1, 2, 3, 4, 5].map(i => (
            <View
              key={i}
              style={[
                styles.signalBar,
                {
                  height: 4 + i * 3,
                  backgroundColor: podcastCount >= i * 4 ? colors.success : colors.gray[300],
                },
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }, [expandedDynasties, events, podcasts, toggleDynasty]);

  const renderItem = useCallback(({ item }: { item: HistoricalEvent & { podcast?: EventPodcast } }) => {
    const hasPodcast = !!item.podcast;

    return (
      <TouchableOpacity
        style={styles.eventItem}
        onPress={() => handleEventPress(item)}
        disabled={!hasPodcast}
        activeOpacity={0.7}
      >
        <View style={styles.eventTimeline}>
          <View style={[styles.eventDot, hasPodcast && styles.eventDotActive]} />
          <View style={styles.eventLine} />
        </View>
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTitle, hasPodcast && styles.eventTitleActive]}>
              {item.titleZh || item.title}
            </Text>
            {hasPodcast && <Text style={styles.podcastIcon}>🎧</Text>}
          </View>
          <Text style={styles.eventMeta}>
            {item.year < 0 ? '前' + Math.abs(item.year) : item.year}年 •{' '}
            {item.type === 'war' ? '战争' :
             item.type === 'culture' ? '文化' :
             item.type === 'politics' ? '政治' : '科技'}
          </Text>
          {item.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.podcast?.doubanRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {item.podcast.doubanRating}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleEventPress]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.title}>历史时间线</Text>
        <Text style={styles.subtitle}>FM 88.0 ~ 108.0 MHz</Text>
      </View>

      {/* 频率刻度尺 */}
      <View style={styles.frequencyRuler}>
        {DYNASTY_FREQUENCIES.slice(0, -1).map((d, i) => (
          <TouchableOpacity
            key={d.id}
            style={styles.frequencyMark}
            onPress={() => {
              setExpandedDynasties(new Set([d.id]));
            }}
          >
            <Text style={[styles.frequencyText, { color: d.color }]}>
              {d.chineseName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 事件列表 */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.year}-${index}`}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无历史事件</Text>
          </View>
        }
      />
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  frequencyRuler: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[900],
  },
  frequencyMark: {
    flex: 1,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: colors.gray[500],
    marginRight: spacing.md,
    width: 16,
  },
  dynastyName: {
    ...typography.h4,
    color: colors.text.primary,
  },
  dynastyYears: {
    ...typography.bodySmall,
    color: colors.gray[500],
    fontWeight: 'normal',
  },
  dynastyMeta: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  eventItem: {
    flexDirection: 'row',
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray[50],
  },
  eventTimeline: {
    width: 24,
    alignItems: 'center',
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
    marginTop: 6,
  },
  eventDotActive: {
    backgroundColor: colors.primary,
  },
  eventLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray[200],
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTitle: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  eventTitleActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  podcastIcon: {
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  eventMeta: {
    ...typography.caption,
    color: colors.gray[500],
    marginTop: 2,
  },
  eventDescription: {
    ...typography.bodySmall,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.primary,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.gray[500],
  },
});
