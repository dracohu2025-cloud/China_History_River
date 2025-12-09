import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const { year, context, uuid } = await req.json()
  const key = process.env.OPENROUTER_API_KEY || process.env.OpenRouter_API_KEY
  if (!key) {
    return new Response(JSON.stringify({ text: 'OpenRouter API Key 未配置。无法获取详情。' }), { status: 400 })
  }
  const storageDir = path.join(process.cwd(), 'server', 'storage')
  const cacheFile = path.join(storageDir, 'eventsCache.json')
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
  const cacheKey = uuid || `year:${year}`
  try {
    const raw = fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile, 'utf-8') : '{}'
    const cache = JSON.parse(raw || '{}')
    if (cache[cacheKey]) {
      return new Response(JSON.stringify({ text: cache[cacheKey], cached: true }), { status: 200 })
    }
  } catch {}
  const prompt = `你是一位精通中国历史的专家。请用简体中文为这一年的历史事件提供一个引人入胜的简短总结（约150字）。\n用户交互上下文: "${context}". 年份: ${year}.\n如果该年份没有特别明确的单一重大事件，请描述当时的时代背景、文化风貌或正在发生的长期历史进程。侧重于文化、政治或军事意义。\n请直接输出纯文本，分段落显示，不要使用 Markdown 标题。`
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2-exp',
        messages: [
          { role: 'system', content: '你是中国史专家，输出简体中文的简短文本。' },
          { role: 'user', content: prompt }
        ]
      })
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) return new Response(JSON.stringify({ text: '获取历史数据时出错，请稍后再试。' }), { status: 502 })
    const text = data?.choices?.[0]?.message?.content || '暂无详细信息。'
    try {
      const raw = fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile, 'utf-8') : '{}'
      const cache = JSON.parse(raw || '{}')
      cache[cacheKey] = text
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
    } catch {}
    return new Response(JSON.stringify({ text, cached: false }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ text: '获取历史数据时出错，请稍后再试。' }), { status: 500 })
  }
}