// Podcast Service - Updated 2025-11-28: Fixed thumbnail_url loading
import { createClient } from '@supabase/supabase-js'

const BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = (BASE_URL && ANON_KEY) ? createClient(BASE_URL, ANON_KEY) : null

interface ScriptSegment {
  speaker: 'Male' | 'Female'
  text: string
  visualPrompt: string
  generatedImageUrl?: string
  estimatedDuration?: number
  startTime?: number
}

interface JobOutput {
  script: ScriptSegment[]
  audioUrl: string
  audioPath: string
}

export interface PodcastJobRow {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  current_step?: string
  output_data?: JobOutput
  error_message?: string
  created_at?: string
  user_id?: string
  title?: string
  total_duration?: number
  thumbnail_url?: string  // 数据库中存储的第一张图片
}

interface PodcastsRow {
  id: string
  user_id?: string
  title?: string
  script?: ScriptSegment[]
  audio_path?: string
  thumbnail_url?: string
  created_at?: string | number
}

const headers = ANON_KEY ? { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } : {}

export async function fetchCompletedPodcasts(userId: string): Promise<PodcastJobRow[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (error) return []
    return data || []
  }
  if (!BASE_URL || !ANON_KEY) return []
  const url = `${BASE_URL}/rest/v1/jobs?select=*` + `&user_id=eq.${encodeURIComponent(userId)}` + `&status=eq.completed` + `&order=created_at.desc`
  const res = await fetch(url, { headers })
  if (!res.ok) return []
  return await res.json()
}

export async function getRiverPinByJobId(jobId: string): Promise<{ title: string; doubanRating: number | null } | null> {
  try {
    if (supabase) {
      const { data } = await supabase
        .from('river_pins')
        .select('title, douban_rating')
        .eq('job_id', jobId)
        .single()

      if (data) {
        return {
          title: data.title,
          doubanRating: data.douban_rating
        }
      }
      return null
    }

    // Fallback if no supabase client (though it should exist)
    // We can use the Vercel API route if we created one, but direct DB is better.
    // If we have to use fetch, we'd need an API route. But we have RLS enabled.
    return null
  } catch (e) {
    console.error('获取RiverPin失败:', e)
    return null
  }
}

export async function getPodcastById(jobId: string): Promise<PodcastJobRow | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    if (!error && data) {
      const jobData = data as PodcastJobRow
      // 如果 jobs 表中没有 thumbnail_url，尝试从 podcasts 表获取
      if (!jobData.thumbnail_url) {
        const { data: pData } = await supabase
          .from('podcasts')
          .select('thumbnail_url')
          .eq('id', jobId)
          .single()
        if (pData && pData.thumbnail_url) {
          jobData.thumbnail_url = pData.thumbnail_url
        }
      }
      return jobData
    }
    // Fallback to podcasts table
    const { data: pData } = await supabase
      .from('podcasts')
      .select('id,user_id,title,script,audio_path,thumbnail_url,total_duration,created_at')
      .eq('id', jobId)
      .single()
    if (!pData) return null
    const row = pData as PodcastsRow
    const path = (row.audio_path || '').replace(/^\//, '')
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'podcasts'
    const publicUrl = BASE_URL && path ? `${BASE_URL}/storage/v1/object/public/${bucket}/${path}` : ''
    const output: JobOutput = {
      audioUrl: publicUrl,
      audioPath: path,
      script: Array.isArray(row.script) ? row.script : []
    }
    const converted: PodcastJobRow = {
      id: row.id,
      status: 'completed',
      created_at: typeof row.created_at === 'string' ? row.created_at : String(row.created_at || ''),
      output_data: output,
      title: row.title,
      total_duration: (row as any).total_duration ? Number((row as any).total_duration) : undefined,
      thumbnail_url: row.thumbnail_url  // 添加 thumbnail_url 字段
    }
    return converted
  }
  if (!BASE_URL || !ANON_KEY) return null
  const url = `${BASE_URL}/rest/v1/jobs?select=*` + `&id=eq.${encodeURIComponent(jobId)}`
  const res = await fetch(url, { headers })
  if (!res.ok) return null
  const arr: PodcastJobRow[] = await res.json()
  if (arr && arr.length) {
    const jobData = arr[0]
    // 如果 jobs 表中没有 thumbnail_url，尝试从 podcasts 表获取
    if (!jobData.thumbnail_url) {
      const thumbUrl = `${BASE_URL}/rest/v1/podcasts?select=thumbnail_url` + `&id=eq.${encodeURIComponent(jobId)}`
      const thumbRes = await fetch(thumbUrl, { headers })
      if (thumbRes.ok) {
        const thumbArr: { thumbnail_url?: string }[] = await thumbRes.json()
        if (thumbArr && thumbArr.length && thumbArr[0].thumbnail_url) {
          jobData.thumbnail_url = thumbArr[0].thumbnail_url
        }
      }
    }
    return jobData
  }
  // REST fallback to podcasts
  const pUrl = `${BASE_URL}/rest/v1/podcasts?select=id,user_id,title,script,audio_path,thumbnail_url,total_duration,created_at` + `&id=eq.${encodeURIComponent(jobId)}`
  const pRes = await fetch(pUrl, { headers })
  if (!pRes.ok) return null
  const pArr: PodcastsRow[] = await pRes.json()
  if (!pArr || !pArr.length) return null
  const row = pArr[0]
  const path = (row.audio_path || '').replace(/^\//, '')
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'podcasts'
  const publicUrl = path ? `${BASE_URL}/storage/v1/object/public/${bucket}/${path}` : ''
  const output: JobOutput = {
    audioUrl: publicUrl,
    audioPath: path,
    script: Array.isArray(row.script) ? row.script : []
  }
  return {
    id: row.id,
    status: 'completed',
    created_at: typeof row.created_at === 'string' ? row.created_at : String(row.created_at || ''),
    output_data: output,
    title: row.title,
    total_duration: (row as any).total_duration ? Number((row as any).total_duration) : undefined,
    thumbnail_url: row.thumbnail_url  // 添加 thumbnail_url 字段
  }
}
