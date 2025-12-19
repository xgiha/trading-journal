
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

// Fixed items per page to prevent scroll requirement
const ITEMS_PER_PAGE = 5;

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
  onViewDay: (date: string) => void;
}

// --- Swipeable Row Component ---
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
        const newOffset = Math.max(Math.min(x, 80), -80); 
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
            if (offset > 40) setOffset(60);       
            else if (offset < -40) setOffset(-60); 
            else setOffset(0);                      
        }
    };

    return (
        <div className="relative h-14 w-full mb-1.5 rounded-2xl select-none touch-none overflow-hidden group shrink-0">
            <div className="absolute inset-0 flex justify-between items-center px-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 z-0">
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(trade); setOffset(0); }}
                    className={`flex items-center gap-1.5 text-green-500 transition-all ${offset > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
                >
                    <Edit2 size={16} />
                    <span className="text-[10px] font-bold uppercase">Edit</span>
                </button>

                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(trade.id); setOffset(0); }}
                    className={`flex items-center gap-1.5 text-red-500 transition-all ${offset < 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
                >
                    <span className="text-[10px] font-bold uppercase">Del</span>
                    <Trash2 size={16} />
                </button>
            </div>

            <div 
                ref={ref}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="absolute inset-0 bg-[#0F0F0F] border border-white/5 rounded-2xl flex items-center transition-transform duration-300 ease-out z-10"
                style={{ transform: `translateX(${offset}px)` }}
            >
                <div className="w-8 flex flex-col gap-0.5 justify-center items-center shrink-0 border-r border-white/5 h-full">
                    {isNewsTrade && <Zap size={12} className="text-yellow-500 fill-yellow-500" />}
                    {hasNotes && <FileText size={8} className="text-[#666]" />}
                </div>

                <div className="flex-1 grid grid-cols-7 gap-2 items-center px-3 h-full">
                    <div className="font-mono text-[10px] text-white font-medium truncate">{trade.pair}</div>
                    <div className={`text-right font-mono text-[10px] font-medium truncate ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-[#E5E5E5] font-mono truncate text-right">{trade.size || '-'}</div>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[8px]"><span className="text-[#555] font-bold">IN</span><span className="font-mono text-[#E5E5E5]">{trade.entryTime.slice(0,5)}</span></div>
                        <div className="flex items-center gap-1 text-[8px]"><span className="text-[#555] font-bold">OT</span><span className="font-mono text-[#E5E5E5]">{trade.exitTime?.slice(0,5) || '-'}</span></div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[8px]"><span className="text-[#555] font-bold">IN</span><span className="font-mono text-[#E5E5E5] truncate max-w-[30px]">{trade.entryPrice || '-'}</span></div>
                        <div className="flex items-center gap-1 text-[8px]"><span className="text-[#555] font-bold">OT</span><span className="font-mono text-[#E5E5E5] truncate max-w-[30px]">{trade.exitPrice || '-'}</span></div>
                    </div>
                    <div className="text-right text-[10px] text-[#888] font-mono truncate">${(trade.fee || 0).toFixed(1)}</div>
                    <div className="flex justify-center">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${trade.type === 'Long' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {trade.type === 'Long' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
    <div className="w-full h-full p-4 flex flex-col justify-between liquid-card rounded-3xl relative overflow-hidden">
      <div className="shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">Journal</h2>
            <div className="flex gap-2">
            <button className="text-[9px] px-2 py-1 rounded bg-[#1A1A1A] text-[#888] hover:text-white">Filter</button>
            <button className="text-[9px] px-2 py-1 rounded bg-[#1A1A1A] text-[#888] hover:text-white">CSV</button>
            </div>
        </div>
        
        <div className="w-full">
            <div className="flex items-center w-full text-[8px] text-[#888] uppercase tracking-wider font-bold bg-white/5 border border-white/5 rounded-full py-2 backdrop-blur-xl">
                <div className="w-8 shrink-0"></div>
                <div className="flex-1 grid grid-cols-7 gap-2 px-3">
                    <div>Symbol</div>
                    <div className="text-right">P&L</div>
                    <div className="text-right">Size</div>
                    <div>Time</div>
                    <div>Price</div>
                    <div className="text-right">Fees</div>
                    <div className="text-center">Dir</div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 relative w-full mt-2 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-0.5 w-full h-full overflow-hidden"
            >
              {groupedTrades.length > 0 ? (
                groupedTrades.map(([date, dateTrades]) => (
                  <div key={date} className="w-full overflow-hidden">
                    <div className="mb-1 pl-2">
                        <span className="text-[8px] font-bold text-nexus-accent uppercase tracking-widest opacity-80">
                            {getDateLabel(date)}
                        </span>
                    </div>
                    {dateTrades.map((trade) => (
                        <SwipeableRow key={trade.id} trade={trade} onEdit={onEdit} onDelete={onDelete} onViewDay={onViewDay} />
                    ))}
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#333]">
                  <span className="text-[10px] uppercase tracking-widest font-bold">No Records</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
      </div>

      <div className="shrink-0 pt-2 flex justify-end items-center gap-3 border-t border-white/5 bg-transparent">
         <span className="text-[8px] text-nexus-muted uppercase tracking-widest">
           {currentPage} / {totalPages}
         </span>
         <div className="flex gap-1.5">
            <button onClick={goToPrevPage} disabled={currentPage === 1} className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-nexus-accent hover:text-black disabled:opacity-20"><ChevronLeft size={12} /></button>
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-nexus-accent hover:text-black disabled:opacity-20"><ChevronRight size={12} /></button>
         </div>
      </div>
    </div>
  );
};
