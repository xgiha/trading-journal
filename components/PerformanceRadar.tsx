import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PerformanceRadarProps {
  data: { subject: string; A: number; fullMark: number }[];
}

// --- Spline / Curve Logic ---
const getControlPoints = (
  p0: {x: number, y: number}, 
  p1: {x: number, y: number}, 
  p2: {x: number, y: number}, 
  t: number = 0.2
) => {
  const d01 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
  const d12 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  
  const fa = t * d01 / (d01 + d12 || 1);
  const fb = t * d12 / (d01 + d12 || 1);
  
  const cp1x = p1.x - fa * (p2.x - p0.x);
  const cp1y = p1.y - fa * (p2.y - p0.y);
  const cp2x = p1.x + fb * (p2.x - p0.x);
  const cp2y = p1.y + fb * (p2.y - p0.y);
  
  return { cp1: {x: cp1x, y: cp1y}, cp2: {x: cp2x, y: cp2y} };
};

const getSmoothPath = (points: {x: number, y: number}[]) => {
  if (points.length < 3) return "";
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];
    
    const cp1 = getControlPoints(p0, p1, p2).cp2; 
    const cp2 = getControlPoints(p1, p2, p3).cp1; 
    
    d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  }
  
  return d + " Z";
};

const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ data }) => {
  // Configuration
  const size = 300;
  const center = size / 2;
  const radius = 80; // Slightly increased from 75 since we handle scaling better now, but kept safe for labels.
  
  const processedData = useMemo(() => {
    const count = data.length || 5;
    const angleStep = (Math.PI * 2) / count;
    
    return data.map((item, i) => {
        const angle = i * angleStep - Math.PI / 2;
        
        const rA = (item.A / 100) * radius; 
        
        let valB = item.A * 0.8 + 15;
        if (i % 2 === 0) valB += 10; else valB -= 10;
        valB = Math.min(Math.max(valB, 20), 100);
        const rB = (valB / 100) * radius;

        return {
            subject: item.subject,
            angle,
            score: item.A,
            xA: center + rA * Math.cos(angle),
            yA: center + rA * Math.sin(angle),
            xB: center + rB * Math.cos(angle),
            yB: center + rB * Math.sin(angle),
            // Push labels out further but within viewbox thanks to smaller radius
            xLabel: center + (radius + 35) * Math.cos(angle),
            yLabel: center + (radius + 35) * Math.sin(angle),
            xAxis: center + radius * Math.cos(angle),
            yAxis: center + radius * Math.sin(angle)
        };
    });
  }, [data, center, radius]);

  const pointsA = processedData.map(d => ({ x: d.xA, y: d.yA }));
  const pointsB = processedData.map(d => ({ x: d.xB, y: d.yB }));
  const pointsBSwirl = pointsB.map((_, i) => pointsB[(i + 1) % pointsB.length]);

  const pathA = getSmoothPath(pointsA);
  const pathB = getSmoothPath(pointsBSwirl);

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none">
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full h-full filter drop-shadow-2xl overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
            <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
             <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF9F43" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="stroke-orange" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF9F43" />
                <stop offset="100%" stopColor="#FF6B6B" />
            </linearGradient>

            <linearGradient id="grad-purple" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5F27CD" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#2E86DE" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="stroke-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#2E86DE" />
                 <stop offset="100%" stopColor="#5F27CD" />
            </linearGradient>
        </defs>

        <g className="opacity-20">
            {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                <circle 
                    key={i} 
                    cx={center} 
                    cy={center} 
                    r={radius * scale} 
                    fill="none" 
                    stroke="#fff" 
                    strokeWidth="1"
                    strokeDasharray={i === 3 ? "0" : "4 4"}
                />
            ))}
            {processedData.map((d, i) => (
                <line 
                    key={i} 
                    x1={center} 
                    y1={center} 
                    x2={d.xAxis} 
                    y2={d.yAxis} 
                    stroke="#fff" 
                    strokeWidth="1" 
                />
            ))}
        </g>

        <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={pathB}
            fill="url(#grad-purple)"
            stroke="url(#stroke-purple)"
            strokeWidth="2"
            filter="url(#glow-purple)"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mix-blend-screen"
        />

        <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
            d={pathA}
            fill="url(#grad-orange)"
            stroke="url(#stroke-orange)"
            strokeWidth="3"
            filter="url(#glow-orange)"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mix-blend-screen"
        />
        
        {processedData.map((d, i) => (
            <g key={i}>
                <circle cx={d.xA} cy={d.yA} r="3" fill="#fff" className="animate-pulse" />
                
                <foreignObject 
                    x={d.xLabel - 40} 
                    y={d.yLabel - 15} 
                    width="80" 
                    height="30"
                    style={{ overflow: 'visible' }}
                >
                    <div className={`flex flex-col items-center justify-center w-full h-full text-center`}>
                        <span className="text-[9px] font-bold text-nexus-muted uppercase tracking-widest shadow-black drop-shadow-md whitespace-nowrap">
                            {d.subject}
                        </span>
                        <span className="text-[9px] font-mono font-medium text-white opacity-80">
                            {d.score.toFixed(0)}
                        </span>
                    </div>
                </foreignObject>
            </g>
        ))}

        <circle cx={center} cy={center} r="4" fill="#fff" opacity="0.5" />
        <circle cx={center} cy={center} r="40" fill="url(#grad-purple)" opacity="0.1" filter="url(#glow-purple)" />

      </svg>
    </div>
  );
};

export default PerformanceRadar;