import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(_req: NextRequest) {
  const openrouter = Boolean(process.env.OPENROUTER_API_KEY || process.env.OpenRouter_API_KEY)
  let cacheSize = 0
  try {
    const storageDir = path.join(process.cwd(), 'server', 'storage')
    const file = path.join(storageDir, 'eventsCache.json')
    const stat = fs.existsSync(file) ? fs.statSync(file) : undefined
    cacheSize = stat?.size || 0
  } catch {}
  return new Response(JSON.stringify({ status: 'ok', openrouter, cacheSize }), { status: 200 })
}