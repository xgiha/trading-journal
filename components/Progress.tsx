import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Check, History, SendHorizontal, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Trade, PayoutRecord } from '../types';
import { Skeleton } from './Skeleton';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const MotionDiv = motion.div as any;

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- Radix Tooltip Components ---
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className="z-[250] overflow-hidden rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-2xl animate-in fade-in zoom-in-95"
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface ProgressProps {
  trades: Trade[];
  payouts?: PayoutRecord[];
  onPayoutUpdate?: (payouts: PayoutRecord[]) => void;
  loading?: boolean;
}

const Progress: React.FC<ProgressProps> = ({ trades, payouts = [], onPayoutUpdate, loading = false }) => {
  const BUFFER_VAL = 2000;
  const TOTAL_SEGMENTS = 6; 
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw');
  const [tempAmount, setTempAmount] = useState('');

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

  // Allowed Limit: 50% of the current balance, capped at $5,000
  const allowedLimit = useMemo(() => {
    if (currentBalance <= 0) return 0;
    const halfBalance = currentBalance * 0.5;
    return Math.min(halfBalance, 5000);
  }, [currentBalance]);

  // Validation
  const isOverLimit = useMemo(() => {
    const val = parseFloat(tempAmount) || 0;
    return val > allowedLimit + 0.001; // float precision delta
  }, [tempAmount, allowedLimit]);

  // Visual Progress Bar Logic
  const maxDisplayVal = useMemo(() => {
    const standardMax = 2750;
    if (currentBalance <= standardMax) return standardMax;
    return Math.max(standardMax, Math.ceil(currentBalance / 250) * 250);
  }, [currentBalance]);

  const tierStep = useMemo(() => (maxDisplayVal - BUFFER_VAL) / 5, [maxDisplayVal]);

  const milestones = useMemo(() => [
    { label: `$${BUFFER_VAL}`, value: BUFFER_VAL, type: 'foundation' },
    { label: `+$${Math.round(tierStep * 1).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 1), type: 'tier' },
    { label: `+$${Math.round(tierStep * 2).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 2), type: 'tier' },
    { label: `+$${Math.round(tierStep * 3).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 3), type: 'tier' },
    { label: `+$${Math.round(tierStep * 4).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 4), type: 'tier' },
    { label: `+$${Math.round(tierStep * 5).toLocaleString()}`, value: BUFFER_VAL + (tierStep * 5), type: 'tier' },
  ], [tierStep]);

  const visualHeight = useMemo(() => {
    if (currentBalance <= 0) return 0;
    const SEG_H = 100 / TOTAL_SEGMENTS;
    if (currentBalance <= BUFFER_VAL) return (currentBalance / BUFFER_VAL) * SEG_H;
    const pnlAboveBuffer = currentBalance - BUFFER_VAL;
    const rangeAboveBuffer = maxDisplayVal - BUFFER_VAL;
    const progressAboveBuffer = Math.min(pnlAboveBuffer / rangeAboveBuffer, 1);
    return SEG_H + (progressAboveBuffer * (5 * SEG_H));
  }, [currentBalance, maxDisplayVal]);

  // Buffer Breach Warning Logic
  const isBufferBreachWarning = useMemo(() => {
    const requested = parseFloat(tempAmount) || 0;
    return requested > 0 && (currentBalance - requested) < BUFFER_VAL;
  }, [tempAmount, currentBalance]);

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;
    
    const amount = parseFloat(tempAmount.replace(/[^0-9.]/g, ''));
    if (!isNaN(amount) && amount > 0) {
      const newPayout: PayoutRecord = {
        id: `P-${Date.now()}`,
        amount,
        date: new Date().toISOString()
      };
      if (onPayoutUpdate) onPayoutUpdate([...payouts, newPayout]);
      setTempAmount('');
      setActiveTab('history');
    }
  };

  const removePayout = (id: string) => {
    if (onPayoutUpdate && confirm("Remove this payout record?")) {
      onPayoutUpdate(payouts.filter(p => p.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="group relative w-full h-full bg-white/[0.03] rounded-[25px] border border-white/5 shadow-xl transition-all duration-500 p-8 flex flex-col overflow-hidden isolate">
      
      {loading ? (
        <div className="relative h-full w-full flex flex-col justify-between py-2">
            <div className="flex gap-4 flex-1">
                <Skeleton className="h-full w-20 rounded-[25px]" />
                <div className="flex-1 flex flex-col justify-between py-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-3 w-20 rounded-md" />)}
                </div>
            </div>
            <div className="mt-8 flex justify-center">
                <Skeleton className="h-14 w-full rounded-xl" />
            </div>
        </div>
      ) : (
        <>
          <div className="relative flex-1 w-full flex items-stretch mt-4 z-10 min-h-0">
            {/* The Progress Bar Track */}
            <div className="relative h-full w-20 bg-white/5 rounded-[25px] border border-white/10 overflow-hidden shrink-0 shadow-inner z-10">
              <MotionDiv
                initial={{ height: 0 }}
                animate={{ height: `${visualHeight}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15, mass: 1 }}
                className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[25px] origin-bottom transform-gpu"
              >
                <div className="absolute inset-0 z-10">
                    <div 
                      className={`w-full h-full transition-colors duration-1000 ${
                        currentBalance >= BUFFER_VAL 
                            ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300' 
                            : 'bg-gradient-to-t from-white/40 via-white/20 to-white/10'
                      }`}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-40" />
              </MotionDiv>
            </div>

            {/* Labels & Markers */}
            <div className="relative flex-1 ml-6 z-10 pointer-events-none select-none">
              {milestones.map((m, index) => {
                const posPct = ((index + 1) / TOTAL_SEGMENTS) * 100;
                const isHit = currentBalance >= m.value;
                const isFoundation = m.type === 'foundation';

                return (
                  <div 
                    key={`${m.value}-${index}`}
                    className="absolute left-0 w-full flex items-center gap-4 transition-all duration-500"
                    style={{ bottom: `${posPct}%`, transform: 'translateY(50%)' }}
                  >
                    <div className={`h-[1px] transition-all duration-700 ${
                      isHit 
                        ? 'w-8 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' 
                        : isFoundation 
                          ? 'w-8 bg-xgiha-accent shadow-[0_0_12px_rgba(255,166,0,0.4)]'
                          : 'w-4 bg-white/10'
                    }`} />

                    <div className="flex flex-col -translate-y-[1px]">
                      <span className={`text-[10px] font-pixel tracking-tighter transition-colors duration-500 leading-none ${
                        isHit ? 'text-emerald-400' : isFoundation ? 'text-xgiha-accent' : 'text-white/20'
                      }`}>
                        {m.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center border-t border-white/5 pt-6 z-[60] shrink-0 relative">
            <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setTempAmount('');
                  setIsPayoutModalOpen(true);
                }}
                className={cn(
                  "relative w-full h-14 rounded-xl font-black text-sm uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center shadow-xl cursor-pointer pointer-events-auto z-[70] isolate",
                  currentBalance >= BUFFER_VAL 
                    ? 'bg-white text-black hover:bg-zinc-100' 
                    : 'bg-white/5 border border-white/10 text-white/30 hover:bg-white/10'
                )}
            >
                <DollarSign size={16} strokeWidth={3} className={currentBalance >= BUFFER_VAL ? 'text-black' : 'text-white/20'} />
                <span>Payout</span>
                {payouts.length > 0 && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-xgiha-accent rounded-full animate-pulse" />
                )}
            </button>
          </div>
        </>
      )}

      {/* Payout Management Modal */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-0">
            <MotionDiv 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/95 backdrop-blur-3xl rounded-[25px]"
                onClick={() => setIsPayoutModalOpen(false)}
            />
            <MotionDiv
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="relative w-full h-full flex flex-col overflow-hidden rounded-[25px] bg-[#0c0c0c]"
            >
                <div className="px-8 pt-10 pb-4 shrink-0 border-b border-white/5 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Payouts</span>
                        <button onClick={() => setIsPayoutModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl w-full">
                        <button onClick={() => setActiveTab('withdraw')} className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center ${activeTab === 'withdraw' ? 'bg-white text-black shadow-lg' : 'text-white/20 hover:text-white/40'}`}>
                            <SendHorizontal size={18} />
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center ${activeTab === 'history' ? 'bg-white text-black shadow-lg' : 'text-white/20 hover:text-white/40'}`}>
                            <History size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-8 min-h-0 flex flex-col">
                    <AnimatePresence mode="wait">
                        {activeTab === 'withdraw' ? (
                            <MotionDiv key="withdraw" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-4 h-full justify-center">
                                
                                {isOverLimit && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] text-center mb-1"
                                  >
                                    Maximum allowed payout is ${formatCurrency(allowedLimit)}
                                  </motion.div>
                                )}

                                <div className={cn(
                                  "relative rounded-[2rem] border transition-all duration-300 overflow-hidden",
                                  isOverLimit ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-white/5 focus-within:border-white/20"
                                )}>
                                    <span className={cn(
                                      "absolute left-6 top-1/2 -translate-y-1/2 font-mono text-3xl transition-colors",
                                      isOverLimit ? "text-red-500/30" : "text-white/10"
                                    )}>$</span>
                                    <input 
                                        type="text" autoFocus value={tempAmount}
                                        onChange={(e) => setTempAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                        className="w-full bg-white/[0.02] py-8 pl-14 pr-8 text-3xl font-mono text-white focus:outline-none transition-all text-right"
                                        placeholder="0.00"
                                    />
                                </div>

                                <button 
                                    onClick={handlePayoutSubmit}
                                    className={cn(
                                      "w-full py-8 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.3em] active:scale-[0.98] transition-all shadow-2xl disabled:opacity-20 cursor-pointer",
                                      isOverLimit ? "bg-white/5 text-white/20 border border-white/5" : "bg-white text-black"
                                    )}
                                    disabled={!tempAmount || parseFloat(tempAmount) <= 0 || isOverLimit}
                                >
                                    <Check size={18} strokeWidth={4} />
                                    Confirm
                                </button>
                            </MotionDiv>
                        ) : (
                            <MotionDiv key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-3">
                                {payouts.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center gap-4 text-white/10 opacity-40">
                                        <History size={40} strokeWidth={1} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Records</span>
                                    </div>
                                ) : (
                                    [...payouts].reverse().map((p) => (
                                        <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between group/item hover:bg-white/[0.04] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                    <DollarSign size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white font-mono">${p.amount.toLocaleString()}</span>
                                                    <span className="text-[9px] font-medium text-white/20 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                        <Calendar size={8} /> {new Date(p.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => removePayout(p.id)} className="p-3 text-white/10 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all opacity-0 group-hover/item:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </div>

                <div className="px-8 pb-10 pt-6 border-t border-white/5 bg-white/[0.01] shrink-0">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Gross Earnings</span>
                            <span className="text-sm font-bold text-white font-mono">${formatCurrency(totalNetPnl)}</span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Allowed Limit</span>
                                {isBufferBreachWarning && (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button className="text-xgiha-accent hover:text-white transition-colors cursor-help">
                                            <AlertCircle size={10} strokeWidth={3} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        Buffer Breach Warning: Withdrawing this amount will drop the balance below the $2,000 safety buffer.
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                            <span className="text-sm font-bold text-emerald-400 font-mono">${formatCurrency(allowedLimit)}</span>
                        </div>
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