import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trade, PayoutRecord } from '../types';
import { Skeleton } from './Skeleton';

const MotionDiv = motion.div as any;

interface ProgressProps {
  trades: Trade[];
  payouts?: PayoutRecord[];
  onPayoutUpdate?: (payouts: PayoutRecord[]) => void;
  loading?: boolean;
}

const Progress: React.FC<ProgressProps> = ({ trades, payouts = [], loading = false }) => {
  const BUFFER_VAL = 2000;
  const TOTAL_SEGMENTS = 6; 

  // 1. Calculations
  const totalNetPnl = useMemo(() => {
    return trades.reduce((sum, trade) => sum + (trade.pnl - (trade.fee || 0)), 0);
  }, [trades]);

  const totalPaidOut = useMemo(() => {
    return payouts.reduce((sum, p) => sum + p.amount, 0);
  }, [payouts]);

  const currentBalance = useMemo(() => {
    return Math.max(0, totalNetPnl - totalPaidOut);
  }, [totalNetPnl, totalPaidOut]);

  // Visual Progress Bar Logic - Dynamic Rescaling Engine
  const maxDisplayVal = useMemo(() => {
    const standardMax = 2750;
    if (currentBalance <= standardMax) return standardMax;
    // Rescale in steps of 250
    return Math.max(standardMax, Math.ceil(currentBalance / 250) * 250);
  }, [currentBalance]);

  const tierStep = useMemo(() => (maxDisplayVal - BUFFER_VAL) / 5, [maxDisplayVal]);

  const milestones = useMemo(() => [
    { label: `$${BUFFER_VAL.toLocaleString()}`, value: BUFFER_VAL, type: 'foundation' },
    { label: `+$${Math.round(tierStep * 1).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 1), type: 'tier' },
    { label: `+$${Math.round(tierStep * 2).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 2), type: 'tier' },
    { label: `+$${Math.round(tierStep * 3).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 3), type: 'tier' },
    { label: `+$${Math.round(tierStep * 4).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 4), type: 'tier' },
    { label: `+$${Math.round(tierStep * 5).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 5), type: 'tier' },
  ], [tierStep]);

  const visualHeight = useMemo(() => {
    if (currentBalance <= 0) return 0;
    const SEG_H = 100 / TOTAL_SEGMENTS;
    
    // If below buffer, scale within the first segment (0 - 16.66%)
    if (currentBalance <= BUFFER_VAL) {
        return (currentBalance / BUFFER_VAL) * SEG_H;
    }

    // If above buffer, scale the remaining 83.33% based on dynamic max range
    const pnlAboveBuffer = currentBalance - BUFFER_VAL;
    const rangeAboveBuffer = maxDisplayVal - BUFFER_VAL;
    const progressAboveBuffer = Math.min(pnlAboveBuffer / rangeAboveBuffer, 1);
    
    return SEG_H + (progressAboveBuffer * (5 * SEG_H));
  }, [currentBalance, maxDisplayVal]);

  return (
    <div className="group relative w-full h-full bg-white/[0.03] rounded-[25px] border border-white/5 shadow-xl transition-all duration-500 p-6 flex flex-col overflow-hidden isolate">
      
      {loading ? (
        <div className="relative h-full w-full flex flex-col justify-between py-2">
            <div className="flex gap-4 flex-1">
                <Skeleton className="h-full w-[90px] rounded-[25px]" />
                <div className="flex-1 flex flex-col justify-between py-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-24 rounded-md" />)}
                </div>
            </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full flex items-stretch z-10 min-h-0">
          {/* The Progress Bar Track */}
          <div className="relative h-full w-[90px] bg-white/5 rounded-[20px] border border-white/10 overflow-hidden shrink-0 shadow-inner z-10">
            {/* Progress Fill */}
            <MotionDiv
              initial={{ height: 0 }}
              animate={{ height: `${visualHeight}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15, mass: 1 }}
              className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[20px] origin-bottom transform-gpu z-10"
            >
              <div className="absolute inset-0">
                  <div 
                    className={`w-full h-full transition-colors duration-1000 ${
                      currentBalance >= BUFFER_VAL 
                          ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300' 
                          : 'bg-gradient-to-t from-white/40 via-white/20 to-white/10'
                    }`}
                  />
              </div>
            </MotionDiv>

            {/* Internal Milestone Marks (The lines inside the bar) */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {milestones.map((m, index) => {
                const posPct = ((index + 1) / TOTAL_SEGMENTS) * 100;
                const isHit = currentBalance >= m.value;
                return (
                  <div 
                    key={`line-${index}`}
                    className={`absolute left-0 w-full h-[1px] transition-all duration-500 ${
                      isHit ? 'bg-emerald-400/40 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'bg-white/10'
                    }`}
                    style={{ bottom: `${posPct}%` }}
                  />
                );
              })}
            </div>

            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none z-30" />
          </div>

          {/* Labels - Increased font size (12px) */}
          <div className="relative flex-1 ml-5 z-10 pointer-events-none select-none h-full">
            {milestones.map((m, index) => {
              const posPct = ((index + 1) / TOTAL_SEGMENTS) * 100;
              const isHit = currentBalance >= m.value;
              const isFoundation = m.type === 'foundation';

              return (
                <div 
                  key={`label-${index}`}
                  className="absolute left-0 w-full flex items-center transition-all duration-500"
                  style={{ bottom: `${posPct}%`, transform: 'translateY(50%)' }}
                >
                  <span className={`text-[12px] font-pixel tracking-tighter transition-colors duration-500 leading-none truncate ${
                    isHit ? 'text-emerald-400' : isFoundation ? 'text-xgiha-accent' : 'text-white/30'
                  }`}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;