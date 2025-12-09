import React, { useEffect, useState, useMemo, useRef } from 'react'
import { getPodcastById, PodcastJobRow, getRiverPinByJobId } from '@/services/podcastService'

interface PodcastPlayerModalProps {
  jobId: string
  onClose: () => void
}

interface SegmentWithTimestamp {
  speaker: string
  text: string
  visualPrompt: string
  generatedImageUrl?: string
  estimatedDuration?: number
  startTime: number
}

interface RiverPinData {
  title: string
  doubanRating: number | null
}

const PodcastPlayerModal: React.FC<PodcastPlayerModalProps> = ({ jobId, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<PodcastJobRow | null>(null)
  const [pinData, setPinData] = useState<RiverPinData | null>(null)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      const data = await getPodcastById(jobId)
      if (mounted) {
        setJob(data)
        setLoading(false)
      }
    }
    run()

    // 获取 Django 后台的 RiverPin 数据 (书名和豆瓣评分)
    getRiverPinByJobId(jobId).then(data => {
      if (data) {
        setPinData(data)
        console.log('📌 RiverPin 数据加载成功:', data)
      }
    })

    return () => { mounted = false }
  }, [jobId])

  const output = job?.output_data
  
  // 计算每个片段的时间戳
  const segments: SegmentWithTimestamp[] = useMemo(() => {
    const script = output?.script || []
    let accumulatedTime = 0
    return script.map(segment => ({
      ...segment,
      startTime: accumulatedTime,
    })).map(segment => {
      accumulatedTime += segment.estimatedDuration || 0
      return segment
    })
  }, [output?.script])
  
  // 监听音频时间更新，实现图片同步
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || segments.length === 0) return

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime
      
      // 找到当前播放的片段
      const activeIndex = segments.findIndex((seg, idx) => {
        const nextSeg = segments[idx + 1]
        return currentTime >= seg.startTime && 
               (!nextSeg || currentTime < nextSeg.startTime)
      })
      
      if (activeIndex !== -1 && activeIndex !== currentSegmentIndex) {
        setCurrentSegmentIndex(activeIndex)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
  }, [segments, currentSegmentIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-stone-200 text-stone-800 max-w-3xl w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-stone-50 px-6 py-4 flex justify-between items-center border-b border-stone-200">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-title text-amber-700">
                {pinData?.title || (job?.title || '播客播放')}
              </h2>
              {pinData?.doubanRating && (
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  {pinData.doubanRating}
                </span>
              )}
            </div>
            {job && (
              <p className="text-xs text-stone-500 mt-1">
                ID: {job.id} {pinData && <span>• 数据来自 Django 后台</span>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-stone-500 animate-pulse">正在从 Supabase 获取播客...</p>
            </div>
          ) : !output ? (
            <div className="text-stone-500">未找到播客数据，或任务未完成。</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="aspect-video bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center overflow-hidden">
                  {segments[currentSegmentIndex]?.generatedImageUrl ? (
                    <img 
                      src={segments[currentSegmentIndex].generatedImageUrl} 
                      alt="cover" 
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  ) : (
                    <div className="text-stone-400">无封面</div>
                  )}
                </div>
                <div className="mt-4">
                  <audio ref={audioRef} controls src={output.audioUrl} className="w-full" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-stone-700 mb-2">文稿与图片</h3>
                <div className="space-y-3 overflow-y-auto max-h-[38vh] pr-2">
                  {segments.map((seg, idx) => {
                    const isActive = idx === currentSegmentIndex
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-200 ${
                          isActive ? 'bg-amber-50 border border-amber-200' : ''
                        }`}
                      >
                        <div className={`w-16 h-16 bg-stone-100 rounded border overflow-hidden flex-shrink-0 ${
                          isActive ? 'border-amber-400' : 'border-stone-200'
                        }`}>
                          {seg.generatedImageUrl ? (
                            <img src={seg.generatedImageUrl} alt={`seg-${idx}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">无图</div>
                          )}
                        </div>
                        <div className="text-sm text-stone-700 leading-relaxed flex-1">
                          <div className="text-stone-500 text-xs mb-1">
                            {seg.speaker} {seg.estimatedDuration ? `• ${seg.estimatedDuration}s` : ''}
                          </div>
                          {seg.text}
                        </div>
                      </div>
                    )
                  })}%0A              </div>%0A              <div className=
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-xs text-center text-stone-500">
          资源由 Supabase 提供 • 厚客户端直连
        </div>
      </div>
    </div>
  )
}

export default PodcastPlayerModal