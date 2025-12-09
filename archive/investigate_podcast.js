// 调查特定播客的 Supabase 数据
const episode_id = '1a338d50-5b8b-4091-ab81-60fe7f03a532';

// 从环境变量获取 Supabase 配置
const SUPABASE_URL = 'https://zhvczrrcwpxgrifshhmh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodmN6cnJjd3B4Z3JpZnNoaG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg5NzUsImV4cCI6MjA5Mjg0OTc1fQ.aSa9aWHsNxghJhGj91l1bU_vwAMPp9ZIDTQnm-OG-go';

async function investigate() {
  console.log('🔍 调查播客:', episode_id);
  console.log('');
  
  try {
    // 1. 查询 jobs 表
    console.log('1️⃣ 查询 jobs 表:');
    const jobsRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.${episode_id}&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const jobs = await jobsRes.json();
    console.log('状态:', jobsRes.status);
    console.log('记录数:', jobs.length);
    if (jobs.length > 0) {
      const job = jobs[0];
      console.log('数据:');
      console.log('  - status:', job.status);
      console.log('  - title:', job.title);
      console.log('  - has_output:', !!job.output_data);
      if (job.output_data) {
        console.log('  - audioPath:', job.output_data.audioPath);
        console.log('  - audioUrl:', job.output_data.audioUrl);
        console.log('  - script length:', job.output_data.script?.length || 0);
      }
    }
    console.log('');
    
    // 2. 查询 podcasts 表
    console.log('2️⃣ 查询 podcasts 表:');
    const podcastsRes = await fetch(`${SUPABASE_URL}/rest/v1/podcasts?id=eq.${episode_id}&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const podcasts = await podcastsRes.json();
    console.log('状态:', podcastsRes.status);
    console.log('记录数:', podcasts.length);
    if (podcasts.length > 0) {
      const podcast = podcasts[0];
      console.log('数据:');
      console.log('  - title:', podcast.title);
      console.log('  - audio_path:', podcast.audio_path);
      console.log('  - thumbnail_url:', podcast.thumbnail_url);
    }
    console.log('');
    
    console.log('✅ 调查完成');
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

investigate();