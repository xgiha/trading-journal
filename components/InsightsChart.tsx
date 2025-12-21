import React, { useState, useRef, useMemo } from "react";
import { Trade } from "../types";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface InsightsChartProps {
  trades: Trade[];
}

export default function InsightsChart({ trades }: InsightsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate last 7 days of daily P&L data
  const dailyData = useMemo(() => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const now = new Date();
    const result = [];

    // To match the M T W T F S S labels from the screenshot, we start from a Monday or calculate backwards
    // Let's just generate the last 7 days but map them to the short single-letter labels
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[(d.getDay() + 6) % 7]; // Adjusting so 0 (Sunday) maps to index 6
      
      const pnl = trades
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + t.pnl, 0);

      // Using mock data values if no trades exist to match the look of the request if needed, 
      // but sticking to real trade data for functionality.
      result.push({
        label: dayName,
        value: pnl,
        display: pnl >= 0 ? `${pnl.toLocaleString()}` : `-${Math.abs(pnl).toLocaleString()}`
      });
    }
    return result;
  }, [trades]);

  const totalPeriodPnl = useMemo(() => dailyData.reduce((acc, d) => acc + d.value, 0), [dailyData]);

  const maxValue = useMemo(() => {
    const values = dailyData.map((d) => Math.abs(d.value));
    const max = Math.max(...values);
    return max === 0 ? 100 : max;
  }, [dailyData]);

  const getHeaderDisplayValue = () => {
    if (hoveredIndex !== null) {
      const val = dailyData[hoveredIndex].value;
      return val >= 0 ? `${val.toLocaleString()}` : `-${Math.abs(val).toLocaleString()}`;
    }
    return totalPeriodPnl >= 0 ? `${totalPeriodPnl.toLocaleString()}` : `-${Math.abs(totalPeriodPnl).toLocaleString()}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoveredIndex(null)}
      className="group relative w-full h-full p-6 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:bg-white/[0.06] hover:border-white/20 flex flex-col gap-4 overflow-hidden isolate"
    >
      {/* Visual Effects Layers */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"></div>
      <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
      <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/5 to-transparent opacity-30 blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none z-0"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-30">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-bold text-[#a1a1aa] tracking-widest uppercase">Activity</span>
        </div>
        <div className="relative h-7 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white transition-all duration-300">
            {getHeaderDisplayValue()}
          </span>
          <span className="text-xs font-bold text-[#52525b] transition-opacity duration-300">
            %
          </span>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="flex items-end gap-2 h-full min-h-[140px] relative z-30 pb-4 mt-2">
        {dailyData.map((item, index) => {
          const heightPct = (Math.abs(item.value) / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;

          return (
            <div
              key={`${item.label}-${index}`}
              className="relative flex-1 flex flex-col items-center justify-end h-full group/bar"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {/* Hover Pill Tooltip matching screenshot */}
              <div 
                className={cn(
                  "absolute px-2.5 py-1 rounded-lg bg-white text-black text-[11px] font-bold transition-all duration-200 shadow-xl z-50 pointer-events-none mb-2",
                  isHovered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-90"
                )}
                style={{ bottom: `${Math.max(20, heightPct)}%` }}
              >
                {item.display}%
              </div>

              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-[1.2rem] cursor-pointer transition-all duration-300 ease-out origin-bottom",
                  isHovered
                    ? "bg-white"
                    : "bg-[#27272a] hover:bg-[#3f3f46]"
                )}
                style={{
                  height: `${Math.max(20, heightPct)}%`,
                  transform: isHovered ? "scaleX(1.1)" : "scaleX(1)",
                }}
              />

              {/* Day Label */}
              <span
                className={cn(
                  "text-[10px] font-bold mt-4 transition-all duration-300 uppercase",
                  isHovered ? "text-white" : "text-[#52525b]",
                )}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}
