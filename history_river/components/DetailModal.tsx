import React, { useEffect, useState } from 'react';
import { fetchEventDetails } from '../services/geminiService';
import { HistoricalEvent } from '../types';
import { useTranslation } from 'react-i18next';

interface DetailModalProps {
  year: number;
  event: HistoricalEvent | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ year, event, onClose }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (!event) return;

    let isMounted = true;

    const loadDetails = async () => {
      setLoading(true);
      const displayTitle = lang.startsWith('en')
        ? (event.titleEn || event.title)
        : (event.titleZh || event.title);
      const context = `Historical Event: ${displayTitle} (Type: ${event.type})`;

      try {
        const text = await fetchEventDetails(year, context, displayTitle, i18n.language);
        if (isMounted) {
          setContent(text);
        }
      } catch (error) {
        if (isMounted) setContent(t('app.no_data'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();
    return () => { isMounted = false; };
  }, [year, event, i18n.language]); // Reload when language changes? Maybe.

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-stone-800 font-serif">
              {lang.startsWith('zh') ? event.title : (event.titleEn || event.title)}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-bold text-amber-700 font-serif">
              {year < 0 ? t('date_format.bc', { year: Math.abs(year) }) : t('date_format.ad', { year })}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider
              ${event.type === 'war' ? 'bg-red-100 text-red-700' :
                event.type === 'politics' ? 'bg-blue-100 text-blue-700' :
                  event.type === 'culture' ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-100 text-stone-700'}`}
            >
              {event.type}
            </span>
          </div>

          <h3 className="text-2xl font-bold text-stone-900 mb-4 leading-snug">
            {i18n.language.startsWith('zh') ? event.title : (event.titleEn || event.title)}
          </h3>

          <div className="prose prose-stone prose-sm max-w-none text-stone-600 leading-relaxed">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-stone-500 animate-pulse">{t('app.loading')}</p>
              </div>
            ) : (
              content.split('\n').map((paragraph, idx) => (
                paragraph.trim() && <p key={idx} className="mb-4 indent-8">{paragraph}</p>
              ))
            )}
          </div>

          {/* External Link (Wiki) */}
          <div className="mt-6 pt-4 border-t border-stone-100">
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(event.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              <span>{t('modal.wiki')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm text-sm"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;