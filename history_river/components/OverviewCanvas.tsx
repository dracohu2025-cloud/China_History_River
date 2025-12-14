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
    const ROW_HEIGHT = height / (COUNTRIES_LIST.length || 1);

    // Optimized viewport state with RAF smoothing
    const [viewport, setViewport] = useSmoothViewport(() => {
        const centerYear = 900;
        const k = 0.12;
        const worldXAtCenter = ((centerYear - (-2500)) / (2025 - (-2500))) * (width * 8);
        const x = (width / 2) - (worldXAtCenter * k);
        const y = 0; // No vertical panning needed usually for fixed rows, possibly locked
        return { x, y, k };
    });

    // Drag state
    const [draggingCountry, setDraggingCountry] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<number>(0);
    const draggingRef = useRef<{ country: string | null, offset: number, startIndex: number }>({ country: null, offset: 0, startIndex: -1 });

    // Recalculate when dimensions change
    useEffect(() => {
        const centerYear = 900;
        const k = 0.12;
        const worldXAtCenter = ((centerYear - (-2500)) / 4525) * (width * 8);
        const x = (width / 2) - (worldXAtCenter * k);
        setViewport(prev => ({ ...prev, x })); // Keep previous k if user zoomed? Or reset? Resetting is safer for layout changes.
    }, [width, height, setViewport]);

    // 1. Scales
    const xScale = useMemo(() => {
        return d3.scaleLinear()
            .domain([-2500, 2025])
            .range([0, width * 8]); // Wide virtual canvas
    }, [width]);

    const visibleXScale = useMemo(() => {
        const transform = d3.zoomIdentity.translate(viewport.x, 0).scale(viewport.k);
        return transform.rescaleX(xScale);
    }, [viewport.x, viewport.k, xScale]);

    // 2. Data Preparation for all countries
    const riversData = useMemo(() => {
        const result: { [country: string]: { series: any[], yScale: d3.ScaleLinear<number, number> } } = {};

        // Use ALL countries to ensure data exists even if order changes
        Object.keys(allDynasties).forEach((country) => {
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

            // Individual Y-scale for each row, keyed generically 0-centered
            // We will translate this scale when rendering
            const halfHeight = ROW_HEIGHT * 0.4; // 80% usage
            const yScale = d3.scaleLinear()
                .domain([-150, 150]) // Same domain as main river for consistency
                .range([halfHeight, -halfHeight]); // 0 is center

            result[country] = { series, yScale };
        });
        return result;
    }, [allDynasties, ROW_HEIGHT]);

    const areaGens = useMemo(() => {
        const gens: { [country: string]: d3.Area<any> } = {};
        Object.keys(allDynasties).forEach(country => {
            // Generator now relative to 0 y-center
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

        // Disable previous zoom
        svg.on('.zoom', null);

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.05, 50])
            .on('zoom', (event) => {
                const { transform } = event;
                setViewport(prev => ({
                    x: transform.x,
                    y: transform.y, // Allow Y panning
                    k: transform.k
                }));
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // Initial Transform - Start with padding for header
        // Initialize D3 zoom identity with this translation so it matches state
        const initialY = 120; // 120px top padding
        setViewport(prev => ({ ...prev, y: initialY }));

        const initialTransform = d3.zoomIdentity.translate(viewport.x, initialY).scale(viewport.k);
        svg.call(zoom.transform, initialTransform);

        return () => { svg.on('.zoom', null); };
    }, []); // Run once on mount

    // Drag Behavior for reordering
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);

        // Select all handle groups - use a specific class
        const handles = svg.selectAll('.drag-handle-group');

        const drag = d3.drag<SVGGElement, string>()
            .on('start', (event, d) => {
                // Prevent zoom during drag
                if (event.sourceEvent) event.sourceEvent.stopPropagation();

                const index = orderedCountries.indexOf(d);
                draggingRef.current = { country: d, offset: 0, startIndex: index };
                setDraggingCountry(d);
                setDragOffset(0);
            })
            .on('drag', (event) => {
                const newOffset = draggingRef.current.offset + event.dy;
                draggingRef.current.offset = newOffset;
                setDragOffset(newOffset);
            })
            .on('end', () => {
                const { country, offset, startIndex } = draggingRef.current;

                if (country && Math.abs(offset) > 5) {
                    const rowHeight = height / (orderedCountries.length || 1);
                    // Calculate how many rows we moved
                    const moveRows = Math.round(offset / rowHeight);
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

        // Apply drag behavior to selection
        handles.call(drag as any);

        // Clean up OLD drag handlers from previous renders would be tricky with D3 + React
        // Ideally we re-run this when orderedCountries changes? Yes.

    }, [orderedCountries, height]); // Re-bind when list changes

    // State for cursor
    const [cursorX, setCursorX] = useState<number | null>(null);

    // Throttled mouse move handler
    const throttledMouseMove = useMemo(
        () => throttle((e: MouseEvent) => {
            if (!svgRef.current) return;
            const svgRect = svgRef.current.getBoundingClientRect();
            const mouseX = e.clientX - svgRect.left;
            if (mouseX >= 0 && mouseX <= width) {
                setCursorX(mouseX);
            } else {
                setCursorX(null);
            }
        }, 16),
        [width]
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

    // Helper for dynasty name
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

                {/* Content Container with Y Translation */}
                <g transform={`translate(0, ${viewport.y})`}>

                    {/* Render Rivers Group (X + K transform) */}
                    <g transform={`translate(${viewport.x}, 0) scale(${viewport.k}, 1)`}>
                        {/* Grid Lines */}
                        <line x1={xScale(-3000)} y1={0} x2={xScale(2050)} y2={0} stroke="#e5e5e5" strokeWidth={1} vectorEffect="non-scaling-stroke" />

                        {(() => {
                            // Dynamic height scaling: Thinner tracks when zoomed out
                            const heightScale = Math.min(1, Math.max(0.1, viewport.k / 0.12));

                            return COUNTRIES_LIST.map((country, index) => {
                                const { series } = riversData[country];
                                const countryDynasties = allDynasties[country];
                                const rowCenter = (index + 0.5) * ROW_HEIGHT;

                                // Drag transform
                                const isDragging = draggingCountry === country;
                                const yTranslate = isDragging ? rowCenter + dragOffset : rowCenter;

                                return (
                                    <g
                                        key={country}
                                        style={{ transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' }}
                                        transform={`translate(0, ${yTranslate}) scale(1, ${heightScale})`}
                                    >
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
                                    </g>
                                )
                            });
                        })()}
                    </g>

                    {/* Dynasty Labels Layer - Separate to avoid distortion */}
                    <g pointerEvents="none">
                        {COUNTRIES_LIST.map((country, index) => {
                            const { series, yScale } = riversData[country];
                            const countryDynasties = allDynasties[country];
                            const rowCenter = (index + 0.5) * ROW_HEIGHT;

                            // Drag transform for labels too
                            const isDragging = draggingCountry === country;
                            const yTranslate = isDragging ? rowCenter + dragOffset : rowCenter;

                            return (
                                <g
                                    key={`text-${country}`}
                                    style={{ transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' }}
                                    transform={`translate(0, ${yTranslate})`}
                                >
                                    {series.map(layer => {
                                        const dynasty = countryDynasties.find(d => d.id === layer.key);
                                        if (!dynasty) return null;

                                        // Calculate visible bounds
                                        const startX = visibleXScale(dynasty.startYear);
                                        const endX = visibleXScale(dynasty.endYear);
                                        const widthPx = endX - startX;

                                        // Optimization: visible only
                                        if (endX < 0 || startX > width) return null;
                                        if (widthPx < 20) return null; // Hide if too small (increased threshold slightly for cleaner look)

                                        const midYear = (dynasty.startYear + dynasty.endYear) / 2;
                                        const midX = visibleXScale(midYear);

                                        // Precise Y calculation based on stack data relative to 0
                                        const dataIndex = Math.floor((midYear - DATA_START_YEAR) / DATA_STEP);
                                        const point = layer[dataIndex];
                                        let centerY = 0; // Relative to row center which is now 0 in local coord
                                        if (point && !isNaN(point[0]) && !isNaN(point[1])) {
                                            centerY = yScale((point[0] + point[1]) / 2);
                                        }

                                        const name = getDynastyName(dynasty);
                                        return (
                                            <text
                                                key={dynasty.id}
                                                x={midX}
                                                y={centerY}
                                                fill="rgba(255,255,255,0.95)"
                                                fontSize={Math.min(16, Math.max(10, widthPx / (name.length + 0.5)))}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                style={{
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                                    pointerEvents: 'none' // Ensure clicks pass through
                                                }}
                                            >
                                                {name}
                                            </text>
                                        );
                                    })}
                                </g>
                            )
                        })}
                    </g>

                    {/* Country Labels Layer (Left Side) - Only moves in Y */}
                    <g>
                        {/* Background for labels - spans full height based on number of countries */}
                        <rect x={0} y={0} width={120} height={COUNTRIES_LIST.length * ROW_HEIGHT} fill="url(#sidebar-gradient)" pointerEvents="none" />

                        {COUNTRIES_LIST.map((country, index) => {
                            const rowCenter = (index + 0.5) * ROW_HEIGHT;
                            const isDragging = draggingCountry === country;
                            const yTranslate = isDragging ? rowCenter + dragOffset : rowCenter;

                            return (
                                <g
                                    key={`label-${country}`}
                                    className="drag-handle-group"
                                    transform={`translate(0, ${yTranslate})`} // Translate whole group
                                    style={{
                                        transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}
                                >
                                    {/* Handle hit area */}
                                    <rect x={0} y={-ROW_HEIGHT / 2} width={100} height={ROW_HEIGHT} fill="transparent" />

                                    {/* Handle Icon (Hamburger) */}
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

                                    {/* Separator line - Hide when dragging for cleaner look */}
                                    {!isDragging && (
                                        <line
                                            x1={0} y1={ROW_HEIGHT / 2}
                                            x2={width} y2={ROW_HEIGHT / 2}
                                            stroke="#e7e5e4"
                                            strokeWidth={1}
                                            opacity={0.5}
                                            pointerEvents="none"
                                        />
                                    )}
                                </g>
                            )
                        })}
                    </g>

                </g> {/* End of Y-translated group */}

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
                        const currentVisibleXScale = visibleXScale;
                        const minYear = visibleXScale.invert(0);
                        const maxYear = visibleXScale.invert(width);
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
