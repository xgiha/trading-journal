
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trade } from '../types';

const MotionDiv = motion.div as any;

interface FearGreedIndexProps {
  trades: Trade[];
}

const FearGreedIndex: React.FC<FearGreedIndexProps> = ({ trades }) => {
  const totalPnl = useMemo(() => {
    return trades.reduce((sum, trade) => sum + trade.pnl, 0);
  }, [trades]);

  const MAX_VAL = 750; // 5 steps of $150
  const STEP_VAL = 150;
  const steps = [750, 600, 450, 300, 150];
  
  // Calculate progress as a percentage of the $750 goal
  const progressPercent = Math.min(Math.max((totalPnl / MAX_VAL) * 100, 0), 100);

  return (
    <div className="w-full h-full bg-white/[0.03] rounded-[25px] border border-white/5 shadow-xl transition-all duration-500 p-8 flex items-stretch justify-start">
      <div className="relative h-full flex items-stretch">
        
        {/* Progress Bar (Left Aligned) */}
        <div className="relative h-full w-20 bg-white/10 rounded-[25px] overflow-hidden shrink-0 border border-white/5">
          {/* Progress Fill - Smooth animation from bottom */}
          <MotionDiv
            initial={{ height: 0 }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ 
              type: "spring", 
              stiffness: 35, 
              damping: 12,
              mass: 1
            }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-[25px]"
          />
        </div>

        {/* 5 External Marks and Labels on the Right */}
        <div className="relative h-full ml-6 flex flex-col justify-between py-1 pointer-events-none">
          {steps.map((val) => {
            const position = (val / MAX_VAL) * 100;
            return (
              <div 
                key={val} 
                className="absolute left-0 flex items-center gap-3 whitespace-nowrap" 
                style={{ bottom: `calc(${position}% - 1px)` }}
              >
                {/* Tick Mark */}
                <div className="w-4 h-[2px] bg-white/20 rounded-full" />
                
                {/* Label Text */}
                <span className="text-[11px] font-pixel text-xgiha-muted/60 tracking-tighter">
                  ${val}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FearGreedIndex;
