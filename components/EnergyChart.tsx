import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface EnergyChartProps {
  data?: { date: string; price: number }[];
}

const EnergyChart: React.FC<EnergyChartProps> = ({ data }) => {
  // Fallback data if none provided (initial state)
  const chartData = data && data.length > 0 ? data : [
    { date: 'Mon', price: 0 },
    { date: 'Tue', price: 0 },
    { date: 'Wed', price: 0 },
    { date: 'Thu', price: 0 },
    { date: 'Fri', price: 0 },
    { date: 'Sat', price: 0 },
    { date: 'Sun', price: 0 },
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
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10 }} 
            domain={['auto', 'auto']}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip 
             contentStyle={{ 
               backgroundColor: 'rgba(24, 24, 27, 0.8)', 
               backdropFilter: 'blur(8px)',
               borderColor: 'rgba(255,255,255,0.1)', 
               color: '#fff', 
               fontSize: '12px',
               borderRadius: '8px'
             }}
             itemStyle={{ color: '#fb923c' }}
             cursor={{ stroke: '#fb923c', strokeWidth: 1, strokeDasharray: '4 4' }}
             formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#fb923c" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVal)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;