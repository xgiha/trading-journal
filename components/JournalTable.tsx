import React, { useState, useRef, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  Trash2,
  Edit2,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trade } from '../types';
import Pagination from './Pagination';
import { Skeleton } from './Skeleton';

// Cast motion elements to any to bypass environment-specific type definition issues
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface JournalTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onViewDay: (date: string) => void;
  onExport?: () => void;
  onImport?: (trades: Trade[]) => void;
  readOnly?: boolean;
  loading?: boolean;
}

const ITEMS_PER_PAGE = 4;

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
  readOnly?: boolean;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ trade, onEdit, onDelete, onViewDay, readOnly }) => {
    // Use useMotionValue instead of state to prevent re-renders during drag
    const x = useMotionValue(0);
    const ref = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const isDragging = useRef(false);
    
    // Derived values for animations
    const editOpacity = useTransform(x, [10, 50], [0, 1]);
    const editX = useTransform(x, [0, 50], [-10, 0]);
    const deleteOpacity = useTransform(x, [-10, -50], [0, 1]);
    const deleteX = useTransform(x, [0, -50], [10, 0]);
    
    const isNewsTrade = !!trade.newsEvent;
    const hasNotes = !!trade.notes;
    const netPnl = trade.pnl - (trade.fee || 0);

    const onPointerDown = (e: React.PointerEvent) => {
        if (readOnly) return;
        isDragging.current = true;
        startX.current = e.clientX - x.get();
        ref.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || readOnly) return;
        const newX = e.clientX - startX.current;
        // Clamp between -120 and 120
        const clamped = Math.max(Math.min(newX, 120), -120);
        x.set(clamped);
    };

    const onPointerUp = (e: React.PointerEvent) => {
        if (readOnly) {
           onViewDay(trade.date);
           return;
        }
        isDragging.current = false;
        ref.current?.releasePointerCapture(e.pointerId);
        
        const currentX = x.get();
        const moveDist = Math.abs(currentX);
        
        // Click detection logic (very small movement)
        if (moveDist < 5) {
             if (currentX !== 0) animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
             else onViewDay(trade.date);
        } else {
            // Snap logic
            if (currentX > 60) animate(x, 100, { type: 'spring', stiffness: 400, damping: 30 });
            else if (currentX < -60) animate(x, -100, { type: 'spring', stiffness: 400, damping: 30 });
            else animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        }
    };

    return (
        <div className="relative h-20 w-full min-w-[600px] mb-2 rounded-[30px] select-none touch-pan-y overflow-hidden shrink-0">
            {!readOnly && (
              <div className="absolute inset-0 flex justify-between items-center px-10 bg-white/5 rounded-[30px] z-0">
                  <MotionButton 
                      type="button"
                      onClick={(e: any) => { e.stopPropagation(); onEdit(trade); animate(x, 0); }}
                      className="flex items-center gap-2 text-green-500 transition-all active:scale-95"
                      aria-label="Edit trade"
                      style={{ opacity: editOpacity, x: editX }}
                  >
                      <Edit2 size={22} />
                  </MotionButton>
                  <MotionButton 
                      type="button"
                      onClick={(e: any) => { e.stopPropagation(); onDelete(trade.id); animate(x, 0); }}
                      className="flex items-center gap-2 text-red-500 transition-all active:scale-95"
                      aria-label="Delete trade"
                      style={{ opacity: deleteOpacity, x: deleteX }}
                  >
                      <Trash2 size={22} />
                  </MotionButton>
              </div>
            )}

            <MotionDiv 
                ref={ref}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => { if(isDragging.current) onPointerUp({ pointerId: 0 } as any) }}
                className="absolute inset-0 bg-[#0F0F0F] rounded-[30px] flex items-center cursor-pointer hover:bg-[#141414] z-10"
                style={{ x }}
            >
                <div className="w-16 flex flex-col gap-1 justify-center items-center shrink-0 border-r border-white/5 h-full">
                    {isNewsTrade ? <Zap size={16} className="text-yellow-500 fill-yellow-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>}
                    {hasNotes && <FileText size={12} className="text-[#555]" />}
                </div>

                <div className="flex-1 grid grid-cols-7 gap-4 items-center px-10 h-full">
                    <div className="font-mono text-base text-white font-bold truncate tracking-wide uppercase">{trade.pair}</div>
                    <div className={`text-right font-mono text-base font-bold truncate ${netPnl >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(2)}
                    </div>
                    <div className="text-base text-[#AAA] font-mono truncate text-right">{trade.size || '-'}</div>
                    <div className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-6 text-[#444] font-bold">IN</span>
                            <span className="font-mono text-white/80 text-sm">{trade.entryTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-6 text-[#444] font-bold">OUT</span>
                            <span className="font-mono text-white/80 text-sm">{trade.exitTime || '-'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 justify-center">
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-6 text-[#444] font-bold">IN</span>
                            <span className="font-mono text-white/80 text-sm">{trade.entryPrice || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-6 text-[#444] font-bold">OUT</span>
                            <span className="font-mono text-white/80 text-sm">{trade.exitPrice || '-'}</span>
                        </div>
                    </div>
                    <div className="text-right text-base text-[#666] font-mono truncate">${(trade.fee || 0).toFixed(2)}</div>
                    <div className="flex justify-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border ${trade.type === 'Long' ? 'bg-green-500/5 text-green-500 border-green-500/10' : 'bg-red-500/5 text-red-400 border-red-500/10'}`}>
                          {trade.type === 'Long' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                    </div>
                </div>
            </MotionDiv>
        </div>
    );
};

const JournalTableComponent = ({ trades, onEdit, onDelete, onViewDay, onExport, onImport, readOnly = false, loading = false }: JournalTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          if (Array.isArray(data) && onImport) {
            onImport(data);
          } else {
            alert("Invalid data format. Please provide a valid backup JSON.");
          }
        } catch (error) {
          alert("Error parsing file.");
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col bg-white/[0.03] rounded-[25px] relative overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <div className="shrink-0 flex flex-col gap-5 mb-4 z-10">
        <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold tracking-[0.3em] text-white uppercase">Journal</h2>
            <div className="flex gap-2">
                {!readOnly && (
                  <button onClick={handleImportClick} className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 text-xgiha-muted hover:text-white transition-all flex items-center gap-2"><Download size={12} />Import</button>
                )}
                <button onClick={onExport} className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 text-xgiha-muted hover:text-white transition-all flex items-center gap-2"><Upload size={12} />Export</button>
            </div>
        </div>
        <div className="overflow-x-auto pb-1 -mx-4 px-6 no-scrollbar">
           <div className="min-w-[600px]">
              <div className="flex items-center w-full text-[10px] text-[#555] uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] rounded-[30px] py-3 px-2 shadow-inner">
                  <div className="w-16 shrink-0"></div>
                  <div className="flex-1 grid grid-cols-7 gap-4 px-8">
                      <div>Symbol</div>
                      <div className="text-right">Net P&L</div>
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
      <div className="flex-1 relative w-full overflow-hidden z-10">
        <div className="w-full h-full overflow-hidden">
          <div className="min-w-[600px] w-full h-full flex flex-col relative pb-20">
             <AnimatePresence mode="wait">
              <MotionDiv key={currentPage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex flex-col gap-1 w-full">
                {loading ? (
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-6 w-32 ml-4 rounded-md" />
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[30px]" />)}
                    </div>
                ) : groupedTrades.length > 0 ? (
                  groupedTrades.map(([date, dateTrades]) => (
                    <div key={date} className="w-full">
                      <div className="mt-2 mb-3 pl-4"><span className="text-[12px] font-bold text-xgiha-accent uppercase tracking-[0.3em] opacity-80">{getDateLabel(date)}</span></div>
                      <div className="flex flex-col gap-2">{dateTrades.map((trade) => <SwipeableRow key={trade.id} trade={trade} onEdit={onEdit} onDelete={onDelete} onViewDay={onViewDay} readOnly={readOnly} />)}</div>
                    </div>
                  ))
                ) : <div className="w-full h-40 flex flex-col items-center justify-center text-xgiha-muted/20"><span className="text-xs uppercase tracking-[0.2em] font-bold">No Entries Found</span></div>}
              </MotionDiv>
            </AnimatePresence>
            {!loading && <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center"><div className="w-full py-2 flex justify-center items-center"><Pagination total={totalPages} page={currentPage - 1} setPage={(p) => setCurrentPage(p + 1)} /></div></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const JournalTable = React.memo(JournalTableComponent);