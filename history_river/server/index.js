import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const app = express()
app.use(cors())
app.use(express.json())

const port = process.env.PORT ? Number(process.env.PORT) : 4000
const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OpenRouter_API_KEY

const storageDir = path.join(process.cwd(), 'server', 'storage')
const cacheFile = path.join(storageDir, 'eventsCache.json')
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
let cache = {}
try {
  cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
} catch {
  cache = {}
}
const saveCache = () => {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
  } catch {}
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', openrouter: Boolean(openrouterKey) })
})

app.post('/api/event-details', async (req, res) => {
  const { year, context, uuid } = req.body || {}
  const key = uuid || `year:${year}`
  if (cache[key]) {
    return res.json({ text: cache[key], cached: true })
  }
  if (!openrouterKey) {
    return res.status(400).json({ text: 'OpenRouter API Key 未配置。无法获取详情。' })
  }
  const prompt = `你是一位精通中国历史的专家。请用简体中文为这一年的历史事件提供一个引人入胜的简短总结（约150字）。\n用户交互上下文: "${context}". 年份: ${year}.\n如果该年份没有特别明确的单一重大事件，请描述当时的时代背景、文化风貌或正在发生的长期历史进程。侧重于文化、政治或军事意义。\n请直接输出纯文本，分段落显示，不要使用 Markdown 标题。`
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'deepseek/deepseek-v3.2-exp',
        messages: [
          { role: 'system', content: '你是中国史专家，输出简体中文的简短文本。' },
          { role: 'user', content: prompt }
        ]
      })
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      console.error('OpenRouter error', resp.status, data)
      return res.status(502).json({ text: '获取历史数据时出错，请稍后再试。' })
    }
    const text = data?.choices?.[0]?.message?.content || '暂无详细信息。'
    cache[key] = text
    saveCache()
    return res.json({ text, cached: false })
  } catch (err) {
    console.error('OpenRouter fetch failed', err)
    return res.status(500).json({ text: '获取历史数据时出错，请稍后再试。' })
  }
})

app.listen(port, () => {})