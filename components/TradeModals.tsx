import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, Clock, Type, Hash, DollarSign, ChevronLeft, ChevronRight, Zap, Plus, Image as ImageIcon, Trash2, UploadCloud, Loader2, Edit2, FileText, Target, Maximize2 } from 'lucide-react';
import { Trade } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

// --- Animation Configs ---
// A refined "middle-ground" spring: snappy with a premium feel and controlled bounce.
const MODAL_SPRING = {
  type: "spring",
  stiffness: 280,
  damping: 24,
  mass: 0.8
};

const BACKDROP_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const MODAL_VARIANTS = {
  initial: { y: 60, opacity: 0, scale: 0.94 },
  animate: { y: 0, opacity: 1, scale: 1 },
  exit: { y: 40, opacity: 0, scale: 0.96 }
};

// --- Helper: Number Formatter ---
const formatNumber = (value: any) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const raw = str.replace(/,/g, '');
  if (isNaN(Number(raw))) return str;
  
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const unformatNumber = (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/,/g, '');
};

// --- Helper: Image Processor (Resize to Base64) ---
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    const timeout = setTimeout(() => {
      reject(new Error("Image processing timed out"));
    }, 10000);

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        const elem = document.createElement('canvas');
        const maxWidth = 1000; 
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = elem.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load image into element"));
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
};

const uploadImageToBlob = async (file: File) => {
    const base64 = await processImageFile(file);
    fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, type: file.type })
    }).catch(e => console.warn("Background upload tracking failed", e));
    return base64;
};

// --- ImageZoomOverlay ---
const ImageZoomOverlay = ({ src, onClose }: { src: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (scale === 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  return (
    <MotionDiv variants={BACKDROP_VARIANTS} initial="initial" animate="animate" exit="exit" className="fixed inset-0 z-[350] bg-black/90 flex items-center justify-center p-8 backdrop-blur-sm" onClick={onClose}>
        <div className="absolute top-8 right-8 z-[360] flex gap-2">
            <div className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/5 backdrop-blur-md">
                Scroll to Zoom • Drag to Pan
            </div>
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors backdrop-blur-md"><X size={20} /></button>
        </div>
        
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative max-w-[85vw] max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl cursor-${isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in'}`}
          onClick={(e) => e.stopPropagation()}
        >
            <motion.img 
              src={src} 
              alt="Zoomed" 
              className="w-full h-full object-contain pointer-events-none select-none"
              animate={{ 
                scale: scale,
                x: position.x,
                y: position.y
              }}
              transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            />
        </div>
    </MotionDiv>
  );
};

// --- NoteZoomOverlay ---
const NoteZoomOverlay = ({ content, onClose }: { content: string, onClose: () => void }) => (
    <MotionDiv variants={BACKDROP_VARIANTS} initial="initial" animate="animate" exit="exit" className="fixed inset-0 z-[350] bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
        <button className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-50 bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        <MotionDiv variants={MODAL_VARIANTS} transition={MODAL_SPRING} className="bg-[#141414] p-6 md:p-8 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl relative border border-white/5" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5 sticky top-0 bg-[#141414] z-10 -mt-2 pt-2"><FileText size={18} className="text-white" /><h3 className="text-base font-bold text-white uppercase tracking-widest">Trade Note</h3></div>
            <div className="text-white/80 text-base leading-relaxed whitespace-pre-wrap font-sans break-words">{content}</div>
        </MotionDiv>
    </MotionDiv>
);

// --- Custom Calendar ---
const CustomDatePicker = ({ selectedDate, onChange }: { selectedDate: string, onChange: (date: string) => void }) => {
    const [viewDate, setViewDate] = useState(() => {
        return selectedDate ? new Date(selectedDate) : new Date();
    });
    
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (e: React.MouseEvent, delta: number) => {
        e.stopPropagation(); 
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
        setViewDate(newDate);
    };

    const handleDayClick = (day: number) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(dateStr);
    };

    const { days, monthLabel } = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const startDay = getFirstDayOfMonth(year, month);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        const dayCells = [];
        for(let i=0; i<startDay; i++) dayCells.push(null);
        for(let i=1; i<=daysInMonth; i++) dayCells.push(i);

        return { days: dayCells, monthLabel: `${monthNames[month]} ${year}` };
    }, [viewDate]);

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
        return viewDate.getFullYear() === sYear && viewDate.getMonth() + 1 === sMonth && day === sDay;
    };

    return (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 w-full shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={(e) => changeMonth(e, -1)} className="p-1.5 hover:bg-white/10 rounded-full text-[#888] hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">{monthLabel}</span>
                <button type="button" onClick={(e) => changeMonth(e, 1)} className="p-1.5 hover:bg-white/10 rounded-full text-[#888] hover:text-white transition-colors">
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] text-[#666] font-bold uppercase">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} className="h-8" />;
                    const selected = isSelected(day);
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => handleDayClick(day)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${selected ? 'bg-xgiha-accent text-white shadow-lg font-bold' : 'text-[#ccc] hover:bg-white/5 hover:text-white'}`}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

// --- Time Scroll Column ---
const TimeScrollColumn = ({ max, value, onChange }: { max: number, value: string, onChange: (val: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            const index = parseInt(value, 10);
            scrollRef.current.scrollTop = index * 32;
        }
    }, []);
    return (
        <div className="h-32 overflow-y-auto custom-scrollbar snap-y snap-mandatory bg-[#141414] rounded-lg" ref={scrollRef}>
            {Array.from({ length: max }).map((_, i) => {
                const val = String(i).padStart(2, '0');
                return (
                    <div key={i} onClick={(e) => { e.stopPropagation(); onChange(val); }} className={`h-8 flex items-center justify-center text-xs font-mono cursor-pointer snap-start transition-colors ${val === value ? 'bg-white/10 text-white font-bold' : 'text-[#666] hover:bg-white/5 hover:text-[#bbb]'}`}>
                        {val}
                    </div>
                );
            })}
        </div>
    );
};

const ScrollableTimeInput = ({ value, onChange, label, type }: { value: string, onChange: (val: string) => void, label: string, type: 'IN' | 'OUT' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const parts = value ? value.split(':') : ['00', '00', '00'];
    const h = parts[0] || '00', m = parts[1] || '00', s = parts[2] || '00';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (part: 'h'|'m'|'s', newVal: string) => {
        const newH = part === 'h' ? newVal : h, newM = part === 'm' ? newVal : m, newS = part === 's' ? newVal : s;
        onChange(`${newH}:${newM}:${newS}`);
    };

    return (
        <div className="flex-1 flex flex-col gap-1.5 relative" ref={dropdownRef}>
            <div className="flex items-center gap-1.5">
                 <div className={`p-0.5 rounded ${type === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <Clock size={10} className={type === 'IN' ? 'text-green-500' : 'text-red-500'} />
                 </div>
                 <span className="text-[9px] font-bold text-[#666] uppercase tracking-widest">{label}</span>
            </div>
            <div className={`flex items-center justify-between bg-[#141414] rounded-xl p-1 h-[38px] cursor-pointer transition-colors ${isOpen ? 'ring-1 ring-white' : 'hover:bg-white/[0.02]'}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="flex-1 text-center text-xs font-mono text-white">{h}</div>
                <span className="text-[10px] text-[#333] font-mono">:</span>
                <div className="flex-1 text-center text-xs font-mono text-white">{m}</div>
                <span className="text-[10px] text-[#333] font-mono">:</span>
                <div className="flex-1 text-center text-xs font-mono text-white">{s}</div>
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1A1A1A] rounded-xl p-2 shadow-2xl flex gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-full">
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[8px] text-center text-[#555] uppercase">HR</span>
                        <TimeScrollColumn max={24} value={h} onChange={(v) => handleChange('h', v)} />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[8px] text-center text-[#555] uppercase">MIN</span>
                        <TimeScrollColumn max={60} value={m} onChange={(v) => handleChange('m', v)} />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[8px] text-center text-[#555] uppercase">SEC</span>
                        <TimeScrollColumn max={60} value={s} onChange={(v) => handleChange('s', v)} />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- AddTradeModal ---
interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onAdd: (trade: Trade) => void;
  initialData?: Trade;
}

export const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, date, onAdd, initialData }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [isNewsTrade, setIsNewsTrade] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateContainerRef = useRef<HTMLDivElement>(null);

  const initialDate = date;
  const tradeToEdit = initialData;

  const [formData, setFormData] = useState({
    symbol: '', news: '', size: '', date: '', 
    timeIn: '09:30:00', timeOut: '10:00:00',
    priceIn: '', priceOut: '', fees: '',
    direction: 'Long', pnl: '', strategy: '',
    images: [] as string[], notes: '',
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (dateContainerRef.current && !dateContainerRef.current.contains(e.target as Node)) {
            setShowCalendar(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const getLocalFallback = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    if (tradeToEdit) {
      setIsNewsTrade(!!tradeToEdit.newsEvent);
      setFormData({
          symbol: tradeToEdit.pair, news: tradeToEdit.newsEvent || '', size: tradeToEdit.size || '',
          date: tradeToEdit.date, timeIn: tradeToEdit.entryTime, timeOut: tradeToEdit.exitTime || '00:00:00',
          priceIn: tradeToEdit.entryPrice?.toString() || '', priceOut: tradeToEdit.exitPrice?.toString() || '',
          fees: formatNumber(tradeToEdit.fee), direction: tradeToEdit.type,
          pnl: formatNumber(tradeToEdit.pnl), strategy: tradeToEdit.strategy || '',
          images: tradeToEdit.images || (tradeToEdit.image ? [tradeToEdit.image] : []), notes: tradeToEdit.notes || '',
      });
    } else {
      setIsNewsTrade(false);
      setFormData({
          symbol: '', news: '', size: '', date: initialDate || getLocalFallback(),
          timeIn: '09:30:00', timeOut: '10:00:00', priceIn: '', priceOut: '', fees: '',
          direction: 'Long', pnl: '', strategy: '', images: [], notes: '',
      });
    }
  }, [initialDate, tradeToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return; 

    const pnlValue = parseFloat(unformatNumber(formData.pnl));
    const newTrade: Trade = {
      id: tradeToEdit ? tradeToEdit.id : `T-${Date.now()}`,
      pair: formData.symbol?.toUpperCase() || 'UNKNOWN',
      newsEvent: isNewsTrade ? (formData.news || 'News Event') : undefined,
      size: formData.size || undefined,
      date: formData.date || new Date().toISOString().split('T')[0],
      entryTime: formData.timeIn || '00:00:00', exitTime: formData.timeOut,
      entryPrice: formData.priceIn ? parseFloat(unformatNumber(formData.priceIn)) : undefined,
      exitPrice: formData.priceOut ? parseFloat(unformatNumber(formData.priceOut)) : undefined,
      fee: parseFloat(unformatNumber(formData.fees)) || 0,
      type: formData.direction as 'Long' | 'Short',
      pnl: isNaN(pnlValue) ? 0 : pnlValue,
      strategy: formData.strategy, images: formData.images,
      image: formData.images[0], notes: formData.notes
    };
    onAdd(newTrade);
    onClose();
  };

  const handleNumberInput = (field: keyof typeof formData, value: string) => {
      const clean = value.replace(/[^0-9.-]/g, ''); 
      setFormData({ ...formData, [field]: formatNumber(clean) });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (formData.images.length >= 5) {
          alert("Maximum 5 images allowed per trade.");
          return;
      }
      const file = e.target.files?.[0];
      if (file) {
          try {
              setIsUploading(true);
              const url = await uploadImageToBlob(file);
              setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
          } catch (error) {
              console.error("Image upload failed", error);
              alert("Failed to process image.");
          } finally {
              setIsUploading(false);
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const removeImage = (index: number) => {
      setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  return (
    <MotionDiv 
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <MotionDiv 
        variants={BACKDROP_VARIANTS} 
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <MotionDiv 
        variants={MODAL_VARIANTS}
        transition={MODAL_SPRING}
        className="relative w-[95%] md:max-w-[420px] bg-[#141414] rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col border border-white/5"
      >
        <div className="p-5 pb-32 relative overflow-visible">
          <form id="entry-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 relative">
            <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                 <label htmlFor="symbol" className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5"><Type size={10} /> Symbol</label>
                 <input type="text" required className="w-full bg-transparent text-lg text-white font-mono placeholder-white/10 focus:outline-none" placeholder="BTCUSD" id="symbol" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} />
            </div>
             <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                 <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={10} /> Net P&L</label>
                 <div className="flex items-center gap-1 h-full">
                     <span className={`text-lg font-mono font-light ${(parseFloat(unformatNumber(formData.pnl || '0'))) > 0 ? 'text-green-500' : (parseFloat(unformatNumber(formData.pnl || '0'))) < 0 ? 'text-red-500' : 'text-[#666]'}`}>$</span>
                     <input type="text" className={`w-full bg-transparent text-lg font-mono font-medium focus:outline-none text-right ${(parseFloat(unformatNumber(formData.pnl || '0'))) > 0 ? 'text-green-500' : (parseFloat(unformatNumber(formData.pnl || '0'))) < 0 ? 'text-red-500' : 'text-white'}`} placeholder="0.00" value={formData.pnl} onChange={(e) => handleNumberInput('pnl', e.target.value)} />
                 </div>
            </div>
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-1 flex relative isolate h-[56px]">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] -z-10 shadow-lg ${formData.direction === 'Long' ? 'left-1 bg-[#153422]' : 'left-[50%] bg-[#381515]'}`}></div>
                <button type="button" onClick={() => setFormData({...formData, direction: 'Long'})} className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-200 z-10 ${formData.direction === 'Long' ? 'text-green-400' : 'text-[#666]'}`}><ArrowUpRight size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Long</span></button>
                <button type="button" onClick={() => setFormData({...formData, direction: 'Short'})} className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-200 z-10 ${formData.direction === 'Short' ? 'text-red-400' : 'text-[#666]'}`}><ArrowDownRight size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Short</span></button>
            </div>
            <div className="col-span-2 relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                 <label htmlFor="strategy" className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5"><Target size={10} /> Strategy</label>
                 <input type="text" className="w-full bg-transparent text-sm text-white font-medium focus:outline-none" placeholder="e.g., VWAP Rejection" id="strategy" value={formData.strategy} onChange={e => setFormData({...formData, strategy: e.target.value})} />
            </div>
            <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5"><Hash size={10} /> Lots</label>
                  <input type="text" className="w-full bg-transparent text-lg text-white font-mono focus:outline-none text-right" placeholder="Qty" value={formData.size} onChange={e => handleNumberInput('size', e.target.value)} />
            </div>
            <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={10} /> Fees</label>
                  <input type="text" className="w-full bg-transparent text-lg text-white font-mono focus:outline-none text-right" placeholder="0.00" value={formData.fees} onChange={e => handleNumberInput('fees', e.target.value)} />
            </div>
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-3 flex flex-col md:flex-row items-start gap-4 z-40 relative h-auto md:h-[84px]" ref={dateContainerRef}>
                 <div className="w-full md:flex-1 relative group h-full">
                      <div className="cursor-pointer h-full" onClick={() => setShowCalendar(!showCalendar)}>
                          <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-none mb-1.5"><CalendarIcon size={10} /> Date</label>
                          <div className={`text-sm font-mono truncate h-[38px] flex items-center ${formData.date ? 'text-white' : 'text-white/30'}`}>{formData.date || 'Select'}</div>
                      </div>
                      {showCalendar && (
                          <div className="absolute top-full left-0 z-50 mt-2 w-full md:w-[280px]">
                              <CustomDatePicker selectedDate={formData.date || ''} onChange={(date) => { setFormData({...formData, date}); setShowCalendar(false); }} />
                          </div>
                      )}
                 </div>
                 <div className="w-full md:w-[65%] flex gap-2">
                     <ScrollableTimeInput label="Entry" type="IN" value={formData.timeIn || '09:30:00'} onChange={(val) => setFormData({...formData, timeIn: val})} />
                     <ScrollableTimeInput label="Exit" type="OUT" value={formData.timeOut || '10:00:00'} onChange={(val) => setFormData({...formData, timeOut: val})} />
                 </div>
            </div>
             <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Entry Price</label>
                  <input type="text" className="w-full bg-transparent text-lg text-white font-mono focus:outline-none text-right" placeholder="0.00" value={formData.priceIn} onChange={e => handleNumberInput('priceIn', e.target.value)} />
            </div>
            <div className="relative bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Exit Price</label>
                  <input type="text" className="w-full bg-transparent text-lg text-white font-mono focus:outline-none text-right" placeholder="0.00" value={formData.priceOut} onChange={e => handleNumberInput('priceOut', e.target.value)} />
            </div>
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-2 flex items-center gap-3 transition-colors h-[64px]">
                <div onClick={() => setIsNewsTrade(!isNewsTrade)} className={`cursor-pointer h-full px-4 rounded-xl flex items-center gap-2 transition-all shrink-0 ${isNewsTrade ? 'bg-yellow-500/10 text-yellow-500' : 'bg-white/5 text-[#666]'}`}>
                    <Zap size={14} fill={isNewsTrade ? "currentColor" : "none"} />
                    <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">News Event</span>
                </div>
                <div className="flex-1 h-full relative flex flex-col justify-center">
                    <input type="text" className={`w-full bg-transparent text-sm text-white font-medium focus:outline-none placeholder-white/20 ${isNewsTrade ? 'opacity-100' : 'opacity-30 pointer-events-none'}`} placeholder={isNewsTrade ? "Event name..." : "Enable news event"} value={formData.news} onChange={e => setFormData({...formData, news: e.target.value})} disabled={!isNewsTrade} />
                </div>
            </div>
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-3 flex flex-col gap-1 h-[72px]">
                <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5"><FileText size={10} /> Notes</label>
                <textarea className="w-full h-full bg-transparent text-sm text-white placeholder-white/10 focus:outline-none resize-none custom-scrollbar leading-relaxed" placeholder="Add trading notes..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl p-2 flex items-center gap-3 h-[72px]">
                 <div className="pl-2 pr-3 h-full flex items-center"><label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0"><ImageIcon size={12} /> Attachments</label></div>
                 <div className="flex-1 flex gap-2 overflow-x-auto custom-scrollbar items-center">
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                     <div 
                        onClick={() => !isUploading && formData.images.length < 5 && fileInputRef.current?.click()} 
                        className={`w-10 h-10 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center transition-colors shrink-0 bg-white/[0.02] ${isUploading || formData.images.length >= 5 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-white hover:border-white text-[#666]'}`} 
                        title={formData.images.length >= 5 ? "Limit reached (5 max)" : "Add Image"}
                     >
                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                     </div>
                     {formData.images.map((img, idx) => (
                         <div key={idx} className="w-10 h-10 rounded-lg relative shrink-0 group overflow-hidden bg-black/40">
                             <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button type="button" onClick={() => removeImage(idx)} className="text-red-500 hover:text-red-400"><Trash2 size={12} /></button>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
          </form>
        </div>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <button 
            type="submit" 
            form="entry-form" 
            disabled={isUploading} 
            className="pointer-events-auto relative px-[141px] py-[27.5px] rounded-full text-black bg-white hover:bg-zinc-100 active:scale-95 transition-all duration-300 shadow-xl font-bold text-[13px] uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Save Trade'}
          </button>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
};

// --- DayDetailsModal ---
interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  onAddTrade: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ 
  isOpen, onClose, date, trades, onAddTrade, onEdit, onDelete, readOnly = false
}) => {
   const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
   const winRate = trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length) * 100 : 0;
   const sortedTrades = [...trades].sort((a, b) => a.entryTime.localeCompare(b.entryTime));
   const [zoomedImage, setZoomedImage] = useState<string | null>(null);
   const [zoomedNote, setZoomedNote] = useState<string | null>(null);

   const chartData = useMemo(() => {
     let runningPnl = 0;
     const firstEntryTime = sortedTrades.length > 0 ? sortedTrades[0].entryTime : 'Start';
     return [{ time: firstEntryTime, pnl: 0 }, ...sortedTrades.map(t => {
       runningPnl += t.pnl;
       return { time: t.exitTime || t.entryTime, pnl: runningPnl };
     })];
   }, [sortedTrades]);

   return (
     <MotionDiv 
        className="fixed inset-0 z-[100] flex items-center justify-center p-2 lg:p-4"
        initial="initial"
        animate="animate"
        exit="exit"
     >
        <MotionDiv variants={BACKDROP_VARIANTS} transition={{ duration: 0.3 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
        <MotionDiv 
            variants={MODAL_VARIANTS}
            transition={MODAL_SPRING}
            className="relative w-full h-full lg:w-[98%] lg:h-[95%] bg-[#0a0a0a] rounded-[2.5rem] shadow-[0_0_120px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden flex flex-col"
        >
             {/* Header Section */}
             <div className="px-8 lg:px-12 pt-10 pb-6 shrink-0 flex justify-between items-center border-b border-white/5 bg-black/20">
                 <div className="flex items-center gap-8">
                     <div>
                         <span className="text-[10px] uppercase text-white font-black tracking-[0.3em] mb-1 block">Selected Session</span>
                         <h2 className="text-2xl font-bold text-white tracking-tight">{date}</h2>
                     </div>
                     <div className="h-10 w-px bg-white/10"></div>
                     <div className="flex gap-10">
                         <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-white font-black tracking-[0.3em] mb-1">Session P&L</span>
                             <span className={`text-2xl font-mono font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toLocaleString()}
                             </span>
                         </div>
                         <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-white font-black tracking-[0.3em] mb-1">Win Rate</span>
                             <span className="text-2xl font-mono font-bold text-white">{winRate.toFixed(0)}%</span>
                         </div>
                         <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-white font-black tracking-[0.3em] mb-1">Executions</span>
                             <span className="text-2xl font-mono font-bold text-white">{trades.length}</span>
                         </div>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     {!readOnly && (
                         <button onClick={onAddTrade} className="bg-white text-black h-12 px-8 rounded-full flex items-center justify-center active:scale-[0.95] transition-all duration-200 shadow-xl shrink-0 hover:bg-zinc-100 font-black text-xs uppercase tracking-[0.2em] gap-2">
                            <Plus size={18} strokeWidth={4} /> Add trade
                         </button>
                     )}
                     <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#888] hover:text-white transition-all hover:bg-white/10 active:scale-95">
                         <X size={24} />
                     </button>
                 </div>
             </div>

             {/* Main Content Pane */}
             <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                <div className="w-full lg:w-[45%] flex flex-col p-8 lg:p-12 overflow-hidden border-r border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                            <span className="text-[11px] uppercase text-white font-black tracking-[0.25em]">Performance Chart</span>
                        </div>
                    </div>
                    {sortedTrades.length > 0 ? (
                        <div className="flex-1 w-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="white" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="white" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.2)" />
                                    <XAxis 
                                        dataKey="time" 
                                        axisLine={{ stroke: 'white', strokeOpacity: 1, strokeWidth: 1.5 }} 
                                        tickLine={{ stroke: 'white', strokeOpacity: 1 }} 
                                        tick={{ fill: 'white', fontSize: 11, fontWeight: 800 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={{ stroke: 'white', strokeOpacity: 1, strokeWidth: 1.5 }} 
                                        tickLine={{ stroke: 'white', strokeOpacity: 1 }} 
                                        tick={{ fill: 'white', fontSize: 11, fontWeight: 800 }}
                                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                                        domain={['auto', 'auto']}
                                        dx={-5}
                                    />
                                    <Tooltip 
                                        cursor={{ stroke: 'rgba(255,255,255,0.6)', strokeWidth: 2 }} 
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', fontSize: '12px' }} 
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        formatter={(val: number) => [`$${val.toFixed(2)}`, 'Equity']} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="pnl" 
                                        stroke="white" 
                                        strokeWidth={4} 
                                        fill="url(#pnlGradient)" 
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-[2rem]">
                            <span className="text-[10px] uppercase text-[#333] font-bold tracking-[0.3em]">No Visual Data Available</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 border-t lg:border-t-0 flex flex-col min-h-0 bg-white/[0.01]">
                    <div className="px-8 pt-8 lg:px-12 lg:pt-12 shrink-0">
                         <span className="text-[10px] uppercase text-white font-black tracking-[0.25em] mb-6 block">All trades of the day</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-12 lg:px-12 flex flex-col gap-6 pt-2">
                        {sortedTrades.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#333]">
                                    <FileText size={24} />
                                </div>
                                <span className="text-[10px] uppercase text-[#333] font-bold tracking-widest">No trades recorded for this session</span>
                            </div>
                        ) : (
                            sortedTrades.map(trade => (
                                <div key={trade.id} className="bg-[#141414] rounded-3xl p-7 border border-white/5 flex flex-col gap-8 group hover:bg-[#181818] hover:border-white/10 transition-all duration-300">
                                    <div className="flex items-start gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border mt-1.5 ${trade.type === 'Long' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-red-500/5 text-red-400 border-red-500/20'}`}>
                                            {trade.type === 'Long' ? <ArrowUpRight size={28} /> : <ArrowDownRight size={28} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-8">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-white font-mono font-black text-2xl tracking-tight uppercase">{trade.pair}</span>
                                                    {trade.newsEvent ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-[11px] font-black uppercase tracking-wider border border-yellow-500/20">
                                                            <Zap size={12} fill="currentColor" /> News trade
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#888] text-[11px] font-black uppercase tracking-wider border border-white/5">
                                                            Technical Entry
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-mono font-black text-2xl ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl).toLocaleString()}
                                                    </span>
                                                    <span className="text-[9px] text-[#555] font-bold uppercase tracking-widest">Result</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-14 gap-y-6">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Entry/Exit Time</span>
                                                    <div className="flex items-center gap-2.5 text-sm text-white font-mono font-black">
                                                        <Clock size={14} className="text-white" />
                                                        <span>{trade.entryTime}</span>
                                                        <span className="text-white/20">→</span>
                                                        <span>{trade.exitTime || 'Open'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Entry/exit price</span>
                                                    <div className="flex items-center gap-2.5 text-sm text-white font-mono font-black">
                                                        <DollarSign size={14} className="text-white" />
                                                        <span>{trade.entryPrice?.toLocaleString() || '---'}</span>
                                                        <span className="text-white/20">→</span>
                                                        <span>{trade.exitPrice?.toLocaleString() || '---'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Contracts</span>
                                                    <div className="flex items-center gap-2.5 text-sm text-white font-mono font-black">
                                                        <Hash size={14} className="text-white" />
                                                        <span>{trade.size || '---'} Lots</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Fees</span>
                                                    <div className="flex items-center gap-2.5 text-sm text-white font-mono font-black">
                                                        <DollarSign size={14} className="text-white" />
                                                        <span>${(trade.fee || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                {trade.strategy && (
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Strategy</span>
                                                        <div className="flex items-center gap-2.5 text-sm text-white font-mono font-black">
                                                            <Target size={14} className="text-white" />
                                                            <span className="uppercase">{trade.strategy}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!readOnly && (
                                            <div className="flex flex-col gap-3 pl-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => onEdit(trade)} className="p-3 text-[#555] hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Edit2 size={20} /></button>
                                                <button onClick={() => onDelete(trade.id)} className="p-3 text-[#555] hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                            </div>
                                        )}
                                    </div>
                                    {trade.notes && (
                                        <div className="flex flex-col gap-3">
                                            <div className="relative text-[13px] text-white/70 bg-black/40 rounded-2xl p-4 font-medium leading-relaxed border border-white/[0.03] min-h-[52px] flex items-center justify-between gap-4">
                                                <div className="flex-1 overflow-hidden">
                                                    <span className="text-white/80">
                                                        {trade.notes.length > 80 ? trade.notes.substring(0, 80) + "..." : trade.notes}
                                                    </span>
                                                </div>
                                                {trade.notes.length > 80 && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setZoomedNote(trade.notes!); }} 
                                                        className="p-2 text-white/40 hover:text-white bg-white/5 rounded-xl transition-all shrink-0"
                                                        title="Read full note"
                                                    >
                                                        <Maximize2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {((trade.images && trade.images.length > 0) || trade.image) && (
                                        <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1">
                                          {(trade.images || (trade.image ? [trade.image] : [])).map((img, idx) => (
                                            <div key={idx} className="relative h-20 w-32 shrink-0 rounded-xl overflow-hidden cursor-zoom-in group/img border border-white/5 bg-black" onClick={() => setZoomedImage(img)}>
                                                <img src={img} alt="Trade capture" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110 opacity-60 group-hover/img:opacity-100" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                                                        <ImageIcon size={14} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                          ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
             </div>
        </MotionDiv>
        <AnimatePresence>
            {zoomedImage && <ImageZoomOverlay src={zoomedImage} onClose={() => setZoomedImage(null)} />}
            {zoomedNote && <NoteZoomOverlay content={zoomedNote} onClose={() => setZoomedNote(null)} />}
        </AnimatePresence>
     </MotionDiv>
   )
};