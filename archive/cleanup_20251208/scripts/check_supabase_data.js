#!/usr/bin/env node

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

import { createClient } from '@supabase/supabase-js';

const jobId = '16ec7d2c-cd25-4dce-90b1-b3f680aaeff1';

async function checkSupabaseData() {
  console.log('🔍 Checking Supabase data for job_id:', jobId);
  console.log('');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check jobs table with status='completed'
    console.log('📋 1. Checking jobs table for completed job...');
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('status', 'completed')
      .single();

    if (jobError) {
      console.log('   ❌ No completed job found in jobs table');
      console.log('   Error:', jobError.message);
    } else {
      console.log('   ✅ Found completed job in jobs table!');
      console.log('   Job ID:', jobData.id);
      console.log('   Status:', jobData.status);
      console.log('   Title:', jobData.title || 'No title');
      console.log('   Created at:', jobData.created_at);
      
      if (jobData.output_data) {
        console.log('   📊 Output data found:');
        console.log('      - Audio URL:', jobData.output_data.audioUrl || 'No audio URL');
        console.log('      - Audio Path:', jobData.output_data.audioPath || 'No audio path');
        console.log('      - Script segments:', Array.isArray(jobData.output_data.script) ? jobData.output_data.script.length : 0);
        
        if (Array.isArray(jobData.output_data.script) && jobData.output_data.script.length > 0) {
          console.log('      - First script segment:', JSON.stringify(jobData.output_data.script[0], null, 2));
        }
      } else {
        console.log('   ⚠️  No output_data found');
      }
    }
    console.log('');

    // 2. Check podcasts table with the job_id
    console.log('🎧 2. Checking podcasts table...');
    const { data: podcastData, error: podcastError } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', jobId)
      .single();

    if (podcastError) {
      console.log('   ❌ No podcast found in podcasts table');
      console.log('   Error:', podcastError.message);
    } else {
      console.log('   ✅ Found podcast in podcasts table!');
      console.log('   Podcast ID:', podcastData.id);
      console.log('   Title:', podcastData.title || 'No title');
      console.log('   Audio path:', podcastData.audio_path || 'No audio path');
      console.log('   Thumbnail URL:', podcastData.thumbnail_url || 'No thumbnail');
      console.log('   Created at:', podcastData.created_at);
      
      if (podcastData.script) {
        console.log('   📜 Script found:', Array.isArray(podcastData.script) ? podcastData.script.length : 0, 'segments');
        if (Array.isArray(podcastData.script) && podcastData.script.length > 0) {
          console.log('   - First script segment:', JSON.stringify(podcastData.script[0], null, 2));
        }
      } else {
        console.log('   ⚠️  No script found');
      }
    }
    console.log('');

    // 3. Check if job exists with any status
    console.log('🔍 3. Checking jobs table for any status...');
    const { data: anyJobData, error: anyJobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (anyJobError) {
      console.log('   ❌ No job found with any status');
      console.log('   Error:', anyJobError.message);
    } else {
      console.log('   ✅ Found job with status:', anyJobData.status);
      console.log('   Job details:');
      console.log('   - ID:', anyJobData.id);
      console.log('   - Status:', anyJobData.status);
      console.log('   - Current step:', anyJobData.current_step || 'No current step');
      console.log('   - Progress:', anyJobData.progress || 'No progress');
      console.log('   - Error message:', anyJobData.error_message || 'No error');
      console.log('   - Created at:', anyJobData.created_at);
      console.log('   - User ID:', anyJobData.user_id);
    }

  } catch (error) {
    console.error('❌ Error checking Supabase data:', error);
  }
}

// Run the check
checkSupabaseData().catch(console.error);