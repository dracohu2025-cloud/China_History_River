// 听见历史 - 播客服务

import { supabase, TABLES } from './supabase';
import type { PodcastDetail, ScriptSegment } from '../types';

// 外部播客服务配置
const PODCAST_API_BASE = 'https://api-podcast.example.com'; // 替换为实际 API

/**
 * 获取播客详情（包含音频URL和文稿）
 */
export const getPodcastDetail = async (podcastId: string): Promise<PodcastDetail | null> => {
  try {
    // 从 river_pins 获取基础信息
    const { data: pin, error } = await supabase
      .from(TABLES.RIVER_PINS)
      .select('*')
      .eq('job_id', podcastId)
      .single();

    if (error || !pin) {
      console.error('[PodcastService] getPodcastDetail error:', error);
      return null;
    }

    // 构建播客详情
    const podcast: PodcastDetail = {
      id: pin.job_id || String(pin.year),
      eventYear: pin.year,
      eventTitle: pin.title || `${pin.year}年事件`,
      podcastUuid: pin.job_id,
      bookTitle: pin.book_title || '',
      doubanRating: pin.douban_rating,
      // 音频 URL 需要从外部服务获取，这里用占位
      audioUrl: `${PODCAST_API_BASE}/audio/${pin.job_id}.mp3`,
      // 文稿数据
      script: await fetchPodcastScript(pin.job_id),
    };

    return podcast;
  } catch (error) {
    console.error('[PodcastService] getPodcastDetail exception:', error);
    return null;
  }
};

/**
 * 获取播客文稿
 */
export const fetchPodcastScript = async (podcastUuid: string): Promise<ScriptSegment[]> => {
  try {
    // 实际项目中从 API 获取文稿
    // 这里返回示例数据
    return [
      {
        speaker: 'male',
        text: '大家好，欢迎收听「听见历史」，我是主播小明。',
        startTime: 0,
        estimatedDuration: 5,
      },
      {
        speaker: 'female',
        text: '我是小红，今天我们要讲述的是一段惊心动魄的历史...',
        startTime: 5,
        estimatedDuration: 6,
      },
      {
        speaker: 'male',
        text: '没错，让我们一起穿越时空，回到那个风云变幻的年代。',
        startTime: 11,
        estimatedDuration: 5,
      },
    ];
  } catch (error) {
    console.error('[PodcastService] fetchPodcastScript error:', error);
    return [];
  }
};

/**
 * 根据年份获取播客详情
 */
export const getPodcastByYear = async (year: number): Promise<PodcastDetail | null> => {
  try {
    const { data: pin, error } = await supabase
      .from(TABLES.RIVER_PINS)
      .select('*')
      .eq('year', year)
      .single();

    if (error || !pin) {
      return null;
    }

    return getPodcastDetail(pin.job_id);
  } catch (error) {
    console.error('[PodcastService] getPodcastByYear error:', error);
    return null;
  }
};

/**
 * 获取相邻播客（用于上一期/下一期）
 */
export const getAdjacentPodcasts = async (
  currentYear: number
): Promise<{ previous?: PodcastDetail; next?: PodcastDetail }> => {
  try {
    // 获取上一期
    const { data: prevData } = await supabase
      .from(TABLES.RIVER_PINS)
      .select('*')
      .lt('year', currentYear)
      .order('year', { ascending: false })
      .limit(1)
      .single();

    // 获取下一期
    const { data: nextData } = await supabase
      .from(TABLES.RIVER_PINS)
      .select('*')
      .gt('year', currentYear)
      .order('year', { ascending: true })
      .limit(1)
      .single();

    const result: { previous?: PodcastDetail; next?: PodcastDetail } = {};

    if (prevData) {
      result.previous = await getPodcastDetail(prevData.job_id);
    }
    if (nextData) {
      result.next = await getPodcastDetail(nextData.job_id);
    }

    return result;
  } catch (error) {
    console.error('[PodcastService] getAdjacentPodcasts error:', error);
    return {};
  }
};
