import React, { useMemo } from "react"
import { Trade } from "../types"

interface TotalPnlCardProps {
  trades: Trade[]
  totalPnl: number
  growthPct: number
}

export default function TotalPnlCard({ trades, totalPnl, growthPct }: TotalPnlCardProps) {
  // Generate a jagged, tick-like path for the intraday look
  const chartPoints = useMemo(() => {
    const points = []
    const base = totalPnl
    const steps = 60
    let current = base - 200 // Start slightly lower

    for (let i = 0; i < steps; i++) {
      // Random walk with a slight upward bias if growth is positive
      const volatility = 40
      const bias = growthPct > 0 ? 3 : -2
      current += (Math.random() - 0.5) * volatility + bias
      points.push(current)
    }
    return points
  }, [totalPnl, growthPct])

  const maxVal = Math.max(...chartPoints)
  const minVal = Math.min(...chartPoints)

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Scaling for SVG
  const width = 200
  const height = 100
  const padding = 10

  const getY = (val: number) => {
    const range = maxVal - minVal || 1
    return height - padding - ((val - minVal) / range) * (height - 2 * padding)
  }

  const getX = (index: number) => {
    return (index / (chartPoints.length - 1)) * width
  }

  const linePath = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`)
    .join(' ')

  const maxPointIdx = chartPoints.indexOf(maxVal)
  const minPointIdx = chartPoints.indexOf(minVal)

  return (
    <div className="bg-[#161616] rounded-[2.5rem] p-6 w-full aspect-square shrink-0 flex flex-col items-center justify-between border border-white/5 relative group transition-all duration-500 overflow-hidden shadow-2xl">
      {/* Top Section: Price and Growth */}
      <div className="flex flex-col items-center mt-6 w-full">
        <div className="flex items-start gap-1">
          <span className="font-pixel text-xl text-white/30 mt-1">$</span>
          <h2 className="font-pixel text-[2.2rem] md:text-[2.6rem] text-white tracking-tighter leading-none">
            {formatCurrency(totalPnl).split('.')[0]}
            <span className="text-white/30">.{formatCurrency(totalPnl).split('.')[1]}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-xs font-bold ${growthPct >= 0 ? 'text-emerald-400' : 'text-nexus-muted'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
          </span>
          <svg 
            width="10" 
            height="10" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`transition-transform duration-300 ${growthPct >= 0 ? 'rotate-0 text-emerald-400' : 'rotate-180 text-nexus-muted'}`}
          >
            <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Middle Section: Chart */}
      <div className="w-full relative px-2 mb-4">
        {/* Horizontal Dashed Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
          <div className="w-full border-t border-dashed border-white flex justify-between">
            <span className="text-[10px] text-nexus-accent font-bold font-mono -translate-y-1/2 bg-[#161616] pr-1">
              ${Math.round(maxVal).toLocaleString()}
            </span>
          </div>
          <div className="w-full border-t border-dashed border-white flex justify-between">
             <span className="text-[10px] text-nexus-accent font-bold font-mono -translate-y-1/2 bg-[#161616] pr-1">
              ${Math.round(minVal).toLocaleString()}
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          {/* Main Chart Line */}
          <path
            d={linePath}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="opacity-90"
          />

          {/* High/Low Markers */}
          <g>
            <circle 
              cx={getX(maxPointIdx)} 
              cy={getY(maxVal)} 
              r="4" 
              fill="#fb923c" 
              className="animate-pulse shadow-lg" 
            />
            <circle 
              cx={getX(maxPointIdx)} 
              cy={getY(maxVal)} 
              r="2" 
              fill="white" 
            />

            <circle 
              cx={getX(minPointIdx)} 
              cy={getY(minVal)} 
              r="4" 
              fill="#fb923c" 
              className="animate-pulse shadow-lg" 
            />
            <circle 
              cx={getX(minPointIdx)} 
              cy={getY(minVal)} 
              r="2" 
              fill="white" 
            />
          </g>
        </svg>
      </div>
      
      {/* Bottom Sub-label (Optional / Aesthetic) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
      </div>
    </div>
  )
}
