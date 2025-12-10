import dotenv from 'dotenv'
import path from 'path'
import https from 'https'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const BASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const JOB_ID = 'e8058aee-71d2-4328-996a-961f88846d4e'

const headers = ANON_KEY ? { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } : {}

console.log('Testing Fetch logic')
console.log('URL:', BASE_URL)
console.log('Key Present:', !!ANON_KEY)

async function test() {
    // 1. Fetch Job
    const url = `${BASE_URL}/rest/v1/jobs?select=*` + `&id=eq.${encodeURIComponent(JOB_ID)}`
    console.log('\nFetching Job:', url)

    try {
        const res = await fetch(url, { headers })
        console.log('Job Res Status:', res.status)
        if (!res.ok) {
            console.log('Job Fetch Failed')
            return
        }

        const arr = await res.json()
        console.log('Job Array Length:', arr.length)

        if (arr.length > 0) {
            const jobData = arr[0]
            console.log('Initial Audio URL:', jobData.output_data?.audioUrl)

            // 2. Mock the Patch Logic
            if (!jobData.output_data?.audioUrl) {
                console.log('Audio URL missing, attempting patch...')
                const pUrl = `${BASE_URL}/rest/v1/podcasts?select=thumbnail_url,audio_path` + `&id=eq.${encodeURIComponent(JOB_ID)}`
                console.log('Fetching Podcast:', pUrl)

                const pRes = await fetch(pUrl, { headers })
                console.log('Podcast Res Status:', pRes.status)

                if (pRes.ok) {
                    const pArr = await pRes.json()
                    console.log('Podcast Array:', pArr)

                    if (pArr.length > 0) {
                        const row = pArr[0]
                        const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'podcasts'
                        const path = row.audio_path.replace(/^\//, '')
                        const fullUrl = `${BASE_URL}/storage/v1/object/public/${bucket}/${path}`
                        console.log('PATCHED URL:', fullUrl)
                    } else {
                        console.log('Podcast Array Empty - RLS Issue?')
                    }
                } else {
                    console.log('Podcast Fetch Failed:', await pRes.text())
                }
            }
        }
    } catch (e) {
        console.error('Fetch Error:', e)
    }
}

test()
