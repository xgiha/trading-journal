
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutGrid, BookOpen, Plus, Cloud, CloudOff, RefreshCw, Check, PieChart, BarChart3, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import WeeklyChart from './components/WeeklyChart';
import GrowthChart from './components/GrowthChart';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import TotalPnlCard from './components/TotalPnlCard';
import TimeAnalysis from './components/TimeAnalysis';
import Progress from './components/Progress';
import { LoginView } from './components/LoginView';
import { Trade } from './types';

const MotionDiv = motion.div as any;

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dash' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
  { id: 'stats', icon: PieChart, label: 'Stats', mobileOnly: true },
  { id: 'analytics', icon: BarChart3, label: 'Charts', mobileOnly: true },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [authMode, setAuthMode] = useState<'admin' | 'guest' | 'none'>('none');
  
  const lastSyncedTradesRef = useRef<string>("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Initial Data Load & Auth Check
  useEffect(() => {
    const initData = async () => {
      // Check auth first
      const savedAuth = localStorage.getItem('xgiha_auth_mode');
      if (savedAuth === 'admin' || savedAuth === 'guest') {
        setAuthMode(savedAuth as 'admin' | 'guest');
      } else {
        setAuthMode('none');
        setIsInitialLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/trades');
        let initialTrades: Trade[] = [];
        
        if (response.ok) {
          const cloudTrades = await response.json();
          if (cloudTrades && Array.isArray(cloudTrades) && cloudTrades.length > 0) {
            initialTrades = cloudTrades;
          } else {
            const saved = localStorage.getItem('xgiha_trades');
            if (saved) initialTrades = JSON.parse(saved);
          }
        }
        
        setTrades(initialTrades);
        lastSyncedTradesRef.current = JSON.stringify(initialTrades);
        
        setTimeout(() => {
          setIsInitialLoading(false);
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 2000);
        }, 800);

      } catch (e) {
        console.error("Failed to sync with cloud", e);
        const saved = localStorage.getItem('xgiha_trades');
        if (saved) {
          const parsed = JSON.parse(saved);
          setTrades(parsed);
          lastSyncedTradesRef.current = saved;
        }
        setIsInitialLoading(false);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };
    initData();
  }, [authMode === 'none']); // Re-run if auth resets

  // 2. Data Sync logic (Debounced) - Only if Admin
  useEffect(() => {
    if (isInitialLoading || authMode !== 'admin') return;

    const currentTradesJson = JSON.stringify(trades);
    if (currentTradesJson === lastSyncedTradesRef.current) return;

    const syncTrades = async () => {
      localStorage.setItem('xgiha_trades', currentTradesJson);
      try {
        setSyncStatus('syncing');
        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: currentTradesJson,
        });
        if (!response.ok) throw new Error('Sync failed');
        lastSyncedTradesRef.current = currentTradesJson;
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };

    const timeout = setTimeout(syncTrades, 1500);
    return () => clearTimeout(timeout);
  }, [trades, isInitialLoading, authMode]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const globalStats = useMemo(() => {
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const initialBalance = 50000;
    const growthPct = trades.length > 0 ? (totalPnl / initialBalance) * 100 : 0;
    return { totalPnl, growthPct };
  }, [trades]);

  const handleLogin = (mode: 'admin' | 'guest') => {
    localStorage.setItem('xgiha_auth_mode', mode);
    setAuthMode(mode);
    setIsInitialLoading(true); // Trigger data load
  };

  const handleLogout = () => {
    if (confirm("Disconnecting from terminal. Proceed?")) {
      localStorage.removeItem('xgiha_auth_mode');
      setAuthMode('none');
      setTrades([]);
    }
  };

  const handleAddTradeClick = useCallback((date: string) => { 
    if (authMode !== 'admin') return;
    setSelectedDate(date); 
    setEditingTrade(undefined); 
    setIsAddModalOpen(true); 
  }, [authMode]);

  const handleAddTradeBtnClick = useCallback(() => { 
    if (authMode !== 'admin') return;
    setSelectedDate(new Date().toISOString().split('T')[0]); 
    setEditingTrade(undefined); 
    setIsAddModalOpen(true); 
  }, [authMode]);

  const handleEditTrade = useCallback((trade: Trade) => { 
    if (authMode !== 'admin') return;
    setSelectedDate(trade.date); 
    setEditingTrade(trade); 
    setIsAddModalOpen(true); 
  }, [authMode]);
  
  const handleDeleteTrade = useCallback((tradeId: string) => { 
    if (authMode !== 'admin') return;
    setTrades(prev => prev.filter(t => t.id !== tradeId));
  }, [authMode]);

  const handleViewDayClick = useCallback((date: string) => { 
    setSelectedDate(date); 
    setSelectedTrades(trades.filter(t => t.date === date)); 
    setIsDetailModalOpen(true); 
  }, [trades]);

  const handleViewWeekClick = useCallback((weekTrades: Trade[], weekLabel: string) => { 
    setSelectedDate(weekLabel); 
    setSelectedTrades(weekTrades); 
    setIsDetailModalOpen(true); 
  }, []);
  
  const handleAddOrUpdateTrade = useCallback((tradeData: Trade) => { 
    if (authMode !== 'admin') return;
    setTrades(prev => {
      const existingIndex = prev.findIndex(t => t.id === tradeData.id); 
      let newTrades = existingIndex >= 0 ? [...prev] : [...prev, tradeData];
      if (existingIndex >= 0) newTrades[existingIndex] = tradeData;
      return newTrades;
    });
  }, [authMode]);

  const handleExportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trades]);

  const handleImportData = useCallback((importedTrades: Trade[]) => {
    if (authMode !== 'admin') return;
    if (confirm("Importing data will replace all current trades. Proceed?")) {
      setTrades(importedTrades);
    }
  }, [authMode]);

  const currentTabs = isMobile ? TABS : TABS.filter(t => !t.mobileOnly);
  const activeIndex = currentTabs.findIndex(t => t.id === activeTab);

  if (authMode === 'none') {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="h-[100dvh] w-screen relative flex items-center justify-center p-2 lg:p-3 overflow-hidden font-sans selection:bg-xgiha-accent selection:text-black">
      <div className="w-full h-full glass-card lg:rounded-[25px] relative overflow-hidden flex flex-col p-4 lg:p-6 transition-all duration-500 shadow-2xl">
        
        {/* Sync Status / Auth Label Header */}
        <AnimatePresence>
          {((syncStatus !== 'idle' && !isInitialLoading) || authMode === 'guest') && (
            <MotionDiv
              initial={{ y: -60, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -60, x: '-50%', opacity: 0 }}
              className="absolute top-6 left-1/2 z-[150] flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
            >
                {authMode === 'guest' ? (
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-xgiha-accent animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white">Guest Terminal (Read Only)</span>
                  </span>
                ) : (
                  <>
                    {syncStatus === 'syncing' && <RefreshCw size={11} className="text-xgiha-accent animate-spin" />}
                    {syncStatus === 'success' && <Check size={11} className="text-emerald-400" />}
                    {syncStatus === 'error' && <CloudOff size={11} className="text-red-400" />}
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white">
                        {syncStatus === 'syncing' ? 'Syncing Journal' : syncStatus === 'error' ? 'Sync Failed' : 'System Synced'}
                    </span>
                  </>
                )}
            </MotionDiv>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
            {isInitialLoading ? (
               <MotionDiv 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6"
               >
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-xgiha-accent rounded-full animate-spin" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-xgiha-accent animate-pulse">Initializing Data Stream</span>
                  </div>
               </MotionDiv>
            ) : (
              <React.Fragment>
                {!isMobile ? (
                  // DESKTOP LAYOUT (Preserved High-Density)
                  <MotionDiv 
                    key="desktop-grid"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 min-h-0 flex flex-row gap-4 lg:gap-6 z-10 items-stretch h-full w-full"
                  >
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
                        <AnimatePresence mode="wait" initial={false}>
                          <MotionDiv
                            key={activeTab}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="absolute inset-0 w-full h-full flex flex-col"
                          >
                            {activeTab === 'dashboard' ? (
                              <TradingCalendar trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} readOnly={authMode === 'guest'} />
                            ) : (
                              <JournalTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} onExport={handleExportData} onImport={handleImportData} readOnly={authMode === 'guest'} />
                            )}
                          </MotionDiv>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex flex-col h-full w-[460px] shrink-0 gap-4 lg:gap-6">
                      <div className="flex-1 min-h-0"><GrowthChart trades={trades} /></div>
                      <div className="flex-1 min-h-0"><WeeklyChart trades={trades} stats={globalStats} /></div>
                    </div>
                  </MotionDiv>
                ) : (
                  // MOBILE LAYOUT (Tabbed Navigation)
                  <div className="flex-1 min-h-0 flex flex-col z-10 w-full h-full pb-28">
                    <AnimatePresence mode="wait">
                      <MotionDiv
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 overflow-y-auto no-scrollbar pt-2"
                      >
                        {activeTab === 'dashboard' && (
                          <TradingCalendar trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} readOnly={authMode === 'guest'} />
                        )}
                        {activeTab === 'journal' && (
                          <JournalTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} onExport={handleExportData} onImport={handleImportData} readOnly={authMode === 'guest'} />
                        )}
                        {activeTab === 'stats' && (
                          <div className="flex flex-col gap-4 px-1 pb-4">
                            <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                            <div className="h-[420px] shrink-0"><Progress trades={trades} /></div>
                            <div className="h-auto shrink-0"><TimeAnalysis trades={trades} /></div>
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

                {/* NAVIGATION DOCK */}
                <MotionDiv 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ bottom: 'calc(1.5rem + var(--sab))' }}
                  className="fixed lg:absolute left-0 right-0 z-[100] flex justify-center items-center pointer-events-none px-4"
                >
                  <div className="flex items-center gap-3 lg:gap-4 pointer-events-auto w-full max-w-xl lg:max-w-none justify-center">
                    
                    {/* Log Out Button */}
                    <button 
                      onClick={handleLogout}
                      className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/5 hover:bg-red-500/10 text-xgiha-muted hover:text-red-400 flex items-center justify-center transition-all duration-300 border border-white/5 group"
                    >
                      <LogOut size={isMobile ? 14 : 18} />
                    </button>

                    {/* Navigation Tabs Pill */}
                    <div className="relative p-1 rounded-full flex items-center bg-white/5 backdrop-blur-md flex-1 lg:flex-none lg:w-[260px] shadow-2xl border border-white/5 overflow-hidden">
                        {currentTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3.5 rounded-full flex flex-col lg:flex-row items-center justify-center gap-1 transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-xgiha-muted hover:text-white/60'}`}
                          >
                            <tab.icon size={isMobile ? 12 : 14} />
                            <span className="text-[8px] lg:text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
                          </button>
                        ))}
                        <MotionDiv
                          layoutId="active-tab-pill"
                          className="absolute inset-y-1 z-0 rounded-full bg-white/10"
                          style={{ width: `calc(${100 / currentTabs.length}% - 4px)` }}
                          animate={{ x: `${activeIndex * 100}%` }}
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                    </div>

                    {/* Add Trade Button (Admin Only) */}
                    {authMode === 'admin' ? (
                      <button 
                        onClick={handleAddTradeBtnClick}
                        className="bg-white text-black w-12 h-12 lg:w-auto lg:h-14 lg:px-8 rounded-full flex items-center justify-center gap-2 active:scale-[0.95] transition-all duration-200 shadow-xl"
                      >
                        <Plus size={18} strokeWidth={3} />
                        <span className="hidden lg:inline text-[10px] font-black uppercase tracking-[0.2em]">Add Trade</span>
                      </button>
                    ) : (
                      /* Placeholder to keep alignment for guest mode */
                      <div className="w-12 h-12 lg:w-14 lg:h-14" />
                    )}
                  </div>
                </MotionDiv>
              </React.Fragment>
            )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddModalOpen && authMode === 'admin' && (
            <AddTradeModal key={editingTrade ? editingTrade.id : 'add-trade'} isOpen={true} onClose={() => setIsAddModalOpen(false)} date={selectedDate} onAdd={handleAddOrUpdateTrade} initialData={editingTrade} />
          )}
          {isDetailModalOpen && (
            <DayDetailsModal isOpen={true} onClose={() => setIsDetailModalOpen(false)} date={selectedDate} trades={selectedTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onAddTrade={handleAddTradeBtnClick} readOnly={authMode === 'guest'} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;