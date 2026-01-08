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
      "relative w-full overflow-hidden bg-white/[0.03] rounded-[25px] p-4 transition-all duration-500 border border-white/5 flex flex-col min-h-0",
      className
    )}
    style={style}
  >
    <div className="relative z-30 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <span className="text-[11px] font-bold text-xgiha-muted tracking-[0.2em] uppercase">{loading ? 'Loading...' : title}</span>
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

const MetricRow: React.FC<{ icon: React.ReactNode, iconColor: string, label: string, value: string, valueColor?: string }> = ({ icon, iconColor, label, value, valueColor = "text-white" }) => (
  <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 flex-1 min-h-0">
    <div className={cn("p-2 rounded-xl shrink-0 flex items-center justify-center", iconColor)}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div className="flex flex-col min-w-0 justify-center">
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className={cn("text-[13px] font-bold font-mono truncate leading-none", valueColor)}>{value}</span>
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
      {/* Net Performance: flex-3 */}
      <StatCard 
        title="Net Performance" 
        loading={loading} 
        className="flex-[3] min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center gap-2">
           <MetricRow icon={<TrendingUp />} iconColor="bg-emerald-500/10 text-emerald-500" label="Avg Win" value={`+$${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} valueColor="text-emerald-400" />
           <MetricRow icon={<TrendingDown />} iconColor="bg-red-500/10 text-red-500" label="Avg Loss" value={`-$${Math.abs(stats.avgLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} valueColor="text-red-400" />
           <MetricRow icon={<Award />} iconColor="bg-white/10 text-white/60" label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
        </div>
      </StatCard>

      {/* Best & Worst: flex-2 */}
      <StatCard 
        title="Best & Worst" 
        loading={loading} 
        className="flex-[2] min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center gap-2">
           <MetricRow icon={<TrendingUp />} iconColor="bg-emerald-500/10 text-emerald-500" label="Best Day" value={stats.mostProfitableDay ? `+$${stats.mostProfitableDay[1].toLocaleString()}` : '---'} valueColor="text-emerald-400" />
           <MetricRow icon={<TrendingDown />} iconColor="bg-red-500/10 text-red-500" label="Worst Day" value={stats.leastProfitableDay ? `-$${Math.abs(stats.leastProfitableDay[1]).toLocaleString()}` : '---'} valueColor="text-red-400" />
        </div>
      </StatCard>

      {/* Trade Durations: flex-3 */}
      <StatCard title="Trade Durations" loading={loading} className="flex-[3] min-h-0">
        <div className="flex-1 flex flex-col justify-center gap-2">
           <MetricRow icon={<Maximize2 />} iconColor="bg-blue-500/10 text-blue-400" label="Longest" value={formatDuration(stats.longestDuration)} />
           <MetricRow icon={<Minimize2 />} iconColor="bg-purple-500/10 text-purple-400" label="Shortest" value={formatDuration(stats.shortestDuration)} />
           <MetricRow icon={<History />} iconColor="bg-orange-500/10 text-orange-400" label="Average" value={formatDuration(stats.avgDuration)} />
        </div>
      </StatCard>

      {/* Strategy: flex-2 */}
      <StatCard 
        title="Strategy" 
        loading={loading} 
        className="flex-[2] min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center gap-2">
           <MetricRow icon={<Zap />} iconColor="bg-emerald-500/10 text-emerald-500" label="Most Profitable" value={stats.mostProfitableStrategy ? stats.mostProfitableStrategy[0] : 'None'} valueColor="text-emerald-400" />
           <MetricRow icon={<Target />} iconColor="bg-white/10 text-white/60" label="Most Used" value={stats.mostUsedStrategy ? stats.mostUsedStrategy[0] : 'None'} />
        </div>
      </StatCard>
    </div>
  );
};

export default TimeAnalysis;