import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Check } from 'lucide-react';
import { Trade } from '../types';
import { Skeleton } from './Skeleton';

const MotionDiv = motion.div as any;

interface ProgressProps {
  trades: Trade[];
  payouts?: number;
  onPayoutUpdate?: (amount: number) => void;
  loading?: boolean;
}

const Progress: React.FC<ProgressProps> = ({ trades, payouts = 0, onPayoutUpdate, loading = false }) => {
  const BUFFER_VAL = 2000;
  const TOTAL_SEGMENTS = 6; 
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [tempPayout, setTempPayout] = useState(payouts.toString());

  const totalNetPnl = useMemo(() => {
    return trades.reduce((sum, trade) => sum + (trade.pnl - (trade.fee || 0)), 0);
  }, [trades]);

  // EFFECTIVE PNL: Total PnL minus what has been taken out.
  // This value is used for the fluid height and dynamic tier markers.
  const effectivePnl = useMemo(() => {
    return Math.max(0, totalNetPnl - payouts);
  }, [totalNetPnl, payouts]);

  // DYNAMIC SCALING LOGIC:
  // If effective profit exceeds $2750, we recalibrate the range.
  const maxDisplayVal = useMemo(() => {
    const standardMax = 2750;
    if (effectivePnl <= standardMax) return standardMax;
    return Math.max(standardMax, Math.ceil(effectivePnl / 250) * 250);
  }, [effectivePnl]);

  const tierStep = useMemo(() => {
    return (maxDisplayVal - BUFFER_VAL) / 5;
  }, [maxDisplayVal]);

  const milestones = useMemo(() => [
    { label: `$${BUFFER_VAL}`, subLabel: 'BUFFER', value: BUFFER_VAL, type: 'foundation' },
    { label: `+$${Math.round(tierStep * 1).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 1), type: 'tier' },
    { label: `+$${Math.round(tierStep * 2).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 2), type: 'tier' },
    { label: `+$${Math.round(tierStep * 3).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 3), type: 'tier' },
    { label: `+$${Math.round(tierStep * 4).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 4), type: 'tier' },
    { label: `+$${Math.round(tierStep * 5).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 5), type: 'tier' },
  ], [tierStep]);

  const calculateVisualHeight = (pnl: number) => {
    if (pnl <= 0) return 0;
    const SEG_H = 100 / TOTAL_SEGMENTS;
    
    if (pnl <= BUFFER_VAL) {
        return (pnl / BUFFER_VAL) * SEG_H;
    }
    
    const pnlAboveBuffer = pnl - BUFFER_VAL;
    const rangeAboveBuffer = maxDisplayVal - BUFFER_VAL;
    const progressAboveBuffer = Math.min(pnlAboveBuffer / rangeAboveBuffer, 1);
    
    return SEG_H + (progressAboveBuffer * (5 * SEG_H));
  };

  const visualHeight = calculateVisualHeight(effectivePnl);

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(tempPayout.replace(/,/g, ''));
    if (!isNaN(amount) && onPayoutUpdate) {
      onPayoutUpdate(amount);
    }
    setIsPayoutModalOpen(false);
  };

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
                <div className="absolute inset-0 z-10">
                    <div 
                      className={`w-full h-full transition-colors duration-1000 ${
                        effectivePnl >= BUFFER_VAL 
                            ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300' 
                            : 'bg-gradient-to-t from-white/40 via-white/20 to-white/10'
                      }`}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-40" />
              </MotionDiv>
            </div>

            {/* Labels & Markers */}
            <div className="relative h-full ml-4 flex-1 z-10">
              {milestones.map((m, index) => {
                const posPct = ((index + 1) / TOTAL_SEGMENTS) * 100;
                const isHit = effectivePnl >= m.value;
                const isFoundation = m.type === 'foundation';

                return (
                  <div 
                    key={`${m.value}-${index}`}
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
                <span className="text-[8px] font-pixel text-white/30 uppercase tracking-widest">Available Credit</span>
                <span className="text-[10px] font-bold text-white tracking-tight">
                    ${Math.round(effectivePnl).toLocaleString()} <span className="text-white/20">/</span> ${maxDisplayVal.toLocaleString()}
                </span>
            </div>
            
            <button 
                onClick={() => {
                  setTempPayout(payouts.toString());
                  setIsPayoutModalOpen(true);
                }}
                className={`group/btn relative px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                  effectivePnl >= BUFFER_VAL 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
            >
                <DollarSign size={10} strokeWidth={3} className={effectivePnl >= BUFFER_VAL ? 'animate-pulse' : ''} />
                <span className="text-[9px] font-black uppercase tracking-widest">Payout</span>
                
                {payouts > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-xgiha-accent rounded-full shadow-[0_0_8px_orange]" />
                )}
            </button>
          </div>
        </>
      )}

      {/* Payout Entry Modal */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
            <MotionDiv 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsPayoutModalOpen(false)}
            />
            <MotionDiv
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                className="relative w-full bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-5 overflow-hidden"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Withdrawals</span>
                    <button onClick={() => setIsPayoutModalOpen(false)} className="text-white/20 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handlePayoutSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Total Withdrawn Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-mono text-xl">$</span>
                            <input 
                                type="text"
                                autoFocus
                                value={tempPayout}
                                onChange={(e) => setTempPayout(e.target.value.replace(/[^0-9.]/g, ''))}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-10 pr-4 text-xl font-mono text-white focus:outline-none focus:border-xgiha-accent/40 transition-all shadow-inner"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full h-14 bg-white text-black rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all shadow-xl"
                    >
                        <Check size={16} strokeWidth={3} />
                        Update Vault
                    </button>
                </form>

                <div className="px-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-white/20 uppercase tracking-widest border-t border-white/5 pt-4">
                        <span>Total PnL</span>
                        <span className="text-white/40 font-mono">${Math.round(totalNetPnl).toLocaleString()}</span>
                    </div>
                </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Progress;