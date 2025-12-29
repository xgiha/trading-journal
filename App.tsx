
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutGrid, BookOpen, Plus, CloudOff, RefreshCw, Check, PieChart, BarChart3, Lock, Unlock, Loader2, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import WeeklyChart from './components/WeeklyChart';
import GrowthChart from './components/GrowthChart';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import TotalPnlCard from './components/TotalPnlCard';
import TimeAnalysis from './components/TimeAnalysis';
import Progress from './components/Progress';
import { Trade } from './types';

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
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "rounded-2xl border border-white/10 bg-[#141414] px-1 py-1 text-sm text-white shadow-2xl overflow-hidden",
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

// --- Button Component ---
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-white text-black shadow-sm hover:bg-zinc-100",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-white/10 bg-white/5 shadow-sm hover:bg-white/10 text-white",
        secondary: "bg-white/10 text-white shadow-sm hover:bg-white/20",
        ghost: "hover:bg-white/5 text-white",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-lg px-8",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

const QuickUserOptions = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="flex flex-col min-w-[140px]">
      <button
        onClick={onLogout}
        className="relative px-4 py-3 group hover:bg-red-500/10 rounded-xl cursor-pointer flex items-center justify-between transition-all text-white/60 hover:text-red-400"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">
          Log Out
        </span>
        <LogOut size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
};

// --- Input Component ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const radius = 100;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gradientRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useGSAP(() => {
      if (!gradientRef.current) return;
      gsap.set(gradientRef.current, {
        background: `radial-gradient(0px circle at ${mousePosition.x}px ${mousePosition.y}px, #3b82f6, transparent 80%)`,
      });
    }, { scope: containerRef });

    function handleMouseMove(e: React.MouseEvent) {
      if (!containerRef.current || !gradientRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      setMousePosition({ x, y });
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
      setMousePosition({ x, y });
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
        background: `radial-gradient(0px circle at ${mousePosition.x}px ${mousePosition.y}px, #3b82f6, transparent 80%)`,
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
        <input
          type={type}
          className={cn(
            `relative z-10 w-full rounded-2xl border-none bg-[#0a0a0a] px-5 py-4 text-sm text-white transition duration-400 focus:outline-none placeholder:text-white/10`,
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
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
      setError('Invalid identity or keycode');
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
      className="fixed inset-0 z-[250] bg-[#050505] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-[320px] flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-2 border transition-all duration-500",
            isUnlocked ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/5"
          )}>
            {isUnlocked ? (
              <Unlock size={20} className="text-emerald-400" />
            ) : (
              <Lock size={20} className="text-white/40" />
            )}
          </div>
          <h1 className="text-sm font-bold tracking-[0.4em] uppercase text-white">Access Vault</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Journal Authorization Required</p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest pl-1">Identity</label>
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
            <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest pl-1">Keycode</label>
            <Input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              disabled={isLoading || isUnlocked}
            />
          </div>

          {error && <span className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest text-center">{error}</span>}

          <button 
            type="submit"
            disabled={isLoading || isUnlocked}
            className={cn(
              "mt-4 w-full h-14 rounded-full font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 shadow-2xl",
              isUnlocked ? "bg-emerald-500 text-white" : "bg-white text-black"
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
  const [isMobile, setIsMobile] = useState(false);
  
  const lastSyncedTradesRef = useRef<string>("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const response = await fetch('/api/trades');
        let initialTrades: Trade[] = [];
        if (response.ok) {
          const cloudTrades = await response.json();
          if (cloudTrades && Array.isArray(cloudTrades)) initialTrades = cloudTrades;
        } else {
          const saved = localStorage.getItem('xgiha_trades');
          if (saved) initialTrades = JSON.parse(saved);
        }
        setTrades(initialTrades);
        lastSyncedTradesRef.current = JSON.stringify(initialTrades);
        setTimeout(() => {
          setIsInitialLoading(false);
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 2000);
        }, 600);
      } catch (e) {
        const saved = localStorage.getItem('xgiha_trades');
        if (saved) setTrades(JSON.parse(saved));
        setIsInitialLoading(false);
        setSyncStatus('error');
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (isInitialLoading) return;
    const currentTradesJson = JSON.stringify(trades);
    if (currentTradesJson === lastSyncedTradesRef.current) return;
    const timeout = setTimeout(async () => {
      localStorage.setItem('xgiha_trades', currentTradesJson);
      try {
        setSyncStatus('syncing');
        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: currentTradesJson,
        });
        if (response.ok) {
          lastSyncedTradesRef.current = currentTradesJson;
          setSyncStatus('success');
        } else throw new Error();
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        setSyncStatus('error');
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [trades, isInitialLoading]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const globalStats = useMemo(() => {
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const growthPct = trades.length > 0 ? (totalPnl / 50000) * 100 : 0;
    return { totalPnl, growthPct };
  }, [trades]);

  const handleAddTradeClick = useCallback((date: string) => { 
    setSelectedDate(date); setEditingTrade(undefined); setIsAddModalOpen(true); 
  }, []);

  const handleAddTradeBtnClick = useCallback(() => { 
    setSelectedDate(new Date().toISOString().split('T')[0]); setEditingTrade(undefined); setIsAddModalOpen(true); 
  }, []);

  const handleEditTrade = useCallback((trade: Trade) => { 
    setSelectedDate(trade.date); setEditingTrade(trade); setIsAddModalOpen(true); 
  }, []);
  
  const handleDeleteTrade = useCallback((tradeId: string) => { 
    setTrades(prev => prev.filter(t => t.id !== tradeId));
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
  }, []);

  const handleExportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup-${new Date().toISOString()}.json`; a.click();
  }, [trades]);

  const handleImportData = useCallback((imported: Trade[]) => {
    if (confirm("Import and replace all current trades?")) setTrades(imported);
  }, []);

  const handleSignIn = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('xgiha_auth', 'true');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('xgiha_auth');
    setIsAuthenticated(false);
  };

  const currentTabs = isMobile ? TABS : TABS.filter(t => !t.mobileOnly);
  const activeIndex = currentTabs.findIndex(t => t.id === activeTab);

  return (
    <div className="h-[100dvh] w-screen relative flex items-center justify-center overflow-hidden font-sans selection:bg-xgiha-accent selection:text-black bg-[#050505]">
      
      {/* DASHBOARD CONTENT - ALWAYS RENDERED BUT STATIC */}
      <div className="w-full h-full p-2 lg:p-3 relative overflow-hidden flex flex-col">
        <div className="w-full h-full glass-card lg:rounded-[25px] relative overflow-hidden flex flex-col p-4 lg:p-6 shadow-2xl">
          <AnimatePresence>
            {(syncStatus !== 'idle' && !isInitialLoading) && (
              <MotionDiv
                initial={{ y: -60, x: '-50%', opacity: 0 }}
                animate={{ y: 0, x: '-50%', opacity: 1 }}
                exit={{ y: -60, x: '-50%', opacity: 0 }}
                className="absolute top-6 left-1/2 z-[150] flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
              >
                {syncStatus === 'syncing' ? <RefreshCw size={11} className="text-xgiha-accent animate-spin" /> : 
                 syncStatus === 'success' ? <Check size={11} className="text-emerald-400" /> : <CloudOff size={11} className="text-red-400" />}
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white">
                    {syncStatus === 'syncing' ? 'Syncing Journal' : syncStatus === 'error' ? 'Sync Failed' : 'System Synced'}
                </span>
              </MotionDiv>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
              {isInitialLoading ? (
                <MotionDiv key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-6">
                    <Loader2 size={32} className="text-xgiha-accent animate-spin" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-xgiha-accent animate-pulse">Initializing Vault</span>
                </MotionDiv>
              ) : (
                <React.Fragment>
                  {!isMobile ? (
                    <div className="flex-1 min-h-0 flex flex-row gap-4 lg:gap-6 z-10 items-stretch h-full w-full">
                      <div className="flex flex-row h-full gap-4 lg:gap-6 w-[460px] shrink-0">
                        <div className="flex flex-col gap-4 w-[218px] shrink-0 h-full">
                          <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                          <Progress trades={trades} />
                        </div>
                        <div className="hidden lg:flex flex-col gap-4 w-[218px] shrink-0 h-full">
                          <TimeAnalysis trades={trades} />
                        </div>
                      </div>

                      <div className="relative flex flex-col items-center h-full min-w-0 flex-1 pb-24">
                        <div className="w-full h-full relative">
                          <AnimatePresence mode="wait">
                            <MotionDiv key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="absolute inset-0 w-full h-full flex flex-col">
                              {activeTab === 'dashboard' ? (
                                <TradingCalendar trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} />
                              ) : (
                                <JournalTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} onExport={handleExportData} onImport={handleImportData} />
                              )}
                            </MotionDiv>
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="flex flex-col h-full w-[460px] shrink-0 gap-4 lg:gap-6">
                        <div className="flex-1 min-h-0"><GrowthChart trades={trades} /></div>
                        <div className="flex-1 min-h-0"><WeeklyChart trades={trades} stats={globalStats} /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 flex flex-col z-10 w-full h-full pb-28">
                      <AnimatePresence mode="wait">
                        <MotionDiv key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="flex-1 overflow-y-auto no-scrollbar pt-2">
                          {activeTab === 'dashboard' && <TradingCalendar trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} />}
                          {activeTab === 'journal' && <JournalTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} onExport={handleExportData} onImport={handleImportData} />}
                          {activeTab === 'stats' && (
                            <div className="flex flex-col gap-4 px-1 pb-4">
                              <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                              <div className="h-[420px] shrink-0"><Progress trades={trades} /></div>
                              <TimeAnalysis trades={trades} />
                            </div>
                          )}
                          {activeTab === 'analytics' && (
                            <div className="flex flex-col gap-4 px-1 pb-4">
                              <div className="h-[320px] shrink-0"><GrowthChart trades={trades} /></div>
                              <div className="h-[320px] shrink-0"><WeeklyChart trades={trades} stats={globalStats} /></div>
                            </div>
                          )}
                        </MotionDiv>
                      </AnimatePresence>
                    </div>
                  )}

                  <div style={{ bottom: 'calc(1.5rem + var(--sab))' }} className="fixed lg:absolute left-0 right-0 z-[100] flex justify-center items-center pointer-events-none px-4">
                    <div className="flex items-center gap-3 lg:gap-4 pointer-events-auto w-full max-w-2xl lg:max-w-none justify-center">
                      <TooltipProvider delayDuration={0.1}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-full shrink-0 shadow-xl p-0 overflow-hidden ring-1 ring-white/10 border-none bg-white hover:bg-zinc-100 active:scale-[0.95]">
                               <img 
                                  src="https://i.imgur.com/FVC6bkF.png" 
                                  alt="User Avatar"
                                  className="w-full h-full object-cover rounded-full"
                                />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center">
                            <QuickUserOptions onLogout={handleLogout} />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="relative p-1 rounded-full flex items-center bg-white/5 backdrop-blur-md flex-1 lg:flex-none lg:w-[240px] h-14 shadow-2xl border border-white/5 overflow-hidden">
                          {currentTabs.map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 h-full rounded-full flex flex-col lg:flex-row items-center justify-center gap-1.5 transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-xgiha-muted hover:text-white/60'}`}>
                              <tab.icon size={isMobile ? 12 : 14} />
                              <span className="text-[8px] lg:text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
                            </button>
                          ))}
                          <MotionDiv layoutId="active-pill" className="absolute inset-y-1 z-0 rounded-full bg-white/10" style={{ width: `calc(${100 / currentTabs.length}% - 4px)` }} animate={{ x: `${activeIndex * 100}%` }} transition={{ type: "spring", stiffness: 400, damping: 35 }} />
                      </div>

                      <button onClick={handleAddTradeBtnClick} className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center active:scale-[0.95] transition-all duration-200 shadow-xl shrink-0 hover:bg-zinc-100">
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              )}
          </AnimatePresence>
        </div>
      </div>

      {/* SIGN IN SCREEN OVERLAY - ONLY SLIDING ELEMENT */}
      <AnimatePresence>
        {!isAuthenticated && (
          <SignInScreen onSignIn={handleSignIn} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && <AddTradeModal isOpen={true} onClose={() => setIsAddModalOpen(false)} date={selectedDate} onAdd={handleAddOrUpdateTrade} initialData={editingTrade} />}
        {isDetailModalOpen && <DayDetailsModal isOpen={true} onClose={() => setIsDetailModalOpen(false)} date={selectedDate} trades={selectedTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onAddTrade={handleAddTradeBtnClick} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
