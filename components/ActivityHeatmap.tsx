import React, { useMemo } from 'react';
import { Trade } from '../types';

interface ActivityHeatmapProps {
  trades: Trade[];
  currentDate?: Date; // Optional, not strictly needed for last 30 days
  className?: string;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ trades, className = '' }) => {
  const last30Days = useMemo(() => {
    const days = [];
    const today = new Date();
    // Normalize today to midnight to avoid time issues
    today.setHours(0,0,0,0);

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const count = trades.filter(t => t.date === dateStr).length;
      days.push({ date: d, dateStr, count });
    }
    return days;
  }, [trades]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-[#1a1a1a] border border-white/5';
    if (count <= 2) return 'bg-emerald-900/50 border border-emerald-500/30';
    if (count <= 5) return 'bg-emerald-600 border border-emerald-400/50';
    return 'bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
  };

  return (
    <div className={`liquid-card rounded-3xl p-5 flex flex-col gap-4 ${className}`}>
        <div className="flex justify-between items-end">
            <span className="text-[10px] uppercase tracking-widest text-nexus-muted">30-Day Activity</span>
             <span className="text-[9px] text-nexus-muted font-mono">
                {last30Days[0].date.toLocaleDateString('en-US', {month:'short', day:'numeric'})} - Today
             </span>
        </div>
        
        {/* GitHub Style Grid - Flexible layout mimicking a grid */}
        <div className="flex flex-wrap gap-1.5 justify-between content-start">
            {last30Days.map((day, i) => (
                <div 
                    key={i}
                    title={`${day.dateStr}: ${day.count} trades`}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${getColor(day.count)} transition-all duration-300 hover:scale-110 cursor-help`}
                ></div>
            ))}
        </div>
    </div>
  );
};

export default ActivityHeatmap;