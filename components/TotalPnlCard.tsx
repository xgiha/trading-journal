
import React, { useMemo } from "react"
import { Trade } from "../types"

interface TotalPnlCardProps {
  trades: Trade[]
  totalPnl: number
  growthPct: number
}

export default function TotalPnlCard({ trades, totalPnl, growthPct }: TotalPnlCardProps) {
  // Generate a real equity curve based on trade history
  const chartPoints = useMemo(() => {
    if (trades.length === 0) return [0, 0, 0, 0];
    
    const sortedTrades = [...trades].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.entryTime.localeCompare(b.entryTime);
    });

    let cumulative = 0;
    const points = [0]; // Start at 0
    sortedTrades.forEach(t => {
      cumulative += t.pnl;
      points.push(cumulative);
    });
    
    // Ensure we have at least a few points for a nice line
    if (points.length < 5) {
        while (points.length < 5) points.push(cumulative);
    }
    
    return points;
  }, [trades]);

  const maxVal = Math.max(...chartPoints);
  const minVal = Math.min(...chartPoints);

  // Dynamic Font Size Calculation
  const getFontSize = (val: number) => {
    const length = Math.floor(Math.abs(val)).toString().length;
    if (length <= 4) return 'text-[2.8rem]';
    if (length === 5) return 'text-[2.5rem]';
    if (length === 6) return 'text-[2.2rem]';
    if (length === 7) return 'text-[1.8rem]';
    return 'text-[1.5rem]';
  };

  const formatCurrencyInteger = (val: number) => {
    return Math.floor(Math.abs(val)).toLocaleString();
  };

  // Scaling for SVG
  const width = 200;
  const height = 100;
  const padding = 10;

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return height - padding - ((val - minVal) / range) * (height - 2 * padding);
  };

  const getX = (index: number) => {
    return (index / (chartPoints.length - 1)) * width;
  };

  const linePath = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`)
    .join(' ');

  const maxPointIdx = chartPoints.indexOf(maxVal);
  const minPointIdx = chartPoints.indexOf(minVal);

  return (
    <div className="bg-black rounded-3xl p-6 w-full aspect-square shrink-0 flex flex-col items-center justify-between border border-white/5 relative group transition-all duration-500 overflow-hidden shadow-lg">
      {/* Background Glow matching Analytics */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-accent/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      {/* Top Section: Price and Growth */}
      <div className="flex flex-col items-center mt-6 w-full z-10">
        <div className="flex items-start gap-1">
          <span className="font-pixel text-xl text-white/30 mt-1">$</span>
          <h2 className={`font-pixel ${getFontSize(totalPnl)} text-white tracking-tighter leading-none transition-all duration-300`}>
            {totalPnl < 0 ? '-' : ''}{formatCurrencyInteger(totalPnl)}
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`text-[10px] font-bold ${growthPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
          </span>
          <svg 
            width="10" 
            height="10" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`transition-transform duration-300 ${growthPct >= 0 ? 'rotate-0 text-emerald-400' : 'rotate-180 text-red-400'}`}
          >
            <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Middle Section: Chart */}
      <div className="w-full relative px-2 mb-4 z-10">
        {/* Horizontal Dashed Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
          <div className="w-full border-t border-dashed border-white flex justify-between">
            <span className="text-[8px] text-nexus-accent font-bold font-mono -translate-y-1/2 bg-black pr-1">
              H: ${Math.round(maxVal).toLocaleString()}
            </span>
          </div>
          <div className="w-full border-t border-dashed border-white flex justify-between">
             <span className="text-[8px] text-nexus-accent font-bold font-mono -translate-y-1/2 bg-black pr-1">
              L: ${Math.round(minVal).toLocaleString()}
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
            className="opacity-90 transition-all duration-700"
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
      
      {/* Bottom Sub-label (Aesthetic) */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-bold">Realtime Equity Stream</span>
      </div>
    </div>
  )
}
