import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, Clock, Type, Hash, DollarSign, ChevronLeft, ChevronRight, Zap, Plus, Image as ImageIcon, Maximize2, Trash2, UploadCloud, Loader2, Edit2 } from 'lucide-react';
import { Trade } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper: Number Formatter ---
const formatNumber = (value: string) => {
  if (!value) return '';
  const raw = value.replace(/,/g, '');
  if (isNaN(Number(raw))) return value;
  
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

const unformatNumber = (value: string) => {
    return value.replace(/,/g, '');
};

// --- Helper: Image Processor (Resize to Base64) ---
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        // Max dimensions for storage efficiency
        const maxWidth = 1200; 
        const maxHeight = 1200;
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
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to Base64 (JPEG 0.8 quality)
        const dataUrl = elem.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- Helper: Upload Logic (Mocked to Base64) ---
const uploadImageToBlob = async (file: File) => {
    // Simulate network delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    const base64 = await processImageFile(file);
    return base64;
};

// --- Custom Calendar Component ---
const CustomDatePicker = ({ selectedDate, onChange }: { selectedDate: string, onChange: (date: string) => void }) => {
    const [viewDate, setViewDate] = useState(() => {
        return selectedDate ? new Date(selectedDate) : new Date();
    });
    
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (delta: number) => {
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

        return {
            days: dayCells,
            monthLabel: `${monthNames[month]} ${year}`
        };
    }, [viewDate]);

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        const [sYear, sMonth, sDay] = selectedDate.split('-').map(Number);
        return viewDate.getFullYear() === sYear && viewDate.getMonth() + 1 === sMonth && day === sDay;
    };

    return (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-full text-[#888] hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">{monthLabel}</span>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-full text-[#888] hover:text-white transition-colors">
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
                            className={`
                                h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                                ${selected 
                                    ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20 font-bold' 
                                    : 'text-[#ccc] hover:bg-white/5 hover:text-white'
                                }
                            `}
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
            const itemHeight = 32; 
            scrollRef.current.scrollTop = index * itemHeight;
        }
    }, []);

    return (
        <div className="h-32 overflow-y-auto custom-scrollbar scroll-smooth snap-y snap-mandatory bg-[#141414] rounded-lg" ref={scrollRef}>
            {Array.from({ length: max }).map((_, i) => {
                const val = String(i).padStart(2, '0');
                const isSelected = val === value;
                return (
                    <div 
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(val);
                        }}
                        className={`
                            h-8 flex items-center justify-center text-xs font-mono cursor-pointer snap-start transition-colors
                            ${isSelected ? 'bg-white/10 text-white font-bold' : 'text-[#666] hover:bg-white/5 hover:text-[#bbb]'}
                        `}
                    >
                        {val}
                    </div>
                );
            })}
        </div>
    );
};

// --- Scrollable Dropdown Time Input ---
const ScrollableTimeInput = ({ 
  value, 
  onChange, 
  label, 
  type 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  label: string, 
  type: 'IN' | 'OUT' 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const parts = value ? value.split(':') : ['00', '00', '00'];
    const h = parts[0] || '00';
    const m = parts[1] || '00';
    const s = parts[2] || '00';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (part: 'h'|'m'|'s', newVal: string) => {
        const newH = part === 'h' ? newVal : h;
        const newM = part === 'm' ? newVal : m;
        const newS = part === 's' ? newVal : s;
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
            
            <div 
                className={`flex items-center justify-between bg-[#141414] rounded-xl p-1 border h-[38px] cursor-pointer transition-colors ${isOpen ? 'border-nexus-accent' : 'border-white/5 hover:border-white/20'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 text-center text-xs font-mono text-white">{h}</div>
                <span className="text-[10px] text-[#333] font-mono">:</span>
                <div className="flex-1 text-center text-xs font-mono text-white">{m}</div>
                <span className="text-[10px] text-[#333] font-mono">:</span>
                <div className="flex-1 text-center text-xs font-mono text-white">{s}</div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl p-2 shadow-2xl flex gap-1 animate-in fade-in zoom-in-95 duration-200 min-w-full">
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
    )
}

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

  // Use date prop as initialDate, initialData prop as tradeToEdit
  const initialDate = date;
  const tradeToEdit = initialData;

  // Form State
  const [formData, setFormData] = useState({
    symbol: '',
    news: '',
    size: '',
    date: '', 
    timeIn: '09:30:00', 
    timeOut: '10:00:00',
    priceIn: '',
    priceOut: '',
    fees: '',
    direction: 'Long',
    pnl: '',
    images: [] as string[],
  });

  // Handle Reset & Pre-fill when modal opens (component mounts)
  useEffect(() => {
    if (tradeToEdit) {
      // Edit Mode
      setIsNewsTrade(!!tradeToEdit.newsEvent);
      // Normalize images
      let initialImages: string[] = [];
      if (tradeToEdit.images && tradeToEdit.images.length > 0) {
          initialImages = tradeToEdit.images;
      } else if (tradeToEdit.image) {
          initialImages = [tradeToEdit.image];
      }

      setFormData({
          symbol: tradeToEdit.pair,
          news: tradeToEdit.newsEvent || '',
          size: tradeToEdit.size || '',
          date: tradeToEdit.date,
          timeIn: tradeToEdit.entryTime,
          timeOut: tradeToEdit.exitTime || '00:00:00',
          priceIn: tradeToEdit.entryPrice?.toString() || '',
          priceOut: tradeToEdit.exitPrice?.toString() || '',
          fees: formatNumber(tradeToEdit.fee?.toString() || '0'),
          direction: tradeToEdit.type,
          pnl: formatNumber(tradeToEdit.pnl.toString()),
          images: initialImages,
      });
    } else {
      // New Mode
      setIsNewsTrade(false);
      setFormData({
          symbol: '',
          news: '',
          size: '',
          date: initialDate || new Date().toISOString().split('T')[0],
          timeIn: '09:30:00',
          timeOut: '10:00:00',
          priceIn: '',
          priceOut: '',
          fees: '',
          direction: 'Long',
          pnl: '',
          images: [],
      });
    }
  }, [initialDate, tradeToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return; // Prevent saving while upload in progress

    const pnlValue = parseFloat(unformatNumber(formData.pnl));
    const tradeId = tradeToEdit ? tradeToEdit.id : `T-${Date.now()}`;

    const newTrade: Trade = {
      id: tradeId,
      pair: formData.symbol?.toUpperCase() || 'UNKNOWN',
      newsEvent: isNewsTrade ? (formData.news || 'News Event') : undefined,
      size: formData.size || undefined,
      date: formData.date || new Date().toISOString().split('T')[0],
      entryTime: formData.timeIn || '00:00:00',
      exitTime: formData.timeOut,
      entryPrice: formData.priceIn ? parseFloat(unformatNumber(formData.priceIn)) : undefined,
      exitPrice: formData.priceOut ? parseFloat(unformatNumber(formData.priceOut)) : undefined,
      fee: parseFloat(unformatNumber(formData.fees)) || 0,
      type: formData.direction as 'Long' | 'Short',
      pnl: isNaN(pnlValue) ? 0 : pnlValue,
      images: formData.images,
      image: formData.images[0] // Backward compat
    };
    onAdd(newTrade);
    onClose();
  };

  const handleNumberInput = (field: keyof typeof formData, value: string) => {
      const clean = value.replace(/[^0-9.-]/g, ''); 
      const formatted = formatNumber(clean);
      setFormData({ ...formData, [field]: formatted });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
      }));
  }

  // Variants for animation
  const backdropVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 }
  };

  const modalVariants = {
      hidden: { y: "100%", opacity: 0, scale: 0.95 },
      visible: { y: 0, opacity: 1, scale: 1 },
      exit: { y: "100%", opacity: 0, scale: 0.95 }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      ></motion.div>

      {/* Modal Container */}
      <motion.div 
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-[95%] md:max-w-[420px] bg-[#141414] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[95vh]"
      >
        
        {/* Minimal Header */}
        <div className="px-6 pt-6 pb-2 flex justify-between items-center shrink-0 z-10">
          <h2 className="text-xl font-normal text-white tracking-tight font-[Google_Sans_Flex]">
            {tradeToEdit ? 'Edit Trade' : 'Add Trade'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#888] hover:text-white hover:bg-[#333] transition-all hover:rotate-90 duration-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Area - Bento Grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 custom-scrollbar pb-24 relative">
          <form id="entry-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 relative">
            
            {/* 1. Symbol */}
            <div className="relative bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex flex-col gap-1 focus-within:border-nexus-accent transition-colors h-[72px]">
                 <label htmlFor="symbol" className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Type size={10} /> Symbol
                 </label>
                 <input 
                   type="text" 
                   required
                   className="w-full bg-transparent text-lg text-white font-mono placeholder-white/10 focus:outline-none text-left"
                   placeholder="BTCUSD"
                   id="symbol"
                   value={formData.symbol}
                   onChange={e => setFormData({...formData, symbol: e.target.value})}
                 />
            </div>

            {/* 2. Net P&L (Moved to top) */}
             <div className="relative bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex flex-col gap-1 focus-within:border-nexus-accent transition-colors h-[72px]">
                 <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={10} /> Net P&L
                 </label>
                 <div className="flex items-center gap-1 h-full">
                     <span className={`text-lg font-mono font-light transition-colors ${
                        (parseFloat(unformatNumber(formData.pnl || '0'))) > 0 ? 'text-green-500' : (parseFloat(unformatNumber(formData.pnl || '0'))) < 0 ? 'text-red-500' : 'text-[#666]'
                     }`}>$</span>
                     <input 
                        type="text"
                        className={`w-full bg-transparent text-lg font-mono font-medium focus:outline-none text-right ${
                           (parseFloat(unformatNumber(formData.pnl || '0'))) > 0 ? 'text-green-500' : (parseFloat(unformatNumber(formData.pnl || '0'))) < 0 ? 'text-red-500' : 'text-white'
                        }`}
                        placeholder="0.00"
                        value={formData.pnl}
                        onChange={e => handleNumberInput('pnl', e.target.value)}
                     />
                 </div>
            </div>

            {/* 3. Direction (Full Width Bar) */}
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl border border-white/5 p-1 flex relative isolate h-[56px]">
                {/* Sliding Background Pill */}
                <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] -z-10 shadow-lg ${
                        formData.direction === 'Long' 
                            ? 'left-1 bg-[#153422] shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                            : 'left-[50%] bg-[#381515] shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    }`}
                ></div>

                <button
                  type="button"
                  onClick={() => setFormData({...formData, direction: 'Long'})}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-200 z-10 ${
                    formData.direction === 'Long' ? 'text-green-400' : 'text-[#666] hover:text-[#999]'
                  }`}
                >
                  <ArrowUpRight size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Long</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, direction: 'Short'})}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-200 z-10 ${
                    formData.direction === 'Short' ? 'text-red-400' : 'text-[#666] hover:text-[#999]'
                  }`}
                >
                  <ArrowDownRight size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Short</span>
                </button>
            </div>

            {/* 4. Size */}
            <div className="relative bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex flex-col gap-1 focus-within:border-nexus-accent transition-colors h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Hash size={10} /> Size
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-lg text-white font-mono placeholder-white/10 focus:outline-none text-right"
                    placeholder="Qty"
                    value={formData.size}
                    onChange={e => handleNumberInput('size', e.target.value)}
                  />
            </div>

            {/* 5. Fees */}
            <div className="relative bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex flex-col gap-1 focus-within:border-nexus-accent transition-colors h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={10} /> Fees
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-lg text-white font-mono placeholder-white/10 focus:outline-none text-right"
                    placeholder="0.00"
                    value={formData.fees}
                    onChange={e => handleNumberInput('fees', e.target.value)}
                  />
            </div>

            {/* 6. Combined Date & Time Section */}
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex items-start gap-4 z-40 relative h-[84px]">
                 {/* Date Block */}
                 <div className="flex-1 relative group cursor-pointer border-r border-white/5 pr-4 h-full" onClick={() => setShowCalendar(!showCalendar)}>
                      <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-none mb-1.5">
                        <CalendarIcon size={10} /> Date
                      </label>
                      <div className={`text-sm font-mono truncate h-[38px] flex items-center ${formData.date ? 'text-white' : 'text-white/30'}`}>
                          {formData.date || 'Select'}
                      </div>
                      {/* Calendar Dropdown */}
                      {showCalendar && (
                          <div className="absolute top-full left-0 z-50 mt-2 w-[280px]">
                              <CustomDatePicker 
                                  selectedDate={formData.date || ''} 
                                  onChange={(date) => {
                                      setFormData({...formData, date});
                                      setShowCalendar(false);
                                  }} 
                              />
                          </div>
                      )}
                 </div>

                 {/* Time Inputs */}
                 <div className="w-[30%] border-r border-white/5 pr-4">
                     <ScrollableTimeInput
                        label="Entry"
                        type="IN"
                        value={formData.timeIn || '09:30:00'}
                        onChange={(val) => setFormData({...formData, timeIn: val})}
                    />
                 </div>
                 <div className="w-[30%]">
                     <ScrollableTimeInput
                        label="Exit"
                        type="OUT"
                        value={formData.timeOut || '10:00:00'}
                        onChange={(val) => setFormData({...formData, timeOut: val})}
                    />
                 </div>
            </div>

             {/* 7. Entry Price */}
             <div className="relative bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex flex-col gap-1 focus-within:border-nexus-accent transition-colors h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Entry Price</label>
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-lg text-white font-mono placeholder-white/10 focus:outline-none text-right"
                    placeholder="0.00"
                    value={formData.priceIn}
                    onChange={e => handleNumberInput('priceIn', e.target.value)}
                  />
            </div>

            {/* 8. Exit Price */}
            <div className="relative bg-[#1E1E1E] rounded-2xl border border-white/5 p-3 flex flex-col gap-1 focus-within:border-nexus-accent transition-colors h-[72px]">
                  <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider">Exit Price</label>
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-lg text-white font-mono placeholder-white/10 focus:outline-none text-right"
                    placeholder="0.00"
                    value={formData.priceOut}
                    onChange={e => handleNumberInput('priceOut', e.target.value)}
                  />
            </div>

            {/* 9. News Event (Horizontal Layout) */}
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl border border-white/5 p-2 flex items-center gap-3 transition-colors h-[64px]">
                <div 
                    onClick={() => setIsNewsTrade(!isNewsTrade)}
                    className={`cursor-pointer h-full px-4 rounded-xl border flex items-center gap-2 transition-all shrink-0 ${
                        isNewsTrade 
                            ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                            : 'bg-white/5 border-white/10 text-[#666] hover:bg-white/10 hover:text-[#888]'
                    }`}
                >
                    <Zap size={14} fill={isNewsTrade ? "currentColor" : "none"} />
                    <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">News Event</span>
                </div>
                
                <div className="flex-1 h-full relative border-l border-white/5 pl-3 flex flex-col justify-center">
                    <input 
                        type="text"
                        className={`w-full bg-transparent text-sm text-white font-medium focus:outline-none placeholder-white/20 transition-opacity ${isNewsTrade ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
                        placeholder={isNewsTrade ? "Event name (e.g., FOMC, CPI)..." : "Enable news event to add details"}
                        value={formData.news}
                        onChange={e => setFormData({...formData, news: e.target.value})}
                        disabled={!isNewsTrade}
                    />
                </div>
            </div>

            {/* 10. Attachments (Compact Layout) */}
            <div className="col-span-2 bg-[#1E1E1E] rounded-2xl border border-white/5 p-2 flex items-center gap-3 h-[72px]">
                 <div className="pl-2 pr-3 border-r border-white/5 h-full flex items-center">
                    <label className="text-[9px] text-[#888] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <ImageIcon size={12} /> Attachments
                    </label>
                 </div>
                 
                 <div className="flex-1 flex gap-2 overflow-x-auto custom-scrollbar items-center">
                     <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/*"
                         onChange={handleFileChange}
                     />
                     
                     {/* Compact Upload Button */}
                     <div 
                         onClick={() => !isUploading && fileInputRef.current?.click()}
                         className={`w-10 h-10 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center transition-colors shrink-0 bg-white/[0.02] ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-white hover:border-nexus-accent text-[#666]'}`}
                         title="Add Image"
                     >
                         {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                     </div>

                     {/* Thumbnails */}
                     {formData.images.map((img, idx) => (
                         <div key={idx} className="w-10 h-10 rounded-lg border border-white/10 relative shrink-0 group overflow-hidden bg-black/40">
                             <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button 
                                     type="button"
                                     onClick={() => removeImage(idx)}
                                     className="text-red-500 hover:text-red-400"
                                 >
                                     <Trash2 size={12} />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>

          </form>
        </div>

        {/* Floating Save Button */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <button 
            type="submit"
            form="entry-form"
            disabled={isUploading}
            className="pointer-events-auto relative px-8 py-[18px] rounded-full text-white group overflow-hidden bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl hover:bg-white/[0.08] hover:border-white/[0.15] active:scale-95 active:bg-white/[0.12] transition-all duration-300 shadow-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Save Trade'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  trades: Trade[];
  onAddTrade: () => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ 
  isOpen, onClose, date, trades, onAddTrade, onEdit, onDelete 
}) => {
   
   // Calculate stats
   const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
   const winRate = trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length) * 100 : 0;

   // Sort trades by time
   const sortedTrades = [...trades].sort((a, b) => a.entryTime.localeCompare(b.entryTime));

   return (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            className="relative w-[95%] md:max-w-[500px] bg-[#141414] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
             {/* Header */}
             <div className="px-6 pt-6 pb-4 shrink-0 flex justify-between items-start">
                 <div>
                     <h2 className="text-xl font-normal text-white tracking-tight">{date}</h2>
                     <div className="flex gap-4 mt-2">
                         <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-[#888] font-bold">Net P&L</span>
                             <span className={`text-lg font-mono ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                 {totalPnl >= 0 ? '+' : ''}{formatNumber(totalPnl.toFixed(2))}
                             </span>
                         </div>
                         <div className="w-px bg-white/10 my-1"></div>
                         <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-[#888] font-bold">Win Rate</span>
                             <span className="text-lg font-mono text-white">
                                 {winRate.toFixed(0)}%
                             </span>
                         </div>
                     </div>
                 </div>
                 <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#888] hover:text-white hover:bg-[#333] transition-all"
                 >
                    <X size={18} />
                 </button>
             </div>

             {/* List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20 flex flex-col gap-2">
                 {sortedTrades.length === 0 ? (
                     <div className="py-10 text-center text-[#555] text-xs uppercase font-bold tracking-widest">
                         No trades recorded
                     </div>
                 ) : (
                     sortedTrades.map(trade => (
                         <div key={trade.id} className="bg-[#1E1E1E] rounded-xl p-3 border border-white/5 flex items-center gap-3">
                             {/* Icon/Type */}
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                                 trade.type === 'Long' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                             }`}>
                                 {trade.type === 'Long' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                             </div>
                             
                             {/* Info */}
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-0.5">
                                     <span className="text-white font-mono font-bold text-sm">{trade.pair}</span>
                                     <span className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                         {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                                     </span>
                                 </div>
                                 <div className="flex justify-between items-center text-[10px] text-[#888]">
                                     <div className="flex gap-2">
                                        <span>{trade.entryTime} - {trade.exitTime}</span>
                                        {trade.newsEvent && <span className="text-yellow-500 flex items-center gap-0.5"><Zap size={8} /> News</span>}
                                     </div>
                                     <span>Qty: {trade.size}</span>
                                 </div>
                             </div>

                             {/* Actions */}
                             <div className="flex gap-1 pl-2 border-l border-white/5">
                                 {onEdit && (
                                     <button 
                                       onClick={() => onEdit(trade)}
                                       className="p-2 text-[#666] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                     >
                                         <Edit2 size={14} />
                                     </button>
                                 )}
                                 {onDelete && (
                                     <button 
                                       onClick={() => onDelete(trade.id)}
                                       className="p-2 text-[#666] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                     >
                                         <Trash2 size={14} />
                                     </button>
                                 )}
                             </div>
                         </div>
                     ))
                 )}
             </div>

             {/* Add Button Area */}
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#141414] to-transparent pt-10 pointer-events-none flex justify-center">
                 <button
                    onClick={onAddTrade}
                    className="pointer-events-auto flex items-center gap-2 bg-nexus-accent text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                 >
                     <Plus size={16} /> Add Trade
                 </button>
             </div>
        </motion.div>
     </div>
   )
};