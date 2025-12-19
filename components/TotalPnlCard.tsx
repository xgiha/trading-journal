import React, { useState, useRef, useMemo } from "react"
import { Trade } from "../types"

interface TotalPnlCardProps {
  trades: Trade[]
  totalPnl: number
  growthPct: number
}

export default function TotalPnlCard({ trades, totalPnl, growthPct }: TotalPnlCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(6)
  const chartRef = useRef<SVGSVGElement>(null)

  // Derive weekly data from real trades for the chart
  const weekData = useMemo(() => {
    const data = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayPnl = trades
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + t.pnl, 0)
      
      data.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayPnl,
      })
    }
    return data
  }, [trades])

  const lastTradePnl = trades.length > 0 ? trades[trades.length - 1].pnl : 0

  const maxValue = Math.max(...weekData.map((d) => d.value), 100)
  const minValue = Math.min(...weekData.map((d) => d.value), -100)
  const chartHeight = 140
  const chartWidth = 320
  const padding = { top: 30, bottom: 30, left: 10, right: 10 }

  const getY = (value: number) => {
    const range = maxValue - minValue || 1
    const normalized = (value - minValue) / range
    return chartHeight - padding.bottom - normalized * (chartHeight - padding.top - padding.bottom)
  }

  const getX = (index: number) => {
    return padding.left + (index / (weekData.length - 1)) * (chartWidth - padding.left - padding.right)
  }

  const generatePath = () => {
    const points = weekData.map((d, i) => ({ x: getX(i), y: getY(d.value) }))
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2] || p2
      const tension = 0.35
      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return path
  }

  const generateAreaPath = () => {
    const linePath = generatePath()
    const lastPoint = weekData.length - 1
    return `${linePath} L ${getX(lastPoint)} ${chartHeight - padding.bottom} L ${getX(0)} ${chartHeight - padding.bottom} Z`
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const relativeX = (x / rect.width) * chartWidth
    let closestIndex = 0
    let closestDist = Number.POSITIVE_INFINITY
    weekData.forEach((_, i) => {
      const dist = Math.abs(getX(i) - relativeX)
      if (dist < closestDist) {
        closestDist = dist
        closestIndex = i
      }
    })
    setHoveredIndex(closestIndex)
  }

  const handleMouseLeave = () => setHoveredIndex(6)

  const scatteredDots = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        x: 30 + (i % 5) * 60 + (Math.random() - 0.5) * 40,
        y: padding.top + 10 + Math.floor(i / 5) * 15 + (Math.random() - 0.5) * 10,
        opacity: 0.2 + Math.random() * 0.3,
        size: 1.0 + Math.random() * 1.5,
      })),
    [],
  )

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : ''
    return `${sign}$${Math.abs(val).toLocaleString()}`
  }

  // Dynamic Font Size logic tailored to the 220px sidebar width
  const getDynamicFontSize = (text: string) => {
    const len = text.length;
    if (len > 13) return 'text-[18px]'; // Extremely long
    if (len > 10) return 'text-[22px]'; // Millions with sign/commas
    if (len > 8) return 'text-[26px]';  // Hundreds of thousands
    return 'text-[32px]';               // Standard thousands/less
  };

  const pnlString = formatCurrency(totalPnl);

  return (
    <div className="relative w-full h-[230px] lg:h-[250px] rounded-[2.5rem] bg-gradient-to-b from-white/10 to-white/5 p-2 shadow-2xl overflow-hidden group shrink-0">
      {/* Inner highlight */}
      <div className="absolute inset-[1px] rounded-[2.4rem] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" style={{ height: "40%" }} />

      <div className="relative h-full overflow-hidden rounded-[2rem] bg-[#0c0c0e] p-6 pb-4 border border-white/5 flex flex-col justify-between">
        {/* Header Section */}
        <div className="flex items-start justify-between min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold tracking-widest text-nexus-muted uppercase">Total P&L</p>
            <h2 className={`mt-1 font-semibold leading-tight tracking-tighter whitespace-nowrap overflow-hidden transition-all duration-300 ${getDynamicFontSize(pnlString)} ${totalPnl >= 0 ? 'text-white' : 'text-red-400'}`}>
              {pnlString}
            </h2>
            <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${
              lastTradePnl >= 0 ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-red-500/20 bg-red-500/5 text-red-400'
            }`}>
              <span className="text-[11px] font-bold font-mono whitespace-nowrap">
                {lastTradePnl >= 0 ? '+' : ''}{formatCurrency(lastTradePnl)}
              </span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={lastTradePnl >= 0 ? 'rotate-0' : 'rotate-90'}>
                <path d="M2 11L6 7L9 10L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 4H14V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="relative mt-2 flex-1">
          <svg
            ref={chartRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "default" }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffa600" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffa600" stopOpacity="0" />
              </linearGradient>
              <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Vertical dashed lines */}
            {weekData.map((_, i) => (
              <line
                key={i}
                x1={getX(i)}
                y1={padding.top}
                x2={getX(i)}
                y2={chartHeight - padding.bottom}
                className="stroke-white/5 transition-opacity duration-200"
                strokeWidth="1"
                strokeDasharray="3 5"
                opacity={hoveredIndex === i ? 1 : 0.4}
              />
            ))}

            {/* Scattered decorative dots */}
            {scatteredDots.map((dot, i) => (
              <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill="white" opacity={dot.opacity} />
            ))}

            {/* Area fill */}
            <path d={generateAreaPath()} fill="url(#areaGradient)" className="transition-all duration-300" />

            {/* Main curve line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="#ffa600"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover data point */}
            {hoveredIndex !== null && (
              <g className="transition-all duration-150 ease-out">
                <circle cx={getX(hoveredIndex)} cy={getY(weekData[hoveredIndex].value)} r="10" fill="#ffa600" opacity="0.2" />
                <circle cx={getX(hoveredIndex)} cy={getY(weekData[hoveredIndex].value)} r="6" fill="#ffa600" filter="url(#dotGlow)" />
              </g>
            )}

            {/* Day labels */}
            {weekData.map((d, i) => (
              <text key={i} x={getX(i)} y={chartHeight - 8} textAnchor="middle" className="text-[10px] font-bold fill-nexus-muted uppercase">
                {d.day}
              </text>
            ))}
          </svg>

          {/* Floating tooltip */}
          {hoveredIndex !== null && (
            <div
              className="pointer-events-none absolute transition-all duration-150 ease-out"
              style={{
                left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                top: `${(getY(weekData[hoveredIndex].value) / chartHeight) * 100}%`,
                transform: "translate(-50%, -140%)",
              }}
            >
              <div className="relative rounded-lg bg-white px-3 py-1.5 shadow-2xl">
                <span className="text-[12px] font-bold text-black font-mono whitespace-nowrap">
                  {formatCurrency(weekData[hoveredIndex].value)}
                </span>
                <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
