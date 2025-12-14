import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

interface NewsChartProps {
  data: { name: string; pnl: number }[];
}

const NewsChart: React.FC<NewsChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
           <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
            dy={10}
          />
           <YAxis 
            hide
            domain={['auto', 'auto']} // Allows bars to go up or down from 0
          />
          <Tooltip 
             cursor={{fill: 'rgba(255,255,255,0.05)'}}
             contentStyle={{ 
               backgroundColor: 'rgba(24, 24, 27, 0.8)', 
               backdropFilter: 'blur(8px)',
               borderColor: 'rgba(255,255,255,0.1)', 
               color: '#fff', 
               fontSize: '12px',
               borderRadius: '8px'
             }}
             itemStyle={{ color: '#fb923c' }}
             formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net P&L']}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar dataKey="pnl" radius={[4, 4, 4, 4]} barSize={40}>
            {data.map((entry, index) => {
               // Logic: 
               // News Trades: Orange if positive, Red if negative
               // Normal Trades: Emerald if positive, Red if negative
               let color = '#ef4444'; // default red
               if (entry.pnl >= 0) {
                   color = entry.name === 'News' ? '#ffa600' : '#10b981';
               }
               return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NewsChart;