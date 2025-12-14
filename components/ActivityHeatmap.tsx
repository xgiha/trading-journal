import React, { useMemo } from 'react';
import { Trade } from '../types';

interface ActivityHeatmapProps {
  trades: Trade[];
  currentDate: Date; // The month we are currently viewing
  className?: string;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ trades, currentDate, className = '' }) => {
  
  const daysData = useMemo(() => {
    // 1. Get total days in the current calendar month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 2. Map trade counts for each day of this specific month
    const tradeCounts: { [key: string]: number } = {};
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    trades.forEach(t => {
      if (t.date.startsWith(monthPrefix)) {
        tradeCounts[t.date] = (tradeCounts[t.date] || 0) + 1;
      }
    });

    // 3. Generate array of days
    const result = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
        const count = tradeCounts[dateStr] || 0;
        
        // Determine if this day is in the future relative to "Today" (real time)
        const checkDate = new Date(year, month, d);
        const isFuture = checkDate > today;

        result.push({ dateStr, count, isFuture, dayNum: d });
    }
    return result;

  }, [trades, currentDate]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count <= 1) return 'bg-emerald-500/30';
    if (count <= 3) return 'bg-emerald-500/60';
    return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]';
  };

  return (
    <div className={`liquid-card rounded-3xl p-4 flex flex-col gap-3 ${className}`}>
       <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] uppercase tracking-widest text-nexus-muted">Monthly Consistency</span>
          <div className="flex gap-1.5 items-center">
             <div className="w-1.5 h-1.5 rounded-sm bg-white/5"></div>
             <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500/30"></div>
             <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500"></div>
          </div>
       </div>
       
       {/* Monthly Consistency Strip */}
       <div className="flex flex-wrap gap-1 content-start">
          {daysData.map((day, i) => (
             <div 
               key={i}
               title={`${day.dateStr}: ${day.count} trades`}
               className={`w-2 h-4 md:w-2.5 md:h-5 rounded-[2px] transition-all duration-300 ${day.isFuture ? 'opacity-0' : getColor(day.count)}`}
             ></div>
          ))}
       </div>
       
       <div className="flex justify-between items-center pt-1 border-t border-white/5 mt-auto">
          <span className="text-[9px] text-nexus-muted font-mono">{currentDate.toLocaleString('default', { month: 'short' })} 1</span>
          <span className="text-[9px] text-nexus-muted font-mono">End of Month</span>
       </div>
    </div>
  );
};

export default ActivityHeatmap;