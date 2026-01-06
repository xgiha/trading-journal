import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trade } from '../types';
import { Skeleton } from './Skeleton';

const MotionDiv = motion.div as any;

interface ProgressProps {
  trades: Trade[];
  loading?: boolean;
}

const Progress: React.FC<ProgressProps> = ({ trades, loading = false }) => {
  const BUFFER_VAL = 2000;
  const TIER_VAL = 150;
  const TOTAL_SEGMENTS = 6; 

  const totalPnl = useMemo(() => {
    return trades.reduce((sum, trade) => sum + trade.pnl, 0);
  }, [trades]);

  const milestones = useMemo(() => [
    { label: '$2000', subLabel: 'BUFFER', value: BUFFER_VAL, type: 'foundation' },
    { label: '$150', value: BUFFER_VAL + (TIER_VAL * 1), type: 'tier' },
    { label: '$300', value: BUFFER_VAL + (TIER_VAL * 2), type: 'tier' },
    { label: '$450', value: BUFFER_VAL + (TIER_VAL * 3), type: 'tier' },
    { label: '$600', value: BUFFER_VAL + (TIER_VAL * 4), type: 'tier' },
    { label: '$750', value: BUFFER_VAL + (TIER_VAL * 5), type: 'tier' },
  ], []);

  const calculateVisualHeight = (pnl: number) => {
    if (pnl <= 0) return 0;
    const SEG_H = 100 / TOTAL_SEGMENTS;
    if (pnl <= BUFFER_VAL) return (pnl / BUFFER_VAL) * SEG_H;
    const pnlAboveBuffer = pnl - BUFFER_VAL;
    const completedTiers = Math.floor(pnlAboveBuffer / TIER_VAL);
    const partialTierProgress = (pnlAboveBuffer % TIER_VAL) / TIER_VAL;
    const totalSegments = 1 + completedTiers + Math.min(partialTierProgress, 1);
    return Math.min(totalSegments * SEG_H, 100);
  };

  const visualHeight = calculateVisualHeight(totalPnl);

  return (
    <div className="group relative w-full h-full bg-white/[0.03] rounded-[25px] border border-white/5 shadow-xl transition-all duration-500 p-8 flex flex-col justify-end overflow-hidden">
      
      {loading ? (
        <div className="relative h-full w-full flex flex-col justify-between py-2">
            <div className="flex gap-4 h-[85%]">
                <Skeleton className="h-full w-20 rounded-[25px]" />
                <div className="flex-1 flex flex-col justify-between py-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-3 w-20 rounded-md" />
                    ))}
                </div>
            </div>
            <div className="mt-8 flex justify-between">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-2 w-16" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
            </div>
        </div>
      ) : (
        <>
          <div className="relative h-[85%] w-full flex items-stretch mt-4 z-10">
            {/* The Progress Bar Track */}
            <div className="relative h-full w-20 bg-white/5 rounded-[25px] border border-white/10 overflow-hidden shrink-0 shadow-inner z-10">
              {/* Main Animation Wrapper */}
              <MotionDiv
                initial={{ height: 0 }}
                animate={{ height: `${visualHeight}%` }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 80, 
                  damping: 15, 
                  mass: 1
                }}
                className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[25px] origin-bottom transform-gpu"
              >
                {/* Fluid Body with Layered Gradients */}
                <div className="absolute inset-0 z-10">
                    <div 
                      className={`w-full h-full transition-colors duration-1000 ${
                        totalPnl >= BUFFER_VAL 
                            ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300' 
                            : 'bg-gradient-to-t from-white/40 via-white/20 to-white/10'
                      }`}
                    />
                </div>
                {/* Overall Gloss Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-40" />
              </MotionDiv>
            </div>

            {/* Labels & Markers */}
            <div className="relative h-full ml-4 flex-1 z-10">
              {milestones.map((m, index) => {
                const posPct = ((index + 1) / TOTAL_SEGMENTS) * 100;
                const isHit = totalPnl >= m.value;
                const isFoundation = m.type === 'foundation';

                return (
                  <div 
                    key={m.value}
                    className="absolute left-0 w-full flex items-center gap-3 transition-all duration-500"
                    style={{ bottom: `${posPct}%`, transform: 'translateY(50%)' }}
                  >
                    <div className={`h-[2px] rounded-full transition-all duration-700 ${
                      isHit 
                        ? 'w-10 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' 
                        : isFoundation 
                          ? 'w-10 bg-xgiha-accent shadow-[0_0_12px_rgba(255,166,0,0.4)]'
                          : 'w-6 bg-white/20'
                    }`} />

                    <div className="flex flex-col -translate-y-[1px]">
                      <span className={`text-[12px] font-pixel tracking-tighter transition-colors duration-500 leading-none ${
                        isHit ? 'text-emerald-400' : isFoundation ? 'text-xgiha-accent' : 'text-white/40'
                      }`}>
                        {m.label}
                      </span>
                      {m.subLabel && (
                        <span className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-1 transition-colors leading-none ${
                          isHit ? 'text-emerald-400/60' : 'text-xgiha-accent/50'
                        }`}>
                          {m.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center border-t border-white/5 pt-4 z-20">
            <div className="flex flex-col">
                <span className="text-[8px] font-pixel text-white/30 uppercase tracking-widest">Payout Progress</span>
                <span className="text-[10px] font-bold text-white tracking-tight">
                    ${Math.max(0, totalPnl).toLocaleString()} <span className="text-white/20">/</span> ${milestones[5].value.toLocaleString()}
                </span>
            </div>
            <div className={`px-2 py-1 rounded-md text-[8px] font-pixel uppercase transition-colors duration-500 ${totalPnl >= BUFFER_VAL ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                {totalPnl >= BUFFER_VAL ? 'Buffer Clear' : 'Accumulating'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;