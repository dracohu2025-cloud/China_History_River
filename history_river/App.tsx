import React, { useState, useEffect } from 'react';
import RiverCanvas from './components/RiverCanvas';
import DetailModal from './components/DetailModal';
import PodcastPlayerModal from './components/PodcastPlayerModal';
import { HistoricalEvent } from './types';

const App: React.FC = () => {
  const isBrowser = typeof window !== 'undefined'
  const [dimensions, setDimensions] = useState({ width: isBrowser ? window.innerWidth : 1024, height: isBrowser ? window.innerHeight : 768 });
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!isBrowser) return
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize()
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isBrowser) return
    const params = new URLSearchParams(window.location.search)
    const episode = params.get('episode')
    if (episode) {
      setCurrentEpisodeId(episode)
      setPlayerOpen(true)
    }
  }, [])

  const handleEventSelect = (event: HistoricalEvent | null, year: number) => {
    // ✅ 只有点击具体历史事件时才显示弹窗
    // 点击空白年份(event为null)不显示任何内容
    if (event) {
      const currentYear = new Date().getFullYear();
      // 额外检查年份合理性（虽然历史数据应该都<=当前年份）
      if (year <= currentYear) {
        setSelectedEvent(event);
        setSelectedYear(year);
        setModalOpen(true);
      }
    }
    // event 为 null 时什么都不做，不查询不显示
  };

  return (
    <div className="relative w-screen h-screen bg-stone-50 text-stone-900 overflow-hidden">
      
      {/* UI Header / Title */}
      <div className="absolute top-0 left-0 w-full px-6 py-3 z-10 pointer-events-none bg-gradient-to-b from-stone-50 via-stone-50/60 to-transparent">
        <div className="flex items-baseline gap-3">
          <h1 className="text-5xl md:text-6xl font-title text-stone-800 drop-shadow-sm tracking-wider">
            <span className="text-amber-700">历史</span>长河
          </h1>
          <p className="text-stone-600 font-serif italic text-xs md:text-sm">
            中华文明五千年，岁月如歌，逝者如斯夫。
          </p>
        </div>
      </div>

      <RiverCanvas 
        width={dimensions.width} 
        height={dimensions.height} 
        onEventSelect={handleEventSelect}
        onOpenEpisode={(jobId) => {
          if (isBrowser) {
            // 添加版本参数绕过缓存
            window.location.href = `/player.html?episode=${jobId}&v=3`
          }
        }}
      />


      {/* Detail Modal */}
      {modalOpen && selectedYear !== null && (
        <DetailModal 
          year={selectedYear} 
          event={selectedEvent} 
          onClose={() => setModalOpen(false)} 
        />
      )}

      {/* Podcast Player removed: navigate to standalone page */}

      
    </div>
  );
};

export default App;
