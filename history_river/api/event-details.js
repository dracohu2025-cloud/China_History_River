import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Prefer Service Role for backend
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // CORS policies
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') // Replace * with your origin in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, context, event_title } = req.body;

  if (!year) {
    return res.status(400).json({ error: 'Year is required' });
  }

  try {
    // 1. Check Cache
    const title = event_title || '__year__';
    const uuid = crypto.createHash('sha256').update(`${title}|${year}`).digest('hex');

    const { data: cacheEntry, error: cacheError } = await supabase
      .from('timeline_event_cache')
      .select('content')
      .eq('uuid', uuid)
      .eq('is_deleted', false)
      .single();

    if (cacheEntry && !cacheError) {
      return res.status(200).json({ text: cacheEntry.content, cached: true });
    }

    // 2. Fetch from OpenRouter (DeepSeek)
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API Key not configured');
    }

    const prompt = `你是一位精通中国历史的专家。请用简体中文为这一年的历史事件提供一个引人入胜的简短总结（约150字）。
用户交互上下文: "${context || ''}". 年份: ${year}.
如果该年份没有特别明确的单一重大事件，请描述当时的时代背景、文化风貌或正在发生的长期历史进程。侧重于文化、政治或军事意义。
请直接输出纯文本，分段落显示，不要使用 Markdown 标题。`;

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2-exp', // Or fall back to deepseek/deepseek-chat
        messages: [
          { role: 'system', content: '你是中国史专家，输出简体中文的简短文本。' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      throw new Error(`OpenRouter API error: ${openRouterRes.status} - ${errorText}`);
    }

    const openRouterData = await openRouterRes.json();
    const content = openRouterData.choices?.[0]?.message?.content || '暂无详细信息。';

    // 3. Save to Cache
    // We use upsert to handle potential race conditions or re-enabling deleted cache
    await supabase.from('timeline_event_cache').upsert({
      uuid: uuid,
      year: year,
      event_title: event_title || '',
      context: context || '',
      content: content,
      is_cached: true, // It is now cached for next time
      is_deleted: false
    });

    return res.status(200).json({ text: content, cached: false });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
