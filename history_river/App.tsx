import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RiverCanvas from './components/RiverCanvas';
import OverviewCanvas from './components/OverviewCanvas';
import DetailModal from './components/DetailModal';
import PodcastPlayerModal from './components/PodcastPlayerModal';
import { HistoricalEvent, Dynasty, RiverPin } from './types';
import { fetchDynasties, fetchEvents, fetchRiverPins } from './services/dataService';
import { DYNASTIES as FALLBACK_DYNASTIES, KEY_EVENTS as FALLBACK_EVENTS } from './data/historyData';

const COUNTRIES = [
  { code: 'overview', label: '🌎 全览' },
  { code: 'china', label: '🇨🇳 中国 (China)' },
  { code: 'usa', label: '🇺🇸 美国 (USA)' },
  { code: 'uk', label: '🇬🇧 英国 (UK)' },
  { code: 'france', label: '🇫🇷 法国 (France)' },
  { code: 'germany', label: '🇩🇪 德国 (Germany)' },
  { code: 'russia', label: '🇷🇺 俄罗斯 (Russia)' },
  { code: 'india', label: '🇮🇳 印度 (India)' },
  { code: 'jp', label: '🇯🇵 日本' },
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
  const [selectedCountry, setSelectedCountry] = useState<string>('overview');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

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
        const [d, e] = await Promise.all([
          fetchDynasties(selectedCountry),
          fetchEvents(selectedCountry)
        ]);
        // For China, we might have fallbacks. For others, allow empty.
        if (d.length > 0) setDynasties(d);
        else if (selectedCountry === 'china') setDynasties(FALLBACK_DYNASTIES);

        if (e.length > 0) setEvents(e);
        else if (selectedCountry === 'china') setEvents(FALLBACK_EVENTS);

        // Pins removed as per request
        setPins([]);
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

  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="relative w-screen h-screen bg-stone-50 text-stone-900 overflow-hidden">

      {/* Header / HUD */}
      <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-start pointer-events-none">

        {/* Title & Descr */}
        <div className="pointer-events-auto bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-stone-200/50">
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight font-serif">
            {t('app.title')}
          </h1>
          <p className="text-sm text-stone-500 mt-1 font-medium">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 pointer-events-auto">
          {/* Language Selector */}
          <div className="relative">
            <select
              onChange={handleLanguageChange}
              value={i18n.language.split('-')[0]} // Handle 'en-US' etc
              className="appearance-none bg-white/80 backdrop-blur-md px-4 py-2 pr-8 rounded-xl shadow-sm border border-stone-200/50 text-stone-700 font-medium hover:bg-white transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="appearance-none bg-white/80 backdrop-blur-md px-4 py-2 pr-8 rounded-xl shadow-sm border border-stone-200/50 text-stone-700 font-medium hover:bg-white transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="overview">{t('countries.overview')}</option>
              {COUNTRIES.filter(c => c.code !== 'overview').map(c => (
                <option key={c.code} value={c.code}>
                  {t(`countries.${c.code}`)}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          {/* 3D View Switch - Temporarily Disabled
          <button
            onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
            className="bg-stone-800 text-stone-50 px-4 py-2 rounded-xl font-medium shadow-lg shadow-stone-900/10 hover:bg-stone-900 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
          >
            {viewMode === '2d' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="4" /><path d="M3 9h18" /><path d="M3 15h18" /></svg>
                {t('app.switch_3d')}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" /><path d="M12 2v20" /></svg>
                {t('app.switch_2d')}
              </>
            )}
          </button>
           */}

          <a href="https://www.buymeacoffee.com/dracohu2027" target="_blank" rel="noopener noreferrer">
            <img
              src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=dracohu2027&button_colour=BD5FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"
              alt="Buy me a coffee"
              className="h-10 hover:scale-105 transition-transform"
            />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative h-full w-full">
        {selectedCountry === 'overview' ? (
          <OverviewCanvas
            width={dimensions.width}
            height={dimensions.height}
            allDynasties={allDynasties}
            countryLabels={COUNTRIES.reduce((acc, c) => ({ ...acc, [c.code]: t(`countries.${c.code}`) }), {})}
          />
        ) : (
          <RiverCanvas
            key={selectedCountry}
            onEventSelect={handleEventSelect}
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

    </div>
  );
};

export default App;
