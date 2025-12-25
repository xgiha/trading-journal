import React, { useMemo } from 'react';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Target, Clock, Trophy, AlertTriangle, Calendar, Award } from 'lucide-react';

interface TradeStatsProps {
  trades: Trade[];
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const StatCard: React.FC<{ title: string; children?: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn(
    "relative w-full overflow-hidden bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-4 transition-all duration-500",
    className
  )}>
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2.5">
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

    let bestTrade = trades[0];
    let worstTrade = trades[0];
    let winSum = 0, winCount = 0;
    let lossSum = 0, lossCount = 0;
    const dayMap = new Map<string, number>();
    let longestTime = 0;
    let shortestTime = Infinity;
    const strategyCount = new Map<string, number>();
    const strategyPnl = new Map<string, number>();

    trades.forEach(t => {
      if (t.pnl > bestTrade.pnl) bestTrade = t;
      if (t.pnl < worstTrade.pnl) worstTrade = t;
      if (t.pnl > 0) { winSum += t.pnl; winCount++; }
      else if (t.pnl < 0) { lossSum += t.pnl; lossCount++; }
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.pnl);
      if (t.entryTime && t.exitTime) {
        const [h1, m1] = t.entryTime.split(':').map(Number);
        const [h2, m2] = t.exitTime.split(':').map(Number);
        const duration = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (duration > 0) {
          if (duration > longestTime) longestTime = duration;
          if (duration < shortestTime) shortestTime = duration;
        }
      }
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
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <StatCard key={i} title="Pending Data" className="h-[120px]">
          <div className="flex-1 flex items-center justify-center opacity-20">
            <Award size={32} />
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
    <div className="flex flex-col gap-3 w-full">
      <StatCard title="Trade Performance" className="h-[250px]">
        <div className="flex-1 grid grid-cols-2 gap-2 mt-[-4px]">
          <div className="bg-white/5 rounded-2xl p-1.5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Trophy size={10} className="text-emerald-400" />
              <span className="text-[9px] uppercase font-bold text-nexus-muted">Best</span>
            </div>
            <div className="text-base font-bold text-emerald-400 font-mono tracking-tighter">
              +${stats.bestTrade.pnl.toLocaleString()}
            </div>
            <div className="text-[8px] text-nexus-muted truncate uppercase tracking-widest">{stats.bestTrade.pair}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-1.5 border border-white/5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <AlertTriangle size={10} className="text-red-400" />
              <span className="text-[9px] uppercase font-bold text-nexus-muted">Worst</span>
            </div>
            <div className="text-base font-bold text-red-400 font-mono tracking-tighter">
              -${Math.abs(stats.worstTrade.pnl).toLocaleString()}
            </div>
            <div className="text-[8px] text-nexus-muted truncate uppercase tracking-widest">{stats.worstTrade.pair}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-1.5 px-3 border border-white/5 col-span-2">
            <div className="flex justify-between items-center mb-0.5">
               <span className="text-[9px] uppercase font-bold text-nexus-muted">Avg Winning Trade</span>
               <TrendingUp size={10} className="text-emerald-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">+${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-1.5 px-3 border border-white/5 col-span-2">
            <div className="flex justify-between items-center mb-0.5">
               <span className="text-[9px] uppercase font-bold text-nexus-muted">Avg Losing Trade</span>
               <TrendingDown size={10} className="text-red-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">-${Math.abs(stats.avgLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </StatCard>

      <StatCard title="Daily Records" className="h-[135px]">
        <div className="flex-1 flex flex-col justify-center gap-2 mt-[-4px]">
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-1.5 px-3 border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted">Most Profitable</span>
                    <span className="text-[10px] text-white font-bold">{stats.mostProfitableDay ? formatDate(stats.mostProfitableDay[0]) : '-'}</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">+${stats.mostProfitableDay?.[1].toLocaleString()}</div>
            </div>
            <div className="flex justify-between items-center bg-white/5 rounded-xl p-1.5 px-3 border border-white/5">
                <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted">Least Profitable</span>
                    <span className="text-[10px] text-white font-bold">{stats.leastProfitableDay ? formatDate(stats.leastProfitableDay[0]) : '-'}</span>
                </div>
                <div className="text-sm font-bold text-red-400 font-mono">-${Math.abs(stats.leastProfitableDay?.[1] || 0).toLocaleString()}</div>
            </div>
        </div>
      </StatCard>

      <StatCard title="Logic & Efficiency" className="h-[195px]">
        <div className="flex-1 flex flex-col gap-2 mt-[-4px]">
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-xl p-1.5 border border-white/5">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted block mb-0.5">Longest</span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-white/40" />
                        <span className="text-[10px] font-bold text-white">{formatMin(stats.longestTime)}</span>
                    </div>
                </div>
                <div className="bg-white/5 rounded-xl p-1.5 border border-white/5">
                    <span className="text-[8px] uppercase font-bold text-nexus-muted block mb-0.5">Shortest</span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-white/40" />
                        <span className="text-[10px] font-bold text-white">{formatMin(stats.shortestTime)}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
                <div className="bg-white/5 rounded-xl p-1.5 px-3 border border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-nexus-muted">Most Used</span>
                        <span className="text-[10px] text-nexus-accent font-bold truncate max-w-[100px]">{stats.mostUsedStrategy?.[0] || 'N/A'}</span>
                    </div>
                    <div className="text-[10px] font-bold text-white">{stats.mostUsedStrategy?.[1] || 0}x</div>
                </div>
                <div className="bg-white/5 rounded-xl p-1.5 px-3 border border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-nexus-muted">Best Logic</span>
                        <span className="text-[10px] text-emerald-400 font-bold truncate max-w-[100px]">{stats.mostProfitableStrategy?.[0] || 'N/A'}</span>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 font-mono">
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