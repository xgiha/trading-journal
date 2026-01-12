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
      // Calculate Net P&L for each trade
      const netPnl = t.pnl - (t.fee || 0);
      dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + netPnl);
    });
    
    let cumulative = 0;
    const sortedDates = Array.from(dailyMap.keys()).sort();
    
    if (sortedDates.length === 0) {
      return [{ name: 'Initial', pnl: 0 }];
    }

    const initialPoint = { name: 'Initial', pnl: 0 };
    const points = sortedDates.map(date => {
      cumulative += dailyMap.get(date)!;
      const d = new Date(date + 'T00:00:00');
      return {
        name: d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        pnl: cumulative
      };
    });
    return [initialPoint, ...points];
  }, [trades]);

  const currentPnl = chartData[chartData.length - 1]?.pnl || 0;

  return (
    <div className={cn("group relative w-full h-full p-6 rounded-[25px] bg-white/[0.03] transition-all duration-500 flex flex-col justify-between overflow-hidden outline-none focus:outline-none", className)}>
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
                <span className={`font-pixel text-xl tracking-tighter tabular-nums ${currentPnl >= 0 ? 'text-white' : 'text-red-400'}`}>${Math.abs(currentPnl).toLocaleString()}</span>
            </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-30 min-h-0 outline-none focus:outline-none">
        {loading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
        ) : (
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 25 }} 
              style={{ outline: 'none' }}
              tabIndex={-1}
            >
                <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="white" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="white" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1.5 }} 
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
                  dy={10} 
                  interval="preserveStart" 
                  minTickGap={20} 
                />
                <YAxis 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1.5 }} 
                  tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
                  tickFormatter={(val) => `$${val}`} 
                  domain={['auto', 'auto']} 
                  width={45} 
                />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px' }} itemStyle={{ fontSize: '10px', color: '#fff' }} labelStyle={{ fontSize: '9px', color: '#666' }} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Equity']} />
                <Area type="monotone" dataKey="pnl" stroke="white" strokeWidth={3} fill="url(#equityGradient)" dot={false} activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }} animationDuration={800} isAnimationActive={true} />
            </AreaChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const GrowthChart = React.memo(GrowthChartComponent);
export default GrowthChart;