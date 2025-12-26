
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
  const progressPercent = Math.min(Math.max((totalPnl / MAX_VAL) * 100, 0), 100);

  return (
    <div className="w-full h-full bg-white/[0.03] rounded-[25px] border border-white/5 shadow-xl transition-all duration-500 p-8 flex items-stretch justify-start">
      <div className="relative h-full flex items-stretch">
        
        {/* Progress Bar (Wider, Left Aligned) */}
        <div className="relative h-full w-20 bg-white/10 rounded-[20px] overflow-hidden shrink-0">
          {/* Progress Fill */}
          <MotionDiv
            initial={{ height: 0 }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-[20px]"
          />
        </div>

        {/* 5 External Marks on the Right */}
        <div className="relative h-full w-12 ml-4 flex flex-col justify-between py-0.5 pointer-events-none">
          {[5, 4, 3, 2, 1].map((step) => {
            const position = (step * STEP_VAL) / MAX_VAL * 100;
            return (
              <div 
                key={step} 
                className="absolute left-0 w-4 h-[2px] bg-white/30 rounded-full" 
                style={{ bottom: `calc(${position}% - 1px)` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FearGreedIndex;
