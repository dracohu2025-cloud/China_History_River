import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchEventDetails } from '../services/geminiService';
import { HistoricalEvent, EventPodcast } from '../types';
import { useTranslation } from 'react-i18next';
import { fetchEventPodcasts } from '../services/eventPodcastService';

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
  const [podcasts, setPodcasts] = useState<EventPodcast[]>([]);

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

  // 3. Load Podcasts for this event
  useEffect(() => {
    if (!event) return;
    fetchEventPodcasts(event.year, event.title).then(setPodcasts);
  }, [event]);

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
        pointerEvents: 'auto',
        visibility: 'visible',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", // Modern font stack
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker for better contrast
          backdropFilter: 'blur(8px)', // Increased blur for modern feel
          cursor: 'pointer',
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'relative',
          width: '90%', // Mobile friendly default
          maxWidth: podcasts.length > 0 ? '900px' : '520px', // Wider when podcasts exist
          maxHeight: '80vh',
          opacity: 1,
          transform: 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slight translucency
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.3)', // Deeper shadow
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >

        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.8)',
        }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            <h2 style={{
              fontSize: '1.25rem', // Slightly more compact header
              fontWeight: '700',
              color: '#1a1a1a',
              margin: 0,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}>
              {lang.startsWith('zh') ? event.title : (event.titleEn || event.title)}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              color: '#666',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.04)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
              e.currentTarget.style.color = '#666';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
          </button>
        </div>

        {/* Main Content Area - Side by side when podcasts exist */}
        <div style={{
          display: 'flex',
          flexDirection: podcasts.length > 0 ? 'row' : 'column',
          flex: 1,
          overflow: 'hidden',
        }}>
          {/* Content */}
          <div style={{
            padding: '24px 24px 16px 24px', // Tighter bottom padding
            overflowY: 'auto',
            flex: podcasts.length > 0 ? '1 1 55%' : 1,
            borderRight: podcasts.length > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
          }}>
            {/* Year Display */}
            <div style={{
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: '2.5rem', // Large, elegant year
                fontWeight: '800',
                color: '#d97706', // amber-600
                fontFamily: "'Playfair Display', serif", // Fallback to serif for date creates nice contrast
                lineHeight: 1,
                opacity: 0.9,
              }}>
                {Math.abs(year)}
              </span>
              <span style={{
                marginLeft: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#d97706',
                opacity: 0.6,
                marginTop: '8px', // Align with baseline
              }}>
                {year < 0 ? 'B.C.' : 'A.D.'}
              </span>
            </div>

            <div style={{
              fontSize: '0.95rem',
              color: '#444',
              lineHeight: 1.75,
              letterSpacing: '0.01em',
            }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '12px' }}>
                  <div className="animate-spin" style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(217, 119, 6, 0.2)',
                    borderTopColor: '#d97706',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></div>
                  <p style={{ color: '#999', fontSize: '0.875rem' }}>{t('app.loading')}</p>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                content.split('\n').map((paragraph, idx) => (
                  paragraph.trim() && <p key={idx} style={{ marginBottom: '16px', textAlign: 'justify' }}>{paragraph}</p>
                ))
              )}
            </div>
          </div>

          {/* Podcast Section - Right side when podcasts exist */}
          {podcasts.length > 0 && (
            <div style={{
              flex: '1 1 45%',
              padding: '24px 20px',
              backgroundColor: '#fffbeb',
              overflowY: 'auto',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 16.5v-9l7 4.5-7 4.5z" />
                </svg>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: '#92400e',
                }}>
                  {lang.startsWith('zh') ? '相关播客' : 'Related Podcasts'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {podcasts.map((podcast) => (
                  <div
                    key={podcast.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #fed7aa',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {podcast.bookTitle}
                      </div>
                      {podcast.doubanRating && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#78716c',
                          }}>
                            {lang.startsWith('zh') ? '豆瓣' : 'Douban'} {podcast.doubanRating}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        window.open(`/player.html?episode=${podcast.podcastUuid}`, '_blank');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#d97706',
                        border: 'none',
                        color: 'white',
                        fontWeight: '600',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#b45309';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#d97706';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {lang.startsWith('zh') ? '播放' : 'Play'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#fafaf9',
          borderTop: '1px solid rgba(0,0,0,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.5,
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ color: '#666' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: '#666',
              fontFamily: 'monospace',
            }}>
              Powered by DeepSeek V3.2
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#1a1a1a',
              border: 'none',
              color: 'white',
              fontWeight: '600',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
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