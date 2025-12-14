import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { getDynastyPower } from '../data/historyData';
import { Dynasty, Viewport } from '../types';

interface OverviewCanvasProps {
    width: number;
    height: number;
    allDynasties: { [countryCode: string]: Dynasty[] };
    countryLabels: { [code: string]: string };
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

const OverviewCanvas: React.FC<OverviewCanvasProps> = ({ width, height, allDynasties, countryLabels }) => {
    const { t, i18n } = useTranslation();
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
    const isBrowser = typeof window !== 'undefined';

    const [orderedCountries, setOrderedCountries] = useState<string[]>([]);

    // Initialize or update orderedCountries when allDynasties changes
    useEffect(() => {
        const countries = Object.keys(allDynasties);
        // Only update if the set of countries changed to preserve order
        setOrderedCountries(prev => {
            const prevSet = new Set(prev);
            const newSet = new Set(countries);
            if (prevSet.size !== newSet.size || !countries.every(c => prevSet.has(c))) {
                return countries;
            }
            return prev;
        });
    }, [allDynasties]);

    const COUNTRIES_LIST = orderedCountries.length > 0 ? orderedCountries : Object.keys(allDynasties);
    // World Space Calculation:
    // We want the initial view (k=INITIAL_ZOOM) to fit the screen height perfectly.
    // ScreenHeight = WorldHeight * INITIAL_ZOOM
    // WorldHeight = ScreenHeight / INITIAL_ZOOM
    // RowHeight = WorldHeight / NumRows
    const WORLD_HEIGHT = height / INITIAL_ZOOM;
    const ROW_HEIGHT = WORLD_HEIGHT / (COUNTRIES_LIST.length || 1);

    // Optimized viewport state with RAF smoothing
    const [viewport, setViewport] = useSmoothViewport(() => {
        const centerYear = 900;
        const worldXAtCenter = ((centerYear - (-2500)) / (2025 - (-2500))) * (width * 8);
        const startX = (width / 2) - (worldXAtCenter * INITIAL_ZOOM);
        const startY = 0; // Top align initially
        return { x: startX, y: startY, k: INITIAL_ZOOM };
    });

    // Drag state
    const [draggingCountry, setDraggingCountry] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<number>(0);
    const draggingRef = useRef<{ country: string | null, offset: number, startIndex: number }>({ country: null, offset: 0, startIndex: -1 });

    // Recalculate when dimensions change
    useEffect(() => {
        if (!width || !height) return;
        // Adjust viewport if needed, or simple re-calc of constants is enough.
        // We might want to keep centering? For now, standard behavior.
    }, [width, height]);

    // 1. Scales
    const xScale = useMemo(() => {
        return d3.scaleLinear()
            .domain([-2500, 2025])
            .range([0, width * 8]); // Wide virtual canvas in World Space
    }, [width]);

    const visibleXScale = useMemo(() => {
        const transform = d3.zoomIdentity.translate(viewport.x, 0).scale(viewport.k);
        return transform.rescaleX(xScale);
    }, [viewport.x, viewport.k, xScale]);

    // 2. Data Preparation for all countries
    const riversData = useMemo(() => {
        const result: { [country: string]: { series: any[], yScale: d3.ScaleLinear<number, number> } } = {};

        // Use ALL countries
        Object.keys(allDynasties).forEach((country, index) => {
            const dynasties = allDynasties[country];
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

            const stack = d3.stack()
                .keys(dynasties.map(d => d.id))
                .offset(d3.stackOffsetSilhouette)
                .order(d3.stackOrderNone);

            const series = stack(data);

            // Individual Y-scale for each row in WORLD SPACE
            const halfHeight = ROW_HEIGHT * 0.45; // 90% usage of row height
            const yScale = d3.scaleLinear()
                .domain([-150, 150])
                .range([halfHeight, -halfHeight]); // 0 is center

            result[country] = { series, yScale };
        });
        return result;
    }, [allDynasties, ROW_HEIGHT]);

    const areaGens = useMemo(() => {
        const gens: { [country: string]: d3.Area<any> } = {};
        Object.keys(allDynasties).forEach(country => {
            // Generator relative to 0 y-center of the row
            gens[country] = d3.area<any>()
                .x(d => xScale(d.data.year))
                .y0(d => riversData[country].yScale(d[0]))
                .y1(d => riversData[country].yScale(d[1]))
                .curve(d3.curveBasis);
        });
        return gens;
    }, [xScale, riversData, allDynasties]);


    // Zoom Behavior
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;
        const svg = d3.select(svgRef.current);

        svg.on('.zoom', null);

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.01, 10]) // Adjust extent for 2D zoom
            .on('zoom', (event) => {
                const { transform } = event;
                setViewport(prev => ({
                    x: transform.x,
                    y: transform.y,
                    k: transform.k
                }));
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // Initial set based on current/pref state
        // If we want to start perfectly centered and fitted:
        // Use the same logic as useState initializer
        const centerYear = 900;
        const worldXAtCenter = ((centerYear - (-2500)) / (2025 - (-2500))) * (width * 8);
        const startX = (width / 2) - (worldXAtCenter * INITIAL_ZOOM);
        const startY = 120; // Top padding

        const initialTransform = d3.zoomIdentity.translate(startX, startY).scale(INITIAL_ZOOM);
        setViewport({ x: startX, y: startY, k: INITIAL_ZOOM });
        svg.call(zoom.transform, initialTransform);

        return () => { svg.on('.zoom', null); };
    }, [width, height]); // Re-run on resize to fit? Or dependency on blank [] is better to preserve user pan? 
    // With re-calc of constants inside render, dependencies here primarily for INIT.

    // Drag Behavior for reordering
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);

        const handles = svg.selectAll<SVGGElement, string>('.drag-handle-group');

        handles.datum((d, i) => orderedCountries[i] || COUNTRIES_LIST[i]);

        const drag = d3.drag<SVGGElement, string>()
            .on('start', (event, d) => {
                if (event.sourceEvent) event.sourceEvent.stopPropagation();
                if (!d) return;

                const index = orderedCountries.indexOf(d);
                draggingRef.current = { country: d, offset: 0, startIndex: index };
                setDraggingCountry(d);
                setDragOffset(0);
            })
            .on('drag', (event) => {
                // Adjust delta by zoom level because the drag happens in screen coordinates
                // but visual feedback is applied in WORLD coordinates (if we were applying it inside the scaled group)
                // BUT: Sidebar is NOT in the scaled group for X, but IS getting Y-positioned.
                // Our yTranslate logic uses world-space ROW_HEIGHT.
                // So visual shift should be `event.dy / viewport.k`.

                const deltaY = event.dy / viewport.k;
                const newOffset = draggingRef.current.offset + deltaY;
                draggingRef.current.offset = newOffset;
                setDragOffset(newOffset);
            })
            .on('end', () => {
                const { country, offset, startIndex } = draggingRef.current;

                // Threshold in world space
                if (country && Math.abs(offset) > (ROW_HEIGHT / 2)) {
                    const moveRows = Math.round(offset / ROW_HEIGHT);
                    const targetIndex = Math.max(0, Math.min(orderedCountries.length - 1, startIndex + moveRows));

                    if (targetIndex !== startIndex) {
                        const newOrder = [...orderedCountries];
                        newOrder.splice(startIndex, 1);
                        newOrder.splice(targetIndex, 0, country);
                        setOrderedCountries(newOrder);
                    }
                }

                setDraggingCountry(null);
                setDragOffset(0);
                draggingRef.current = { country: null, offset: 0, startIndex: -1 };
            });

        handles.call(drag as any);

    }, [orderedCountries, height, COUNTRIES_LIST, viewport.k, ROW_HEIGHT]); // Added dependencies

    // ... (Cursor logic remains similar)
    const [cursorX, setCursorX] = useState<number | null>(null);
    const throttledMouseMove = useMemo(
        () => throttle((e: MouseEvent) => {
            if (!svgRef.current) return;
            const svgRect = svgRef.current.getBoundingClientRect();
            const mouseX = e.clientX - svgRect.left;
            if (mouseX >= 0 && mouseX <= width) setCursorX(mouseX);
            else setCursorX(null);
        }, 16), [width]
    );

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        container.addEventListener('mousemove', throttledMouseMove);
        container.addEventListener('mouseleave', () => setCursorX(null));
        return () => {
            container.removeEventListener('mousemove', throttledMouseMove);
            container.removeEventListener('mouseleave', () => setCursorX(null));
        };
    }, [throttledMouseMove]);

    const getDynastyName = (d: Dynasty) => {
        return i18n.language.startsWith('zh')
            ? (d.chineseName || t(`dynasties.${d.id}`, { defaultValue: d.name }))
            : (d.name || t(`dynasties.${d.id}`));
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

                    {COUNTRIES_LIST.map((country, index) => {
                        const { series } = riversData[country];
                        const countryDynasties = allDynasties[country];
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

                                {/* Dynasty Labels (Inside the scaled group -> Text scales with river) */}
                                <g pointerEvents="none">
                                    {series.map(layer => {
                                        const dynasty = countryDynasties.find(d => d.id === layer.key);
                                        if (!dynasty) return null;

                                        // Calculate world coordinates
                                        const startX = xScale(dynasty.startYear);
                                        const endX = xScale(dynasty.endYear);
                                        const widthPx = endX - startX;

                                        // Since we are inside scaled group, thresholds are in World Pixels.
                                        // If k is small, 100 world pixels is 12 screen pixels.
                                        // We want to hide if screen width is too small?
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
                                        const fontSize = Math.min(60, Math.max(12, widthPx / (name.length + 1))); // World font size

                                        return (
                                            <text
                                                key={dynasty.id}
                                                x={midX}
                                                y={centerY}
                                                fill="rgba(255,255,255,0.95)"
                                                fontSize={fontSize} // This scales with the view
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
                    {/* Background */}
                    <rect x={0} y={0} width={160} height={height} fill="url(#sidebar-gradient)" pointerEvents="none" />

                    {/* Container translated by Y pan, but NOT scaled uniformly. Manual Y positioning. */}
                    <g transform={`translate(0, ${viewport.y})`}>
                        {COUNTRIES_LIST.map((country, index) => {
                            // Calculate screen Y position manually
                            const isDragging = draggingCountry === country;

                            // World Y centers
                            const worldRowCenter = (index + 0.5) * ROW_HEIGHT;
                            const worldY = isDragging ? worldRowCenter + dragOffset : worldRowCenter;

                            // Screen Y = WorldY * k
                            const screenY = worldY * viewport.k;

                            // Don't render if off screen
                            // if (viewport.y + screenY < -50 || viewport.y + screenY > height + 50) return null;

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
                                    {/* Hit Area (Screen Space Estimate) */}
                                    <rect x={0} y={-20} width={140} height={40} fill="transparent" />

                                    {/* Handle */}
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

                                    {/* Separator line - Hide when dragging */}
                                    {!isDragging && (
                                        <line
                                            x1={0} y1={(ROW_HEIGHT / 2) * viewport.k} // Screen relative bottom
                                            x2={width * 5} y2={(ROW_HEIGHT / 2) * viewport.k} // Long line? Or just nearby?
                                            // The original separator was full width. 
                                            // Since this is sidebar, maybe just sidebar width?
                                            // Or is it the grid line?
                                            // Let's omit grid lines in sidebar to avoid clutter.
                                            stroke="none"
                                        />
                                    )}
                                </g>
                            )
                        })}
                    </g>
                </g>

                {/* Cursor Line */}
                {cursorX !== null && (
                    <g pointerEvents="none">
                        <line
                            x1={cursorX}
                            y1={0}
                            x2={cursorX}
                            y2={height}
                            stroke="#ea580c"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                        />
                        <g transform={`translate(${cursorX}, 20)`}>
                            <rect x={-24} y={-14} width={48} height={20} rx={4} fill="#ea580c" />
                            <text
                                x={0}
                                y={0}
                                fill="white"
                                fontSize={11}
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {Math.round(visibleXScale.invert(cursorX))}
                            </text>
                        </g>
                    </g>
                )}

                {/* Year Ruler (Top) */}
                <g className="pointer-events-none">
                    <rect width={width} height={30} fill="url(#ruler-gradient)" />
                    {(() => {
                        // Rescale X using viewport
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

            </svg>
        </div>
    );
};

export default OverviewCanvas;
