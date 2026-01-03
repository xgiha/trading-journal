import React, { useMemo } from 'react';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Target, Zap, Clock, Timer, History } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface TimeAnalysisProps {
  trades: Trade[];
  loading?: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const StatCard: React.FC<{ title: string; children?: React.ReactNode; className?: string; loading?: boolean }> = ({ title, children, className, loading = false }) => (
  <div className={cn(
    "relative w-full overflow-hidden bg-white/[0.03] rounded-[25px] p-5 transition-all duration-500 border border-white/5",
    className
  )}>
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        {loading ? (
          <Skeleton className="w-1.5 h-1.5 rounded-full" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        )}
        {loading ? (
            <Skeleton className="h-3 w-20 rounded-full" />
        ) : (
            <span className="text-[10px] font-bold text-xgiha-muted tracking-[0.2em] uppercase">{title}</span>
        )}
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full rounded-xl" />
          <Skeleton className="h-8 w-3/4 rounded-xl" />
        </div>
      ) : (
        children
      )}
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
  if (s <= 0) return '0h 0m 0s';
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  
  return `${hrs}h ${mins}m ${secs}s`;
};

const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ trades, loading = false }) => {
  const stats = useMemo(() => {
    const emptyStats = {
      bestTrade: null,
      worstTrade: null,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      mostProfitableDay: null as [string, number] | null,
      leastProfitableDay: null as [string, number] | null,
      mostUsedStrategy: null as [string, number] | null,
      mostUsedStrategyCount: 0,
      mostProfitableStrategy: null as [string, number] | null,
      avgDuration: 0,
      avgWinDuration: 0,
      avgLossDuration: 0
    };

    if (trades.length === 0) return emptyStats;

    let bestTrade = trades[0];
    let worstTrade = trades[0];
    let winSum = 0, winCount = 0;
    let lossSum = 0, lossCount = 0;
    
    let totalDuration = 0, totalDurationCount = 0;
    let winDurationSum = 0, winDurationCount = 0;
    let lossDurationSum = 0, lossDurationCount = 0;

    const dayMap = new Map<string, number>();
    const strategyCountMap = new Map<string, number>();
    const strategyPnlMap = new Map<string, number>();

    trades.forEach(t => {
      if (t.pnl > (bestTrade?.pnl || -Infinity)) bestTrade = t;
      if (t.pnl < (worstTrade?.pnl || Infinity)) worstTrade = t;
      if (t.pnl > 0) { winSum += t.pnl; winCount++; }
      else if (t.pnl < 0) { lossSum += t.pnl; lossCount++; }
      
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.pnl);
      
      const strat = t.strategy || 'Uncategorized';
      strategyCountMap.set(strat, (strategyCountMap.get(strat) || 0) + 1);
      strategyPnlMap.set(strat, (strategyPnlMap.get(strat) || 0) + t.pnl);

      if (t.entryTime && t.exitTime) {
        const start = getSeconds(t.entryTime);
        const end = getSeconds(t.exitTime);
        let duration = end - start;
        if (duration < 0) duration += 86400; 

        totalDuration += duration;
        totalDurationCount++;
        if (t.pnl > 0) {
          winDurationSum += duration;
          winDurationCount++;
        } else if (t.pnl < 0) {
          lossDurationSum += duration;
          lossDurationCount++;
        }
      }
    });

    const avgWin = winCount > 0 ? winSum / winCount : 0;
    const avgLoss = lossCount > 0 ? lossSum / lossCount : 0;
    const profitFactor = Math.abs(lossSum) > 0 ? winSum / Math.abs(lossSum) : (winSum > 0 ? 3.0 : 0);

    const dayEntries = Array.from(dayMap.entries());
    const mostProfitableDay = dayEntries.length > 0 ? dayEntries.sort((a,b) => b[1] - a[1])[0] : null;
    const leastProfitableDay = dayEntries.length > 0 ? dayEntries.sort((a,b) => a[1] - b[1])[0] : null;
    
    const strategyEntries = Array.from(strategyCountMap.entries());
    const mostUsedStrategyEntry = strategyEntries.length > 0 ? strategyEntries.sort((a,b) => b[1] - a[1])[0] : null;
    const strategyPnlEntries = Array.from(strategyPnlMap.entries());
    const mostProfitableStrategyEntry = strategyPnlEntries.length > 0 ? strategyPnlEntries.sort((a,b) => b[1] - a[1])[0] : null;

    const avgDuration = totalDurationCount > 0 ? totalDuration / totalDurationCount : 0;
    const avgWinDuration = winDurationCount > 0 ? winDurationSum / winDurationCount : 0;
    const avgLossDuration = lossDurationCount > 0 ? lossDurationSum / lossDurationCount : 0;

    return {
      bestTrade, worstTrade, avgWin, avgLoss, profitFactor,
      mostProfitableDay, leastProfitableDay,
      mostUsedStrategy: mostUsedStrategyEntry ? [mostUsedStrategyEntry[0], mostUsedStrategyEntry[1]] as [string, number] : null,
      mostUsedStrategyCount: mostUsedStrategyEntry ? mostUsedStrategyEntry[1] : 0,
      mostProfitableStrategy: mostProfitableStrategyEntry ? [mostProfitableStrategyEntry[0], mostProfitableStrategyEntry[1]] as [string, number] : null,
      avgDuration, avgWinDuration, avgLossDuration
    };
  }, [trades]);

  return (
    <div className="flex flex-col gap-4 w-full h-full pr-1">
      <StatCard title="Trade Performance" loading={loading}>
        <div className="flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp size={14} /></div>
                 <span className="text-[11px] font-bold text-xgiha-muted uppercase">Avg Win</span>
              </div>
              <span className="font-pixel text-emerald-400 text-sm">${stats.avgWin.toFixed(0)}</span>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><TrendingDown size={14} /></div>
                 <span className="text-[11px] font-bold text-xgiha-muted uppercase">Avg Loss</span>
              </div>
              <span className="font-pixel text-red-400 text-sm">-${Math.abs(stats.avgLoss).toFixed(0)}</span>
           </div>
           <div className="h-px bg-white/5 w-full my-1"></div>
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Profit Factor</span>
              <span className="text-xl font-pixel text-white">{stats.profitFactor.toFixed(2)}</span>
           </div>
        </div>
      </StatCard>

      <StatCard title="Best & Worst" loading={loading}>
        <div className="flex flex-col gap-3">
           <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-xgiha-muted/40 uppercase tracking-widest mb-1">Best Day</span>
                 <span className="text-[10px] font-bold text-white uppercase">{stats.mostProfitableDay?.[0] || '---'}</span>
              </div>
              <span className="text-sm font-pixel text-emerald-400">{stats.mostProfitableDay ? `+$${stats.mostProfitableDay[1].toFixed(0)}` : '$0'}</span>
           </div>
           <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-xgiha-muted/40 uppercase tracking-widest mb-1">Worst Day</span>
                 <span className="text-[10px] font-bold text-white uppercase">{stats.leastProfitableDay?.[0] || '---'}</span>
              </div>
              <span className="text-sm font-pixel text-red-400">{stats.leastProfitableDay ? `-$${Math.abs(stats.leastProfitableDay[1]).toFixed(0)}` : '$0'}</span>
           </div>
        </div>
      </StatCard>

      <StatCard title="Strategy" loading={loading}>
        <div className="flex flex-col gap-4">
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <Target size={12} className="text-xgiha-accent" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-widest">Top Strategy</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2">
                 <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{stats.mostProfitableStrategy?.[0] || '---'}</span>
                 <span className="text-[10px] font-pixel text-emerald-400">{stats.mostProfitableStrategy ? `+$${stats.mostProfitableStrategy[1].toFixed(0)}` : '$0'}</span>
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <Zap size={12} className="text-yellow-500" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-widest">Volume Leader</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2">
                 <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{stats.mostUsedStrategy?.[0] || '---'}</span>
                 <span className="text-[10px] font-bold text-xgiha-accent">{stats.mostUsedStrategyCount} Trades</span>
              </div>
           </div>
        </div>
      </StatCard>

      <StatCard title="Time Analysis" className="flex-1" loading={loading}>
        <div className="flex flex-col gap-2">
           <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                 <History size={11} className="text-blue-400" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-[0.15em]">Avg Trade Duration</span>
              </div>
              <span className="font-pixel text-white text-[11px] leading-tight">
                {formatDuration(stats.avgDuration)}
              </span>
           </div>

           <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                 <Clock size={11} className="text-emerald-400" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-[0.15em]">Avg Win Duration</span>
              </div>
              <span className="font-pixel text-emerald-400 text-[11px] leading-tight">
                {formatDuration(stats.avgWinDuration)}
              </span>
           </div>

           <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                 <Timer size={11} className="text-red-400" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-[0.15em]">Avg Loss Duration</span>
              </div>
              <span className="font-pixel text-red-400 text-[11px] leading-tight">
                {formatDuration(stats.avgLossDuration)}
              </span>
           </div>
        </div>
      </StatCard>
    </div>
  );
};

export default TimeAnalysis;