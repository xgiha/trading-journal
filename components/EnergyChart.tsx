import React from 'react';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface EnergyChartProps {
  data?: { 
    date: string; 
    price: number; 
    normal?: number; 
    news?: number; 
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-nexus-muted font-mono mb-2 border-b border-white/5 pb-1">{label}</p>
        <div className="flex flex-col gap-1.5">
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span style={{ color: p.color }} className="font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                {p.name}
              </span>
              <span className="font-mono text-white">
                ${p.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const EnergyChart: React.FC<EnergyChartProps> = ({ data }) => {
  // Fallback data if none provided (initial state)
  const chartData = data && data.length > 0 ? data : [
    { date: 'Mon', price: 50000, normal: 50000, news: 50000 },
  ];

  const yAxisFormatter = (value: number) => {
      if (value >= 1000) {
          return `${(value / 1000).toFixed(0)}k`;
      }
      return value.toString();
  };

  return (
    <div className="w-full h-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10 }} 
            dy={10}
            interval="preserveStartEnd"
            minTickGap={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10 }} 
            domain={['auto', 'auto']}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          
          {/* Main Total Balance Area (Orange) */}
          <Area 
            name="Total Balance"
            type="monotone" 
            dataKey="price" 
            stroke="#fb923c" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVal)" 
          />

          {/* Normal Trades Line (Green) */}
          <Line 
            name="Normal Trades"
            type="monotone" 
            dataKey="normal" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            strokeDasharray="3 3"
          />

          {/* News Trades Line (Yellow) */}
          <Line 
            name="News Trades"
            type="monotone" 
            dataKey="news" 
            stroke="#eab308" 
            strokeWidth={2}
            dot={false}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;