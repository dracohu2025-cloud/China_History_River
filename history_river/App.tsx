import React, { useState, useEffect } from 'react';
import RiverCanvas from './components/RiverCanvas';
import OverviewCanvas from './components/OverviewCanvas';
import DetailModal from './components/DetailModal';
import PodcastPlayerModal from './components/PodcastPlayerModal';
import { HistoricalEvent, Dynasty, RiverPin } from './types';
import { fetchDynasties, fetchEvents, fetchRiverPins } from './services/dataService';
import { DYNASTIES as FALLBACK_DYNASTIES, KEY_EVENTS as FALLBACK_EVENTS } from './data/historyData';

const COUNTRIES = [
  { code: 'china', label: '🇨🇳 中国 (China)' },
  { code: 'usa', label: '🇺🇸 美国 (USA)' },
  { code: 'uk', label: '🇬🇧 英国 (UK)' },
  { code: 'france', label: '🇫🇷 法国 (France)' },
  { code: 'germany', label: '🇩🇪 德国 (Germany)' },
  { code: 'russia', label: '🇷🇺 俄罗斯 (Russia)' },
  { code: 'india', label: '🇮🇳 印度 (India)' },
  { code: 'jp', label: '🇯🇵 日本' },
  { code: 'overview', label: '🌎 全览' },
];

const App: React.FC = () => {
  const isBrowser = typeof window !== 'undefined'
  const [dimensions, setDimensions] = useState({ width: isBrowser ? window.innerWidth : 1024, height: isBrowser ? window.innerHeight : 768 });
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  // New State: Selected Country
  const [selectedCountry, setSelectedCountry] = useState<string>('china');

  const [dynasties, setDynasties] = useState<Dynasty[]>(FALLBACK_DYNASTIES);
  const [events, setEvents] = useState<HistoricalEvent[]>(FALLBACK_EVENTS);
  const [pins, setPins] = useState<RiverPin[]>([]);
  const [allDynasties, setAllDynasties] = useState<{ [code: string]: Dynasty[] }>({});

  useEffect(() => {
    const loadData = async () => {
      if (selectedCountry === 'overview') {
        const targetCountries = COUNTRIES.filter(c => c.code !== 'overview');
        const promises = targetCountries.map(c => fetchDynasties(c.code));
        const results = await Promise.all(promises);

        const newAllDynasties: { [code: string]: Dynasty[] } = {};
        targetCountries.forEach((c, idx) => {
          newAllDynasties[c.code] = results[idx];
        });
        setAllDynasties(newAllDynasties);
      } else {
        const [d, e, p] = await Promise.all([
          fetchDynasties(selectedCountry),
          fetchEvents(selectedCountry),
          fetchRiverPins(selectedCountry)
        ]);
        // For China, we might have fallbacks. For others, allow empty.
        if (d.length > 0) setDynasties(d);
        else if (selectedCountry === 'china') setDynasties(FALLBACK_DYNASTIES);

        if (e.length > 0) setEvents(e);
        else if (selectedCountry === 'china') setEvents(FALLBACK_EVENTS);

        if (p.length > 0) setPins(p);
      }
    };
    loadData();
  }, [selectedCountry]);

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

  const handleOpenEpisode = (jobId: string) => {
    if (isBrowser && jobId) {
      window.location.href = `/player.html?episode=${jobId}&v=3`
    }
  }

  return (
    <div className="relative w-screen h-screen bg-stone-50 text-stone-900 overflow-hidden">

      {/* UI Header / Title */}
      <div className="absolute top-0 left-0 w-full px-6 py-3 z-10 pointer-events-none bg-gradient-to-b from-stone-50 via-stone-50/60 to-transparent flex justify-between items-start">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-baseline gap-3">
            <h1 className="text-5xl md:text-6xl font-title text-stone-800 drop-shadow-sm tracking-wider">
              <span className="text-amber-700">历史</span>长河
            </h1>
          </div>

          {/* Country Selector */}
          <div className="flex gap-2 flex-wrap">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`px-3 py-1 rounded-full text-sm transition-all shadow-sm border
                  ${selectedCountry === c.code
                    ? 'bg-amber-700 text-white border-amber-800 scale-105 font-bold'
                    : 'bg-white/80 text-stone-600 border-stone-200 hover:bg-stone-100'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative h-full w-full">
        {selectedCountry === 'overview' ? (
          <OverviewCanvas
            width={dimensions.width}
            height={dimensions.height}
            allDynasties={allDynasties}
            countryLabels={COUNTRIES.reduce((acc, c) => ({ ...acc, [c.code]: c.label }), {})}
          />
        ) : (
          <RiverCanvas
            key={selectedCountry}
            onEventSelect={handleEventSelect}
            onOpenEpisode={handleOpenEpisode}
            width={dimensions.width}
            height={dimensions.height}
            dynasties={dynasties}
            events={events}
            pins={pins}
          />
        )}
      </div>


      {/* Detail Modal */}
      {modalOpen && selectedYear !== null && (
        <DetailModal
          year={selectedYear}
          event={selectedEvent}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Buy Me A Coffee Button */}
      <div className="fixed bottom-4 right-4 z-50 transition-transform hover:scale-105">
        <a href="https://www.buymeacoffee.com/dracohu2027" target="_blank" rel="noreferrer">
          <img
            src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=dracohu2027&button_colour=BD5FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
            alt="Buy Me A Coffee"
            className="h-10 md:h-12" // Adjust height for responsiveness
          />
        </a>
      </div>

    </div>
  );
};

export default App;
