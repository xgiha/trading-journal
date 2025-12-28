
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
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../types';
import Pagination from './Pagination';

const MotionDiv = motion.div as any;

interface JournalTableProps {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onViewDay: (date: string) => void;
  onExport?: () => void;
  onImport?: (trades: Trade[]) => void;
}

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

const SwipeableRow: React.FC<any> = ({ trade, onEdit, onDelete, onViewDay }) => {
    const [offset, setOffset] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const dragStartX = useRef(0);
    const isDragging = useRef(false);

    const onPointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        startX.current = e.clientX - offset;
        dragStartX.current = e.clientX;
        ref.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const x = e.clientX - startX.current;
        setOffset(Math.max(Math.min(x, 80), -80));
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
        <div className="relative h-16 w-full min-w-[500px] mb-1.5 rounded-[20px] select-none touch-pan-y overflow-hidden shrink-0">
            <div className="absolute inset-0 flex justify-between items-center px-6 bg-white/5 rounded-[20px] z-0">
                <button onClick={(e) => { e.stopPropagation(); onEdit(trade); setOffset(0); }} className="text-green-500"><Edit2 size={18} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(trade.id); setOffset(0); }} className="text-red-500"><Trash2 size={18} /></button>
            </div>
            <div 
                ref={ref} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                className="absolute inset-0 bg-[#0F0F0F] rounded-[20px] flex items-center transition-transform duration-300 z-10"
                style={{ transform: `translateX(${offset}px)` }}
            >
                <div className="w-12 flex justify-center items-center shrink-0 border-r border-white/5 h-full">
                    {trade.newsEvent ? <Zap size={14} className="text-yellow-500 fill-yellow-500" /> : <div className="w-1 h-1 rounded-full bg-[#333]"></div>}
                </div>
                <div className="flex-1 grid grid-cols-5 gap-3 items-center px-4 lg:px-6 h-full">
                    <div className="font-mono text-xs text-white font-bold truncate">{trade.pair}</div>
                    <div className={`text-right font-mono text-xs font-bold truncate ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(1)}</div>
                    <div className="text-[10px] text-[#666] font-mono text-right">{trade.size || '-'}</div>
                    <div className="flex flex-col text-[9px] text-right"><span className="text-white/60">{trade.entryTime}</span><span className="text-white/30">{trade.exitTime || '-'}</span></div>
                    <div className="flex justify-center">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${trade.type === 'Long' ? 'text-green-500 border-green-500/10' : 'text-red-500 border-red-500/10'}`}>
                          {trade.type === 'Long' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const JournalTableComponent = ({ trades, onEdit, onDelete, onViewDay, onExport, onImport }: JournalTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const sortedTrades = useMemo(() => [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.entryTime.localeCompare(a.entryTime)), [trades]);
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / ITEMS_PER_PAGE));
  const currentTrades = useMemo(() => sortedTrades.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [sortedTrades, currentPage]);
  const groupedTrades = useMemo(() => groupTradesByDate(currentTrades), [currentTrades]);

  return (
    <div className="w-full h-full p-2 lg:p-6 flex flex-col bg-white/[0.03] rounded-[20px] lg:rounded-[25px] relative overflow-hidden">
      <div className="shrink-0 flex justify-between items-center mb-4 px-2">
          <h2 className="text-[10px] lg:text-sm font-bold tracking-[0.3em] text-white uppercase">Journal</h2>
          <div className="flex gap-1">
              <button onClick={onExport} className="text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 text-xgiha-muted"><Download size={10} /></button>
          </div>
      </div>
      <div className="flex-1 relative w-full overflow-hidden z-10">
        <div className="w-full h-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[500px] w-full h-full flex flex-col pb-16">
             <div className="grid grid-cols-5 gap-3 items-center px-4 lg:px-6 mb-2 text-[9px] font-black uppercase text-[#444] tracking-widest pl-16">
                 <div>Pair</div><div className="text-right">PnL</div><div className="text-right">Qty</div><div className="text-right">Time</div><div className="text-center">Side</div>
             </div>
             <AnimatePresence mode="wait"><MotionDiv key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1 w-full">
                {groupedTrades.map(([date, dateTrades]) => (
                    <div key={date} className="w-full">
                      <div className="mt-1 mb-2 px-4"><span className="text-[10px] font-bold text-xgiha-accent uppercase tracking-[0.2em]">{getDateLabel(date)}</span></div>
                      {dateTrades.map((t) => <SwipeableRow key={t.id} trade={t} onEdit={onEdit} onDelete={onDelete} onViewDay={onViewDay} />)}
                    </div>
                ))}
             </MotionDiv></AnimatePresence>
             <div className="absolute bottom-0 left-0 right-0 flex justify-center py-2"><Pagination total={totalPages} page={currentPage - 1} setPage={(p) => setCurrentPage(p + 1)} /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const JournalTable = React.memo(JournalTableComponent);
