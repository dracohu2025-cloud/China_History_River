import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { getDynastyPower } from '../data/historyData';
import { Dynasty, Viewport, HistoricalEvent } from '../types';

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

const INITIAL_ZOOM = 0.12;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 10;
const EVENT_DOT_THRESHOLD = 0.1;
const EVENT_LABEL_THRESHOLD = 0.4;

const COUNTRIES_LIST = ['china', 'usa', 'uk', 'france', 'germany', 'russia', 'india', 'japan'];

const OverviewCanvas: React.FC<OverviewCanvasProps> = ({ width, height, allDynasties, allEvents, countryLabels, onEventSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // World Space Height Calculation
    // We want the initial view (k=INITIAL_ZOOM) to fit the screen height.
    // So WorldHeight * INITIAL_ZOOM = ScreenHeight
    // WorldHeight = ScreenHeight / INITIAL_ZOOM
    const WORLD_HEIGHT = height / INITIAL_ZOOM;
    const ROW_HEIGHT = WORLD_HEIGHT / (COUNTRIES_LIST.length || 1);

    // Initial viewport state
    const [viewport, setViewport] = useSmoothViewport(() => {
        const worldXAtCenter = 900; // Center year 900
        const startX = (width / 2) - (worldXAtCenter * INITIAL_ZOOM); // Approximate for year 900? No, this is pixel math.
        // Let's rely on xScale definition
        // xScale map -2500 to ?
        // Actually, we need to know the scale first.
        // Let's assume a default start.
        return { x: 0, y: 0, k: INITIAL_ZOOM };
    });

    const [cursorX, setCursorX] = useState<number | null>(null);
    const [orderedCountries, setOrderedCountries] = useState<string[]>(COUNTRIES_LIST);
    const draggingRef = useRef<{ country: string, startY: number, originalIndex: number, offset: number } | null>(null);
    const [draggingCountry, setDraggingCountry] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState(0);

    const { t, i18n } = useTranslation();

    // Scales
    const xScale = useMemo(() => d3.scaleLinear()
        .domain([DATA_START_YEAR, DATA_END_YEAR])
        .range([0, width * 5]), // Broad world width
        [width]);

    // Initialize Viewport to center interesting history
    useEffect(() => {
        if (!containerRef.current) return;

        // Calculate initial X to center around year 900
        const centerYear = 900;
        const worldX = xScale(centerYear);
        const startX = (width / 2) - (worldX * INITIAL_ZOOM);
        const startY = 0;

        const initialTransform = d3.zoomIdentity.translate(startX, startY).scale(INITIAL_ZOOM);

        // We need to sync D3 zoom state
        const svg = d3.select(svgRef.current);
        const zoom = d3.zoom<SVGSVGElement, unknown>(); // Temporary access to zoom behavior?
        // Actually we do it in the zoom effect below

        setViewport({ x: startX, y: startY, k: INITIAL_ZOOM });
    }, [width, height, xScale, setViewport]);
    // Note: Dependencies strictly width/height to prevent loop? 
    // Safe because we only want to reset on resize or init. 
    // Ideally we shouldn't reset on resize if already zoomed.

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
            const yScale = d3.scaleLinear()
                .domain([-maxExtent, maxExtent])
                .range([-ROW_HEIGHT / 2 * 0.9, ROW_HEIGHT / 2 * 0.9]);

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

    // Zoom Behavior
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        if (!svg.node()) return;

        const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
            setViewport(event.transform);
        };

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([MIN_ZOOM, MAX_ZOOM])
            .on('zoom', zoomed);

        svg.call(zoom);

        // Set initial transform
        // We do this to ensure D3 internal state matches our React state
        const currentT = d3.zoomIdentity.translate(viewport.x, viewport.y).scale(viewport.k);
        svg.call(zoom.transform, currentT);

    }, [setViewport]); // Dependencies minimal to avoid re-binding

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

                {/* 1. Main River Content: Scaled Uniformly (True 2D) */}
                <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.k})`}>
                    {/* Grid Lines */}
                    <line x1={xScale(-3000)} y1={0} x2={xScale(2050)} y2={0} stroke="#e5e5e5" strokeWidth={1 / viewport.k} vectorEffect="non-scaling-stroke" />

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

                                {/* Historical Events Layer - Visibility controlled by zoom */}
                                {viewport.k > EVENT_DOT_THRESHOLD && countryEvents && (
                                    {/* Historical Events Layer - Pin Style */ }
                                {allEvents && allEvents[country] && (() => {
                                    // Layout constraints for Overview Mode
                                    const events = allEvents[country];
                                    const availableHeightPerSide = ROW_HEIGHT / 2 - 10;

                                    // Filter events based on Zoom level, identical to RiverCanvas
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

                                    const sortedEvents = [...relevantEvents].sort((a, b) => {
                                        if (a.importance !== b.importance) return a.importance - b.importance;
                                        return a.year - b.year;
                                    });

                                    // Simple layout algorithm (inline for now)
                                    const occupiedLanes = new Map<number, { start: number, end: number }[]>();
                                    const nodes: any[] = [];
                                    const PADDING_X = 10;
                                    const TOLERANCE = 5;

                                    sortedEvents.forEach(ev => {
                                        const worldX = xScale(ev.year); // Keep in world coordinates
                                        const zoomScale = Math.min(1.2, Math.max(0.6, viewport.k));
                                        // Font estimation
                                        const title = getEventTitle(ev);
                                        const textPixelWidth = (title.length * 10) + 25;
                                        const textWorldWidth = textPixelWidth / viewport.k; // Width in world units

                                        const startX = worldX - textWorldWidth / 2;
                                        const endX = worldX + textWorldWidth / 2;

                                        const bandIndex = Math.min(3, Math.max(1, ev.importance));
                                        const primaryLane = (ev.year % 2 === 0 ? 1 : -1) * bandIndex;
                                        const tryPlace = (laneVal: number) => {
                                            const ranges = occupiedLanes.get(laneVal) || [];
                                            // Check overlap in world space
                                            const hasOverlap = ranges.some(r => !(endX < r.start - (TOLERANCE / viewport.k) || startX > r.end + (TOLERANCE / viewport.k)));
                                            if (hasOverlap) return false;
                                            ranges.push({ start: startX, end: endX });
                                            occupiedLanes.set(laneVal, ranges);

                                            // Calculate Y offset (World Space)
                                            // In Overview, we need to be careful with vertical space.
                                            // Lane height should be roughly 20-30px screen units.
                                            const laneHeightWorld = 25 / viewport.k;
                                            const yOffset = laneVal * laneHeightWorld;
                                            // Clamp to row
                                            if (Math.abs(yOffset) > availableHeightPerSide) return false; // Too far

                                            nodes.push({ event: ev, x: worldX, yOffset, width: textWorldWidth, title });
                                            return true;
                                        };

                                        if (!tryPlace(primaryLane)) {
                                            tryPlace(-primaryLane);
                                        }
                                    });

                                    return nodes.map((node, i) => {
                                        // Don't render if out of horizontal view
                                        const screenX = node.x * viewport.k + viewport.x;
                                        if (screenX < -150 || screenX > width + 150) return null;

                                        const renderScale = Math.min(1.2, Math.max(0.6, viewport.k));
                                        const color = '#57534e'; // Use getEventColor logic if needed, simplify for now or copy

                                        return (
                                            <g
                                                key={`${node.event.year}-${i}`}
                                                transform={`translate(${node.x}, 0)`}
                                                className="cursor-pointer hover:opacity-80"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventSelect(node.event, node.event.year);
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                {/* Pin Circle at river center */}
                                                <circle
                                                    r={3 / viewport.k}
                                                    fill="white"
                                                    stroke={color}
                                                    strokeWidth={1.5 / viewport.k}
                                                />
                                                {/* Connecting Line */}
                                                <line
                                                    x1={0} y1={0}
                                                    x2={0} y2={node.yOffset}
                                                    stroke={color}
                                                    strokeWidth={1 / viewport.k}
                                                    strokeDasharray={`${2 / viewport.k},${2 / viewport.k}`}
                                                    opacity={0.6}
                                                />
                                                {/* Bubble Group */}
                                                <g transform={`translate(0, ${node.yOffset})`}>
                                                    <rect
                                                        x={-node.width / 2}
                                                        y={-10 / viewport.k}
                                                        width={node.width}
                                                        height={20 / viewport.k}
                                                        rx={10 / viewport.k}
                                                        fill="white"
                                                        stroke={color}
                                                        strokeWidth={1 / viewport.k}
                                                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                                                    />
                                                    <text
                                                        y={0}
                                                        dy={4 / viewport.k} // Centering
                                                        fill="#44403c"
                                                        fontSize={10 / viewport.k}
                                                        fontWeight="bold"
                                                        textAnchor="middle"
                                                        style={{ textShadow: 'none' }}
                                                    >
                                                        {node.title}
                                                    </text>
                                                </g>
                                            </g>
                                        );
                                    });
                                })()}
                                )}

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
                {cursorX !== null && (
                    <g pointerEvents="none">
                        <line x1={cursorX} y1={0} x2={cursorX} y2={height} stroke="#ea580c" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
                        <g transform={`translate(${cursorX}, 15)`}>
                            {/* Calculated logic for year at cursor can go here if needed */}
                        </g>
                    </g>
                )}

            </svg>
        </div>
    );
};

export default OverviewCanvas;
