// 时间线页面

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { getDynasties, getEvents, getPodcasts } from '../src/services/dataService';
import type { Dynasty, HistoricalEvent, EventPodcast } from '../src/types';
import { DYNASTY_FREQUENCIES } from '../src/types';

const colors = {
  primary: '#DC143C',
  white: '#FFFFFF',
  background: '#FAFAFA',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    900: '#171717',
  },
  success: '#10B981',
  text: { primary: '#171717', secondary: '#525252' },
};

interface SectionData {
  dynasty: Dynasty;
  frequency: number;
  data: (HistoricalEvent & { podcast?: EventPodcast })[];
}

export default function TimelineScreen() {
  const [dynasties, setDynasties] = useState<Dynasty[]>([]);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [podcasts, setPodcasts] = useState<EventPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDynasties, setExpandedDynasties] = useState<Set<string>>(new Set(['tang']));

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
    } catch (error) {
      console.error('[TimelineScreen] loadData error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const podcastsByYear = useMemo(() => {
    const map = new Map<number, EventPodcast>();
    podcasts.forEach(p => map.set(p.eventYear, p));
    return map;
  }, [podcasts]);

  const sections: SectionData[] = useMemo(() => {
    return dynasties.map(dynasty => {
      const dynastyFreq = DYNASTY_FREQUENCIES.find(d => d.id === dynasty.id);
      const dynastyEvents = events
        .filter(e => e.year >= dynasty.startYear && e.year <= dynasty.endYear)
        .map(e => ({ ...e, podcast: podcastsByYear.get(e.year) }));

      return {
        dynasty,
        frequency: dynastyFreq?.frequency || 88,
        data: expandedDynasties.has(dynasty.id) ? dynastyEvents : [],
      };
    }).filter(s => events.some(e => e.year >= s.dynasty.startYear && e.year <= s.dynasty.endYear));
  }, [dynasties, events, podcastsByYear, expandedDynasties]);

  const toggleDynasty = (dynastyId: string) => {
    setExpandedDynasties(prev => {
      const next = new Set(prev);
      if (next.has(dynastyId)) next.delete(dynastyId);
      else next.add(dynastyId);
      return next;
    });
  };

  const handleEventPress = (event: HistoricalEvent & { podcast?: EventPodcast }) => {
    if (event.podcast) {
      router.push(`/player/${event.podcast.id}`);
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>历史时间线</Text>
        <Text style={styles.subtitle}>FM 88.0 ~ 108.0 MHz</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.year}-${index}`}
        renderSectionHeader={({ section }) => {
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
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => {
          const hasPodcast = !!item.podcast;
          return (
            <TouchableOpacity
              style={styles.eventItem}
              onPress={() => handleEventPress(item)}
              disabled={!hasPodcast}
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
                  {hasPodcast && <Text>🎧</Text>}
                </View>
                <Text style={styles.eventMeta}>
                  {item.year < 0 ? '前' + Math.abs(item.year) : item.year}年
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  title: { fontSize: 24, fontWeight: '600', color: colors.text.primary },
  subtitle: { fontSize: 10, color: colors.gray[500], marginTop: 2 },
  listContent: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 20, backgroundColor: colors.white,
    borderLeftWidth: 4, borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  expandIcon: { fontSize: 12, color: colors.gray[500], marginRight: 12, width: 16 },
  dynastyName: { fontSize: 20, fontWeight: '600', color: colors.text.primary },
  dynastyYears: { fontSize: 12, color: colors.gray[500], fontWeight: 'normal' },
  dynastyMeta: { fontSize: 10, color: colors.gray[500], marginTop: 2 },
  eventItem: { flexDirection: 'row', paddingLeft: 24, paddingRight: 20, paddingVertical: 12, backgroundColor: colors.gray[50] },
  eventTimeline: { width: 24, alignItems: 'center' },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray[300], marginTop: 6 },
  eventDotActive: { backgroundColor: colors.primary },
  eventLine: { flex: 1, width: 2, backgroundColor: colors.gray[200], marginTop: 4 },
  eventContent: { flex: 1, paddingLeft: 12 },
  eventHeader: { flexDirection: 'row', alignItems: 'center' },
  eventTitle: { fontSize: 14, color: colors.text.secondary, flex: 1 },
  eventTitleActive: { color: colors.text.primary, fontWeight: '600' },
  eventMeta: { fontSize: 10, color: colors.gray[500], marginTop: 2 },
});
