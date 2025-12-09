import React, { useEffect, useState } from 'react';
import { fetchEventDetails } from '../services/geminiService';
import { HistoricalEvent } from '../types';

interface DetailModalProps {
  year: number;
  event: HistoricalEvent | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ year, event, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadDetails = async () => {
      // We only fetch details for actual events, not blank years
      if (!event) {
        setLoading(false);
        setContent('');
        return;
      }
      
      setLoading(true);
      const context = `历史事件: ${event.title} (类型: ${event.type})`;
      const text = await fetchEventDetails(year, context, event.title);
      
      if (isMounted) {
        setContent(text);
        setLoading(false);
      }
    };

    loadDetails();
    return () => { isMounted = false; };
  }, [year, event]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-stone-200 text-stone-800 max-w-lg w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-stone-50 px-6 py-4 flex justify-between items-center border-b border-stone-200">
          <div>
            <h2 className="text-2xl font-title text-amber-700">
              {year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`}
            </h2>
            {event && <p className="text-sm text-stone-500 mt-1">{event.title}</p>}
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-stone-500 animate-pulse">正在查阅史籍...</p>
            </div>
          ) : (
            <div className="prose prose-stone prose-p:text-stone-700 leading-relaxed font-serif">
              {content.split('\n').map((paragraph, idx) => (
                paragraph.trim() && <p key={idx} className="mb-4 indent-8">{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-xs text-center text-stone-500">
          由 OpenRouter • DeepSeek V3.2 提供支持 • 历史内容仅供参考
        </div>
      </div>
    </div>
  );
};

export default DetailModal;