
import { createClient } from '@supabase/supabase-js'
import { Dynasty, HistoricalEvent } from '../types'

const BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (BASE_URL && ANON_KEY) ? createClient(BASE_URL, ANON_KEY) : null

export async function fetchDynasties(): Promise<Dynasty[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('dynasties')
        .select('*')
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

export async function fetchEvents(): Promise<HistoricalEvent[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('historical_events')
        .select('*')
        .order('year', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }

    return (data || []).map((row: any) => ({
        year: row.year,
        title: row.title,
        type: row.event_type, // Map event_type (DB) to type (Frontend)
        importance: row.importance,
        description: row.description
    }))
}
