import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Trade } from '../types';

interface InsightCardProps {
  trades: Trade[];
  className?: string;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const InsightCard: React.FC<InsightCardProps> = ({ trades, className }) => {
  const chartData = useMemo(() => {
    // Group and aggregate by date for the equity curve
    const dailyMap = new Map<string, number>();
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedTrades.forEach(t => {
      dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.pnl);
    });

    let cumulative = 0;
    const sortedDates = Array.from(dailyMap.keys()).sort();
    
    // Ensure we have at least some data points for the visual
    if (sortedDates.length === 0) {
        return [
            { name: '1', pnl: 0 }, { name: '2', pnl: 120 }, { name: '3', pnl: 80 }, { name: '4', pnl: 250 }
        ];
    }

    return sortedDates.map(date => {
      cumulative += dailyMap.get(date)!;
      const d = new Date(date);
      return {
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: cumulative
      };
    });
  }, [trades]);

  const currentPnl = chartData[chartData.length - 1]?.pnl || 0;
  const isPositive = currentPnl >= 0;

  return (
    <div
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
          <div className="w-1.5 h-1.5 rounded-full bg-nexus-accent shadow-[0_0_8px_#ffa600]" />
          <span className="text-[11px] font-bold text-nexus-muted tracking-[0.2em] uppercase">Growth Analytics</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold tabular-nums text-white")}>
            ${Math.abs(currentPnl).toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-nexus-muted opacity-60 uppercase tracking-widest">
            Equity
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full relative z-30 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ fontSize: '10px', color: '#fff' }}
              labelStyle={{ fontSize: '9px', color: '#666' }}
              formatter={(val: number) => [`$${val.toLocaleString()}`, 'Equity']}
            />
            <Area 
              type="monotone" 
              dataKey="pnl" 
              stroke={isPositive ? "#10b981" : "#ef4444"} 
              strokeWidth={2} 
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#fff' }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Details */}
      <div className="pt-4 border-t border-white/5 z-30 mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <TrendingUp size={12} className="text-emerald-400 opacity-60" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-nexus-muted">Stable Trajectory</span>
        </div>
        <span className="text-[9px] font-bold text-nexus-muted/40 uppercase tracking-widest">Live Updates</span>
      </div>
    </div>
  );
};

export default React.memo(InsightCard);
