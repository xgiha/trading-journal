
import React, { useMemo } from 'react';
import { Trade } from '../types';
import { Award, TrendingUp, TrendingDown, Target, Zap, Clock, Timer, History } from 'lucide-react';

interface TimeAnalysisProps {
  trades: Trade[];
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const StatCard: React.FC<{ title: string; children?: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={cn(
    "relative w-full overflow-hidden bg-white/[0.03] rounded-[25px] p-5 transition-all duration-500 border border-white/5",
    className
  )}>
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <span className="text-[10px] font-bold text-xgiha-muted tracking-[0.2em] uppercase">{title}</span>
      </div>
      {children}
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
  if (seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ trades }) => {
  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    let bestTrade = trades[0];
    let worstTrade = trades[0];
    let winSum = 0, winCount = 0;
    let lossSum = 0, lossCount = 0;
    
    let totalDuration = 0, totalDurationCount = 0;
    let winDurationSum = 0;
    let lossDurationSum = 0;

    const dayMap = new Map<string, number>();
    const strategyCount = new Map<string, number>();
    const strategyPnl = new Map<string, number>();

    trades.forEach(t => {
      // P&L Stats
      if (t.pnl > bestTrade.pnl) bestTrade = t;
      if (t.pnl < worstTrade.pnl) worstTrade = t;
      if (t.pnl > 0) { winSum += t.pnl; winCount++; }
      else if (t.pnl < 0) { lossSum += t.pnl; lossCount++; }
      
      dayMap.set(t.date, (dayMap.get(t.date) || 0) + t.pnl);
      
      const strat = t.strategy || 'Uncategorized';
      strategyCount.set(strat, (strategyCount.get(strat) || 0) + 1);
      strategyPnl.set(strat, (strategyPnl.get(strat) || 0) + t.pnl);

      // Duration Stats
      if (t.entryTime && t.exitTime) {
        const start = getSeconds(t.entryTime);
        const end = getSeconds(t.exitTime);
        let duration = end - start;
        // Handle potential cross-midnight (simple logic)
        if (duration < 0) duration += 86400; 

        totalDuration += duration;
        totalDurationCount++;
        if (t.pnl > 0) winDurationSum += duration;
        else if (t.pnl < 0) lossDurationSum += duration;
      }
    });

    const avgWin = winCount > 0 ? winSum / winCount : 0;
    const avgLoss = lossCount > 0 ? lossSum / lossCount : 0;
    const profitFactor = Math.abs(lossSum) > 0 ? winSum / Math.abs(lossSum) : (winSum > 0 ? 3.0 : 0);

    const dayEntries = Array.from(dayMap.entries());
    const mostProfitableDay = dayEntries.length > 0 ? dayEntries.sort((a,b) => b[1] - a[1])[0] : null;
    const leastProfitableDay = dayEntries.length > 0 ? dayEntries.sort((a,b) => a[1] - b[1])[0] : null;
    
    const strategyEntries = Array.from(strategyCount.entries());
    const mostUsedStrategy = strategyEntries.length > 0 ? strategyEntries.sort((a,b) => b[1] - a[1])[0] : null;
    const strategyPnlEntries = Array.from(strategyPnl.entries());
    const mostProfitableStrategy = strategyPnlEntries.length > 0 ? strategyPnlEntries.sort((a,b) => b[1] - a[1])[0] : null;

    const avgDuration = totalDurationCount > 0 ? totalDuration / totalDurationCount : 0;
    const avgWinDuration = winCount > 0 ? winDurationSum / winCount : 0;
    const avgLossDuration = lossCount > 0 ? lossDurationSum / lossCount : 0;

    return {
      bestTrade, worstTrade, avgWin, avgLoss, profitFactor,
      mostProfitableDay, leastProfitableDay,
      mostUsedStrategy, mostProfitableStrategy,
      avgDuration, avgWinDuration, avgLossDuration
    };
  }, [trades]);

  if (!stats) return (
    <div className="flex flex-col gap-4 h-full">
      {[1, 2, 3, 4].map(i => (
        <StatCard key={i} title="Pending Data" className="flex-1">
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
            <Award size={24} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Awaiting Trades</span>
          </div>
        </StatCard>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full h-full pr-1">
      {/* PERFORMANCE CARD */}
      <StatCard title="Trade Performance">
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

      {/* BEST & WORST CARD */}
      <StatCard title="Best & Worst">
        <div className="flex flex-col gap-3">
           <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-xgiha-muted/40 uppercase tracking-widest mb-1">Best Day</span>
                 <span className="text-[10px] font-bold text-white uppercase">{stats.mostProfitableDay?.[0]}</span>
              </div>
              <span className="text-sm font-pixel text-emerald-400">+${stats.mostProfitableDay?.[1].toFixed(0)}</span>
           </div>
           <div className="flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-xgiha-muted/40 uppercase tracking-widest mb-1">Worst Day</span>
                 <span className="text-[10px] font-bold text-white uppercase">{stats.leastProfitableDay?.[0]}</span>
              </div>
              <span className="text-sm font-pixel text-red-400">-${Math.abs(stats.leastProfitableDay?.[1] || 0).toFixed(0)}</span>
           </div>
        </div>
      </StatCard>

      {/* STRATEGY CARD */}
      <StatCard title="Strategy">
        <div className="flex flex-col gap-4">
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <Target size={12} className="text-xgiha-accent" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-widest">Top Strategy</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2">
                 <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{stats.mostProfitableStrategy?.[0]}</span>
                 <span className="text-[10px] font-pixel text-emerald-400">+${stats.mostProfitableStrategy?.[1].toFixed(0)}</span>
              </div>
           </div>
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <Zap size={12} className="text-yellow-500" />
                 <span className="text-[9px] font-bold text-xgiha-muted uppercase tracking-widest">Volume Leader</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2">
                 <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{stats.mostUsedStrategy?.[0]}</span>
                 <span className="text-[10px] font-bold text-xgiha-accent">{stats.mostUsedStrategy?.[1]} Trades</span>
              </div>
           </div>
        </div>
      </StatCard>

      {/* TIME ANALYSIS CARD */}
      <StatCard title="Time Analysis" className="flex-1">
        <div className="flex flex-col gap-3">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><History size={14} /></div>
                 <span className="text-[10px] font-bold text-xgiha-muted uppercase tracking-widest">Avg Duration</span>
              </div>
              <span className="font-pixel text-white text-xs">{formatDuration(stats.avgDuration)}</span>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Clock size={14} /></div>
                 <span className="text-[10px] font-bold text-xgiha-muted uppercase tracking-widest">Avg Win Time</span>
              </div>
              <span className="font-pixel text-emerald-400 text-xs">{formatDuration(stats.avgWinDuration)}</span>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><Timer size={14} /></div>
                 <span className="text-[10px] font-bold text-xgiha-muted uppercase tracking-widest">Avg Loss Time</span>
              </div>
              <span className="font-pixel text-red-400 text-xs">{formatDuration(stats.avgLossDuration)}</span>
           </div>
        </div>
      </StatCard>
    </div>
  );
};

export default TimeAnalysis;
