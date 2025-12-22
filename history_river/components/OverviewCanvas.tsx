import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { getDynastyPower } from '../data/historyData';
import { Dynasty, Viewport, HistoricalEvent, EventPodcast } from '../types';
import { fetchEventsWithPodcasts, fetchAllEventPodcasts } from '../services/eventPodcastService';

interface OverviewCanvasProps {
    width: number;
    height: number;
    allDynasties: { [countryCode: string]: Dynasty[] };
    allEvents: { [countryCode: string]: HistoricalEvent[] };
    countryLabels: { [code: string]: string };
    onEventSelect: (event: HistoricalEvent | null, year: number) => void;
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

// Constants for data generation
const DATA_START_YEAR = -2500;
const DATA_END_YEAR = 2025;
const DATA_STEP = 5; // Use coarser step for overview to improve performance

const INITIAL_ZOOM = 0.19;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 10;
const EVENT_DOT_THRESHOLD = 0.1;

const EVENT_LABEL_THRESHOLD = 0.4;

const COUNTRIES_LIST = ['china', 'usa', 'uk', 'france', 'germany', 'russia', 'poland', 'greece', 'italy', 'india', 'japan'];

const OverviewCanvas: React.FC<OverviewCanvasProps> = ({ width, height, allDynasties, allEvents, countryLabels, onEventSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // World Space Height Calculation
    // We want the initial view (k=INITIAL_ZOOM) to fit the screen height.
    // So WorldHeight * INITIAL_ZOOM = ScreenHeight
    // WorldHeight = ScreenHeight / INITIAL_ZOOM
    const WORLD_HEIGHT = height / INITIAL_ZOOM;
    // COMPRESSION: Reduce row height spacing to 60% of original, to compact the view
    // But we will inversely scale the river drawing to keep it the same visual size
    const ROW_COMPRESSION = 0.65;
    const ROW_HEIGHT = (WORLD_HEIGHT / (COUNTRIES_LIST.length || 1)) * ROW_COMPRESSION;

    // Initial viewport state
    const [viewport, setViewport] = useSmoothViewport(() => {
        return { x: 0, y: 0, k: INITIAL_ZOOM };
    });

    const [cursorX, setCursorX] = useState<number | null>(null);
    const zoomRectRef = useRef<SVGRectElement>(null);
    const [orderedCountries, setOrderedCountries] = useState<string[]>(COUNTRIES_LIST);
    const draggingRef = useRef<{ country: string, startY: number, originalIndex: number, offset: number } | null>(null);
    const [draggingCountry, setDraggingCountry] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [eventsWithPodcasts, setEventsWithPodcasts] = useState<Set<string>>(new Set());
    const [allPodcasts, setAllPodcasts] = useState<EventPodcast[]>([]);
    const [podcastListExpanded, setPodcastListExpanded] = useState(false);

    const { t, i18n } = useTranslation();

    // Fetch events that have podcasts on mount
    useEffect(() => {
        fetchEventsWithPodcasts().then(setEventsWithPodcasts);
        fetchAllEventPodcasts().then(setAllPodcasts);
    }, []);

    // Scales
    const xScale = useMemo(() => d3.scaleLinear()
        .domain([DATA_START_YEAR, DATA_END_YEAR])
        .range([0, width * 5]), // Broad world width
        [width]);

    // Zoom Behavior created once
    const zoomBehavior = useMemo(() => d3.zoom<SVGRectElement, unknown>()
        .scaleExtent([MIN_ZOOM, MAX_ZOOM])
        // Simplified: No filter needed with background rect strategy
        .on('zoom', (event) => setViewport(event.transform)),
        [setViewport]);

    // Initialize Viewport to center interesting history
    useEffect(() => {
        if (!zoomRectRef.current) return;

        // Horizontally center the timeline (Focus on year 100 AD)
        const centerYear = 100;
        const worldX = xScale(centerYear);
        const startX = (width / 2) - (worldX * INITIAL_ZOOM);

        // Vertically Align: Explicit Top Padding (24%)
        // We place the first row's anchor (approx top) at 24% of screen height.
        // This targets a ~10-20px visual gap below the header.
        const startY = height * 0.24;

        const initialTransform = d3.zoomIdentity.translate(startX, startY).scale(INITIAL_ZOOM);

        // Apply to D3 immediately - this will trigger the 'zoom' event and update React state
        const zoomRect = d3.select(zoomRectRef.current);
        zoomRect.call(zoomBehavior.transform, initialTransform);

    }, [width, height, xScale, orderedCountries.length, ROW_HEIGHT, zoomBehavior]);

    // Calculate river data (Memoized)
    const riversData = useMemo(() => {
        const data: { [key: string]: { series: any[], yScale: any } } = {};
        let globalMaxAbsY = 0;

        // First pass: Calculate series and find global max extent
        const countrySeries: { [key: string]: any[] } = {};

        COUNTRIES_LIST.forEach(country => {
            const dynasties = allDynasties[country] || [];
            const years = d3.range(DATA_START_YEAR, DATA_END_YEAR + 1, DATA_STEP);
            const riverPoints = years.map(year => {
                const point: any = { year };
                dynasties.forEach(d => {
                    const power = getDynastyPower(d, year);
                    point[d.id] = power > 0 ? power : 0;
                });
                return point;
            });

            const keys = dynasties.map(d => d.id);
            const stack = d3.stack().keys(keys).offset(d3.stackOffsetSilhouette);
            const series = stack(riverPoints);
            countrySeries[country] = series;

            const maxY = d3.max(series, layer => d3.max(layer, d => d[1])) || 0;
            const minY = d3.min(series, layer => d3.min(layer, d => d[0])) || 0;
            globalMaxAbsY = Math.max(globalMaxAbsY, Math.abs(maxY), Math.abs(minY));
        });

        // Use global max to ensure consistent scaling and prevent overlap
        // Buffer of 1.1 for safety
        const maxExtent = Math.max(globalMaxAbsY * 1.1, 55);

        // Second pass: Create scales
        COUNTRIES_LIST.forEach(country => {
            // Restore visual height by dividing by compression ratio
            const visualRowHeight = ROW_HEIGHT / ROW_COMPRESSION;
            const yScale = d3.scaleLinear()
                .domain([-maxExtent, maxExtent])
                .range([-visualRowHeight / 2 * 0.9, visualRowHeight / 2 * 0.9]);

            data[country] = { series: countrySeries[country], yScale };
        });

        return data;
    }, [allDynasties, ROW_HEIGHT]);

    const areaGens = useMemo(() => {
        const gens: { [key: string]: d3.Area<any> } = {};
        COUNTRIES_LIST.forEach(country => {
            gens[country] = d3.area()
                .x((d: any) => xScale(d.data.year))
                .y0((d: any) => riversData[country].yScale(d[0]))
                .y1((d: any) => riversData[country].yScale(d[1]))
                .curve(d3.curveBasis);
        });
        return gens;
    }, [xScale, riversData]);

    // Bind Zoom Behavior
    useEffect(() => {
        if (!zoomRectRef.current) return;
        const zoomRect = d3.select(zoomRectRef.current);

        // Bind the behavior
        zoomRect.call(zoomBehavior);

    }, [zoomBehavior]);

    // Drag Behavior
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        if (!svg.node()) return;

        const drag = d3.drag<SVGGElement, string>()
            .on('start', (event, d) => {
                event.sourceEvent.stopPropagation();
                const index = orderedCountries.indexOf(d);
                draggingRef.current = {
                    country: d,
                    startY: event.y,
                    originalIndex: index,
                    offset: 0
                };
                setDraggingCountry(d);
                setDragOffset(0);
            })
            .on('drag', (event) => {
                if (!draggingRef.current) return;

                // Calculate Delta in WORLD SPACE
                // event.dy is in screen pixels. 
                // Because we are inside a scaled group? NO. 
                // The drag handle is in the Sidebar group, which is NOT scaled by K (only Y translated).
                // Wait, sidebar is `translate(0, viewport.y)`.
                // The drag event gives delta in Screen Coordinates.
                // We need to move the element visually in Screen Coordinates?
                // Visual translate is `translate(0, ${screenY})`.
                // screenY = worldY * k.
                // So if we drag 10 screen pixels, we change screenY by 10.
                // We update dragOffset (World Units).
                // So deltaWorld = deltaScreen / k.

                const deltaY = event.dy / viewport.k;
                draggingRef.current.offset += deltaY;
                setDragOffset(draggingRef.current.offset);

                // Reorder logic trigger? (Optional: live reorder)
            })
            .on('end', () => {
                if (!draggingRef.current) return;

                // Calculate final position
                const { originalIndex, offset } = draggingRef.current;
                const totalDragWorld = offset;

                // How many rows did we move?
                // ROW_HEIGHT is World Height per row.
                const movedRows = Math.round(totalDragWorld / ROW_HEIGHT);
                const targetIndex = Math.max(0, Math.min(orderedCountries.length - 1, originalIndex + movedRows));

                if (targetIndex !== originalIndex) {
                    const newOrder = [...orderedCountries];
                    const [moved] = newOrder.splice(originalIndex, 1);
                    newOrder.splice(targetIndex, 0, moved);
                    setOrderedCountries(newOrder);
                }

                setDraggingCountry(null);
                setDragOffset(0);
                draggingRef.current = null;
            });

        // Bind drag to handles
        const handles = svg.selectAll('.drag-handle-group');
        // We need to attach data! React renders elements, D3 binds events.
        // We need to ensure elements have data.
        handles.datum((d, i) => orderedCountries[i] || COUNTRIES_LIST[i]); // Fallback?
        // Actually, we are rendering map(orderedCountries).
        // The selection order matches DOM order? React might re-order DOM.
        // Better: Select by ID or ensure data binding matches.

        // Manual data binding for safety
        svg.selectAll('.drag-handle-group').each(function (d, i) {
            // We can read the key from React? 
            // Or rely on the 'index' from the loop?
            // Let's bind the country string to the element
            const countryCode = orderedCountries[i];
            d3.select(this).datum(countryCode);
        });

        svg.selectAll<SVGGElement, string>('.drag-handle-group').call(drag);

    }, [orderedCountries, ROW_HEIGHT, viewport.k]); // Re-bind when order or zoom K changes

    // Throttled mouse move for cursor
    const throttledMouseMove = useMemo(() => throttle((e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setCursorX(e.clientX - rect.left);
    }, 16), []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('mousemove', throttledMouseMove);
        container.addEventListener('mouseleave', () => setCursorX(null));
        return () => {
            container.removeEventListener('mousemove', throttledMouseMove);
            container.removeEventListener('mouseleave', () => setCursorX(null));
        };
    }, [throttledMouseMove]);

    const getDynastyName = (d: Dynasty) => {
        const lang = i18n.language || 'en';
        return lang.startsWith('zh')
            ? (d.chineseName || t(`dynasties.${d.id}`, { defaultValue: d.name }))
            : (d.name || t(`dynasties.${d.id}`));
    };

    // Helper for event name
    const getEventTitle = (e: HistoricalEvent) => {
        const lang = i18n.language || 'en';
        // Prefer zh title if language is zh, else en title, else fallback
        return lang.startsWith('zh')
            ? (e.titleZh || e.title)
            : (e.titleEn || e.title);
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden bg-stone-50 relative cursor-grab active:cursor-grabbing select-none"
        >
            <svg ref={svgRef} width={width} height={height} className="block">
                <defs>
                    <linearGradient id="ruler-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                    <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                </defs>

                {/* 0. Zoom Interaction Layer (Bottom) */}
                <rect
                    ref={zoomRectRef}
                    width={width}
                    height={height}
                    fill="transparent"
                    style={{ cursor: 'grab', pointerEvents: 'all' }}
                />

                {/* 1. Main River Content: Scaled Uniformly (True 2D) */}
                <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.k})`} style={{ pointerEvents: 'none' }}>


                    {orderedCountries.map((country, index) => {
                        const { series } = riversData[country];
                        const countryDynasties = allDynasties[country] || [];
                        const countryEvents = allEvents ? allEvents[country] : [];
                        const rowCenter = (index + 0.5) * ROW_HEIGHT;

                        // Drag transform (visual float in world space)
                        const isDragging = draggingCountry === country;
                        const yTranslate = isDragging ? rowCenter + dragOffset : rowCenter;

                        return (
                            <g
                                key={country}
                                style={{ transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' }}
                                transform={`translate(0, ${yTranslate})`}
                            >
                                {/* River Paths */}
                                {series.map(layer => {
                                    const dynasty = countryDynasties.find(d => d.id === layer.key);
                                    if (!dynasty) return null;
                                    return (
                                        <g key={layer.key}>
                                            <path
                                                d={areaGens[country](layer as any) || ''}
                                                fill={dynasty.color}
                                                opacity={0.85}
                                            />
                                        </g>
                                    );
                                })}

                                {/* Dynasty Labels */}
                                <g pointerEvents="none">
                                    {series.map(layer => {
                                        const dynasty = countryDynasties.find(d => d.id === layer.key);
                                        if (!dynasty) return null;

                                        const startX = xScale(dynasty.startYear);
                                        const endX = xScale(dynasty.endYear);
                                        const widthPx = endX - startX;

                                        if (widthPx * viewport.k < 20) return null;

                                        const midYear = (dynasty.startYear + dynasty.endYear) / 2;
                                        const midX = xScale(midYear);
                                        const dataIndex = Math.floor((midYear - DATA_START_YEAR) / DATA_STEP);
                                        const point = layer[dataIndex];
                                        let centerY = 0;
                                        const { yScale } = riversData[country];
                                        if (point && !isNaN(point[0]) && !isNaN(point[1])) {
                                            centerY = yScale((point[0] + point[1]) / 2);
                                        }

                                        const name = getDynastyName(dynasty);
                                        const fontSize = Math.min(60, Math.max(12, widthPx / (name.length + 1)));

                                        // Calculate estimated text width and hide if it would overflow
                                        const estimatedTextWidth = name.length * fontSize * 0.6; // Approximate char width
                                        if (estimatedTextWidth > widthPx * 0.9) return null; // Don't show if text is too wide

                                        return (
                                            <text
                                                key={dynasty.id}
                                                x={midX}
                                                y={centerY}
                                                fill="rgba(255,255,255,0.95)"
                                                fontSize={fontSize}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                style={{
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {name}
                                            </text>
                                        );
                                    })}
                                </g>
                            </g>
                        )
                    })}
                </g>

                {/* ===== SCREEN-SPACE EVENT OVERLAY LAYER ===== */}
                <g>
                    {orderedCountries.map((country, index) => {
                        const events = allEvents ? allEvents[country] : null;
                        if (!events) return null;

                        // 1. Filter events (Semantic Zoom)
                        const relevantEvents = events.filter(ev => {
                            if (ev.importance === 1) return true;
                            if (viewport.k <= 0.1) return false;
                            if (viewport.k < 0.3 && ev.importance > 1) return false;
                            if (viewport.k < 0.8 && ev.importance > 2) return false;
                            if (viewport.k < 2.0 && ev.importance > 3) return false;
                            if (viewport.k < 3.5 && ev.importance > 4) return false;
                            if (viewport.k < 6.0 && ev.importance > 5) return false;
                            return true;
                        });

                        if (relevantEvents.length === 0) return null;

                        const sortedEvents = [...relevantEvents].sort((a, b) => {
                            if (a.importance !== b.importance) return a.importance - b.importance;
                            return a.year - b.year;
                        });

                        // 2. Screen Space Layout
                        const occupiedLanes = new Map<number, { start: number, end: number }[]>();
                        const nodes: any[] = [];
                        const LANE_HEIGHT_PX = 18; // Fixed pixel height for lanes
                        const TOLERANCE_PX = 5;

                        // Row Center in Screen Space
                        const rowCenterY = ((index + 0.5) * ROW_HEIGHT) * viewport.k + viewport.y;

                        sortedEvents.forEach(ev => {
                            const screenX = xScale(ev.year) * viewport.k + viewport.x;

                            // Optimization: visible bounds check
                            if (screenX < -100 || screenX > width + 100) return;

                            const title = getEventTitle(ev);
                            // Optimization: Adjust width based on language (English chars are narrower)
                            const isZh = i18n.language && i18n.language.startsWith('zh');
                            const charWidth = isZh ? 11 : 7;
                            const padding = isZh ? 20 : 16;
                            const textWidthPx = (title.length * charWidth) + padding;
                            const startX = screenX - textWidthPx / 2;
                            const endX = screenX + textWidthPx / 2;

                            const bandIndex = Math.min(4, Math.max(1, ev.importance));
                            // Alternate up/down
                            const primaryLane = (ev.year % 2 === 0 ? 1 : -1) * bandIndex;

                            const tryPlace = (laneVal: number) => {
                                const ranges = occupiedLanes.get(laneVal) || [];
                                const hasOverlap = ranges.some(r => !(endX < r.start - TOLERANCE_PX || startX > r.end + TOLERANCE_PX));
                                if (hasOverlap) return false;

                                ranges.push({ start: startX, end: endX });
                                occupiedLanes.set(laneVal, ranges);

                                const yOffset = laneVal * LANE_HEIGHT_PX;
                                nodes.push({ event: ev, x: screenX, y: rowCenterY, yOffset, width: textWidthPx, title });
                                return true;
                            };

                            // Try multiple lanes: primary, then alternate lanes up to ±10
                            let placed = false;
                            const lanesToTry = [primaryLane, -primaryLane];

                            // Add more lanes to try at high zoom levels
                            const maxLanes = viewport.k > 1 ? 10 : (viewport.k > 0.5 ? 6 : 4);
                            for (let i = 1; i <= maxLanes && lanesToTry.length < maxLanes * 2; i++) {
                                lanesToTry.push(i, -i);
                            }

                            for (const lane of lanesToTry) {
                                if (tryPlace(lane)) {
                                    placed = true;
                                    break;
                                }
                            }

                            // At high zoom, always place event even if overlapping
                            if (!placed && viewport.k > 0.8) {
                                const fallbackLane = (ev.year * 7 + ev.title.length) % 20 - 10;
                                const yOffset = fallbackLane * LANE_HEIGHT_PX;
                                nodes.push({ event: ev, x: screenX, y: rowCenterY, yOffset, width: textWidthPx, title });
                            }
                        });

                        // 3. Render
                        return (
                            <g key={country}>
                                {nodes.map((node, i) => {
                                    const color = '#57534e';
                                    return (
                                        <g
                                            key={`${node.event.year}-${i}`}
                                            transform={`translate(${node.x}, ${node.y})`}
                                            className="cursor-pointer hover:opacity-80"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventSelect(node.event, node.event.year);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            {/* Center Dot (on River) */}
                                            <circle
                                                r={3}
                                                fill="white"
                                                stroke={color}
                                                strokeWidth={1.5}
                                            />
                                            {/* Dotted Line */}
                                            <line
                                                x1={0} y1={0}
                                                x2={0} y2={node.yOffset}
                                                stroke={color}
                                                strokeWidth={1}
                                                strokeDasharray="2,2"
                                                opacity={0.6}
                                            />
                                            {/* Bubble */}
                                            <g transform={`translate(0, ${node.yOffset})`}>
                                                <rect
                                                    x={-node.width / 2}
                                                    y={-10}
                                                    width={node.width}
                                                    height={20}
                                                    rx={10}
                                                    fill="white"
                                                    stroke={color}
                                                    strokeWidth={1}
                                                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                                                />
                                                <text
                                                    y={0}
                                                    dy={4}
                                                    fill="#44403c"
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                    textAnchor="middle"
                                                >
                                                    {node.title}
                                                </text>
                                                {/* Play icon for events with podcasts */}
                                                {eventsWithPodcasts.has(`${node.event.year}:${node.event.title}`) && (
                                                    <g transform={`translate(${(node.width / 2) - 12}, 0)`}>
                                                        <circle cx="0" cy="0" r="7" fill="#d97706" opacity="0.9" />
                                                        <path d="M-2,-3 L3,0 L-2,3 Z" fill="white" />
                                                    </g>
                                                )}
                                            </g>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </g>

                {/* 2. Country Labels (Sidebar): Fixed X, Scaled Y */}
                <g>
                    <rect x={0} y={0} width={160} height={height} fill="url(#sidebar-gradient)" pointerEvents="none" />
                    <g transform={`translate(0, ${viewport.y})`}>
                        {orderedCountries.map((country, index) => {
                            const isDragging = draggingCountry === country;
                            const worldRowCenter = (index + 0.5) * ROW_HEIGHT;
                            const worldY = isDragging ? worldRowCenter + dragOffset : worldRowCenter;
                            const screenY = worldY * viewport.k;

                            // Optimization: Hide offscreen
                            if (viewport.y + screenY < -50 || viewport.y + screenY > height + 50) return null;

                            return (
                                <g
                                    key={`label-${country}`}
                                    className="drag-handle-group"
                                    transform={`translate(0, ${screenY})`}
                                    style={{
                                        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}
                                >
                                    <rect x={0} y={-20} width={140} height={40} fill="transparent" />
                                    <g transform="translate(14, -5)" stroke="#a8a29e" strokeWidth={2}>
                                        <line x1={0} y1={0} x2={12} y2={0} />
                                        <line x1={0} y1={5} x2={12} y2={5} />
                                        <line x1={0} y1={10} x2={12} y2={10} />
                                    </g>
                                    <text
                                        x={40}
                                        fill="#292524"
                                        fontSize={14}
                                        fontWeight="bold"
                                        dominantBaseline="middle"
                                        style={{ textShadow: '0 2px 4px rgba(255,255,255,0.9)', userSelect: 'none' }}
                                    >
                                        {countryLabels[country]}
                                    </text>
                                    {!isDragging && (
                                        <line
                                            x1={0} y1={(ROW_HEIGHT / 2) * viewport.k}
                                            x2={160} y2={(ROW_HEIGHT / 2) * viewport.k}
                                            stroke="none"
                                        />
                                    )}
                                </g>
                            )
                        })}
                    </g>
                </g>

                {/* Year Ruler (Top) */}
                <g className="pointer-events-none">
                    <rect width={width} height={30} fill="url(#ruler-gradient)" />
                    {(() => {
                        const transform = d3.zoomIdentity.translate(viewport.x, 0).scale(viewport.k);
                        const currentVisibleXScale = transform.rescaleX(xScale);
                        const minYear = currentVisibleXScale.invert(0);
                        const maxYear = currentVisibleXScale.invert(width);
                        const span = maxYear - minYear;
                        let step = 1;
                        if (span > 800) step = 100; else if (span > 300) step = 50; else if (span > 120) step = 10; else step = 5;

                        const startTick = Math.floor(minYear / step) * step;
                        const endTick = Math.ceil(maxYear / step) * step;
                        const ticks = d3.range(startTick, endTick + step, step);

                        return ticks.map(year => (
                            <g key={year} transform={`translate(${currentVisibleXScale(year)}, 0)`}>
                                <line y2={10} stroke="#a8a29e" strokeWidth={1} />
                                <text y={22} fill="#57534e" fontSize={10} textAnchor="middle">
                                    {year < 0 ? t('date_format.bc', { year: Math.abs(year) }) : t('date_format.ad', { year })}
                                </text>
                            </g>
                        ));
                    })()}
                </g>

                {/* Cursor Line */}
                {
                    cursorX !== null && (
                        <g pointerEvents="none">
                            <line x1={cursorX} y1={0} x2={cursorX} y2={height} stroke="#ea580c" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
                            <g transform={`translate(${cursorX}, 15)`}>
                                {(() => {
                                    // Calculate year from cursorX
                                    // available vars: cursorX, viewport, xScale, width
                                    // screenX = worldX * k + x
                                    // worldX = (screenX - x) / k
                                    const worldX = (cursorX - viewport.x) / viewport.k;
                                    const year = Math.round(xScale.invert(worldX));

                                    // Clamp year to data range for sanity? optional.

                                    return (
                                        <text
                                            y={12} // Below the top ruler
                                            fill="#ea580c"
                                            fontSize={12}
                                            fontWeight="bold"
                                            textAnchor={cursorX > width - 50 ? 'end' : (cursorX < 50 ? 'start' : 'middle')}
                                            style={{
                                                textShadow: '0 1px 2px rgba(255,255,255,0.9)',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            {year < 0 ? t('date_format.bc', { year: Math.abs(year) }) : t('date_format.ad', { year })}
                                        </text>
                                    );
                                })()}
                            </g>
                        </g>
                    )
                }

            </svg>

            {/* Podcast Counter - Bottom Right */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    zIndex: 100
                }}
            >
                {/* Counter Badge */}
                <button
                    onClick={() => setPodcastListExpanded(!podcastListExpanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        backgroundColor: '#d97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: podcastListExpanded ? '8px 8px 0 0' : 8,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>已上线播客 ({allPodcasts.length})</span>
                    <svg
                        width="12" height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ transform: podcastListExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                </button>

                {/* Expandable List */}
                {podcastListExpanded && allPodcasts.length > 0 && (
                    <div
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e5e5',
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            maxHeight: 300,
                            overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    >
                        {allPodcasts.map((podcast, idx) => (
                            <div
                                key={podcast.id || idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderBottom: idx < allPodcasts.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    fontSize: 13
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: '#d97706', fontWeight: 600, fontSize: 12 }}>
                                        {podcast.eventYear < 0 ? `公元前${Math.abs(podcast.eventYear)}年` : `公元${podcast.eventYear}年`}
                                    </div>
                                    <div style={{ color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {podcast.eventTitle}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span>《{podcast.bookTitle}》</span>
                                        {podcast.doubanRating && (
                                            <span style={{ color: '#22c55e' }}>★ {podcast.doubanRating.toFixed(1)}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open(`/player.html?episode=${podcast.podcastUuid}`, '_blank')}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#d97706',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        fontWeight: 500,
                                        marginLeft: 8,
                                        flexShrink: 0
                                    }}
                                >
                                    播放
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverviewCanvas;
