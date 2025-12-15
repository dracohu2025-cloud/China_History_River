import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { getDynastyPower } from '../data/historyData';
import { HistoricalEvent, Viewport, EventDetail, Dynasty, RiverPin } from '../types';
import { getPodcastById, PodcastJobRow } from '@/services/podcastService';



interface RiverCanvasProps {
  onEventSelect: (event: HistoricalEvent | null, year: number) => void;
  width: number;
  height: number;
  dynasties: Dynasty[];
  events: HistoricalEvent[];
  pins?: RiverPin[]; // Keeping optional for now to avoid breakages during refactor, but unused
}

interface LayoutNode {
  event: HistoricalEvent;
  x: number; // Visible screen X
  yOffset: number; // Lane offset from center
  lane: number;
  width: number; // Calculated display width
}

// Performance optimization: Throttle function
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
}

// Performance optimization: RAF-based smooth updates
function useSmoothViewport(initialViewport: Viewport | (() => Viewport)) {
  const [viewport, setViewport] = useState(initialViewport);
  const rafRef = useRef<number | null>(null);
  const targetViewportRef = useRef(viewport);

  const smoothSetViewport = useCallback((newViewport: Viewport | ((prev: Viewport) => Viewport)) => {
    const targetViewport = typeof newViewport === 'function'
      ? newViewport(targetViewportRef.current)
      : newViewport;

    targetViewportRef.current = targetViewport;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setViewport(targetViewport);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return [viewport, smoothSetViewport] as const;
}

// FIX: 提取PodcastPin为独立组件，避免闭包陷阱导致的位移bug
interface PodcastPinComponentProps {
  pin: RiverPin;
  screenX: number;
  height: number;
  trackHeight: number;
  trackMargin: number;
  title: string;
  onOpenEpisode?: (jobId: string) => void;
}

const PodcastPinComponent: React.FC<PodcastPinComponentProps> = ({
  pin,
  screenX,
  height,
  trackHeight,
  trackMargin,
  title,
  onOpenEpisode
}) => {
  // BUG FIX: 组件会重新渲染，所以screenX总是最新的
  // 避免在父组件的map中直接使用闭包函数捕获过时的screenX值

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenEpisode) onOpenEpisode(pin.jobId);
  };

  const baseY = height - trackHeight - trackMargin;

  const handleMouseEnter = (e: React.MouseEvent<SVGElement>) => {
    const target = e.currentTarget as SVGElement;
    // 使用当前的screenX值，确保不会错位
    target.style.transform = `translate(${screenX}px, ${baseY}px) scale(1.05)`;
    target.style.filter = "drop-shadow(0 4px 8px rgba(217, 119, 6, 0.25))";
  };

  const handleMouseLeave = (e: React.MouseEvent<SVGElement>) => {
    const target = e.currentTarget as SVGElement;
    // 恢复到正确的位置
    target.style.transform = `translate(${screenX}px, ${baseY}px) scale(1)`;
    target.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.1))";
  };

  return (
    <g
      transform={`translate(${screenX}, ${baseY})`}
      className="cursor-pointer"
      onClick={handleClick}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        transition: "transform 0.2s ease, filter 0.2s ease"
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 播客Pin容器 - 优化设计 */}
      <g transform={`translate(0, 0)`}>
        {/* 背景圆角矩形 - 使用渐变填充效果 */}
        <rect
          x={-22}
          y={-14}
          width={44}
          height={36}
          rx={12}
          fill="#ffffff"
          stroke="#f59e0b"
          strokeWidth={1.5}
        />
        {/* 顶部装饰条 - 增加视觉层次 */}
        <rect
          x={-22}
          y={-14}
          width={44}
          height={3}
          rx={12}
          fill="#f59e0b"
          opacity={0.7}
        />
        {/* 书籍名称 - 优化排版 */}
        {title && (
          <text
            x={0}
            y={-1}
            fill="#0f172a"
            fontSize={10}
            fontWeight={600}
            textAnchor="middle"
            className="select-none"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" }}
          >
            {title}
          </text>
        )}
        {/* 年份 - 使用不同颜色区分 */}
        <text
          x={0}
          y={10}
          fill="#64748b"
          fontSize={11}
          fontWeight={700}
          textAnchor="middle"
          className="select-none"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" }}
        >
          {pin.year}
        </text>
        {/* 小圆点装饰 - 暗示播客/音频 */}
        <circle
          cx={16}
          cy={-5}
          r={2}
          fill="#f59e0b"
          opacity={0.8}
        />
      </g>
    </g>
  );
};

const RiverCanvas: React.FC<RiverCanvasProps> = ({ onEventSelect, width, height, dynasties, events }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const isBrowser = typeof window !== 'undefined';

  // Optimized viewport state with RAF smoothing
  const [viewport, setViewport] = useSmoothViewport(() => {
    const centerYear = 900;  // ~238 BCE, Qin Dynasty - pivotal moment in Chinese history
    const k = 0.12;  // Zoom out to see ~4000 years span

    // World coordinates: river spans from xScale(-2500) to xScale(2025)
    // xScale maps years to pixels: domain [-2500, 2025] → range [0, width*8]
    const worldXAtCenter = ((centerYear - (-2500)) / (2025 - (-2500))) * (width * 8);
    const x = (width / 2) - (worldXAtCenter * k);

    // Vertical center: river thickness is 600px (from yScale domain [-150,150])
    // We want river center (height/2) at viewport center (height/2)
    // So: viewport.y = height/2 - (height/2) * k
    const y = (height / 2) - ((height / 2) * k);

    return { x, y, k };
  });

  // Recalculate when dimensions change (responsive)
  useEffect(() => {
    const centerYear = 900;
    const k = 0.12;
    const worldXAtCenter = ((centerYear - (-2500)) / 4525) * (width * 8);
    const x = (width / 2) - (worldXAtCenter * k);
    const y = (height / 2) - ((height / 2) * k);
    setViewport({ x, y, k });
  }, [width, height, setViewport]);

  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [hoverEvent, setHoverEvent] = useState<HistoricalEvent | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [podcastCache, setPodcastCache] = useState<Record<string, PodcastJobRow | null>>({});
  const [hoverEpisodeId, setHoverEpisodeId] = useState<string | null>(null);

  // Constants for data generation
  const DATA_START_YEAR = -2500;
  const DATA_END_YEAR = 2025;
  const DATA_STEP = 2;


  // 1949年专属轨道参数 (置顶显示)
  const TOP_TRACK_Y = 60;              // 轨道顶部Y位置 (距离屏幕顶部60px)
  const TOP_TRACK_HEIGHT = 56;         // 轨道高度
  const TOP_TRACK_MARGIN = 8;          // 轨道间距
  // 1. Data Preparation (Memoized)
  const riverData = useMemo(() => {
    const data = [];
    for (let y = DATA_START_YEAR; y <= DATA_END_YEAR; y += DATA_STEP) {
      const point: any = { year: y };
      let totalPower = 0;
      dynasties.forEach(d => {
        const p = getDynastyPower(d, y);
        point[d.id] = p;
        totalPower += p;
      });
      point.totalPower = totalPower;
      data.push(point);
    }
    return data;
  }, [dynasties]);

  // 2. D3 Stack Generator
  const stack = useMemo(() => {
    return d3.stack()
      .keys(dynasties.map(d => d.id))
      .offset(d3.stackOffsetSilhouette)
      .order(d3.stackOrderNone);
  }, [dynasties]);

  const series = useMemo(() => stack(riverData), [stack, riverData]);

  // 3. Scales
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([-2500, 2025])
      .range([0, width * 8]);
  }, [width]);

  const visibleXScale = useMemo(() => {
    const transform = d3.zoomIdentity.translate(viewport.x, 0).scale(viewport.k);
    return transform.rescaleX(xScale);
  }, [viewport.x, viewport.k, xScale]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([-150, 150])
      .range([height / 2 + 300, height / 2 - 300]);
  }, [height]);

  const areaGen = useMemo(() => {
    return d3.area<any>()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveBasis);
  }, [xScale, yScale]);

  // --- RIVER BANK LAYOUT ALGORITHM ---
  const eventLayoutNodes = useMemo(() => {
    const relevantEvents = events.filter(ev => {
      if (ev.importance === 1) return true;
      if (viewport.k <= 0.1) return false; // 降低阈值
      if (viewport.k < 0.3 && ev.importance > 1) return false; // 降低阈值
      if (viewport.k < 0.8 && ev.importance > 2) return false; // 降低阈值
      if (viewport.k < 2.0 && ev.importance > 3) return false; // 降低阈值
      if (viewport.k < 3.5 && ev.importance > 4) return false; // 降低阈值
      if (viewport.k < 6.0 && ev.importance > 5) return false; // 降低阈值
      return true;
    });

    const sortedEvents = [...relevantEvents].sort((a, b) => {
      if (a.importance !== b.importance) return a.importance - b.importance;
      return a.year - b.year;
    });

    const occupiedLanes = new Map<number, { start: number, end: number }[]>();
    const nodes: LayoutNode[] = [];

    const PADDING_X = viewport.k <= 0.05 ? 10 : 20;
    const LANE_HEIGHT = 52;
    const TOLERANCE = viewport.k <= 0.05 ? 30 : 5;
    const PX_PER_UNIT = 2;

    sortedEvents.forEach(ev => {
      const screenX = xScale(ev.year) * viewport.k;
      const zoomScale = Math.min(1.2, Math.max(0.8, viewport.k));
      const yearStr = ev.year < 0 ? `BC${Math.abs(ev.year)}` : `${ev.year}`;
      const textPixelWidth = (ev.title.length * 14) + (yearStr.length * 9) + 15;
      const textWidth = textPixelWidth * zoomScale;
      const boxWidth = textWidth + PADDING_X;
      const startX = screenX - boxWidth / 2;
      const endX = screenX + boxWidth / 2;

      const bandIndex = Math.min(5, Math.max(1, ev.importance));
      const primaryLane = (ev.year % 2 === 0 ? 1 : -1) * bandIndex;
      const secondaryLane = -primaryLane;

      const tryPlace = (laneVal: number) => {
        const ranges = occupiedLanes.get(laneVal) || [];
        const hasOverlap = ranges.some(r => !(endX < r.start - TOLERANCE || startX > r.end + TOLERANCE));
        if (hasOverlap) return false;
        ranges.push({ start: startX, end: endX });
        occupiedLanes.set(laneVal, ranges);
        nodes.push({ event: ev, x: 0, yOffset: 0, lane: laneVal, width: boxWidth });
        return true;
      };

      if (!tryPlace(primaryLane)) {
        tryPlace(secondaryLane);
      }
    });

    return nodes.sort((a, b) => b.event.importance - a.event.importance);
  }, [viewport.k, xScale, riverData, events]);

  // --- OPTIMIZED EVENT HANDLERS ---

  // Use D3's zoom behavior for smooth panning and zooming
  // FIXED: Let D3 fully control transform, only sync to React state
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = d3.select(containerRef.current);

    // Remove any existing zoom behavior
    svg.on('.zoom', null);
    container.on('.zoom', null);

    // Create new zoom behavior - D3 will manage transform
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 50])
      .filter((event) => {
        // Allow wheel zooming anywhere
        if (event.type === 'wheel') return true;

        // Check if event is mousedown/pointerdown to log
        if (event.type === 'mousedown' || event.type === 'pointerdown') {
          const target = event.target as Element;
          console.log('RiverCanvas: Zoom Filter Check', event.type, target.tagName, target.className);

          // Check for interactive attribute
          const interactiveNode = target.closest('[data-interactive="true"]');
          if (interactiveNode) {
            console.log('RiverCanvas: Zoom BLOCKED (Interactive Element)');
            return false;
          }
        }

        // Check for secondary buttons or ctrl key (standard D3 filter)
        if (event.ctrlKey || event.button) return false;

        // Fallback check for cursor-pointer class
        const target = event.target as Element;
        if (target.closest && target.closest('.cursor-pointer')) return false;

        return true;
      })
      .on('zoom', (event) => {
        const { transform } = event;
        // Sync to React state for other components
        setViewport({
          x: transform.x,
          y: transform.y,
          k: transform.k
        });
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Set initial transform
    const initialTransform = d3.zoomIdentity
      .translate(viewport.x, viewport.y)
      .scale(viewport.k);

    svg.call(zoom.transform, initialTransform);

    return () => {
      svg.on('.zoom', null);
    };
  }, []); // Run once on mount, never re-run

  // Optimized wheel handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
  }, []);

  // Throttled mouse move handler for hover detection
  const throttledMouseMove = useMemo(
    () => throttle((e: MouseEvent) => {
      if (!svgRef.current) return;

      const svgRect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left;

      if (mouseX >= 0 && mouseX <= width) {
        setCursorX(mouseX);
        // FIXED: Use visibleXScale variable directly
        const currentVisibleXScale = visibleXScale;
        const year = Math.round(currentVisibleXScale.invert(mouseX));
        setHoverYear(year);

        // Optimized event lookup with binary search for better performance
        const node = eventLayoutNodes.find(n => Math.abs(n.event.year - year) <= 1);
        setHoverEvent(node ? node.event : null);
      } else {
        setCursorX(null);
        setHoverYear(null);
        setHoverEvent(null);
      }
    }, 16), // ~60fps
    [width, visibleXScale, eventLayoutNodes]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.addEventListener('mousemove', throttledMouseMove);

    return () => {
      container.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [throttledMouseMove]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setCursorX(null);
    setHoverYear(null);
    setHoverEvent(null);
  }, []);

  // Handle event clicks
  const handleEventClick = useCallback((e: React.MouseEvent, event: HistoricalEvent) => {
    console.log('RiverCanvas: Event Clicked', event.title, event.year);
    e.stopPropagation();
    onEventSelect(event, event.year);
  }, [onEventSelect]);

  // Set up wheel event listener
  useEffect(() => {
    if (!isBrowser) return;
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        if (container) container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel, isBrowser]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'war': return '#ef4444';
      case 'politics': return '#2563eb';
      case 'culture': return '#d97706';
      case 'science': return '#9333ea';
      default: return '#57534e';
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-stone-50 relative cursor-grab active:cursor-grabbing select-none"
      onMouseLeave={handleMouseLeave}
    >
      <svg ref={svgRef} width={width} height={height} className="block">
        <defs>
          <filter id="card-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.15)" />
          </filter>
          <linearGradient id="ruler-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {/* TRANSFORMED GROUP for River */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.k})`}>
          <line
            x1={xScale(-3000)}
            y1={height / 2}
            x2={xScale(2050)}
            y2={height / 2}
            stroke="#d6d3d1"
            strokeWidth={1}
            strokeDasharray="10,10"
          />

          {series.map((layer) => {
            const dynasty = dynasties.find(d => d.id === layer.key);
            if (!dynasty) return null;
            const midYear = (dynasty.startYear + dynasty.endYear) / 2;
            const dataIndex = Math.floor((midYear - DATA_START_YEAR) / DATA_STEP);
            const point = layer[dataIndex];
            const yPos = point ? yScale((point[0] + point[1]) / 2) : height / 2;

            return (
              <g key={layer.key}>
                <path
                  d={areaGen(layer as any) || ''}
                  fill={dynasty.color}
                  opacity={0.9}
                />
                <text
                  x={xScale(midYear)}
                  y={yPos}
                  fill="rgba(255,255,255,0.9)"
                  fontSize={24 / viewport.k}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  style={{
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    opacity: viewport.k > 0.2 ? 1 : 0.3 // 降低文字显示阈值，并添加半透明状态
                  }}
                >
                  {lang.startsWith('zh') ? (dynasty.chineseName || t(`dynasties.${dynasty.id}`, { defaultValue: dynasty.name })) : (dynasty.name || t(`dynasties.${dynasty.id}`))}
                </text>
              </g>
            );
          })}
        </g>

        {/* UI & MARKERS LAYER */}
        <g>
          {/* ===== 1949年专属轨道 (置顶显示) ===== */}
          <g>
            {(() => {
              const event1949 = events.find(e => e.year === 1949);
              if (!event1949) return null;

              const screenX_1949 = visibleXScale(1949);
              const trackY = 60;
              const trackHeight = 56;

              return (
                <g>
                  {/* 淡红色轨道背景 - 高度缩小一半 */}
                  <rect
                    x={0}
                    y={trackY}
                    width={width}
                    height={28}
                    fill="#fee2e2"
                    stroke="#fecaca"
                    opacity={0.8}
                  />

                  {/* 1949年事件标记 (无旗子) */}
                  <g
                    transform={`translate(${screenX_1949}, ${trackY + 14})`}
                    className="cursor-pointer"
                    data-interactive="true"
                    onClick={(e) => handleEventClick(e, event1949)}
                    onMouseDown={(e) => e.stopPropagation()}
                    role="button"
                    tabIndex={0}
                  >
                    {/* 年份 - 字体缩小一半 */}
                    <text y={-4} fill="#b91c1c" fontSize={10} fontWeight={700} textAnchor="middle">1949</text>

                    {/* 标题 - 字体缩小一半 */}
                    <text y={6} fill="#1f2937" fontSize={7} fontWeight={600} textAnchor="middle">
                      {lang.startsWith('en') ? 'PRC Founded' : '新中国成立'}
                    </text>
                  </g>
                </g>
              );
            })()}

          </g>
          {/* ===== END 1949年专属轨道 ===== */}
          {eventLayoutNodes.map((node) => {
            const screenX = visibleXScale(node.event.year);
            const edgePad = 16;
            const isHighPriority = node.event.importance <= 2;
            const finalX = isHighPriority
              ? Math.max(edgePad, Math.min(width - edgePad, screenX))
              : screenX;
            if (!isHighPriority && (screenX < -200 || screenX > width + 200)) return null;

            const centerY = (height / 2) * viewport.k + viewport.y;
            const marginTop = 140;
            const marginBottom = 48;
            const deltaTop = (centerY - marginTop) / 5;
            const deltaBottom = (height - marginBottom - centerY) / 5;
            const band = Math.min(5, Math.max(1, Math.abs(node.lane)));
            const sideTop = node.lane > 0;
            let desiredY = sideTop ? centerY - deltaTop * band : centerY + deltaBottom * band;
            let clampedY = Math.max(marginTop, Math.min(height - marginBottom, desiredY));
            const bottomClamped = clampedY === height - marginBottom;
            const topClamped = clampedY === marginTop;
            let spread = (band * 8) + (12 - node.event.importance * 2);
            if (spread < 6) spread = 6;
            const bandSpacing = 22;
            const bandBase = node.event.importance <= 2 ? 2 : 0;
            const bandIndex = (Math.abs(node.lane) % 3) + bandBase;
            const jitter = ((Math.abs(node.lane) * 7 + Math.abs(node.event.year)) % 8) - 4;
            if (bottomClamped) clampedY = Math.max(marginTop, clampedY - spread - bandSpacing * bandIndex - jitter);
            if (topClamped) clampedY = Math.min(height - marginBottom, clampedY + spread + bandSpacing * bandIndex + jitter);
            if (!topClamped && desiredY < marginTop + 30) clampedY = Math.min(height - marginBottom, marginTop + 30 + spread + bandSpacing);
            const effectiveYOffset = clampedY - centerY;

            const color = getEventColor(node.event.type);
            const isHovered = hoverEvent === node.event;

            const baseScale = Math.min(1.2, Math.max(0.8, viewport.k));
            const renderScale = isHovered ? baseScale * 1.1 : baseScale;

            return (
              <g
                key={`${node.event.year}-${node.event.title}`}
                transform={`translate(${finalX}, ${centerY})`}
                className="cursor-pointer"
                data-interactive="true"
                onClick={(e) => handleEventClick(e, node.event)}
                onMouseDown={(e) => e.stopPropagation()} // Prevent D3 zoom from capturing click
                style={{ zIndex: node.event.importance === 1 ? 50 : 10, pointerEvents: 'auto' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEventClick(e as any, node.event) }}
              >
                <circle
                  r={3 * renderScale}
                  fill="white"
                  stroke={color}
                  strokeWidth={2}
                />
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={effectiveYOffset}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="3,3"
                  opacity={0.7}
                />
                <g transform={`translate(0, ${effectiveYOffset}) scale(${renderScale})`}>
                  <rect
                    x={-node.width / 2 / renderScale}
                    y="-13"
                    width={node.width / renderScale}
                    height="26"
                    rx="13"
                    fill="white"
                    stroke={color}
                    strokeWidth={1.5}
                    filter="url(#card-shadow)"
                  />
                  <text
                    x="0"
                    y="5"
                    fill="#44403c"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none whitespace-nowrap font-sans"
                  >
                    <tspan fill={color} fontWeight="800">
                      {node.event.year < 0 ? t('date_format.bc', { year: Math.abs(node.event.year) }) : t('date_format.ad', { year: node.event.year })}
                    </tspan>
                    <tspan dx="6">
                      {/* Prioritize English check, default to Chinese/Native if not English */}
                      {lang.startsWith('en') ? (node.event.titleEn || node.event.title) : (node.event.titleZh || node.event.title)}
                      {/* DEBUG: Show language to debug if it persists */}
                      {/* {` [${i18n.language}]`} */}
                    </tspan>
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Fixed UI Elements (Ruler & Cursor) */}
        <g className="pointer-events-none">
          <rect width={width} height={50} fill="url(#ruler-gradient)" />
          {(() => {
            // FIXED: Use visibleXScale variable directly
            const currentVisibleXScale = visibleXScale;
            const minYear = visibleXScale.invert(0);
            const maxYear = visibleXScale.invert(width);
            const a = Math.min(minYear, maxYear);
            const b = Math.max(minYear, maxYear);
            const span = b - a;
            let step = 1;
            if (span > 800) step = 100; else if (span > 300) step = 50; else if (span > 120) step = 10; else if (span > 40) step = 5; else step = 1;
            const majorTicks = d3.range(Math.floor(a / step) * step, Math.floor(b / step) * step + step, step);
            const minorStep = step >= 5 ? step / 5 : 0;
            const minorTicks = minorStep ? d3.range(Math.floor(a / minorStep) * minorStep, Math.floor(b / minorStep) * minorStep + minorStep, minorStep) : [];
            return (
              <g>
                {minorTicks.map((year, i) => (
                  <line key={`m-${i}-${year}`} x1={currentVisibleXScale(year)} y1={0} x2={currentVisibleXScale(year)} y2={12} stroke="rgba(0,0,0,0.15)" strokeDasharray="3 2" />
                ))}
                {majorTicks.map((year, i) => {
                  const x = currentVisibleXScale(year);
                  const label = year < 0 ? t('date_format.bc', { year: Math.abs(year) }) : t('date_format.ad', { year });
                  const w = label.length * 9 + 18;
                  return (
                    <g key={`J-${i}-${year}`} transform={`translate(${x}, 0)`}>
                      <line y1={0} y2={18} stroke="#0f172a" strokeWidth={1} />
                      <g transform="translate(0, 22)">
                        <rect x={-w / 2} y={0} width={w} height={20} rx={10} fill="white" stroke="#d97706" strokeWidth={1} filter="url(#card-shadow)" />
                        <text y={14} fill="#0f172a" fontSize={11} fontWeight="700" textAnchor="middle" fontFamily="monospace">{label}</text>
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {cursorX !== null && (
            <g transform={`translate(${cursorX}, 0)`}>
              <line y1={0} y2={height} stroke="#d97706" strokeWidth={1} strokeDasharray="4 2" />
              <g transform="translate(0, 35)">
                <rect x="-40" y="0" width="80" height="24" rx="4" fill="#d97706" />
                <text y={16} fill="white" fontSize={12} fontWeight="bold" textAnchor="middle">
                  {Math.round(visibleXScale.invert(cursorX))}
                </text>
              </g>
            </g>
          )}
        </g>
      </svg>
    </div >
  );
};

export default RiverCanvas;
