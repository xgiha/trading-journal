import React from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface RadialProgressProps {
  value: number;
  max: number;
  label: string;
  subLabel: string;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ value, max, label, subLabel }) => {
  const data = [{ name: 'Power', value: value, fill: '#fb923c' }]; // Orange-400

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[100px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="65%" 
          outerRadius="90%" 
          barSize={12} 
          data={data} 
          startAngle={210} 
          endAngle={-30}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: '#27272a' }} // Zinc-800
            dataKey="value"
            cornerRadius={12}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-white tracking-tight">{label}</span>
        <span className="text-[10px] text-nexus-muted uppercase tracking-widest mt-0">{subLabel}</span>
      </div>
    </div>
  );
};

export default RadialProgress;