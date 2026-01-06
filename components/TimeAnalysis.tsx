import React, { useMemo } from 'react';
import { Trade } from '../types';
import { TrendingUp, TrendingDown, Target, Zap, Clock, Timer, Award } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface TimeAnalysisProps {
  trades: Trade[];
  loading?: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const StatCard: React.FC<{ title: string; children?: React.ReactNode; className?: string; loading?: boolean }> = ({ title, children, className, loading = false }) => (
  <div className={cn(
    "relative w-full overflow-hidden bg-white/[0.03] rounded-[25px] p-5 transition-all duration-500 border border-white/5 flex-1",
    className
  )}>
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
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
      mostProfitableStrategy: null as [string, number] | null,
      avgWinDuration: 0, avgLossDuration: 0
    };

    if (trades.length === 0) return emptyStats;

    let winSum = 0, winCount = 0, lossSum = 0, lossCount = 0;
    let winDurationSum = 0, winDurationCount = 0;
    let lossDurationSum = 0, lossDurationCount = 0;

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

        if (netPnl > 0) { winDurationSum += duration; winDurationCount++; }
        else if (netPnl < 0) { lossDurationSum += duration; lossDurationCount++; }
      }
    });

    const dayEntries = Array.from(dayMap.entries());
    const strategyEntries = Array.from(strategyCountMap.entries());
    const strategyPnlEntries = Array.from(strategyPnlMap.entries());

    return {
      avgWin: winCount > 0 ? winSum / winCount : 0,
      avgLoss: lossCount > 0 ? lossSum / lossCount : 0,
      profitFactor: Math.abs(lossSum) > 0 ? winSum / Math.abs(lossSum) : (winSum > 0 ? 3.0 : 0),
      mostProfitableDay: dayEntries.length > 0 ? dayEntries.sort((a,b) => b[1] - a[1])[0] : null,
      leastProfitableDay: dayEntries.length > 0 ? dayEntries.sort((a,b) => a[1] - b[1])[0] : null,
      mostUsedStrategy: strategyEntries.length > 0 ? strategyEntries.sort((a,b) => b[1] - a[1])[0] : null,
      mostProfitableStrategy: strategyPnlEntries.length > 0 ? strategyPnlEntries.sort((a,b) => b[1] - a[1])[0] : null,
      avgWinDuration: winDurationCount > 0 ? winDurationSum / winDurationCount : 0,
      avgLossDuration: lossDurationCount > 0 ? lossDurationSum / lossDurationCount : 0
    };
  }, [trades]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <StatCard title="Net Performance" loading={loading}>
        <div className="flex-1 flex flex-col justify-center gap-5">
           <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Avg Win</span>
                <span className="text-xl font-mono font-bold text-emerald-400">+${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Avg Loss</span>
                <span className="text-xl font-mono font-bold text-red-400">-${Math.abs(stats.avgLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
           </div>
           <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/5 text-white/40"><Award size={14} /></div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Profit Factor</span>
              </div>
              <span className="text-lg font-mono font-bold text-white">{stats.profitFactor.toFixed(2)}</span>
           </div>
        </div>
      </StatCard>

      <StatCard title="Session Analytics" loading={loading}>
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp size={16} /></div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Best Day</span>
            </div>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {stats.mostProfitableDay ? `+$${stats.mostProfitableDay[1].toLocaleString()}` : '---'}
            </span>
          </div>
          <div className="bg-black/20 rounded-2xl p-3 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><TrendingDown size={16} /></div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Worst Day</span>
            </div>
            <span className="text-sm font-mono font-bold text-red-400">
              {stats.leastProfitableDay ? `-$${Math.abs(stats.leastProfitableDay[1]).toLocaleString()}` : '---'}
            </span>
          </div>
        </div>
      </StatCard>

      <StatCard title="Duration Analysis" loading={loading}>
        <div className="flex-1 flex flex-col justify-center gap-4">
           <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold text-white/20 uppercase tracking-widest">
                <span>Hold Time (Wins)</span>
                <span className="text-emerald-400/50 font-mono">{formatDuration(stats.avgWinDuration)}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: stats.avgWinDuration > 0 ? '70%' : '0%' }} />
              </div>
           </div>
           <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold text-white/20 uppercase tracking-widest">
                <span>Hold Time (Loss)</span>
                <span className="text-red-400/50 font-mono">{formatDuration(stats.avgLossDuration)}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: stats.avgLossDuration > 0 ? '45%' : '0%' }} />
              </div>
           </div>
        </div>
      </StatCard>

      <StatCard title="Strategy Alpha" loading={loading}>
        <div className="flex-1 flex flex-col justify-center gap-4">
           <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-white/10 text-white/60"><Zap size={16} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Main Engine</span>
                <span className="text-[11px] font-bold text-white uppercase truncate max-w-[120px]">
                  {stats.mostUsedStrategy ? stats.mostUsedStrategy[0] : 'None'}
                </span>
              </div>
           </div>
           <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-2 rounded-xl bg-xgiha-accent/10 text-xgiha-accent"><Target size={16} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Peak Alpha</span>
                <span className="text-[11px] font-bold text-white uppercase truncate max-w-[120px]">
                  {stats.mostProfitableStrategy ? stats.mostProfitableStrategy[0] : 'None'}
                </span>
              </div>
           </div>
        </div>
      </StatCard>
    </div>
  );
};

export default TimeAnalysis;