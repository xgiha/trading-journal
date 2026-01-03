import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trade } from '../types';
import { Skeleton } from './Skeleton';

interface GrowthChartProps {
  trades: Trade[];
  className?: string;
  loading?: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

const GrowthChartComponent: React.FC<GrowthChartProps> = ({ trades, className, loading = false }) => {
  const chartData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedTrades.forEach(t => {
      dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.pnl);
    });
    let cumulative = 0;
    const sortedDates = Array.from(dailyMap.keys()).sort();
    const initialPoint = { name: 'Initial', pnl: 0 };
    const points = sortedDates.map(date => {
      cumulative += dailyMap.get(date)!;
      const d = new Date(date);
      return {
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: cumulative
      };
    });
    return [initialPoint, ...points];
  }, [trades]);

  const currentPnl = chartData[chartData.length - 1]?.pnl || 0;

  return (
    <div className={cn("group relative w-full h-full p-6 rounded-[25px] bg-white/[0.03] transition-all duration-500 flex flex-col justify-between overflow-hidden", className)}>
      <div className="flex items-center justify-between z-30 shrink-0 mb-4">
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
          )}
          {loading ? (
            <Skeleton className="h-3 w-20 rounded-full" />
          ) : (
            <span className="text-[11px] font-bold text-xgiha-muted tracking-[0.2em] uppercase">Growth Chart</span>
          )}
        </div>
        {loading ? (
            <Skeleton className="h-6 w-32 rounded-lg" />
        ) : (
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-white">${Math.abs(currentPnl).toLocaleString()}</span>
                <span className="text-[10px] font-bold text-xgiha-muted opacity-60 uppercase tracking-widest">Equity</span>
            </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-30 min-h-0">
        {loading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="white" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="white" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1 }} tickLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }} tick={{ fill: 'rgba(161, 161, 170, 0.4)', fontSize: 9, fontWeight: 600 }} dy={10} interval="preserveStart" minTickGap={30} />
                <YAxis axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1 }} tickLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }} tick={{ fill: 'rgba(161, 161, 170, 0.4)', fontSize: 9, fontWeight: 600 }} tickFormatter={(val) => `$${val}`} domain={[0, 'auto']} width={40} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ fontSize: '10px', color: '#fff' }} labelStyle={{ fontSize: '9px', color: '#666' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Total PnL']} />
                <Area type="monotone" dataKey="pnl" stroke="white" strokeWidth={2} fill="url(#equityGradient)" dot={false} activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }} animationDuration={800} isAnimationActive={true} />
            </AreaChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const GrowthChart = React.memo(GrowthChartComponent);
export default GrowthChart;