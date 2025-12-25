import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
import { Trade } from '../types';

interface EnergyChartProps {
  trades: Trade[];
  stats: {
    totalPnl: number;
    growthPct: number;
  };
  className?: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const EnergyChart: React.FC<EnergyChartProps> = ({ trades, stats, className }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const result = [];
    let weekTotal = 0;
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      const y = currentDay.getFullYear();
      const m = String(currentDay.getMonth() + 1).padStart(2, '0');
      const d = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dayTrades = trades.filter(t => t.date === dateStr);
      const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      weekTotal += dayPnl;
      result.push({
        label: days[i],
        value: dayPnl,
        dateStr: dateStr,
        display: dayPnl >= 0 ? `+$${dayPnl.toLocaleString()}` : `-$${Math.abs(dayPnl).toLocaleString()}`
      });
    }
    return { bars: result, weekTotal };
  }, [trades]);

  const headerValue = hoveredIndex !== null 
    ? chartData.bars[hoveredIndex].value 
    : chartData.weekTotal;

  const isPositiveValue = headerValue >= 0;
  const maxAbsValue = Math.max(...chartData.bars.map((d) => Math.abs(d.value)), 100);

  const handleContainerLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleContainerLeave}
      className={cn(
        "group relative w-full h-full p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 transition-all duration-500 flex flex-col justify-between overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between z-30 shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold text-nexus-muted tracking-[0.2em] uppercase">Weekly Chart</span>
        </div>
        <div className="relative h-7 flex items-baseline">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums transition-all duration-300 ease-out text-white"
            )}
          >
            {isPositiveValue ? '+' : '-'}${Math.abs(headerValue).toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-nexus-muted/40 uppercase tracking-widest ml-1.5">
            EQUITY
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-end gap-3 relative z-30 mb-2 px-2">
        {chartData.bars.map((item, index) => {
          const heightPct = (Math.abs(item.value) / maxAbsValue) * 85 + 5; 
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;
          const isNeighbor = hoveredIndex !== null && (index === hoveredIndex - 1 || index === hoveredIndex + 1);
          return (
            <div
              key={`${item.label}-${index}`}
              className="relative flex-1 flex flex-col items-center justify-end h-full"
              onMouseEnter={() => {
                setHoveredIndex(index);
              }}
            >
              <div
                className={cn(
                  "w-full rounded-full cursor-pointer transition-all duration-300 ease-out origin-bottom flex items-center justify-center overflow-hidden",
                  isHovered
                    ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                    : isNeighbor
                      ? "bg-white/10"
                      : isAnyHovered
                        ? "bg-white/5"
                        : "bg-white/15",
                )}
                style={{
                  height: `${heightPct}%`,
                  transform: isHovered ? "scaleX(1.1)" : "scaleX(1)",
                }}
              >
                 {isHovered && (
                    <span className="text-black font-bold text-[9px] whitespace-nowrap [writing-mode:vertical-rl] rotate-180 drop-shadow-sm py-2">
                       {item.display}
                    </span>
                 )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold mt-3 transition-all duration-300 uppercase tracking-widest",
                  isHovered ? "text-white" : "text-nexus-muted/40",
                )}
              >
                {item.label.charAt(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(EnergyChart);