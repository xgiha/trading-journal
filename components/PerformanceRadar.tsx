import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PerformanceRadarProps {
  data: { subject: string; A: number; fullMark: number }[];
}

const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ data }) => {
  return (
    <div className="w-full h-full min-h-[250px] flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#ffa600"
            strokeWidth={2}
            fill="#ffa600"
            fillOpacity={0.15}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Decorative center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-20 h-20 bg-nexus-accent/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default PerformanceRadar;