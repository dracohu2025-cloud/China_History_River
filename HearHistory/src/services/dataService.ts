// 听见历史 - 数据服务

import { supabase, TABLES } from './supabase';
import type { Dynasty, HistoricalEvent, EventPodcast, DynastyFrequency, DYNASTY_FREQUENCIES } from '../types';

// ==================== 朝代相关 ====================

/**
 * 获取所有朝代（中国）
 */
export const getDynasties = async (): Promise<Dynasty[]> => {
  const { data, error } = await supabase
    .from(TABLES.DYNASTIES)
    .select('*')
    .eq('country', 'China')
    .order('start_year', { ascending: true });

  if (error) {
    console.error('[DataService] getDynasties error:', error);
    throw error;
  }

  return (data || []).map(d => ({
    id: d.id,
    name: d.name,
    chineseName: d.chinese_name || d.name,
    startYear: d.start_year,
    endYear: d.end_year,
    color: d.color || '#888888',
    description: d.description,
  }));
};

/**
 * 根据ID获取朝代
 */
export const getDynastyById = async (id: string): Promise<Dynasty | null> => {
  const { data, error } = await supabase
    .from(TABLES.DYNASTIES)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DataService] getDynastyById error:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    chineseName: data.chinese_name || data.name,
    startYear: data.start_year,
    endYear: data.end_year,
    color: data.color || '#888888',
    description: data.description,
  };
};

// ==================== 事件相关 ====================

/**
 * 获取历史事件
 */
export const getEvents = async (options?: {
  dynastyId?: string;
  startYear?: number;
  endYear?: number;
  type?: string;
  limit?: number;
}): Promise<HistoricalEvent[]> => {
  let query = supabase
    .from(TABLES.HISTORICAL_EVENTS)
    .select('*')
    .eq('country', 'China')
    .order('year', { ascending: true });

  if (options?.dynastyId) {
    query = query.eq('dynasty_id', options.dynastyId);
  }
  if (options?.startYear !== undefined) {
    query = query.gte('year', options.startYear);
  }
  if (options?.endYear !== undefined) {
    query = query.lte('year', options.endYear);
  }
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DataService] getEvents error:', error);
    throw error;
  }

  return (data || []).map(e => ({
    id: e.id,
    year: e.year,
    title: e.title,
    titleEn: e.title_en,
    titleZh: e.title_zh || e.title,
    type: e.type || 'politics',
    description: e.description,
    importance: e.importance || 5,
    dynastyId: e.dynasty_id,
    hasPodcast: false, // 需要后续查询 river_pins
  }));
};

/**
 * 获取有播客的事件
 */
export const getEventsWithPodcasts = async (): Promise<HistoricalEvent[]> => {
  // 先获取所有 river_pins（播客标记）
  const { data: pins, error: pinsError } = await supabase
    .from(TABLES.RIVER_PINS)
    .select('year, title')
    .order('year', { ascending: true });

  if (pinsError) {
    console.error('[DataService] getEventsWithPodcasts pins error:', pinsError);
    throw pinsError;
  }

  const pinYears = new Set((pins || []).map(p => p.year));

  // 获取这些年份的事件
  const { data: events, error: eventsError } = await supabase
    .from(TABLES.HISTORICAL_EVENTS)
    .select('*')
    .eq('country', 'China')
    .in('year', Array.from(pinYears))
    .order('year', { ascending: true });

  if (eventsError) {
    console.error('[DataService] getEventsWithPodcasts events error:', eventsError);
    throw eventsError;
  }

  return (events || []).map(e => ({
    id: e.id,
    year: e.year,
    title: e.title,
    titleEn: e.title_en,
    titleZh: e.title_zh || e.title,
    type: e.type || 'politics',
    description: e.description,
    importance: e.importance || 5,
    dynastyId: e.dynasty_id,
    hasPodcast: true,
  }));
};

/**
 * 按朝代分组获取事件
 */
export const getEventsByDynasty = async (): Promise<Map<string, HistoricalEvent[]>> => {
  const dynasties = await getDynasties();
  const events = await getEvents();

  const grouped = new Map<string, HistoricalEvent[]>();

  for (const dynasty of dynasties) {
    const dynastyEvents = events.filter(
      e => e.year >= dynasty.startYear && e.year <= dynasty.endYear
    );
    if (dynastyEvents.length > 0) {
      grouped.set(dynasty.id, dynastyEvents);
    }
  }

  return grouped;
};

// ==================== 播客相关 ====================

/**
 * 获取所有播客
 */
export const getPodcasts = async (): Promise<EventPodcast[]> => {
  const { data, error } = await supabase
    .from(TABLES.RIVER_PINS)
    .select('*')
    .order('year', { ascending: true });

  if (error) {
    console.error('[DataService] getPodcasts error:', error);
    throw error;
  }

  return (data || []).map(p => ({
    id: p.job_id || String(p.year),
    eventYear: p.year,
    eventTitle: p.title || `${p.year}年事件`,
    podcastUuid: p.job_id,
    bookTitle: p.book_title || '',
    doubanRating: p.douban_rating,
  }));
};

/**
 * 根据年份获取播客
 */
export const getPodcastByYear = async (year: number): Promise<EventPodcast | null> => {
  const { data, error } = await supabase
    .from(TABLES.RIVER_PINS)
    .select('*')
    .eq('year', year)
    .single();

  if (error) {
    console.error('[DataService] getPodcastByYear error:', error);
    return null;
  }

  return {
    id: data.job_id || String(data.year),
    eventYear: data.year,
    eventTitle: data.title || `${data.year}年事件`,
    podcastUuid: data.job_id,
    bookTitle: data.book_title || '',
    doubanRating: data.douban_rating,
  };
};

/**
 * 根据朝代获取播客列表
 */
export const getPodcastsByDynasty = async (dynastyId: string): Promise<EventPodcast[]> => {
  const dynasty = await getDynastyById(dynastyId);
  if (!dynasty) return [];

  const { data, error } = await supabase
    .from(TABLES.RIVER_PINS)
    .select('*')
    .gte('year', dynasty.startYear)
    .lte('year', dynasty.endYear)
    .order('year', { ascending: true });

  if (error) {
    console.error('[DataService] getPodcastsByDynasty error:', error);
    throw error;
  }

  return (data || []).map(p => ({
    id: p.job_id || String(p.year),
    eventYear: p.year,
    eventTitle: p.title || `${p.year}年事件`,
    podcastUuid: p.job_id,
    bookTitle: p.book_title || '',
    doubanRating: p.douban_rating,
  }));
};

// ==================== 统计相关 ====================

/**
 * 获取各朝代播客数量
 */
export const getPodcastCountByDynasty = async (): Promise<Map<string, number>> => {
  const dynasties = await getDynasties();
  const podcasts = await getPodcasts();

  const counts = new Map<string, number>();

  for (const dynasty of dynasties) {
    const count = podcasts.filter(
      p => p.eventYear >= dynasty.startYear && p.eventYear <= dynasty.endYear
    ).length;
    counts.set(dynasty.id, count);
  }

  return counts;
};
