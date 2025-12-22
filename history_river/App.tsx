import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RiverCanvas from './components/RiverCanvas';
import OverviewCanvas from './components/OverviewCanvas';
import DetailModal from './components/DetailModal';
import PodcastPlayerModal from './components/PodcastPlayerModal';
import { HistoricalEvent, Dynasty, RiverPin } from './types';
import { fetchDynasties, fetchEvents, fetchRiverPins } from './services/dataService';
import { DYNASTIES as FALLBACK_DYNASTIES, KEY_EVENTS as FALLBACK_EVENTS } from './data/historyData';
import { WORLD_HISTORY } from './data/worldHistory';

const COUNTRIES = [
  { code: 'overview', emoji: '🌎' },
  { code: 'china', emoji: '🇨🇳' },
  { code: 'usa', emoji: '🇺🇸' },
  { code: 'uk', emoji: '🇬🇧' },
  { code: 'france', emoji: '🇫🇷' },
  { code: 'germany', emoji: '🇩🇪' },
  { code: 'russia', emoji: '🇷🇺' },
  { code: 'poland', emoji: '🇵🇱' },
  { code: 'greece', emoji: '🇬🇷' },
  { code: 'italy', emoji: '🇮🇹' },
  { code: 'india', emoji: '🇮🇳' },
  { code: 'japan', emoji: '🇯🇵' },
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
  const [allEvents, setAllEvents] = useState<{ [code: string]: HistoricalEvent[] }>({});
  const [mounted, setMounted] = useState(false);

  // Ensure portal root exists for DetailModal
  useEffect(() => {
    let portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      // Style independent of React styles to correct stacking context
      portalRoot.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      document.body.appendChild(portalRoot);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    console.log('App: Mounted, Version: 2025-12-14-FIXED-ZOOM-OFFICIAL');

    // Check if we have history state (returning from 3D view?)
    const loadData = async () => {
      if (selectedCountry === 'overview') {
        const targetCountries = COUNTRIES.filter(c => c.code !== 'overview');

        // Parallel fetch for dynasties AND events
        const dynastyPromises = targetCountries.map(c => fetchDynasties(c.code));
        const eventPromises = targetCountries.map(c => fetchEvents(c.code));

        const [dynastyResults, eventResults] = await Promise.all([
          Promise.all(dynastyPromises),
          Promise.all(eventPromises)
        ]);

        const newAllDynasties: { [code: string]: Dynasty[] } = {};
        const newAllEvents: { [code: string]: HistoricalEvent[] } = {};

        targetCountries.forEach((c, idx) => {
          let d = dynastyResults[idx];
          let e = eventResults[idx];

          if (!d || d.length === 0) {
            if (c.code === 'china') d = FALLBACK_DYNASTIES;
            else if (WORLD_HISTORY[c.code]) d = WORLD_HISTORY[c.code].dynasties;
          }

          if (!e || e.length === 0) {
            if (c.code === 'china') e = FALLBACK_EVENTS;
            else if (WORLD_HISTORY[c.code]) e = WORLD_HISTORY[c.code].events;
          }

          newAllDynasties[c.code] = d || [];
          newAllEvents[c.code] = e || [];
        });

        setAllDynasties(newAllDynasties);
        setAllEvents(newAllEvents);

      } else {
        const [d, e] = await Promise.all([
          fetchDynasties(selectedCountry),
          fetchEvents(selectedCountry)
        ]);
        // For China, we might have fallbacks. For others, allow empty and CLEAR state if empty.
        if (d.length > 0) {
          setDynasties(d);
        } else if (selectedCountry === 'china') {
          setDynasties(FALLBACK_DYNASTIES);
        } else if (WORLD_HISTORY[selectedCountry]) {
          setDynasties(WORLD_HISTORY[selectedCountry].dynasties);
        } else {
          setDynasties([]);
        }

        if (e.length > 0) {
          setEvents(e);
        } else if (selectedCountry === 'china') {
          setEvents(FALLBACK_EVENTS);
        } else if (WORLD_HISTORY[selectedCountry]) {
          setEvents(WORLD_HISTORY[selectedCountry].events);
        } else {
          setEvents([]);
        }

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
    console.log('App: handleEventSelect called', event, year);
    setSelectedEvent(event);
    setSelectedYear(year);
    if (event) {
      setModalOpen(true);
      console.log('App: opening modal for', event.title);
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
        <div className={`pointer-events-auto bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-stone-200/50 flex ${i18n.language.startsWith('zh') ? 'flex-row items-baseline gap-4' : 'flex-col'}`}>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight font-serif whitespace-nowrap">
            {t('app.title')}
          </h1>
          <p className="text-sm text-stone-500 font-medium whitespace-nowrap">
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
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.emoji} {t(`countries.${c.code}`)}
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative h-full w-full">
        {selectedCountry === 'overview' ? (
          <OverviewCanvas
            width={dimensions.width}
            height={dimensions.height}
            allDynasties={allDynasties}
            allEvents={allEvents}
            countryLabels={COUNTRIES.reduce((acc, c) => ({ ...acc, [c.code]: t(`countries.${c.code}`) }), {})}
            onEventSelect={handleEventSelect}
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
      {(() => {
        if (modalOpen) {
          console.log('App: Rendering DetailModal check. modalOpen=', modalOpen, 'selectedYear=', selectedYear, 'selectedEvent=', selectedEvent);
        }
        return null;
      })()}
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
