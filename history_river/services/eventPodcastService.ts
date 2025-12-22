// Event Podcast Service - Links historical events to podcasts
import { createClient } from '@supabase/supabase-js'
import { EventPodcast } from '../types'

const BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (BASE_URL && ANON_KEY) ? createClient(BASE_URL, ANON_KEY) : null

interface EventPodcastRow {
    id: string
    event_year: number
    event_title: string
    podcast_uuid: string
    book_title: string
    douban_rating: number | null
    created_at?: string
}

// Convert database row to frontend type
function rowToEventPodcast(row: EventPodcastRow): EventPodcast {
    return {
        id: row.id,
        eventYear: row.event_year,
        eventTitle: row.event_title,
        podcastUuid: row.podcast_uuid,
        bookTitle: row.book_title,
        doubanRating: row.douban_rating
    }
}

/**
 * Fetch all podcasts linked to a specific event
 */
export async function fetchEventPodcasts(eventYear: number, eventTitle: string): Promise<EventPodcast[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('event_podcasts')
        .select('*')
        .eq('event_year', eventYear)
        .eq('event_title', eventTitle)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching event podcasts:', error)
        return []
    }

    return (data || []).map(rowToEventPodcast)
}

/**
 * Fetch all event-podcast mappings (for admin)
 */
export async function fetchAllEventPodcasts(): Promise<EventPodcast[]> {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('event_podcasts')
        .select('*')
        .order('event_year', { ascending: true })

    if (error) {
        console.error('Error fetching all event podcasts:', error)
        return []
    }

    return (data || []).map(rowToEventPodcast)
}

/**
 * Get a set of event keys that have podcasts (for quick lookup in RiverCanvas)
 * Returns a Set of "year:title" strings
 */
export async function fetchEventsWithPodcasts(): Promise<Set<string>> {
    if (!supabase) return new Set()

    const { data, error } = await supabase
        .from('event_podcasts')
        .select('event_year, event_title')

    if (error) {
        console.error('Error fetching events with podcasts:', error)
        return new Set()
    }

    const eventKeys = new Set<string>()
    for (const row of data || []) {
        eventKeys.add(`${row.event_year}:${row.event_title}`)
    }
    return eventKeys
}

/**
 * Add a new event-podcast mapping (admin)
 */
export async function addEventPodcast(
    eventYear: number,
    eventTitle: string,
    podcastUuid: string,
    bookTitle: string,
    doubanRating?: number | null
): Promise<EventPodcast | null> {
    if (!supabase) return null

    const payload = {
        event_year: eventYear,
        event_title: eventTitle,
        podcast_uuid: podcastUuid.trim(),
        book_title: bookTitle.trim(),
        douban_rating: doubanRating ?? null
    }

    const { data, error } = await supabase
        .from('event_podcasts')
        .insert(payload)
        .select()
        .single()

    if (error) {
        console.error('Error adding event podcast:', error)
        return null
    }

    return rowToEventPodcast(data)
}

/**
 * Update an event-podcast mapping (admin)
 */
export async function updateEventPodcast(
    id: string,
    updates: {
        eventYear?: number
        eventTitle?: string
        podcastUuid?: string
        bookTitle?: string
        doubanRating?: number | null
    }
): Promise<boolean> {
    if (!supabase) return false

    const payload: any = {}
    if (updates.eventYear !== undefined) payload.event_year = updates.eventYear
    if (updates.eventTitle !== undefined) payload.event_title = updates.eventTitle
    if (updates.podcastUuid !== undefined) payload.podcast_uuid = updates.podcastUuid.trim()
    if (updates.bookTitle !== undefined) payload.book_title = updates.bookTitle.trim()
    if (updates.doubanRating !== undefined) payload.douban_rating = updates.doubanRating

    const { error } = await supabase
        .from('event_podcasts')
        .update(payload)
        .eq('id', id)

    if (error) {
        console.error('Error updating event podcast:', error)
        return false
    }

    return true
}

/**
 * Delete an event-podcast mapping (admin)
 */
export async function deleteEventPodcast(id: string): Promise<boolean> {
    if (!supabase) return false

    const { error } = await supabase
        .from('event_podcasts')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting event podcast:', error)
        return false
    }

    return true
}
