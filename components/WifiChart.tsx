import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

const WifiChart: React.FC = () => {
  // Mock data simulating network latency with slight jitter
  const data = [
    { time: 1, ms: 15 }, { time: 2, ms: 18 }, { time: 3, ms: 12 }, { time: 4, ms: 13 },
    { time: 5, ms: 12 }, { time: 6, ms: 16 }, { time: 7, ms: 14 }, { time: 8, ms: 12 },
    { time: 9, ms: 11 }, { time: 10, ms: 13 }, { time: 11, ms: 12 }, { time: 12, ms: 15 },
    { time: 13, ms: 18 }, { time: 14, ms: 12 }, { time: 15, ms: 14 }, { time: 16, ms: 12 },
    { time: 17, ms: 11 }, { time: 18, ms: 12 }, { time: 19, ms: 13 }, { time: 20, ms: 12 }
  ];

  return (
    <div className="w-full h-8 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
          <Area 
            type="monotone" 
            dataKey="ms" 
            stroke="#10b981" 
            strokeWidth={1.5} 
            fill="url(#latencyGradient)" 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WifiChart;