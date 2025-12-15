import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PerformanceRadarProps {
  data: { subject: string; A: number; fullMark: number }[];
}

// Helper to determine tooltip position based on the label subject
// This ensures tooltips always point "inwards" to avoid being cut off by the card edges
const getTooltipPositionClass = (subject: string) => {
  switch(subject) {
      case 'Win Rate': 
        // Top Center -> Show Below, Centered
        return 'top-full left-1/2 -translate-x-1/2 mt-2'; 
      case 'Profit Factor': 
        // Top Right -> Show Below, Align Right edge (pushes tooltip left)
        return 'top-full right-0 mt-2';
      case 'Consistency': 
        // Bottom Right -> Show Above, Align Right edge (pushes tooltip left)
        return 'bottom-full right-0 mb-2';
      case 'Risk/Reward': 
        // Bottom Left -> Show Above, Align Left edge (pushes tooltip right)
        return 'bottom-full left-0 mb-2';
      case 'Discipline': 
        // Top Left -> Show Below, Align Left edge (pushes tooltip right)
        return 'top-full left-0 mt-2';
      default: 
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
  }
};

const CustomTick = ({ x, y, payload, data }: any) => {
  const item = data.find((d: any) => d.subject === payload.value);
  const score = item ? item.A : 0;
  const positionClass = getTooltipPositionClass(payload.value);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* 
        ForeignObject: Large enough bounding box to catch hover but centered.
        x=-75, y=-25 centers a 150x50 box roughly around the point.
      */}
      <foreignObject x={-75} y={-25} width={150} height={50} style={{ overflow: 'visible' }}>
        {/* 
           group/tick: Isolates hover state to this element.
        */}
        <div className="flex flex-col items-center justify-center relative w-full h-full group/tick pointer-events-auto">
            
            {/* The Badge (Label) */}
            <div className="px-3 py-1.5 rounded-full bg-[#18181b] border border-white/10 shadow-sm backdrop-blur-md transition-colors duration-200 group-hover/tick:border-nexus-accent/50 group-hover/tick:bg-[#27272a] cursor-default z-10">
                 <span className="text-[9px] text-nexus-muted font-bold tracking-widest uppercase group-hover/tick:text-white whitespace-nowrap">
                    {payload.value}
                 </span>
            </div>
            
            {/* The Floating Score Tooltip */}
            <div className={`absolute px-2.5 py-1 rounded bg-nexus-accent text-black text-[10px] font-bold opacity-0 group-hover/tick:opacity-100 transition-all duration-200 pointer-events-none shadow-lg z-50 whitespace-nowrap ${positionClass}`}>
                {score.toFixed(0)} / 100
            </div>
        </div>
      </foreignObject>
    </g>
  );
};

const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ data }) => {
  return (
    <div className="w-full h-full flex items-center justify-center relative min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          
          {/* Hide Radius Axis Labels */}
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          
          {/* 
            Radar (The Polygon):
            - Rendered BEFORE the labels (Axis) so labels appear on top.
            - pointerEvents="none" prevents the polygon from stealing mouse hover from labels.
          */}
          <Radar
            name="Performance"
            dataKey="A"
            stroke="#ffa600"
            strokeWidth={2}
            fill="#ffa600"
            fillOpacity={0.15}
            isAnimationActive={true}
            style={{ pointerEvents: 'none' }} 
          />

          {/* 
            Axis Ticks (Labels):
            - Rendered LAST to be on top of the polygon.
          */}
          <PolarAngleAxis 
            dataKey="subject" 
            tick={(props) => <CustomTick {...props} data={data} />}
          />
          
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Decorative center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         <div className="w-24 h-24 bg-nexus-accent/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default PerformanceRadar;