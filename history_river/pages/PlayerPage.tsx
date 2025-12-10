import React, { useEffect, useState, useRef } from 'react'
import { getPodcastById, PodcastJobRow, getRiverPinByJobId } from '@/services/podcastService'

const PlayerPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<PodcastJobRow | null>(null)
  const [riverPin, setRiverPin] = useState<{ title: string; doubanRating: number | null } | null>(null)
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const episode = params.get('episode') || ''
  const [currentIndex, setCurrentIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        setLoading(true)
        const [data, pinData] = episode ? await Promise.all([
          getPodcastById(episode),
          getRiverPinByJobId(episode)
        ]) : [null, null];
        if (!mounted) return
        setJob(data)
        setRiverPin(pinData)
        setLoading(false)
      })()
    return () => { mounted = false }
  }, [episode])

  const output = job?.output_data
  const segments = output?.script || []
  const title = job?.title || 'Podcast'

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-20 bg-[#0f172a] border-b border-[#0b1220]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => { window.location.href = '/' }} className="text-stone-300 hover:text-white flex-shrink-0">← 返回</button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="font-semibold truncate">{riverPin?.title || title}</div>
              {riverPin?.doubanRating && (
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                  <span>⭐</span>
                  <span>{riverPin.doubanRating}</span>
                </div>
              )}
            </div>
          </div>
          {job && <div className="text-xs opacity-80 flex-shrink-0">ID: {job.id}</div>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-stone-500">正在从 Supabase 获取播客数据...</p>
          </div>
        ) : !output ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-stone-700">
            未找到播客数据，或任务未完成。请确认任务 ID 有效，并且 Supabase 的访问策略允许匿名读取。
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <div className="w-full bg-black rounded-lg overflow-hidden border border-[#1f2a44] flex items-center justify-center min-h-[46vh] lg:min-h-[60vh]">
                {segments?.[currentIndex]?.generatedImageUrl ? (
                  <img
                    src={segments[currentIndex].generatedImageUrl}
                    alt={`seg-${currentIndex}`}
                    className="max-w-full max-h-full object-contain"
                    loading="eager"  // 封面图片立即加载
                  />
                ) : (
                  <div className="text-stone-400">无封面</div>
                )}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="text-sm font-semibold mb-2 text-stone-300">TRANSCRIPT</div>
              <div className="space-y-3 overflow-y-auto min-h-[46vh] lg:min-h-[60vh] max-h-[46vh] lg:max-h-[60vh] pr-2">
                {segments.map((seg, idx) => {
                  const active = idx === currentIndex
                  let acc = 0
                  for (let i = 0; i < idx; i++) {
                    const s = segments[i]
                    const start = s.startTime ?? acc
                    const dur = s.estimatedDuration ?? 0
                    const end = dur ? start + dur : (segments[i + 1]?.startTime ?? start + 1)
                    acc = end
                  }
                  const s = segments[idx]
                  const start = s.startTime ?? acc
                  const t = Math.floor(start)
                  const mm = String(Math.floor(t / 60)).padStart(2, '0')
                  const ss = String(t % 60).padStart(2, '0')
                  return (
                    <button key={idx} onClick={() => { if (audioRef.current) { audioRef.current.currentTime = t } setCurrentIndex(idx) }} className={`w-full text-left rounded-lg border ${active ? 'border-amber-500 bg-[#182235]' : 'border-[#1f2a44] bg-[#0f172a]'} p-3 hover:border-amber-500`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className={`text-xs ${active ? 'text-amber-400' : 'text-stone-400'}`}>{seg.speaker}</div>
                        <div className="text-xs text-stone-400">{mm}:{ss}</div>
                      </div>
                      <div className="text-stone-200 leading-relaxed">{seg.text}</div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="col-span-12">
              <div className="bg-[#0f172a] border border-[#1f2a44] rounded-lg p-3">
                <audio
                  controls
                  src={output.audioUrl}
                  className="w-full"
                  preload="metadata"  // 优化: 只加载元数据，不立即下载整个文件
                  ref={audioRef}
                  onTimeUpdate={() => {
                    const t = audioRef.current?.currentTime || 0
                    let idx = 0
                    let acc = 0
                    for (let i = 0; i < segments.length; i++) {
                      const s = segments[i]
                      const start = s.startTime ?? acc
                      const dur = s.estimatedDuration ?? 0
                      const end = dur ? start + dur : (segments[i + 1]?.startTime ?? start + 1)
                      if (t >= start && t < end) { idx = i; break }
                      acc = end
                    }
                    if (idx !== currentIndex) setCurrentIndex(idx)
                  }}
                  onEnded={() => setCurrentIndex(0)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 py-6 text-center text-xs text-stone-400">资源由 Supabase 提供 • 厚客户端直连</footer>


    </div>
  )
}

export default PlayerPage
