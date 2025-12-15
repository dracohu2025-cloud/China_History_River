import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchEventDetails } from '../services/geminiService';
import { HistoricalEvent } from '../types';
import { useTranslation } from 'react-i18next';

interface DetailModalProps {
  year: number;
  event: HistoricalEvent | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ year, event, onClose }) => {
  console.log('DetailModal: Rendering', event?.title);
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // 1. Initialize Portal Target
  useEffect(() => {
    // App.tsx ensures this exists, but we check here just in case or for Type safety
    const target = document.getElementById('portal-root');
    if (target) {
      setPortalTarget(target);
    }
  }, []);

  // 2. Load Data
  useEffect(() => {
    console.log('DetailModal: Mounted/Updated for', event?.title);
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
  }, [year, event, i18n.language]);

  if (!event || !portalTarget) return null;

  // Use Portal to render directly into portalTarget
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto', // CRITICAL: Re-enable clicks
        visibility: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(28, 25, 23, 0.4)', // stone-900/40
          backdropFilter: 'blur(4px)',
          cursor: 'pointer',
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '32rem', // max-w-lg
          maxHeight: '85vh',
          opacity: 1,
          transform: 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderRadius: '16px', // rounded-2xl
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl
          overflow: 'hidden',
        }}
      >

        {/* Header */}
        <div style={{
          padding: '16px 24px', // px-6 py-4
          borderBottom: '1px solid #f5f5f4', // border-stone-100
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start', // changed to flex-start for title alignment
          backgroundColor: '#fafaf9', // bg-stone-50
        }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            <h2 style={{
              fontSize: '1.5rem', // text-2xl
              fontWeight: '700', // font-bold
              color: '#292524', // text-stone-800
              fontFamily: 'serif',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {lang.startsWith('zh') ? event.title : (event.titleEn || event.title)}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              borderRadius: '9999px',
              color: '#a8a29e', // text-stone-400
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px', // p-6
          overflowY: 'auto',
          flex: 1, // Allow content to grow/shrink
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px', // gap-3
            marginBottom: '8px', // mb-2
          }}>
            <span style={{
              fontSize: '1.5rem', // text-2xl
              fontWeight: '700',
              color: '#b45309', // text-amber-700
              fontFamily: 'serif',
            }}>
              {year < 0 ? t('date_format.bc', { year: Math.abs(year) }) : t('date_format.ad', { year })}
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem', // text-xs
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: event.type === 'war' ? '#fee2e2' : // bg-red-100
                event.type === 'politics' ? '#dbeafe' : // bg-blue-100
                  event.type === 'culture' ? '#fef3c7' : // bg-amber-100
                    '#f5f5f4', // bg-stone-100
              color: event.type === 'war' ? '#b91c1c' : // text-red-700
                event.type === 'politics' ? '#1d4ed8' : // text-blue-700
                  event.type === 'culture' ? '#b45309' : // text-amber-700
                    '#44403c', // text-stone-700
            }}>
              {event.type}
            </span>
          </div>

          <h3 style={{
            fontSize: '1.5rem', // text-2xl
            fontWeight: '700',
            color: '#1c1917', // text-stone-900
            marginBottom: '16px', // mb-4
            lineHeight: 1.375, // leading-snug
            marginTop: 0,
          }}>
            {lang.startsWith('zh') ? event.title : (event.titleEn || event.title)}
          </h3>

          <div style={{
            fontSize: '0.875rem', // text-sm
            color: '#57534e', // text-stone-600
            lineHeight: 1.625, // leading-relaxed
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '16px' }}>
                <div className="animate-spin" style={{ // Keep animate-spin if possible, or fallback
                  width: '40px',
                  height: '40px',
                  border: '4px solid #d97706', // amber-600
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite' // Add standard spin animation inline just in case
                }}></div>
                <p style={{ color: '#78716c' }}>{t('app.loading')}</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              content.split('\n').map((paragraph, idx) => (
                paragraph.trim() && <p key={idx} style={{ marginBottom: '16px', textIndent: '2em' }}>{paragraph}</p>
              ))
            )}
          </div>

          {/* External Link (Wiki) */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f5f5f4', // border-stone-100
          }}>
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(event.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#b45309', // text-amber-700
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#92400e'} // hover:text-amber-800
              onMouseLeave={(e) => e.currentTarget.style.color = '#b45309'}
            >
              <span>{t('modal.wiki')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#fafaf9', // bg-stone-50
          borderTop: '1px solid #f5f5f4', // border-stone-100
          textAlign: 'right',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #e7e5e4', // border-stone-200
              color: '#44403c', // text-stone-700
              fontWeight: '500',
              borderRadius: '8px', // rounded-lg
              cursor: 'pointer',
              fontSize: '0.875rem', // text-sm
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafaf9'; e.currentTarget.style.borderColor = '#d6d3d1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e7e5e4'; }}
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default DetailModal;