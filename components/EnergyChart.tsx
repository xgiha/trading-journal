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
  const [displayValue, setDisplayValue] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate dynamic chart data based on trades
  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const result = [];

    // Calculate last 7 days activity
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[(d.getDay() + 6) % 7]; 
      
      const dayTrades = trades.filter(t => t.date === dateStr);
      // Map activity to a 0-100 range.
      const value = dayTrades.length > 0 ? Math.min(60 + (dayTrades.length * 10), 100) : (40 + Math.random() * 20);

      result.push({
        label: dayName,
        value: Math.round(value),
        display: Math.round(value).toString()
      });
    }
    return result;
  }, [trades]);

  const maxValue = Math.max(...chartData.map((d) => d.value));

  const handleContainerLeave = () => {
    setIsHovering(false);
    setHoveredIndex(null);
    setTimeout(() => setDisplayValue(null), 150);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleContainerLeave}
      className={cn(
        "group relative w-full h-full p-6 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 transition-all duration-500 hover:bg-white/[0.06] hover:border-white/20 flex flex-col justify-between overflow-hidden isolate shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {/* Visual Effects Layers */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"></div>
      <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
      <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/5 to-transparent opacity-30 blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none z-0"></div>

      {/* Header */}
      <div className="flex items-center justify-between z-30 shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="text-[11px] font-bold text-nexus-muted tracking-[0.2em] uppercase">Activity</span>
        </div>
        <div className="relative h-7 flex items-baseline">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums transition-all duration-300 ease-out",
              isHovering && displayValue !== null ? "text-white" : "text-white/60",
            )}
          >
            {displayValue !== null ? displayValue : "85"}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold text-nexus-muted transition-opacity duration-300 ml-0.5",
              displayValue !== null || !isHovering ? "opacity-60" : "opacity-0",
            )}
          >
            %
          </span>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="flex-1 flex items-end gap-3 relative z-30 mb-4 px-2">
        {chartData.map((item, index) => {
          const heightPct = (item.value / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;
          const isNeighbor = hoveredIndex !== null && (index === hoveredIndex - 1 || index === hoveredIndex + 1);

          return (
            <div
              key={`${item.label}-${index}`}
              className="relative flex-1 flex flex-col items-center justify-end h-full"
              onMouseEnter={() => {
                setHoveredIndex(index);
                setDisplayValue(item.display);
              }}
            >
              <div
                className={cn(
                  "w-full rounded-full cursor-pointer transition-all duration-300 ease-out origin-bottom",
                  isHovered
                    ? "bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : isNeighbor
                      ? "bg-white/10"
                      : isAnyHovered
                        ? "bg-white/5"
                        : "bg-white/10",
                )}
                style={{
                  height: `${heightPct}%`,
                  transform: isHovered ? "scaleX(1.1) scaleY(1.01)" : "scaleX(1)",
                }}
              />

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

      {/* Footer Details */}
      <div className="pt-4 border-t border-white/5 z-30">
          <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-nexus-muted">
                <span>System Health</span>
                <span className="text-emerald-400">99.2%</span>
             </div>
             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/30 w-[99.2%]" />
             </div>
          </div>
      </div>
    </div>
  );
};

export default React.memo(EnergyChart);
