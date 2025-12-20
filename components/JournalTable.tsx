import React, { useState, useRef, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../types';

interface JournalTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onViewDay: (date: string) => void;
}

// Strictly limit to 5 trades per page to prevent any scrolling
const ITEMS_PER_PAGE = 5;

const groupTradesByDate = (trades: Trade[]) => {
  const groups: { [key: string]: Trade[] } = {};
  trades.forEach(trade => {
    const dateKey = trade.date;
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(trade);
  });
  return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
};

const getDateLabel = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
};

interface SwipeableRowProps {
  trade: Trade;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onViewDay: (date: string) => void;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ trade, onEdit, onDelete, onViewDay }) => {
    const [offset, setOffset] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const dragStartX = useRef(0);
    const isDragging = useRef(false);
    const isNewsTrade = !!trade.newsEvent;
    const hasNotes = !!trade.notes;

    const onPointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX - offset;
        dragStartX.current = e.clientX;
        ref.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const x = e.clientX - startX.current;
        const newOffset = Math.max(Math.min(x, 120), -120); 
        setOffset(newOffset);
    };

    const onPointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        ref.current?.releasePointerCapture(e.pointerId);
        const moveDist = Math.abs(e.clientX - dragStartX.current);

        if (moveDist < 5) {
             if (offset !== 0) setOffset(0);
             else onViewDay(trade.date);
        } else {
            if (offset > 60) setOffset(100);
            else if (offset < -60) setOffset(-100);
            else setOffset(0);
        }
    };

    return (
        <div className="relative h-16 w-full min-w-[600px] mb-2 rounded-2xl select-none touch-pan-y overflow-hidden shrink-0">
            <div className="absolute inset-0 flex justify-between items-center px-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 z-0">
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(trade); setOffset(0); }}
                    className={`flex items-center gap-2 text-green-500 transition-all active:scale-95 ${offset > 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                >
                    <Edit2 size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                </button>
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(trade.id); setOffset(0); }}
                    className={`flex items-center gap-2 text-red-500 transition-all active:scale-95 ${offset < 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
                    <Trash2 size={16} />
                </button>
            </div>

            <div 
                ref={ref}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => { if(isDragging.current) onPointerUp({ pointerId: 0 } as any) }}
                className="absolute inset-0 bg-[#0F0F0F] border border-white/5 rounded-2xl flex items-center transition-transform duration-300 ease-out cursor-pointer hover:border-white/20 hover:bg-[#141414] z-10"
                style={{ transform: `translateX(${offset}px)` }}
            >
                <div className="w-12 flex flex-col gap-1 justify-center items-center shrink-0 border-r border-white/5 h-full">
                    {isNewsTrade ? <Zap size={14} className="text-yellow-500 fill-yellow-500" /> : <div className="w-1 h-1 rounded-full bg-[#222]"></div>}
                    {hasNotes && <FileText size={10} className="text-[#444]" />}
                </div>

                <div className="flex-1 grid grid-cols-7 gap-4 items-center px-6 h-full">
                    <div className="font-mono text-xs text-white font-bold truncate tracking-wide">{trade.pair}</div>
                    <div className={`text-right font-mono text-xs font-bold truncate ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}</div>
                    <div className="text-xs text-[#AAA] font-mono truncate text-right">{trade.size || '-'}</div>
                    <div className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-2 text-[9px]">
                            <span className="w-5 text-[#444] font-bold">IN</span>
                            <span className="font-mono text-white/70">{trade.entryTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                            <span className="w-5 text-[#444] font-bold">OUT</span>
                            <span className="font-mono text-white/70">{trade.exitTime || '-'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-2 text-[9px]">
                            <span className="w-5 text-[#444] font-bold">IN</span>
                            <span className="font-mono text-white/70">{trade.entryPrice || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                            <span className="w-5 text-[#444] font-bold">OUT</span>
                            <span className="font-mono text-white/70">{trade.exitPrice || '-'}</span>
                        </div>
                    </div>
                    <div className="text-right text-xs text-[#666] font-mono truncate">${(trade.fee || 0).toFixed(2)}</div>
                    <div className="flex justify-center">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${trade.type === 'Long' ? 'bg-green-500/5 text-green-500 border-green-500/10' : 'bg-red-500/5 text-red-500 border-red-500/10'}`}>
                          {trade.type === 'Long' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const JournalTable = ({ trades, onEdit, onDelete, onViewDay }: JournalTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.entryTime.localeCompare(a.entryTime);
    });
  }, [trades]);

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / ITEMS_PER_PAGE));
  const currentTrades = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTrades.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTrades, currentPage]);

  const groupedTrades = useMemo(() => groupTradesByDate(currentTrades), [currentTrades]);

  const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col liquid-card rounded-3xl relative overflow-hidden">
      {/* Header Section */}
      <div className="shrink-0 flex flex-col gap-5 mb-4">
        <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold tracking-[0.3em] text-white uppercase">Journal</h2>
            <div className="flex gap-2">
                <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-nexus-muted hover:text-white transition-all">Filter</button>
                <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-nexus-muted hover:text-white transition-all">Export</button>
            </div>
        </div>
        
        {/* Table Headers */}
        <div className="overflow-x-auto pb-1 -mx-4 px-6 no-scrollbar">
           <div className="min-w-[600px]">
              <div className="flex items-center w-full text-[10px] text-[#555] uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] border border-white/5 rounded-2xl py-3 px-2 shadow-inner">
                  <div className="w-12 shrink-0"></div>
                  <div className="flex-1 grid grid-cols-7 gap-4 px-4">
                      <div>Symbol</div>
                      <div className="text-right">P&L</div>
                      <div className="text-right">Size</div>
                      <div className="pl-2">Time</div>
                      <div className="pl-2">Price</div>
                      <div className="text-right">Fees</div>
                      <div className="text-center">Direction</div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area - Strictly NO INTERNAL SCROLLING */}
      <div className="flex-1 relative w-full overflow-hidden">
        <div className="w-full h-full overflow-hidden">
          <div className="min-w-[600px] w-full h-full flex flex-col">
             <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-1 w-full"
              >
                {groupedTrades.length > 0 ? (
                  groupedTrades.map(([date, dateTrades]) => (
                    <div key={date} className="w-full">
                      <div className="mt-2 mb-3 pl-4">
                          <span className="text-[11px] font-bold text-nexus-accent uppercase tracking-[0.3em] opacity-80">
                              {getDateLabel(date)}
                          </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {dateTrades.map((trade) => (
                            <SwipeableRow key={trade.id} trade={trade} onEdit={onEdit} onDelete={onDelete} onViewDay={onViewDay} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-40 flex flex-col items-center justify-center text-nexus-muted/20">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold">No Entries Found</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* SPACER BEFORE PAGINATION AREA */}
            <div className="mt-auto h-12" />

            {/* PAGINATION AREA - Placed in the specific blue box region */}
            <div className="flex justify-end w-full px-4 mb-4">
                <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-2.5 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <span className="text-[10px] text-nexus-muted font-bold uppercase tracking-[0.2em] px-4 min-w-[120px] text-center">
                        PAGE {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={goToPrevPage} 
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/5 hover:bg-white/10 transition-all active:scale-90 disabled:opacity-5"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            onClick={goToNextPage} 
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/5 hover:bg-white/10 transition-all active:scale-90 disabled:opacity-5"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};