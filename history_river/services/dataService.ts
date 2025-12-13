import { createClient } from '@supabase/supabase-js'
import { Dynasty, HistoricalEvent, RiverPin } from '../types'
const BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (BASE_URL && ANON_KEY) ? createClient(BASE_URL, ANON_KEY) : null

export async function fetchDynasties(country: string = 'china'): Promise<Dynasty[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('dynasties')
        .select('*')
        .eq('country', country)
        .order('start_year', { ascending: true })

    if (error) {
        console.error('Error fetching dynasties:', error)
        return []
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        chineseName: row.chinese_name,
        startYear: row.start_year,
        endYear: row.end_year,
        color: row.color,
        description: row.description
    }))
}

export async function fetchEvents(country: string = 'china'): Promise<HistoricalEvent[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('historical_events')
        .select('*')
        .eq('country', country)
        .order('year', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }

    return (data || []).map((row: any) => ({
        year: row.year,
        title: row.title,
        titleEn: row.title_en, // Map localized titles
        titleZh: row.title_zh,
        type: row.event_type, // Map event_type (DB) to type (Frontend)
        importance: row.importance,
        description: row.description,
    }));
}

export async function fetchRiverPins(country: string = 'china'): Promise<RiverPin[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('river_pins')
        .select('*')
        .eq('country', country)
        .order('year', { ascending: true });
    if (error) {
        console.error('Error fetching river pins:', error);
        return [];
    }
    return (data || []).map((row: any) => ({
        year: row.year,
        jobId: row.job_id,
        title: row.title,
        doubanRating: row.douban_rating,
    }));
}
