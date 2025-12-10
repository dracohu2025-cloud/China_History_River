import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars!')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const JOB_ID = 'e8058aee-71d2-4328-996a-961f88846d4e'

async function debug() {
    console.log('Checking ID:', JOB_ID)

    // 1. Check jobs table
    console.log('\n--- Checking jobs table ---')
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', JOB_ID)
        .maybeSingle()

    if (jobError) console.error('Error fetching job:', jobError)
    else {
        console.log('Job found:', !!job, job ? `Status: ${job.status}` : '')
        if (job && job.output_data) {
            console.log('  output_data.audioUrl:', job.output_data.audioUrl)
            console.log('  output_data.audioPath:', job.output_data.audioPath)
        }
    }

    // 2. Check podcasts table
    console.log('\n--- Checking podcasts table ---')
    const { data: podcast, error: podError } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', JOB_ID)
        .maybeSingle()

    if (podError) console.error('Error fetching podcast:', podError)
    else {
        console.log('Podcast found:', !!podcast)
        if (podcast) {
            console.log('  audio_path:', podcast.audio_path)
            console.log('  thumbnail_url:', podcast.thumbnail_url)
        }
    }

    // 3. Check river_pins table (to see if it exists there but points elsewhere)
    console.log('\n--- Checking river_pins table ---')
    const { data: pin, error: pinError } = await supabase
        .from('river_pins')
        .select('*')
        .eq('job_id', JOB_ID)
        .maybeSingle()

    if (pinError) console.error('Error fetching pin:', pinError)
    else console.log('Pin found:', !!pin, pin)
}

debug()
