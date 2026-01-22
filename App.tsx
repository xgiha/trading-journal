import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutGrid, BookOpen, Plus, CloudOff, RefreshCw, Check, PieChart, BarChart3, Lock, Unlock, Loader2, LogOut, Eye, EyeOff, Calendar, Download, Upload, FileJson, AlertTriangle, Camera, Move, ZoomIn, Save, X, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import WeeklyChart from './components/WeeklyChart';
import GrowthChart from './components/GrowthChart';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import TotalPnlCard from './components/TotalPnlCard';
import TimeAnalysis from './components/TimeAnalysis';
import Progress from './components/Progress';
import { Trade, PayoutRecord } from './types';
import { Skeleton } from './components/Skeleton';

const MotionDiv = motion.div as any;

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- Radix Tooltip Components ---
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean;
  }
>(({ className, sideOffset = 12, showArrow = false, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className="z-[200]"
      {...props}
    >
      <MotionDiv
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "rounded-2xl border border-white/10 bg-[#141414] px-1 py-1 text-sm text-white shadow-2xl overflow-hidden origin-top",
          className,
        )}
      >
        {children}
        {showArrow && (
          <TooltipPrimitive.Arrow className="-my-px fill-[#141414]" />
        )}
      </MotionDiv>
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// --- Avatar Editor Modal ---
interface AvatarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Image: string) => void;
  currentAvatar: string | null;
}

const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({ isOpen, onClose, onSave, currentAvatar }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target?.result as string);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleSave = () => {
    if (!imageSrc || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    // Use higher resolution for better quality
    const size = 400; 
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw circular mask
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Clear background
    ctx.fillStyle = "#141414";
    ctx.fillRect(0,0, size, size);

    const img = imgRef.current;
    
    // Original image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // The visual container size in pixels (from CSS w-[240px])
    const containerSize = 240;
    
    // Draw logic:
    // 1. Center origin
    ctx.translate(size / 2, size / 2);
    
    // 2. Apply user transform (Pan & Zoom)
    // Scale position offset to match canvas resolution ratio
    const ratio = size / containerSize;
    ctx.translate(position.x * ratio, position.y * ratio);
    ctx.scale(scale, scale);
    
    // 3. Draw image centered, mimicking 'object-fit: cover' logic
    let drawWidth = size;
    let drawHeight = size;
    
    // object-fit: cover logic
    // If image aspect ratio is 'taller' than canvas (1:1), width matches size, height scales
    // If image aspect ratio is 'wider' than canvas (1:1), height matches size, width scales
    if (naturalWidth < naturalHeight) {
        // Taller image relative to square
        // Check AR to be sure. (w/h < 1)
        // Actually, comparison of ratios is safer: (w/h) < (size/size = 1)
        const imgRatio = naturalWidth / naturalHeight;
        if (imgRatio < 1) {
             drawWidth = size;
             drawHeight = size / imgRatio;
        } else {
             // Wider
             drawHeight = size;
             drawWidth = size * imgRatio;
        }
    } else {
        // Wider image or square
        const imgRatio = naturalWidth / naturalHeight;
        if (imgRatio > 1) {
            drawHeight = size;
            drawWidth = size * imgRatio;
        } else {
            // Square or Taller (if naturalWidth < naturalHeight failed earlier)
            drawWidth = size;
            drawHeight = size / imgRatio;
        }
    }
    
    // Simplified robust cover logic for 1:1 target:
    // Scale factor to cover size x size
    const scaleFactor = Math.max(size / naturalWidth, size / naturalHeight);
    const renderWidth = naturalWidth * scaleFactor;
    const renderHeight = naturalHeight * scaleFactor;

    ctx.drawImage(img, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
    
    onSave(canvas.toDataURL('image/jpeg', 0.9));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <MotionDiv
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <MotionDiv
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[#141414] w-full max-w-[360px] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest">Edit Avatar</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        
        <div className="p-8 flex flex-col items-center gap-6">
            {/* Preview Area */}
            <div className="relative w-[240px] h-[240px] rounded-full overflow-hidden border-2 border-dashed border-white/10 bg-black/50 group cursor-move shadow-inner">
                {imageSrc ? (
                     <img 
                        ref={imgRef}
                        src={imageSrc} 
                        alt="Preview" 
                        draggable={false}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        className="absolute inset-0 w-full h-full object-cover touch-none select-none"
                        style={{ 
                            transformOrigin: "center center",
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
                        }}
                     />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2 pointer-events-none">
                        <ImageIcon size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                    </div>
                )}
                
                {/* Overlay Hint */}
                {imageSrc && <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><Move size={24} className="text-white/80" /></div>}
            </div>

            {/* Controls */}
            {imageSrc ? (
                <div className="w-full flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                        <ZoomIn size={14} className="text-white/40" />
                        <input 
                            type="range" 
                            min="0.5" 
                            max="3" 
                            step="0.1" 
                            value={scale} 
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-xgiha-accent cursor-pointer"
                        />
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all">Change</button>
                        <button onClick={() => { setScale(1); setPosition({x:0,y:0}); }} className="px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"><RotateCcw size={14} /></button>
                     </div>
                </div>
            ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 group">
                    <Camera size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Upload Photo</span>
                </button>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>

        <div className="p-4 border-t border-white/5 bg-[#0f0f0f]">
            <button 
                onClick={handleSave} 
                disabled={!imageSrc}
                className="w-full py-4 rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save size={14} strokeWidth={3} /> Save Avatar
            </button>
        </div>
      </MotionDiv>
    </div>
  );
};

// --- Import Confirmation Modal ---
interface ImportModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  dataSummary: { trades: number; payouts: number } | null;
  error?: string | null;
}

const ImportModal: React.FC<ImportModalProps> = ({ onConfirm, onCancel, dataSummary, error }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <MotionDiv
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onCancel}
      />
      <MotionDiv
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative bg-[#141414] w-full max-w-[400px] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden p-8 flex flex-col gap-6"
      >
         <div className="flex items-center gap-3">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-xgiha-accent/10 border-xgiha-accent/20 text-xgiha-accent'}`}>
                 {error ? <AlertTriangle size={24} /> : <FileJson size={24} />}
             </div>
             <div>
                 <h3 className="text-white font-bold text-lg leading-tight">{error ? 'Import Failed' : 'Confirm Import'}</h3>
                 <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">{error ? 'Error Detected' : 'Restore Backup'}</span>
             </div>
         </div>

         {error ? (
             <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                 <p className="text-red-400 text-sm font-medium leading-relaxed">{error}</p>
             </div>
         ) : (
             <div className="flex flex-col gap-4">
                 <p className="text-white/60 text-sm leading-relaxed">
                     This action will <strong>replace</strong> your current journal entries with the data from the backup file. This cannot be undone.
                 </p>
                 <div className="flex gap-3">
                     <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center gap-1">
                         <span className="text-2xl font-mono font-bold text-white">{dataSummary?.trades || 0}</span>
                         <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Trades</span>
                     </div>
                     <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center gap-1">
                         <span className="text-2xl font-mono font-bold text-white">{dataSummary?.payouts || 0}</span>
                         <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Payouts</span>
                     </div>
                 </div>
             </div>
         )}

         <div className="flex gap-3 mt-2">
             <button onClick={onCancel} className="flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                {error ? 'Close' : 'Cancel'}
             </button>
             {!error && (
                 <button onClick={onConfirm} className="flex-1 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                    <Check size={14} strokeWidth={3} /> Restore
                 </button>
             )}
         </div>
      </MotionDiv>
    </div>
  );
};

const QuickUserOptions = ({ onLogout, onImport, onExport, onEditAvatar }: { onLogout: () => void, onImport: () => void, onExport: () => void, onEditAvatar: () => void }) => {
  return (
    <div className="flex flex-col min-w-[180px] p-1">
      <div className="px-3 py-2">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Settings</span>
      </div>
      <button
        onClick={onEditAvatar}
        className="relative px-3 py-2.5 group hover:bg-white/5 rounded-lg cursor-pointer flex items-center gap-3 transition-all text-white/60 hover:text-white"
      >
        <Camera size={14} className="opacity-70 group-hover:opacity-100" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Change Avatar</span>
      </button>

      <div className="h-px bg-white/5 my-1 mx-2" />

      <div className="px-3 py-2">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Data</span>
      </div>
      <button
        onClick={onImport}
        className="relative px-3 py-2.5 group hover:bg-white/5 rounded-lg cursor-pointer flex items-center gap-3 transition-all text-white/60 hover:text-white"
      >
        <Download size={14} className="opacity-70 group-hover:opacity-100" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Import JSON</span>
      </button>
      <button
        onClick={onExport}
        className="relative px-3 py-2.5 group hover:bg-white/5 rounded-lg cursor-pointer flex items-center gap-3 transition-all text-white/60 hover:text-white"
      >
        <Upload size={14} className="opacity-70 group-hover:opacity-100" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Export JSON</span>
      </button>
      
      <div className="h-px bg-white/5 my-1 mx-2" />
      
      <button
        onClick={onLogout}
        className="relative px-3 py-2.5 group hover:bg-red-500/10 rounded-lg cursor-pointer flex items-center gap-3 transition-all text-white/60 hover:text-red-400"
      >
        <LogOut size={14} className="opacity-70 group-hover:opacity-100" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Log Out</span>
      </button>
    </div>
  );
};

// --- Input Component ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, rightElement, ...props }, ref) => {
    const radius = 100;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gradientRef = useRef(null);
    const mousePosition = useRef({ x: 0, y: 0 });

    useGSAP(() => {
      if (!gradientRef.current) return;
      gsap.set(gradientRef.current, {
        background: `radial-gradient(0px circle at ${mousePosition.current.x}px ${mousePosition.current.y}px, #3b82f6, transparent 80%)`,
      });
    }, { scope: containerRef });

    function handleMouseMove(e: React.MouseEvent) {
      if (!containerRef.current || !gradientRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      mousePosition.current = { x, y };
      
      gsap.to(gradientRef.current, {
        background: `radial-gradient(${radius}px circle at ${x}px ${y}px, #3b82f6, transparent 80%)`,
        duration: 0.1,
      });
    }

    function handleMouseEnter(e: React.MouseEvent) {
      if (!containerRef.current || !gradientRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      mousePosition.current = { x, y };
      
      gsap.set(gradientRef.current, {
        background: `radial-gradient(0px circle at ${x}px ${y}px, #3b82f6, transparent 80%)`,
      });
      gsap.to(gradientRef.current, {
        background: `radial-gradient(${radius}px circle at ${x}px ${y}px, #3b82f6, transparent 80%)`,
        duration: 0.3,
      });
    }

    function handleMouseLeave() {
      if (!gradientRef.current) return;
      gsap.to(gradientRef.current, {
        background: `radial-gradient(0px circle at ${mousePosition.current.x}px ${mousePosition.current.y}px, #3b82f6, transparent 80%)`,
        duration: 0.3,
      });
    }

    return (
      <div
        ref={containerRef}
        className="group/input rounded-2xl p-[1px] transition duration-300 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={gradientRef} className="absolute inset-0 rounded-2xl" />
        <div className="relative flex items-center w-full">
          <input
            type={type}
            className={cn(
              `relative z-10 w-full rounded-2xl border-none bg-[#0a0a0a] px-5 py-4 text-sm text-white transition duration-400 focus:outline-none placeholder:text-white/30`,
              rightElement && "pr-12",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-4 z-20 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Calendar' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
  { id: 'stats', icon: PieChart, label: 'Stats', mobileOnly: true },
  { id: 'analytics', icon: BarChart3, label: 'Charts', mobileOnly: true },
];

const CREDENTIALS = {
  username: 'xgiha',
  password: '#gehanDagiya117'
};

const SignInScreen: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 800));

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      setIsUnlocked(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      onSignIn();
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <MotionDiv 
      key="signin-overlay"
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[250] bg-[#0B0B0B] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[380px] bg-[#111111] border border-white/5 rounded-[32px] p-8 md:p-10 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col items-center relative overflow-hidden">
        <div className="mb-10 flex flex-col items-center gap-3 w-full">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-2 border transition-all duration-500 shadow-lg",
            isUnlocked ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"
          )}>
            {isUnlocked ? (
              <Unlock size={22} className="text-emerald-400" />
            ) : (
              <Lock size={22} className="text-white/50" />
            )}
          </div>
          <h1 className="text-xl font-bold tracking-[0.4em] uppercase text-white">Access Vault</h1>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Username</label>
            <Input 
              type="text" 
              autoFocus
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
              disabled={isLoading || isUnlocked}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest pl-1">Password</label>
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              disabled={isLoading || isUnlocked}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/20 hover:text-white/40 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {error && <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest text-center">{error}</span>}

          <button 
            type="submit"
            disabled={isLoading || isUnlocked}
            className={cn(
              "mt-4 w-full h-14 rounded-xl font-black text-sm uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 shadow-xl",
              isUnlocked ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-gray-100"
            )}
          >
            {isUnlocked ? (
              <Check size={18} strokeWidth={3} />
            ) : isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </MotionDiv>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('xgiha_auth') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Tooltip State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const lastSyncedStateRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{trades: number, payouts: number} | null>(null);

  // Avatar Editor State
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 1024;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCloudData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    try {
      const response = await fetch(`/api/trades?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      
      let cloudTrades: Trade[] = [];
      let cloudPayouts: PayoutRecord[] = [];
      let cloudAvatar: string | null = null;

      if (response.ok) {
        let data = await response.json();
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch(e) {}
        }
        
        if (Array.isArray(data)) {
          cloudTrades = data;
        } else if (data && typeof data === 'object') {
          cloudTrades = data.trades || [];
          // Migration from number to PayoutRecord[]
          if (typeof data.payouts === 'number') {
            cloudPayouts = data.payouts > 0 ? [{ id: 'migrated', amount: data.payouts, date: new Date().toISOString() }] : [];
          } else {
            cloudPayouts = data.payouts || [];
          }
          if (data.userProfile && data.userProfile.avatar) {
             cloudAvatar = data.userProfile.avatar;
          }
        }
      }

      const stateToSync = { trades: cloudTrades, payouts: cloudPayouts, userProfile: { avatar: cloudAvatar } };
      const cloudJson = JSON.stringify(stateToSync);
      
      if (cloudJson !== lastSyncedStateRef.current) {
        setTrades(cloudTrades);
        setPayouts(cloudPayouts);
        setUserAvatar(cloudAvatar);
        lastSyncedStateRef.current = cloudJson;
        localStorage.setItem('xgiha_state', cloudJson);
      }
      
      if (!isSilent) setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      return stateToSync;
    } catch (e) {
      console.error("Sync Error:", e);
      if (!isSilent) setSyncStatus('error');
      return null;
    }
  }, []);

  const initData = useCallback(async () => {
    setIsInitialLoading(true);
    
    const saved = localStorage.getItem('xgiha_state') || localStorage.getItem('xgiha_trades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTrades(parsed);
          setPayouts([]);
        } else {
          setTrades(parsed.trades || []);
          if (typeof parsed.payouts === 'number') {
             setPayouts(parsed.payouts > 0 ? [{ id: 'migrated', amount: parsed.payouts, date: new Date().toISOString() }] : []);
          } else {
             setPayouts(parsed.payouts || []);
          }
          if (parsed.userProfile && parsed.userProfile.avatar) {
             setUserAvatar(parsed.userProfile.avatar);
          }
        }
        lastSyncedStateRef.current = saved;
      } catch(e) {}
    }

    if (isAuthenticated) {
      await fetchCloudData();
    }
    
    setIsInitialLoading(false);
  }, [isAuthenticated, fetchCloudData]);

  useEffect(() => { 
    initData(); 
  }, [initData]);

  useEffect(() => {
    if (!isAuthenticated || isInitialLoading) return;
    const interval = setInterval(() => {
      fetchCloudData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isInitialLoading, fetchCloudData]);

  useEffect(() => {
    if (isInitialLoading || !isAuthenticated) return;
    
    const currentState = { trades, payouts, userProfile: { avatar: userAvatar } };
    const currentStateJson = JSON.stringify(currentState);
    
    if (currentStateJson === lastSyncedStateRef.current) return;
    
    const timeout = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const response = await fetch('/api/trades', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: currentStateJson 
        });
        
        if (response.ok) { 
          lastSyncedStateRef.current = currentStateJson; 
          localStorage.setItem('xgiha_state', currentStateJson);
          setSyncStatus('success'); 
        } else {
          setSyncStatus('error');
        }
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) { 
        setSyncStatus('error'); 
      }
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [trades, payouts, userAvatar, isInitialLoading, isAuthenticated]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const globalStats = useMemo(() => {
    const totalNetPnl = trades.reduce((sum, t) => sum + (t.pnl - (t.fee || 0)), 0);
    const growthPct = trades.length > 0 ? (totalNetPnl / 50000) * 100 : 0;
    return { totalPnl: totalNetPnl, growthPct };
  }, [trades]);

  const handleAddTradeClick = useCallback((date: string) => { 
    setSelectedDate(date); setEditingTrade(undefined); setIsAddModalOpen(true); 
  }, []);

  const handleAddTradeBtnClick = useCallback((specificDate?: string) => { 
    setSelectedDate(specificDate || new Date().toISOString().split('T')[0]); 
    setEditingTrade(undefined); 
    setIsAddModalOpen(true); 
  }, []);

  const handleEditTrade = useCallback((trade: Trade) => { 
    setSelectedDate(trade.date); setEditingTrade(trade); setIsAddModalOpen(true); 
  }, []);
  
  const handleViewTradeStats = useCallback((trade: Trade) => {
    setSelectedDate(trade.date);
    setSelectedTrades([trade]);
    setIsDetailModalOpen(true);
  }, []);

  const handleDeleteTrade = useCallback((tradeId: string) => { 
    setTrades(prev => prev.filter(t => t.id !== tradeId));
    setSelectedTrades(prev => prev.filter(t => t.id !== tradeId));
  }, []);

  const handleViewDayClick = useCallback((date: string) => { 
    setSelectedDate(date); setSelectedTrades(trades.filter(t => t.date === date)); setIsDetailModalOpen(true); 
  }, [trades]);

  const handleViewWeekClick = useCallback((weekTrades: Trade[], weekLabel: string) => { 
    setSelectedDate(weekLabel); setSelectedTrades(weekTrades); setIsDetailModalOpen(true); 
  }, []);
  
  const handleAddOrUpdateTrade = useCallback((tradeData: Trade) => { 
    setTrades(prev => {
      const idx = prev.findIndex(t => t.id === tradeData.id); 
      let next = [...prev]; if (idx >= 0) next[idx] = tradeData; else next.push(tradeData);
      return next;
    });
    setSelectedTrades(prev => {
      const idx = prev.findIndex(t => t.id === tradeData.id);
      let next = [...prev];
      if (idx >= 0) next[idx] = tradeData; else if (tradeData.date === selectedDate) next.push(tradeData);
      return next;
    });
  }, [selectedDate]);

  const handleExportData = useCallback(() => {
    const blob = new Blob([JSON.stringify({ trades, payouts, userProfile: { avatar: userAvatar } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup-${new Date().toISOString()}.json`; a.click();
  }, [trades, payouts, userAvatar]);

  const handleImportClick = () => {
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
          
          let isValid = false;
          let stats = { trades: 0, payouts: 0 };

          if (Array.isArray(data)) {
            // Legacy Array format
            isValid = true;
            stats.trades = data.length;
          } else if (data && typeof data === 'object' && Array.isArray(data.trades)) {
            // New Object format (trades + payouts)
            isValid = true;
            stats.trades = data.trades.length;
            stats.payouts = Array.isArray(data.payouts) ? data.payouts.length : 0;
          }

          if (isValid) {
            setPendingImportData(data);
            setImportStats(stats);
            setImportError(null);
          } else {
            setPendingImportData(null);
            setImportStats(null);
            setImportError("Invalid data format. Please provide a valid backup JSON file.");
          }
          setShowImportModal(true);

        } catch (error) {
           setPendingImportData(null);
           setImportStats(null);
           setImportError("Error parsing file. Ensure it is a valid JSON.");
           setShowImportModal(true);
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = useCallback(() => {
      if (pendingImportData) {
        if (Array.isArray(pendingImportData)) {
          setTrades(pendingImportData);
          setPayouts([]);
        } else {
          setTrades(pendingImportData.trades || []);
          setPayouts(pendingImportData.payouts || []);
          if (pendingImportData.userProfile && pendingImportData.userProfile.avatar) {
             setUserAvatar(pendingImportData.userProfile.avatar);
          }
        }
        setShowImportModal(false);
        setPendingImportData(null);
      }
  }, [pendingImportData]);

  const handleSignIn = () => { 
    sessionStorage.setItem('xgiha_auth', 'true');
    setIsAuthenticated(true); 
  };
  
  const handleLogout = () => { 
    sessionStorage.removeItem('xgiha_auth'); 
    setIsAuthenticated(false); 
    setTrades([]); 
    setPayouts([]);
    setUserAvatar(null);
    localStorage.removeItem('xgiha_state');
    lastSyncedStateRef.current = "";
  };

  const currentTabs = isMobile ? TABS : TABS.filter(t => !t.mobileOnly);
  const activeIndex = currentTabs.findIndex(t => t.id === activeTab);

  return (
    <div className="h-[100dvh] w-screen relative flex items-center justify-center overflow-hidden font-sans selection:bg-xgiha-accent selection:text-black bg-[#050505]">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <AnimatePresence>
        {showImportModal && (
            <ImportModal 
                onConfirm={confirmImport} 
                onCancel={() => setShowImportModal(false)} 
                dataSummary={importStats}
                error={importError}
            />
        )}
        {showAvatarEditor && (
            <AvatarEditorModal 
                isOpen={showAvatarEditor} 
                onClose={() => setShowAvatarEditor(false)} 
                onSave={(img) => setUserAvatar(img)} 
                currentAvatar={userAvatar}
            />
        )}
      </AnimatePresence>

      <div className="w-full h-full p-2 lg:p-3 relative overflow-hidden flex flex-col">
        <div className="w-full h-full glass-card lg:rounded-[25px] relative overflow-hidden flex flex-col p-4 lg:p-6 shadow-2xl">
          <AnimatePresence>
            {(syncStatus !== 'idle' && !isInitialLoading && isAuthenticated) && (
              <MotionDiv
                initial={{ y: -60, x: '-50%', opacity: 0 }}
                animate={{ y: 0, x: '-50%', opacity: 1 }}
                exit={{ y: -60, x: '-50%', opacity: 0 }}
                className="absolute top-6 left-1/2 z-[150] flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl group/sync cursor-pointer"
                onClick={() => syncStatus !== 'syncing' && fetchCloudData()}
              >
                {syncStatus === 'syncing' ? <RefreshCw size={11} className="text-xgiha-accent animate-spin" /> : 
                 syncStatus === 'success' ? <Check size={11} className="text-emerald-400" /> : <CloudOff size={11} className="text-red-400" />}
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white">
                    {syncStatus === 'syncing' ? 'Cloud Synchronization' : syncStatus === 'error' ? 'Sync Communication Failed' : 'Vault Synced'}
                </span>
                <span className="hidden group-hover/sync:block text-[8px] font-bold text-white/40 uppercase tracking-widest pl-2 ml-2 border-l border-white/10">Force Refresh</span>
              </MotionDiv>
            )}
          </AnimatePresence>

          {isAuthenticated && (
            <React.Fragment>
              {!isMobile ? (
                <div className="flex-1 min-h-0 flex flex-row gap-4 lg:gap-6 z-10 items-stretch h-full w-full">
                  <div className="flex flex-row h-full gap-4 lg:gap-6 w-[460px] shrink-0">
                    <div className="flex flex-col gap-4 w-[218px] shrink-0 h-full overflow-hidden">
                      <TotalPnlCard loading={isInitialLoading} trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                      <div className="flex-1 min-h-0">
                        <Progress loading={isInitialLoading} trades={trades} payouts={payouts} onPayoutUpdate={setPayouts} />
                      </div>
                    </div>
                    <div className="hidden lg:flex flex-col gap-4 w-[218px] shrink-0 h-full">
                      <TimeAnalysis loading={isInitialLoading} trades={trades} onViewDay={handleViewDayClick} onViewTrade={handleViewTradeStats} />
                    </div>
                  </div>
                  <div className="relative flex flex-col items-center h-full min-w-0 flex-1 pb-24">
                    <div className="w-full h-full relative">
                      <AnimatePresence mode="wait">
                        <MotionDiv key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="absolute inset-0 w-full h-full flex flex-col">
                          {activeTab === 'dashboard' ? (
                            <TradingCalendar loading={isInitialLoading} trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} />
                          ) : (
                            <JournalTable loading={isInitialLoading} trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} />
                          )}
                        </MotionDiv>
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex flex-col h-full w-[460px] shrink-0 gap-4 lg:gap-6">
                    <div className="flex-1 min-h-0"><GrowthChart loading={isInitialLoading} trades={trades} /></div>
                    <div className="flex-1 min-h-0"><WeeklyChart loading={isInitialLoading} trades={trades} stats={globalStats} /></div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col z-10 w-full h-full pb-28">
                  <AnimatePresence mode="wait">
                    <MotionDiv key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="flex-1 overflow-y-auto no-scrollbar pt-2">
                      {activeTab === 'dashboard' && <TradingCalendar loading={isInitialLoading} trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} />}
                      {activeTab === 'journal' && <JournalTable loading={isInitialLoading} trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} /> }
                      {activeTab === 'stats' && (
                        <div className="flex flex-col gap-4 px-1 pb-4">
                          <TotalPnlCard loading={isInitialLoading} trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                          <div className="h-[420px] shrink-0"><Progress loading={isInitialLoading} trades={trades} payouts={payouts} onPayoutUpdate={setPayouts} /></div>
                          <TimeAnalysis loading={isInitialLoading} trades={trades} onViewDay={handleViewDayClick} onViewTrade={handleViewTradeStats} />
                        </div>
                      )}
                      {activeTab === 'analytics' && (
                        <div className="flex flex-col gap-4 px-1 pb-4">
                          <div className="h-[320px] shrink-0"><GrowthChart loading={isInitialLoading} trades={trades} /></div>
                          <div className="h-[320px] shrink-0"><WeeklyChart loading={isInitialLoading} trades={trades} stats={globalStats} /></div>
                        </div>
                      )}
                    </MotionDiv>
                  </AnimatePresence>
                </div>
              )}
              <div style={{ bottom: 'calc(1.5rem + var(--sab))' }} className="fixed lg:absolute left-0 right-0 z-[100] flex justify-center items-center pointer-events-none px-4">
                <div className="flex items-center gap-3 lg:gap-4 pointer-events-auto w-full max-w-2xl lg:max-w-none justify-center">
                  {isInitialLoading ? <Skeleton className="w-12 h-12 rounded-full shadow-xl shrink-0" /> : (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                        <TooltipTrigger asChild>
                              <button className="bg-white w-12 h-12 rounded-full flex items-center justify-center active:scale-[0.95] transition-all duration-200 shadow-xl shrink-0 overflow-hidden border-2 border-white/10 relative group">
                                {userAvatar ? (
                                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <img src="https://i.imgur.com/kCkmBR9.png" alt="User" className="w-full h-full object-cover" />
                                )}
                                {/* Optional: Hover overlay indicator */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                        </TooltipTrigger>
                        <AnimatePresence>
                          {isUserMenuOpen && (
                            <TooltipContent forceMount side="top" align="center" key="user-tooltip">
                              <QuickUserOptions onLogout={handleLogout} onImport={handleImportClick} onExport={handleExportData} onEditAvatar={() => setShowAvatarEditor(true)} />
                            </TooltipContent>
                          )}
                        </AnimatePresence>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <div className="relative p-1 rounded-full flex items-center bg-white/5 backdrop-blur-md flex-1 lg:flex-none lg:w-[240px] h-14 shadow-2xl border border-white/5 overflow-hidden">
                      {isInitialLoading ? <div className="flex-1 h-full px-6 flex items-center justify-between gap-4"><Skeleton className="h-4 flex-1 rounded-full" /><Skeleton className="h-4 flex-1 rounded-full" /><Skeleton className="h-4 flex-1 rounded-full" /></div> : (
                          <>
                            {currentTabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 h-full rounded-full flex flex-col lg:flex-row items-center justify-center gap-1.5 transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-xgiha-muted hover:text-white/60'}`}>
                                <tab.icon size={isMobile ? 12 : 14} /><span className="text-[8px] lg:text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
                                </button>
                            ))}
                            <MotionDiv layoutId="active-pill" className="absolute inset-y-1 z-0 rounded-full bg-white/10" style={{ width: `calc(${100 / currentTabs.length}% - 4px)` }} animate={{ x: `${activeIndex * 100}%` }} transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                          </>
                      )}
                  </div>
                  {isInitialLoading ? <Skeleton className="w-12 h-12 rounded-full shadow-xl shrink-0" /> : (
                      <button onClick={() => handleAddTradeBtnClick()} className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center active:scale-[0.95] transition-all duration-200 shadow-xl shrink-0 hover:bg-zinc-100">
                        <Plus size={20} strokeWidth={3} />
                      </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>{!isAuthenticated && <SignInScreen onSignIn={handleSignIn} />}</AnimatePresence>
      <AnimatePresence>
        {isDetailModalOpen && <DayDetailsModal key="detail-modal" isOpen={true} onClose={() => setIsDetailModalOpen(false)} date={selectedDate} trades={selectedTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onAddTrade={() => handleAddTradeBtnClick(selectedDate)} />}
        {isAddModalOpen && <AddTradeModal key="add-modal" isOpen={true} onClose={() => setIsAddModalOpen(false)} date={selectedDate} onAdd={handleAddOrUpdateTrade} initialData={editingTrade} />}
      </AnimatePresence>
    </div>
  );
}

export default App;