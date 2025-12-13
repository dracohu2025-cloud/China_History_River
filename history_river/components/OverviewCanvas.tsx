import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
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
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
    const isBrowser = typeof window !== 'undefined';

    const COUNTRIES = Object.keys(allDynasties);
    const ROW_HEIGHT = height / (COUNTRIES.length || 1);

    // Optimized viewport state with RAF smoothing
    const [viewport, setViewport] = useSmoothViewport(() => {
        const centerYear = 900;
        const k = 0.12;
        const worldXAtCenter = ((centerYear - (-2500)) / (2025 - (-2500))) * (width * 8);
        const x = (width / 2) - (worldXAtCenter * k);
        const y = 0; // No vertical panning needed usually for fixed rows, possibly locked
        return { x, y, k };
    });

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

        COUNTRIES.forEach((country, index) => {
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

            // Individual Y-scale for each row
            // Row center is (index + 0.5) * ROW_HEIGHT
            // We map domain [-100, 100] (power range assumption) to that row height with padding
            const rowCenter = (index + 0.5) * ROW_HEIGHT;
            const halfHeight = ROW_HEIGHT * 0.4; // 80% usage
            const yScale = d3.scaleLinear()
                .domain([-150, 150]) // Same domain as main river for consistency
                .range([rowCenter + halfHeight, rowCenter - halfHeight]);

            result[country] = { series, yScale };
        });
        return result;
    }, [allDynasties, ROW_HEIGHT, COUNTRIES]);

    const areaGens = useMemo(() => {
        const gens: { [country: string]: d3.Area<any> } = {};
        COUNTRIES.forEach(country => {
            gens[country] = d3.area<any>()
                .x(d => xScale(d.data.year))
                .y0(d => riversData[country].yScale(d[0]))
                .y1(d => riversData[country].yScale(d[1]))
                .curve(d3.curveBasis);
        });
        return gens;
    }, [xScale, riversData, COUNTRIES]);


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

                        {COUNTRIES.map((country) => {
                            const { series } = riversData[country];
                            const countryDynasties = allDynasties[country];

                            return (
                                <g key={country}>
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
                        })}
                    </g>

                    {/* Dynasty Labels Layer - Separate to avoid distortion */}
                    <g pointerEvents="none">
                        {COUNTRIES.map((country) => {
                            const { yScale } = riversData[country];
                            const countryDynasties = allDynasties[country];

                            return (
                                <g key={`text-${country}`}>
                                    {countryDynasties.map(dynasty => {
                                        // Calculate visible bounds
                                        const startX = visibleXScale(dynasty.startYear);
                                        const endX = visibleXScale(dynasty.endYear);
                                        const widthPx = endX - startX;

                                        // Optimization: visible only
                                        if (endX < 0 || startX > width) return null;
                                        if (widthPx < 40) return null; // Hide if too small

                                        const midYear = (dynasty.startYear + dynasty.endYear) / 2;
                                        const midX = visibleXScale(midYear);

                                        // Use yScale from data preparation to find centered Y
                                        // But we don't have easy access to the exact stacked Y here without looking up data again.
                                        // Ideally we stick to the row center approximation for labels, or use the yScale(0).
                                        // riversData[country].yScale domain is [-150, 150]. 0 is center.
                                        const centerY = yScale(0);

                                        return (
                                            <text
                                                key={dynasty.id}
                                                x={midX}
                                                y={centerY}
                                                fill="rgba(255,255,255,0.95)"
                                                fontSize={Math.min(16, Math.max(12, widthPx / (dynasty.chineseName.length + 1)))}
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                style={{
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {dynasty.chineseName}
                                            </text>
                                        )
                                    })}
                                </g>
                            )
                        })}
                    </g>

                    {/* Country Labels Layer (Left Side) - Only moves in Y */}
                    <g pointerEvents="none">
                        {/* Background for labels - spans full height based on number of countries */}
                        <rect x={0} y={0} width={120} height={COUNTRIES.length * ROW_HEIGHT} fill="url(#sidebar-gradient)" />

                        {COUNTRIES.map((country, index) => {
                            const rowCenter = (index + 0.5) * ROW_HEIGHT;
                            return (
                                <g key={`label-${country}`} transform={`translate(20, ${rowCenter})`}>
                                    <text
                                        fill="#292524"
                                        fontSize={14}
                                        fontWeight="bold"
                                        dominantBaseline="middle"
                                        style={{ textShadow: '0 2px 4px rgba(255,255,255,0.9)' }}
                                    >
                                        {countryLabels[country]}
                                    </text>
                                    {/* Separator line */}
                                    <line
                                        x1={-20} y1={ROW_HEIGHT / 2}
                                        x2={width} y2={ROW_HEIGHT / 2}
                                        stroke="#e7e5e4"
                                        strokeWidth={1}
                                        opacity={0.5}
                                    />
                                </g>
                            )
                        })}
                    </g>

                </g> {/* End of Y-translated group */}

                {/* Cursor Line - Needs to account for Y translation? 
                    The cursor X is screen space. The Y line draws full height.
                    This overlays everything, so it's fine.
                */}
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

                {/* Year Ruler (Top) - FIXED, DOES NOT MOVE Y */}
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
                                    {year < 0 ? `${Math.abs(year)} BC` : year}
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
