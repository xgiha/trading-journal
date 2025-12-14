import React, { useState, useRef, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../types';

interface JournalTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

// Reduced to 4 to ensure it fits comfortably within the card without scrolling or collapsing pagination
const ITEMS_PER_PAGE = 4;

// Helper to group trades by date
const groupTradesByDate = (trades: Trade[]) => {
  const groups: { [key: string]: Trade[] } = {};
  
  trades.forEach(trade => {
    const dateKey = trade.date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
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
  
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

interface SwipeableRowProps {
  trade: Trade;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

// --- Swipeable Row Component ---
const SwipeableRow: React.FC<SwipeableRowProps> = ({ trade, onEdit, onDelete }) => {
    const [offset, setOffset] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const isDragging = useRef(false);
    const isNewsTrade = !!trade.newsEvent;

    const onPointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX - offset;
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
        
        if (offset > 60) setOffset(100); 
        else if (offset < -60) setOffset(-100); 
        else setOffset(0); 
    };

    return (
        <div className="relative h-16 w-full min-w-[600px] mb-2 rounded-2xl select-none touch-pan-y overflow-hidden group shrink-0">
            
            {/* Actions Background Layer */}
            <div className="absolute inset-0 flex justify-between items-center px-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] z-0">
                <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation();
                      onEdit(trade); 
                      setOffset(0); 
                    }}
                    className={`flex items-center gap-2 text-green-500 transition-all duration-100 cursor-pointer active:scale-95 ${offset > 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                >
                    <Edit2 size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Edit</span>
                </button>

                <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation();
                      onDelete(trade.id); 
                      setOffset(0); 
                    }}
                    className={`flex items-center gap-2 text-red-500 transition-all duration-100 cursor-pointer active:scale-95 ${offset < 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                >
                    <span className="text-xs font-bold uppercase tracking-wider">Delete</span>
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Foreground Content Layer */}
            <div 
                ref={ref}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => { if(isDragging.current) onPointerUp({ pointerId: 0 } as any) }}
                className="absolute inset-0 bg-[#0F0F0F] border border-white/5 rounded-2xl flex items-center transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing hover:border-white/10 hover:bg-[#121212] z-10"
                style={{ transform: `translateX(${offset}px)` }}
            >
                {/* News Icon Area (Matches Header Spacer) */}
                <div className="w-10 flex justify-center items-center shrink-0 border-r border-white/5 h-full">
                    {isNewsTrade ? (
                        <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                    ) : (
                        <div className="w-1 h-1 rounded-full bg-[#222]"></div>
                    )}
                </div>

                {/* Data Grid (Matches Header Grid) */}
                <div className="flex-1 grid grid-cols-7 gap-4 items-center px-4 h-full">
                    {/* Symbol */}
                    <div className="font-mono text-xs text-white font-medium truncate">
                        {trade.pair}
                    </div>

                    {/* P&L */}
                    <div className={`text-right font-mono text-xs font-medium truncate ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                    </div>

                    {/* Size */}
                    <div className="text-xs text-[#E5E5E5] font-mono truncate text-right">
                        {trade.size || '-'}
                    </div>

                    {/* Time */}
                    <div className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-1.5 text-[9px] text-[#888]">
                            <span className="w-5 text-[#555] font-bold">IN</span>
                            <span className="font-mono text-[#E5E5E5]">{trade.entryTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#888]">
                            <span className="w-5 text-[#555] font-bold">OUT</span>
                            <span className="font-mono text-[#E5E5E5]">{trade.exitTime || '-'}</span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-1.5 text-[9px] text-[#888]">
                            <span className="w-5 text-[#555] font-bold">IN</span>
                            <span className="font-mono text-[#E5E5E5]">{trade.entryPrice || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#888]">
                            <span className="w-5 text-[#555] font-bold">OUT</span>
                            <span className="font-mono text-[#E5E5E5]">{trade.exitPrice || '-'}</span>
                        </div>
                    </div>

                    {/* Fees */}
                    <div className="text-right text-xs text-[#888] font-mono truncate">
                        ${(trade.fee || 0).toFixed(2)}
                    </div>

                    {/* Direction */}
                    <div className="flex justify-center">
                        <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${
                          trade.type === 'Long' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {trade.type === 'Long' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const JournalTable = ({ trades, onEdit, onDelete }: JournalTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Sort all trades (Date DESC -> Time DESC)
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.entryTime.localeCompare(a.entryTime);
    });
  }, [trades]);

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / ITEMS_PER_PAGE));

  // 2. Slice trades for current page
  const currentTrades = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTrades.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTrades, currentPage]);

  // 3. Group sliced trades
  const groupedTrades = useMemo(() => groupTradesByDate(currentTrades), [currentTrades]);

  const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between liquid-card rounded-3xl relative overflow-hidden">
      
      {/* Top Section: Header + Column Labels */}
      <div className="shrink-0 flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase">Journal</h2>
            <div className="flex gap-2">
            <button className="text-[10px] px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white transition-colors">Filter</button>
            <button className="text-[10px] px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white transition-colors">Export</button>
            </div>
        </div>
        
        {/* Table Column Headers - Pill Shape - Scrollable Container */}
        <div className="overflow-x-auto pb-1 -mx-4 px-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
           <div className="min-w-[600px]">
              <div className="flex items-center w-full text-[10px] text-[#888] uppercase tracking-wider font-bold bg-white/5 border border-white/5 rounded-full py-2.5 backdrop-blur-xl shadow-lg">
                  {/* Spacer for News Icon (matches row w-10) */}
                  <div className="w-10 shrink-0"></div>
                  
                  {/* Grid matching row structure */}
                  <div className="flex-1 grid grid-cols-7 gap-4 px-4">
                      <div>Symbol</div>
                      <div className="text-right">P&L</div>
                      <div className="text-right">Size</div>
                      <div>Time</div>
                      <div>Price</div>
                      <div className="text-right">Fees</div>
                      <div className="text-center">Direction</div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content - Horizontal Scroll for Mobile */}
      <div className="flex-1 relative w-full overflow-hidden mt-2">
        {/* Added no-scrollbar classes to hide the scrollbar visually */}
        <div className="absolute inset-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="min-w-[600px] w-full pb-4">
             <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                // Changed from x-axis animation to y-axis to prevent horizontal scrollbar flickering
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="flex flex-col gap-1 w-full"
              >
                {groupedTrades.length > 0 ? (
                  groupedTrades.map(([date, dateTrades]) => (
                    <div key={date} className="w-full">
                      {/* Date Label */}
                      <div className="mt-2 mb-2 pl-4">
                          <span className="text-xs font-bold text-nexus-accent uppercase tracking-widest opacity-80">
                              {getDateLabel(date)}
                          </span>
                      </div>
                      
                      {/* Rows */}
                      {dateTrades.map((trade) => (
                          <SwipeableRow key={trade.id} trade={trade} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="w-full h-40 flex flex-col items-center justify-center text-[#333]">
                    <span className="text-xs uppercase tracking-widest font-bold">No Entries Yet</span>
                    <span className="text-[10px] mt-2">Add a trade to get started</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Pagination Controls - Strictly separated at bottom */}
      <div className="shrink-0 pt-3 px-2 flex justify-end items-center gap-4 border-t border-white/5 z-20 bg-transparent">
         <span className="text-[10px] text-nexus-muted uppercase tracking-widest">
           Page {currentPage} of {totalPages}
         </span>
         <div className="flex gap-2">
            <button 
              onClick={goToPrevPage} 
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-nexus-accent hover:text-black transition-transform active:scale-95 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white disabled:scale-100"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-nexus-accent hover:text-black transition-transform active:scale-95 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-white disabled:scale-100"
            >
              <ChevronRight size={14} />
            </button>
         </div>
      </div>

    </div>
  );
};