
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Settings } from 'lucide-react';
import { Trade } from '../types';

interface InsightsChartProps {
  trades: Trade[];
}

type TimeFilter = '1D' | '7D' | '3M' | '6M' | '1Y';

const InsightsChart: React.FC<InsightsChartProps> = ({ trades }) => {
  const [filter, setFilter] = useState<TimeFilter>('6M');

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (filter) {
      case '1D': startDate.setHours(0, 0, 0, 0); break;
      case '7D': startDate.setDate(now.getDate() - 7); break;
      case '3M': startDate.setMonth(now.getMonth() - 3); break;
      case '6M': startDate.setMonth(now.getMonth() - 6); break;
      case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
    }

    const filteredTrades = trades
      .filter(t => new Date(t.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filter === '1D') {
      // For 1D, aggregate today's trades by time
      let cumulative = 0;
      return filteredTrades.map(t => {
        cumulative += t.pnl;
        return {
          name: t.entryTime.slice(0, 5),
          pnl: cumulative
        };
      });
    }

    // For other filters, group and aggregate by date
    const dailyMap = new Map<string, number>();
    filteredTrades.forEach(t => {
      dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.pnl);
    });

    let cumulative = 0;
    const sortedDates = Array.from(dailyMap.keys()).sort();
    
    return sortedDates.map(date => {
      cumulative += dailyMap.get(date)!;
      const d = new Date(date);
      return {
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: cumulative
      };
    });
  }, [trades, filter]);

  // Use dummy data if no trades are present in the filtered range
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Jan', pnl: 24000 },
    { name: 'Feb', pnl: 28000 },
    { name: 'Mar', pnl: 35000 },
    { name: 'Apr', pnl: 32000 },
    { name: 'May', pnl: 44000 },
  ];

  const currentPnl = displayData[displayData.length - 1]?.pnl || 0;
  const initialPnl = displayData[0]?.pnl || 0;
  const diff = currentPnl - initialPnl;
  const pct = initialPnl !== 0 ? (diff / Math.abs(initialPnl)) * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col bg-black text-white p-4 md:p-6 rounded-3xl border border-white/5 relative selection:bg-white/10 overflow-hidden">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">${currentPnl.toLocaleString()}</h2>
            <div className="flex items-center gap-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {diff >= 0 ? '↗' : '↘'} {Math.abs(pct).toFixed(1)}%
              </span>
              <span className={`text-[9px] font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {diff >= 0 ? '+' : ''}${Math.abs(diff).toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-[#555] font-medium uppercase tracking-widest">Growth Analytics</p>
        </div>

        <button className="flex items-center gap-1.5 bg-[#111] hover:bg-[#222] text-[#aaa] hover:text-white px-3 py-1.5 rounded-lg transition-all border border-white/5 text-[10px] font-bold uppercase tracking-wider">
          <Settings size={12} className="text-blue-400" />
          Insights
        </button>
      </div>

      {/* Time Filter Pills */}
      <div className="flex gap-1 mb-4">
        {(['1D', '7D', '3M', '6M', '1Y'] as TimeFilter[]).map((label) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              filter === label ? 'bg-white/10 text-white shadow-inner' : 'text-[#444] hover:text-[#777]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart Section */}
      <div className="flex-1 w-full relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#edfabd" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#edfabd" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#333', fontSize: 9, fontWeight: 'bold' }}
              dy={5}
              minTickGap={20}
            />
            <YAxis 
              hide={true}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', padding: '10px' }}
              itemStyle={{ fontSize: '11px', color: '#edfabd' }}
              labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
              formatter={(val: number) => [`$${val.toLocaleString()}`, 'Equity']}
            />
            <Area 
              type="monotone" 
              dataKey="pnl" 
              stroke="#edfabd" 
              strokeWidth={3} 
              fill="url(#lineGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#edfabd', stroke: '#000', strokeWidth: 2 }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="flex gap-4 mt-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#edfabd] shadow-[0_0_8px_#edfabd]"></div>
          <span className="text-[9px] text-[#444] font-bold uppercase tracking-wider">Equity Curve</span>
        </div>
      </div>
    </div>
  );
};

export default InsightsChart;
