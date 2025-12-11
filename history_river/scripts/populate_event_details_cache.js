import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenRouter Key
const openRouterKey = process.env.OPENROUTER_API_KEY;
if (!openRouterKey) {
    console.error("Error: Missing OPENROUTER_API_KEY in .env.local");
    process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("Starting batch population of event details...");
    console.log("Target Table: timeline_event_cache");
    console.log("AI Model: deepseek/deepseek-v3.2-exp");
    console.log("Delay: 10 seconds per request");

    // 1. Fetch all events
    const { data: events, error } = await supabase
        .from('historical_events')
        .select('year, title, description')
        .order('year', { ascending: true });

    if (error) {
        console.error("Error fetching historical events:", error);
        process.exit(1);
    }

    console.log(`Found ${events.length} historical events to process.`);

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const { year, title, description } = event;

        // Construct UUID same as api/event-details.js: sha256(title|year)
        const uuid = crypto.createHash('sha256').update(`${title}|${year}`).digest('hex');

        // Check if exists
        const { data: existing, error: checkError } = await supabase
            .from('timeline_event_cache')
            .select('uuid, content')
            .eq('uuid', uuid)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error(`[${i + 1}/${events.length}] Error checking cache:`, checkError.message);
        }

        if (existing && existing.content && existing.content.length > 50) {
            console.log(`[${i + 1}/${events.length}] Skipping existing cache for: ${year} ${title}`);
            continue;
        }

        console.log(`[${i + 1}/${events.length}] Generating details for: ${year} ${title}...`);

        // Call OpenRouter
        const prompt = `你是一位精通中国历史的专家。请用简体中文为这一年的历史事件提供一个引人入胜的简短总结（约150字）。
用户交互上下文: "${description || ''}". 年份: ${year}.
如果该年份没有特别明确的单一重大事件，请描述当时的时代背景、文化风貌或正在发生的长期历史进程。侧重于文化、政治或军事意义。
请直接输出纯文本，分段落显示，不要使用 Markdown 标题。`;

        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://history-river.vercel.app',
                    'X-Title': 'History River Batch Generator'
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-v3.2-exp',
                    messages: [
                        { role: 'system', content: '你是中国史专家，输出简体中文的简短文本。' },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!res.ok) {
                console.error(`  -> API Error: ${res.status} ${res.statusText}`);
                const text = await res.text();
                console.error(`  -> Body: ${text.substring(0, 100)}`);
                // If strict rate limit, maybe wait longer?
                if (res.status === 429) {
                    console.log("  -> Rate limited! Waiting 60s...");
                    await sleep(60000);
                }
            } else {
                const json = await res.json();
                const content = json.choices?.[0]?.message?.content;

                if (content) {
                    // Insert
                    const { error: insertError } = await supabase.from('timeline_event_cache').upsert({
                        uuid: uuid,
                        year: year,
                        event_title: title,
                        context: description || '',
                        content: content,
                        is_cached: true,
                        is_deleted: false
                    });

                    if (insertError) {
                        console.error("  -> Supabase Insert Error:", insertError.message);
                    } else {
                        console.log("  -> Saved to cache.");
                    }
                } else {
                    console.error("  -> No content in response.");
                }
            }

        } catch (err) {
            console.error("  -> Fetch Error:", err);
        }

        // Wait 10s
        console.log("  -> Waiting 10s...");
        await sleep(10000);
    }

    console.log("Batch generation complete.");
}

main();
