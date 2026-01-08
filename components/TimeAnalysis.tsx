import React, { useMemo } from 'react';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Target, Zap, Award, History, Maximize2, Minimize2 } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface TimeAnalysisProps {
  trades: Trade[];
  loading?: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const StatCard: React.FC<{ 
  title: string; 
  children?: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
  loading?: boolean;
}> = ({ title, children, className, style, loading = false }) => (
  <div 
    className={cn(
      "relative w-full overflow-hidden bg-white/[0.03] rounded-[25px] p-5 transition-all duration-500 border border-white/5",
      className
    )}
    style={style}
  >
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        {loading ? <Skeleton className="w-1.5 h-1.5 rounded-full" /> : <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />}
        <span className="text-[10px] font-bold text-xgiha-muted tracking-[0.2em] uppercase">{loading ? 'Loading...' : title}</span>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4 rounded-xl" />
        </div>
      ) : children}
    </div>
  </div>
);

const getSeconds = (time?: string) => {
  if (!time) return 0;
  const parts = time.split(':').map(Number);
  if (parts.length < 2) return 0;
  const [h, m, s = 0] = parts;
  return h * 3600 + m * 60 + s;
};

const formatDuration = (seconds: number) => {
  const s = Math.round(seconds);
  if (s <= 0) return '0m 0s';
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m ${secs}s`;
};

const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ trades, loading = false }) => {
  const stats = useMemo(() => {
    const emptyStats = {
      avgWin: 0, avgLoss: 0, profitFactor: 0,
      mostProfitableDay: null as [string, number] | null,
      leastProfitableDay: null as [string, number] | null,
      mostUsedStrategy: null as [string, number] | null,
      mostUsedStrategyCount: 0,
      mostProfitableStrategy: null as [string, number] | null,
      avgWinDuration: 0, avgLossDuration: 0,
      longestDuration: 0, shortestDuration: Infinity, avgDuration: 0
    };

    if (trades.length === 0) return { ...emptyStats, shortestDuration: 0 };

    let winSum = 0, winCount = 0, lossSum = 0, lossCount = 0;
    let winDurationSum = 0, winDurationCount = 0;
    let lossDurationSum = 0, lossDurationCount = 0;
    let totalDurationSum = 0, totalDurationCount = 0;
    let maxDur = 0;
    let minDur = Infinity;

    const dayMap = new Map<string, number>();
    const strategyCountMap = new Map<string, number>();
    const strategyPnlMap = new Map<string, number>();

    trades.forEach(t => {
      const netPnl = t.pnl - (t.fee || 0);
      
      if (netPnl > 0) { winSum += netPnl; winCount++; }
      else if (netPnl < 0) { lossSum += netPnl; lossCount++; }
      
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + netPnl);
      
      const strat = t.strategy || 'Uncategorized';
      strategyCountMap.set(strat, (strategyCountMap.get(strat) || 0) + 1);
      strategyPnlMap.set(strat, (strategyPnlMap.get(strat) || 0) + netPnl);

      if (t.entryTime && t.exitTime) {
        const start = getSeconds(t.entryTime);
        const end = getSeconds(t.exitTime);
        let duration = end - start;
        if (duration < 0) duration += 86400; 

        if (duration > maxDur) maxDur = duration;
        if (duration < minDur && duration > 0) minDur = duration;
        totalDurationSum += duration;
        totalDurationCount++;

        if (netPnl > 0) { winDurationSum += duration; winDurationCount++; }
        else if (netPnl < 0) { lossDurationSum += duration; lossDurationCount++; }
      }
    });

    const dayEntries = Array.from(dayMap.entries());
    const strategyEntries = Array.from(strategyCountMap.entries());
    const strategyPnlEntries = Array.from(strategyPnlMap.entries());

    const mostUsed = strategyEntries.length > 0 ? strategyEntries.sort((a,b) => b[1] - a[1])[0] : null;

    return {
      avgWin: winCount > 0 ? winSum / winCount : 0,
      avgLoss: lossCount > 0 ? lossSum / lossCount : 0,
      profitFactor: Math.abs(lossSum) > 0 ? winSum / Math.abs(lossSum) : (winSum > 0 ? 3.0 : 0),
      mostProfitableDay: dayEntries.length > 0 ? dayEntries.sort((a,b) => b[1] - a[1])[0] : null,
      leastProfitableDay: dayEntries.length > 0 ? dayEntries.sort((a,b) => a[1] - b[1])[0] : null,
      mostUsedStrategy: mostUsed,
      mostUsedStrategyCount: mostUsed ? mostUsed[1] : 0,
      mostProfitableStrategy: strategyPnlEntries.length > 0 ? strategyPnlEntries.sort((a,b) => b[1] - a[1])[0] : null,
      avgWinDuration: winDurationCount > 0 ? winDurationSum / winDurationCount : 0,
      avgLossDuration: lossDurationCount > 0 ? lossDurationSum / lossDurationCount : 0,
      longestDuration: maxDur,
      shortestDuration: minDur === Infinity ? 0 : minDur,
      avgDuration: totalDurationCount > 0 ? totalDurationSum / totalDurationCount : 0
    };
  }, [trades]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Locked height: 25% - 5px */}
      <StatCard 
        title="Net Performance" 
        loading={loading} 
        className="flex-none"
        style={{ height: 'calc(25% - 5px)' }}
      >
        <div className="flex-1 flex flex-col justify-center gap-2">
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Avg Win</span>
                <span className="text-[11px] font-bold text-emerald-400 font-mono">+${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><TrendingDown size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Avg Loss</span>
                <span className="text-[11px] font-bold text-red-400 font-mono">-${Math.abs(stats.avgLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-white/10 text-white/60"><Award size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Profit Factor</span>
                <span className="text-[11px] font-bold text-white font-mono">{stats.profitFactor.toFixed(2)}</span>
              </div>
           </div>
        </div>
      </StatCard>

      {/* Locked height: 25% - 40px (Requested decrease) */}
      <StatCard 
        title="Best & Worst" 
        loading={loading} 
        className="flex-none"
        style={{ height: 'calc(25% - 40px)' }}
      >
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Best Day</span>
                <span className="text-[11px] font-bold text-emerald-400 font-mono">
                  {stats.mostProfitableDay ? `+$${stats.mostProfitableDay[1].toLocaleString()}` : '---'}
                </span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><TrendingDown size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Worst Day</span>
                <span className="text-[11px] font-bold text-red-400 font-mono">
                  {stats.leastProfitableDay ? `-$${Math.abs(stats.leastProfitableDay[1]).toLocaleString()}` : '---'}
                </span>
              </div>
           </div>
        </div>
      </StatCard>

      {/* Flexible height card */}
      <StatCard title="Trade Durations" loading={loading} className="flex-1">
        <div className="flex-1 flex flex-col justify-center gap-2">
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Maximize2 size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Longest</span>
                <span className="text-[11px] font-bold text-white uppercase font-mono">{formatDuration(stats.longestDuration)}</span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Minimize2 size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Shortest</span>
                <span className="text-[11px] font-bold text-white uppercase font-mono">{formatDuration(stats.shortestDuration)}</span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400"><History size={14} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Average</span>
                <span className="text-[11px] font-bold text-white uppercase font-mono">{formatDuration(stats.avgDuration)}</span>
              </div>
           </div>
        </div>
      </StatCard>

      {/* Locked height: matches Best & Worst */}
      <StatCard 
        title="Strategy" 
        loading={loading} 
        className="flex-none"
        style={{ height: 'calc(25% - 40px)' }}
      >
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Zap size={14} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Most Profitable</span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase truncate">
                  {stats.mostProfitableStrategy ? stats.mostProfitableStrategy[0] : 'None'}
                </span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-white/10 text-white/60"><Target size={14} /></div>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mb-0.5">Most Used</span>
                <span className="text-[11px] font-bold text-white uppercase truncate">
                  {stats.mostUsedStrategy ? stats.mostUsedStrategy[0] : 'None'}
                </span>
              </div>
           </div>
        </div>
      </StatCard>
    </div>
  );
};

export default TimeAnalysis;