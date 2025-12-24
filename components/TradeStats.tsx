import React, { useMemo } from 'react';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Target, Clock, Trophy, AlertTriangle, Calendar, Award } from 'lucide-react';

interface TradeStatsProps {
  trades: Trade[];
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// Fix: Use React.FC and make children optional to resolve "Property 'children' is missing" and "Property 'key' does not exist" errors
const StatCard: React.FC<{ title: string; children?: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn(
    "relative w-full overflow-hidden bg-white/[0.03] backdrop-blur-[120px] border border-white/10 rounded-[2.5rem] p-5 isolate shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:bg-white/[0.06] hover:border-white/20",
    className
  )}>
    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"></div>
    <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
    <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/5 to-transparent opacity-30 blur-3xl pointer-events-none -z-10"></div>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none z-0"></div>
    
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-bold text-nexus-muted tracking-[0.2em] uppercase">{title}</span>
      </div>
      {children}
    </div>
  </div>
);

const TradeStats: React.FC<TradeStatsProps> = ({ trades }) => {
  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    // 1. Peaks
    let bestTrade = trades[0];
    let worstTrade = trades[0];
    
    // 2. Averages
    let winSum = 0, winCount = 0;
    let lossSum = 0, lossCount = 0;
    
    // 3. Days
    const dayMap = new Map<string, number>();
    
    // 4. Time & Strategy
    let longestTime = 0; // in minutes
    let shortestTime = Infinity;
    const strategyCount = new Map<string, number>();
    const strategyPnl = new Map<string, number>();

    trades.forEach(t => {
      // Peaks
      if (t.pnl > bestTrade.pnl) bestTrade = t;
      if (t.pnl < worstTrade.pnl) worstTrade = t;
      
      // Averages
      if (t.pnl > 0) { winSum += t.pnl; winCount++; }
      else if (t.pnl < 0) { lossSum += t.pnl; lossCount++; }
      
      // Daily
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.pnl);
      
      // Time (assuming HH:mm:ss format)
      if (t.entryTime && t.exitTime) {
        const [h1, m1] = t.entryTime.split(':').map(Number);
        const [h2, m2] = t.exitTime.split(':').map(Number);
        const duration = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (duration > 0) {
          if (duration > longestTime) longestTime = duration;
          if (duration < shortestTime) shortestTime = duration;
        }
      }
      
      // Strategy
      const strat = t.strategy || 'Uncategorized';
      strategyCount.set(strat, (strategyCount.get(strat) || 0) + 1);
      strategyPnl.set(strat, (strategyPnl.get(strat) || 0) + t.pnl);
    });

    const avgWin = winCount > 0 ? winSum / winCount : 0;
    const avgLoss = lossCount > 0 ? lossSum / lossCount : 0;

    const dayEntries = Array.from(dayMap.entries());
    const mostProfitableDay = dayEntries.length > 0 ? dayEntries.sort((a,b) => b[1] - a[1])[0] : null;
    const leastProfitableDay = dayEntries.length > 0 ? dayEntries.sort((a,b) => a[1] - b[1])[0] : null;

    const strategyEntries = Array.from(strategyCount.entries());
    const mostUsedStrategy = strategyEntries.length > 0 ? strategyEntries.sort((a,b) => b[1] - a[1])[0] : null;
    
    const strategyPnlEntries = Array.from(strategyPnl.entries());
    const mostProfitableStrategy = strategyPnlEntries.length > 0 ? strategyPnlEntries.sort((a,b) => b[1] - a[1])[0] : null;

    return {
      bestTrade, worstTrade, avgWin, avgLoss,
      mostProfitableDay, leastProfitableDay,
      longestTime, shortestTime: shortestTime === Infinity ? 0 : shortestTime,
      mostUsedStrategy, mostProfitableStrategy
    };
  }, [trades]);

  if (!stats) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <StatCard key={i} title="Pending Data" className="h-[140px]">
          <div className="flex-1 flex items-center justify-center opacity-20">
            <Award size={40} />
          </div>
        </StatCard>
      ))}
    </div>
  );

  const formatMin = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* CARD 1 & 2: Performance Matrix (Merged) - Increased height by 24px */}
      <StatCard title="Trade Performance" className="h-[320px]">
        <div className="flex-1 grid grid-cols-2 gap-4 mt-1">
          {/* Best Trade */}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy size={10} className="text-emerald-400" />
              <span className="text-[9px] uppercase font-bold text-nexus-muted">Best</span>
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono tracking-tighter">
              +${stats.bestTrade.pnl.toLocaleString()}
            </div>
            <div className="text-[8px] text-nexus-muted mt-0.5 truncate uppercase tracking-widest">{stats.bestTrade.pair}</div>
          </div>
          {/* Worst Trade */}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={10} className="text-red-400" />
              <span className="text-[9px] uppercase font-bold text-nexus-muted">Worst</span>
            </div>
            <div className="text-lg font-bold text-red-400 font-mono tracking-tighter">
              -${Math.abs(stats.worstTrade.pnl).toLocaleString()}
            </div>
            <div className="text-[8px] text-nexus-muted mt-0.5 truncate uppercase tracking-widest">{stats.worstTrade.pair}</div>
          </div>
          {/* Avg Win */}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 col-span-2">
            <div className="flex justify-between items-center mb-1.5">
               <span className="text-[9px] uppercase font-bold text-nexus-muted">Avg Winning Trade</span>
               <TrendingUp size={10} className="text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">+${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          {/* Avg Loss */}
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 col-span-2">
            <div className="flex justify-between items-center mb-1.5">
               <span className="text-[9px] uppercase font-bold text-nexus-muted">Avg Losing Trade</span>
               <TrendingDown size={10} className="text-red-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">-${Math.abs(stats.avgLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </StatCard>

      {/* CARD 3: Most / Least Profitable Days */}
      <StatCard title="Daily Records" className="h-[164px]">
        <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-2 px-3 border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted">Most Profitable</span>
                    <span className="text-[10px] text-white font-bold">{stats.mostProfitableDay ? formatDate(stats.mostProfitableDay[0]) : '-'}</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">+${stats.mostProfitableDay?.[1].toLocaleString()}</div>
            </div>
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-2 px-3 border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted">Least Profitable</span>
                    <span className="text-[10px] text-white font-bold">{stats.leastProfitableDay ? formatDate(stats.leastProfitableDay[0]) : '-'}</span>
                </div>
                <div className="text-sm font-bold text-red-400 font-mono">-${Math.abs(stats.leastProfitableDay?.[1] || 0).toLocaleString()}</div>
            </div>
        </div>
      </StatCard>

      {/* CARD 4: Time & Strategy - Increased height by 24px */}
      <StatCard title="Logic & Efficiency" className="h-[234px]">
        <div className="flex-1 flex flex-col gap-3 mt-1">
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted block mb-1">Longest</span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-white/40" />
                        <span className="text-[11px] font-bold text-white">{formatMin(stats.longestTime)}</span>
                    </div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted block mb-1">Shortest</span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-white/40" />
                        <span className="text-[11px] font-bold text-white">{formatMin(stats.shortestTime)}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-2">
                <div className="bg-white/5 rounded-xl p-2 px-3 border border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-nexus-muted">Most Used Strategy</span>
                        <span className="text-[10px] text-nexus-accent font-bold truncate max-w-[120px]">{stats.mostUsedStrategy?.[0] || 'N/A'}</span>
                    </div>
                    <div className="text-[10px] font-bold text-white">{stats.mostUsedStrategy?.[1] || 0}x</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 px-3 border border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-nexus-muted">Best Strategy</span>
                        <span className="text-[10px] text-emerald-400 font-bold truncate max-w-[120px]">{stats.mostProfitableStrategy?.[0] || 'N/A'}</span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 font-mono tracking-tighter">
                        +${stats.mostProfitableStrategy?.[1].toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
      </StatCard>
    </div>
  );
};

export default TradeStats;