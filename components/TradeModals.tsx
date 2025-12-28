
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, Clock, Type, Hash, DollarSign, ChevronLeft, ChevronRight, Zap, Plus, Image as ImageIcon, Trash2, Loader2, Edit2, FileText, Target } from 'lucide-react';
import { Trade } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

const formatNumber = (value: string) => {
  if (!value) return '';
  const raw = value.replace(/,/g, '');
  if (isNaN(Number(raw))) return value;
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const unformatNumber = (value: string) => value.replace(/,/g, '');

const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const maxWidth = 1200; 
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
        else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const uploadImageToBlob = async (file: File) => {
    const base64 = await processImageFile(file);
    try {
        await fetch('/api/upload', { method: 'POST', body: JSON.stringify({ filename: file.name, type: file.type }) });
    } catch (e) { console.warn("Upload tracking failed", e); }
    return base64;
};

const CustomDatePicker = ({ selectedDate, onChange }: { selectedDate: string, onChange: (date: string) => void }) => {
    const [viewDate, setViewDate] = useState(() => selectedDate ? new Date(selectedDate) : new Date());
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
    const changeMonth = (delta: number) => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
    const handleDayClick = (day: number) => onChange(`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    const { days, monthLabel } = useMemo(() => {
        const dInM = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
        const start = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
        const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const cells = [];
        for(let i=0; i<start; i++) cells.push(null);
        for(let i=1; i<=dInM; i++) cells.push(i);
        return { days: cells, monthLabel: `${names[viewDate.getMonth()]} ${viewDate.getFullYear()}` };
    }, [viewDate]);
    const isSelected = (day: number) => {
        const [sY, sM, sD] = selectedDate.split('-').map(Number);
        return viewDate.getFullYear() === sY && viewDate.getMonth() + 1 === sM && day === sD;
    };
    return (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 w-full border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-full text-[#888]"><ChevronLeft size={16} /></button>
                <span className="text-sm font-bold text-white">{monthLabel}</span>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-full text-[#888]"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (<div key={d} className="text-center text-[10px] text-[#444] font-bold uppercase">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => day ? (
                    <button key={day} type="button" onClick={() => handleDayClick(day)} className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs ${isSelected(day) ? 'bg-xgiha-accent text-white font-bold' : 'text-[#ccc] hover:bg-white/5'}`}>{day}</button>
                ) : <div key={`empty-${i}`} className="h-8" />)}
            </div>
        </div>
    );
};

const TimeScrollColumn = ({ max, value, onChange }: { max: number, value: string, onChange: (val: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = parseInt(value, 10) * 32; }, []);
    return (
        <div className="h-32 overflow-y-auto custom-scrollbar snap-y snap-mandatory bg-[#141414] rounded-lg" ref={scrollRef}>
            {Array.from({ length: max }).map((_, i) => {
                const val = String(i).padStart(2, '0');
                return (<div key={i} onClick={(e) => { e.stopPropagation(); onChange(val); }} className={`h-8 flex items-center justify-center text-xs font-mono cursor-pointer snap-start ${val === value ? 'bg-white/10 text-white font-bold' : 'text-[#666] hover:bg-white/5'}`}>{val}</div>);
            })}
        </div>
    );
};

const ScrollableTimeInput = ({ value, onChange, label, type }: { value: string, onChange: (val: string) => void, label: string, type: 'IN' | 'OUT' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const parts = value ? value.split(':') : ['00', '00', '00'];
    const h = parts[0] || '00', m = parts[1] || '00', s = parts[2] || '00';
    return (
        <div className="flex-1 flex flex-col gap-1.5 relative">
            <div className="flex items-center gap-1.5"><span className="text-[9px] font-bold text-[#666] uppercase tracking-widest">{label}</span></div>
            <div className={`flex items-center justify-between bg-[#141414] rounded-xl p-1 h-[38px] cursor-pointer transition-colors ${isOpen ? 'ring-1 ring-xgiha-accent' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="flex-1 text-center text-xs font-mono text-white">{h}</div>
                <span className="text-[10px] text-[#333]">:</span>
                <div className="flex-1 text-center text-xs font-mono text-white">{m}</div>
            </div>
            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-[#1A1A1A] rounded-xl p-2 shadow-2xl flex gap-1 border border-white/5">
                    <div className="flex-1 flex flex-col gap-1"><span className="text-[8px] text-center text-[#555]">HR</span><TimeScrollColumn max={24} value={h} onChange={(v) => onChange(`${v}:${m}:${s}`)} /></div>
                    <div className="flex-1 flex flex-col gap-1"><span className="text-[8px] text-center text-[#555]">MIN</span><TimeScrollColumn max={60} value={m} onChange={(v) => onChange(`${h}:${v}:${s}`)} /></div>
                </div>
            )}
        </div>
    );
};

interface AddTradeModalProps { isOpen: boolean; onClose: () => void; date: string; onAdd: (trade: Trade) => void; initialData?: Trade; }

export const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, date, onAdd, initialData }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [isNewsTrade, setIsNewsTrade] = useState(!!initialData?.newsEvent);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    symbol: initialData?.pair || '',
    news: initialData?.newsEvent || '',
    size: initialData?.size || '',
    date: initialData?.date || date,
    timeIn: initialData?.entryTime || '09:30:00',
    timeOut: initialData?.exitTime || '10:00:00',
    priceIn: initialData?.entryPrice?.toString() || '',
    priceOut: initialData?.exitPrice?.toString() || '',
    fees: formatNumber(initialData?.fee?.toString() || '0'),
    direction: initialData?.type || 'Long',
    pnl: formatNumber(initialData?.pnl.toString() || ''),
    strategy: initialData?.strategy || '',
    images: initialData?.images || (initialData?.image ? [initialData.image] : []),
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pnlValue = parseFloat(unformatNumber(formData.pnl));
    onAdd({
      id: initialData?.id || `T-${Date.now()}`,
      pair: formData.symbol.toUpperCase(),
      newsEvent: isNewsTrade ? (formData.news || 'News Event') : undefined,
      size: formData.size,
      date: formData.date,
      entryTime: formData.timeIn,
      exitTime: formData.timeOut,
      entryPrice: formData.priceIn ? parseFloat(unformatNumber(formData.priceIn)) : undefined,
      exitPrice: formData.priceOut ? parseFloat(unformatNumber(formData.priceOut)) : undefined,
      fee: parseFloat(unformatNumber(formData.fees)) || 0,
      type: formData.direction as 'Long' | 'Short',
      pnl: isNaN(pnlValue) ? 0 : pnlValue,
      strategy: formData.strategy,
      images: formData.images,
      notes: formData.notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90" onClick={onClose} />
      <MotionDiv initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full lg:max-w-[420px] bg-[#141414] rounded-t-[2rem] lg:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-6 flex justify-between items-center"><h2 className="text-xl font-normal text-white">{initialData ? 'Edit Trade' : 'Add Trade'}</h2><button onClick={onClose} className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#888]"><X size={18} /></button></div>
        <div className="flex-1 overflow-y-auto p-5 pb-24"><form id="entry-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]"><label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Symbol</label><input type="text" required className="w-full bg-transparent text-lg text-white font-mono focus:outline-none" placeholder="BTCUSD" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} /></div>
          <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]"><label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Net P&L</label><input type="text" className="w-full bg-transparent text-lg font-mono focus:outline-none text-right text-white" placeholder="0.00" value={formData.pnl} onChange={e => setFormData({...formData, pnl: formatNumber(e.target.value)})} /></div>
          <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-1 flex relative h-[56px]"><div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ${formData.direction === 'Long' ? 'left-1 bg-green-900/30' : 'left-[50%] bg-red-900/30'}`} /><button type="button" onClick={() => setFormData({...formData, direction: 'Long'})} className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl z-10 ${formData.direction === 'Long' ? 'text-green-400' : 'text-[#666]'}`}><ArrowUpRight size={14} /><span className="text-[10px] font-bold uppercase">Long</span></button><button type="button" onClick={() => setFormData({...formData, direction: 'Short'})} className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl z-10 ${formData.direction === 'Short' ? 'text-red-400' : 'text-[#666]'}`}><ArrowDownRight size={14} /><span className="text-[10px] font-bold uppercase">Short</span></button></div>
          <div className="col-span-2 relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]"><label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Strategy</label><input type="text" className="w-full bg-transparent text-sm text-white focus:outline-none" placeholder="Strategy name..." value={formData.strategy} onChange={e => setFormData({...formData, strategy: e.target.value})} /></div>
          <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-3 relative"><div className="flex items-center justify-between"><div className="cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}><label className="text-[9px] text-[#888] font-bold uppercase">Date</label><div className="text-sm font-mono text-white mt-1">{formData.date}</div>{showCalendar && <div className="absolute top-full left-0 z-50 mt-2 w-full"><CustomDatePicker selectedDate={formData.date} onChange={d => { setFormData({...formData, date: d}); setShowCalendar(false); }} /></div>}</div><div className="flex gap-2 w-[60%]"><ScrollableTimeInput label="IN" type="IN" value={formData.timeIn} onChange={v => setFormData({...formData, timeIn: v})} /><ScrollableTimeInput label="OUT" type="OUT" value={formData.timeOut} onChange={v => setFormData({...formData, timeOut: v})} /></div></div></div>
          <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[100px]"><label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Notes</label><textarea className="w-full h-full bg-transparent text-sm text-white focus:outline-none resize-none" placeholder="Trade observations..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
        </form></div>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 px-6"><button type="submit" form="entry-form" className="w-full py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest shadow-xl">Save Trade</button></div>
      </MotionDiv>
    </div>
  );
};

export const DayDetailsModal: React.FC<any> = ({ isOpen, onClose, date, trades, onAddTrade, onEdit, onDelete }) => {
   const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
   const sorted = [...trades].sort((a, b) => a.entryTime.localeCompare(b.entryTime));
   return (
     <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90" onClick={onClose} />
        <MotionDiv initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full lg:max-w-[500px] bg-[#141414] rounded-t-[2rem] lg:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
             <div className="p-6 flex justify-between items-start">
                 <div><h2 className="text-xl font-normal text-white">{date}</h2><span className={`text-lg font-mono ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{totalPnl >= 0 ? '+' : ''}{formatNumber(totalPnl.toFixed(2))}</span></div>
                 <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#888]"><X size={18} /></button>
             </div>
             <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-2">
                 {sorted.map(t => (
                     <div key={t.id} className="bg-[#1E1E1E] rounded-xl p-3 flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.type === 'Long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{t.type === 'Long' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</div>
                         <div className="flex-1"><div className="flex justify-between items-center"><span className="text-white font-mono font-bold text-sm">{t.pair}</span><span className={`font-mono font-bold text-sm ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{t.pnl >= 0 ? '+' : ''}{t.pnl}</span></div><div className="text-[10px] text-[#888]">{t.entryTime} - Qty: {t.size}</div></div>
                         <div className="flex gap-1"><button onClick={() => { onClose(); onEdit(t); }} className="p-2 text-[#666]"><Edit2 size={14} /></button><button onClick={() => onDelete(t.id)} className="p-2 text-[#666] hover:text-red-500"><Trash2 size={14} /></button></div>
                     </div>
                 ))}
             </div>
             <div className="absolute bottom-4 left-0 right-0 p-4 flex justify-center"><button onClick={onAddTrade} className="bg-white text-black px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl">Add Trade</button></div>
        </MotionDiv>
     </div>
   )
};
