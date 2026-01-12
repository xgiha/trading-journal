import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
import { Trade } from '../types';
import { Skeleton } from './Skeleton';

interface WeeklyChartProps {
  trades: Trade[];
  stats: {
    totalPnl: number;
    growthPct: number;
  };
  className?: string;
  loading?: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const WeeklyChart: React.FC<WeeklyChartProps> = ({ trades, stats, className, loading = false }) => {
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
      // Calculate Net P&L for the day
      const dayNetPnl = dayTrades.reduce((sum, t) => sum + (t.pnl - (t.fee || 0)), 0);
      weekTotal += dayNetPnl;
      result.push({
        label: days[i],
        value: dayNetPnl,
        dateStr: dateStr,
        display: dayNetPnl >= 0 ? `+$${dayNetPnl.toLocaleString()}` : `-$${Math.abs(dayNetPnl).toLocaleString()}`
      });
    }
    // Calculate maxAbsValue here once to avoid the block-scoped variable usage error inside map
    const maxAbsValue = Math.max(...result.map((d) => Math.abs(d.value)), 100);
    return { bars: result, weekTotal, maxAbsValue };
  }, [trades]);

  const headerValue = hoveredIndex !== null 
    ? chartData.bars[hoveredIndex].value 
    : chartData.weekTotal;

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setHoveredIndex(null)}
      className={cn(
        "group relative w-full h-full p-6 rounded-[25px] bg-white/[0.03] transition-all duration-500 flex flex-col justify-between overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between z-30 shrink-0 mb-4">
        <div className="flex items-center gap-2">
          {loading ? <Skeleton className="h-1.5 w-1.5 rounded-full" /> : <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />}
          {loading ? <Skeleton className="h-3 w-20 rounded-full" /> : <span className="text-[11px] font-bold text-xgiha-muted tracking-[0.2em] uppercase">Weekly Performance</span>}
        </div>
        {!loading && (
            <div className="relative h-7 flex items-baseline">
                <span className={cn("font-pixel text-xl tracking-tighter tabular-nums transition-all duration-300 ease-out text-white")}>
                    {headerValue < 0 ? '-' : ''}${Math.abs(headerValue).toLocaleString()}
                </span>
            </div>
        )}
      </div>

      <div className="flex-1 flex items-end gap-3 relative z-30 mb-2 px-2">
        {loading ? (
            [...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <Skeleton className="w-full rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />
                </div>
            ))
        ) : (
            chartData.bars.map((item, index) => {
                // Fix: Access maxAbsValue from chartData instead of declaring it inside the loop after usage
                const heightPct = (Math.abs(item.value) / chartData.maxAbsValue) * 85 + 5; 
                const isHovered = hoveredIndex === index;
                return (
                    <div key={`${item.label}-${index}`} className="relative flex-1 flex flex-col items-center justify-end h-full" onMouseEnter={() => setHoveredIndex(index)}>
                    <div
                        className={cn("w-full rounded-full cursor-pointer transition-all duration-300 origin-bottom flex items-center justify-center overflow-hidden", isHovered ? "bg-white shadow-[0_0_15px_white]" : "bg-white/10")}
                        style={{ height: `${heightPct}%`, transform: isHovered ? "scaleX(1.1)" : "scaleX(1)" }}
                    >
                        {isHovered && Math.abs(item.value) > 0 && <span className="text-black font-bold text-[9px] [writing-mode:vertical-rl] rotate-180 py-2">{item.display}</span>}
                    </div>
                    <span className={cn("text-[10px] font-bold mt-3 transition-all uppercase tracking-widest", isHovered ? "text-white" : "text-xgiha-muted/40")}>{item.label.charAt(0)}</span>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default React.memo(WeeklyChart);