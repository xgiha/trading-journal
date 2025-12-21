import React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Trade } from "../types"

interface TotalPnlCardProps {
  trades: Trade[]
  totalPnl: number
  growthPct: number
}

export default function TotalPnlCard({ totalPnl, growthPct }: TotalPnlCardProps) {
  // --- Tilt Effect Logic ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // --- Formatting & Sizing ---
  const getFontSize = (val: number) => {
    const length = Math.floor(Math.abs(val)).toString().length;
    if (length <= 4) return 'text-[3.4rem]';
    if (length === 5) return 'text-[2.8rem]';
    if (length === 6) return 'text-[2.5rem]';
    return 'text-[2.2rem]';
  };

  const formatCurrencyInteger = (val: number) => {
    return Math.floor(Math.abs(val)).toLocaleString();
  };

  return (
    <div className="perspective-[1000px]">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative w-full aspect-square bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col items-center justify-center transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden isolate"
      >
        {/* Glossy Highlights */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent"></div>
        
        {/* Deep Internal Glow */}
        <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/10 to-transparent opacity-50 blur-3xl pointer-events-none -z-10"></div>
        
        {/* Main Value Display - Center Stage */}
        <div 
          style={{ transform: "translateZ(50px)" }}
          className="flex flex-col items-center z-10"
        >
          <div className="flex items-start gap-1">
            <span className="font-pixel text-2xl text-white/20 mt-3">$</span>
            <h2 className={`font-pixel ${getFontSize(totalPnl)} text-white tracking-tighter leading-none drop-shadow-2xl`}>
              {totalPnl < 0 ? '-' : ''}{formatCurrencyInteger(totalPnl)}
            </h2>
          </div>
          
          <div className={`flex items-center gap-1.5 mt-6 px-3 py-1 rounded-full border bg-white/5 backdrop-blur-md ${growthPct >= 0 ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400'}`}>
            <span className="text-[11px] font-bold font-mono">
              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
            </span>
            <svg 
              width="10" 
              height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              className={`transition-transform duration-500 ${growthPct >= 0 ? 'rotate-0' : 'rotate-180'}`}
            >
              <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Liquid Surface Sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </motion.div>
    </div>
  )
}