
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LayoutGrid, BookOpen, Plus, Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Ref to prevent redundant syncs on initial load
  const lastSyncedTradesRef = useRef<string>("");

  // 1. Initial Data Load
  useEffect(() => {
    const initData = async () => {
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
        
        // Brief delay before showing the dashboard for smoother transition
        setTimeout(() => {
          setIsInitialLoading(false);
          // Show successful sync once the dashboard appears
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
  }, []);

  // 2. Data Sync logic (Debounced)
  useEffect(() => {
    if (isInitialLoading) return;

    const currentTradesJson = JSON.stringify(trades);
    // Only trigger sync if data has actually changed from what we last loaded/sent
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
        console.error("Cloud sync failed", e);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };

    const timeout = setTimeout(syncTrades, 1500); // 1.5s debounce
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
    const initialBalance = 50000;
    const growthPct = trades.length > 0 ? (totalPnl / initialBalance) * 100 : 0;
    return { totalPnl, growthPct };
  }, [trades]);

  const handleAddTradeClick = useCallback((date: string) => { 
    setSelectedDate(date); 
    setEditingTrade(undefined); 
    setIsAddModalOpen(true); 
  }, []);

  const handleAddTradeBtnClick = useCallback(() => { 
    setSelectedDate(new Date().toISOString().split('T')[0]); 
    setEditingTrade(undefined); 
    setIsAddModalOpen(true); 
  }, []);

  const handleEditTrade = useCallback((trade: Trade) => { 
    setSelectedDate(trade.date); 
    setEditingTrade(trade); 
    setIsAddModalOpen(true); 
  }, []);
  
  const handleDeleteTrade = useCallback((tradeId: string) => { 
    setTrades(prev => prev.filter(t => t.id !== tradeId));
  }, []);

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
    setTrades(prev => {
      const existingIndex = prev.findIndex(t => t.id === tradeData.id); 
      let newTrades = existingIndex >= 0 ? [...prev] : [...prev, tradeData];
      if (existingIndex >= 0) newTrades[existingIndex] = tradeData;
      return newTrades;
    });
  }, []);

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
    if (confirm("Importing data will replace all current trades. Proceed?")) {
      setTrades(importedTrades);
    }
  }, []);

  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="h-screen w-screen relative flex items-center justify-center p-2 lg:p-3 overflow-hidden font-sans selection:bg-xgiha-accent selection:text-black">
      <div className="w-full h-full glass-card rounded-[25px] relative overflow-hidden flex flex-col p-4 lg:p-6 transition-all duration-500 shadow-2xl">
        
        {/* Sync Status Header - Visible only when NOT loading and status is active */}
        <AnimatePresence>
          {(syncStatus !== 'idle' && !isInitialLoading) && (
            <MotionDiv
              initial={{ y: -60, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -60, x: '-50%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-6 left-1/2 z-[150] flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
            >
                {syncStatus === 'syncing' && <RefreshCw size={11} className="text-xgiha-accent animate-spin" />}
                {syncStatus === 'success' && <Check size={11} className="text-emerald-400" />}
                {syncStatus === 'error' && <CloudOff size={11} className="text-red-400" />}
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white">
                    {syncStatus === 'syncing' ? 'Syncing Journal' : syncStatus === 'error' ? 'Sync Failed' : 'System Synced'}
                </span>
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
                    <div className="absolute inset-0 w-12 h-12 border border-white/5 rounded-full blur-[4px]" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-xgiha-accent animate-pulse">Journal Core</span>
                    <span className="text-[8px] uppercase font-medium tracking-[0.2em] text-xgiha-muted/60">Initializing Environment...</span>
                  </div>
               </MotionDiv>
            ) : (
              <React.Fragment>
                <MotionDiv 
                  key="dashboard-grid"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="flex-1 min-h-0 flex flex-row gap-4 lg:gap-6 z-10 items-stretch h-full w-full"
                >
                  {/* LEFT WING */}
                  <div className="flex flex-row h-full gap-4 lg:gap-6 w-[460px] shrink-0">
                    <div className="flex flex-col gap-4 w-[218px] shrink-0 h-full">
                      <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                      <Progress trades={trades} />
                    </div>
                    <div className="hidden lg:flex flex-col gap-4 w-[218px] shrink-0 h-full">
                      <TimeAnalysis trades={trades} />
                    </div>
                  </div>

                  {/* CENTER AREA - Adjusted bottom padding to pb-24 to terminate exactly above the floating menu */}
                  <div className="relative flex flex-col items-center h-full min-w-0 flex-1 pb-24">
                    <div className="w-full h-full relative">
                      <AnimatePresence mode="wait" initial={false}>
                        <MotionDiv
                          key={activeTab}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="absolute inset-0 w-full h-full flex flex-col"
                        >
                          {activeTab === 'dashboard' ? (
                            <TradingCalendar 
                              trades={trades} 
                              currentDate={currentCalendarDate} 
                              onMonthChange={setCurrentCalendarDate} 
                              onAddTradeClick={handleAddTradeClick} 
                              onViewDayClick={handleViewDayClick} 
                              onViewWeekClick={handleViewWeekClick} 
                            />
                          ) : (
                            <JournalTable 
                              trades={trades} 
                              onEdit={handleEditTrade} 
                              onDelete={handleDeleteTrade} 
                              onViewDay={handleViewDayClick}
                              onExport={handleExportData}
                              onImport={handleImportData}
                            />
                          )}
                        </MotionDiv>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* RIGHT WING */}
                  <div className="flex flex-col h-full w-[460px] shrink-0 gap-4 lg:gap-6">
                    <div className="flex-1 min-h-0">
                        <GrowthChart trades={trades} />
                    </div>
                    <div className="flex-1 min-h-0">
                        <WeeklyChart trades={trades} stats={globalStats} />
                    </div>
                  </div>
                </MotionDiv>

                {/* NAVIGATION DOCK */}
                <MotionDiv 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "circOut" }}
                  className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center items-center pointer-events-none"
                >
                  <div className="flex items-center gap-6 pointer-events-auto">
                    {/* Tab Switcher - Increased height with py-3.5 */}
                    <div className="relative p-1 rounded-full flex items-center bg-white/5 backdrop-blur-md w-[260px] shadow-2xl border border-white/5">
                        {TABS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-xgiha-muted hover:text-white/60'}`}
                          >
                            <tab.icon size={14} />
                            <span className="text-[10px] font-bold tracking-widest uppercase">{tab.label}</span>
                          </button>
                        ))}
                        <MotionDiv
                          layoutId="active-tab-pill"
                          className="absolute inset-y-1 w-[calc(50%-4px)] z-0 rounded-full bg-white/10"
                          initial={false}
                          animate={{ x: activeIndex === 1 ? '100%' : '0%' }}
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                    </div>

                    {/* Add Trade Button - Increased height with py-4 */}
                    <button 
                      onClick={handleAddTradeBtnClick}
                      className="bg-white text-black px-7 py-4 rounded-full flex items-center gap-2 active:scale-[0.95] transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)]"
                    >
                      <Plus size={16} strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Entry</span>
                    </button>
                  </div>
                </MotionDiv>
              </React.Fragment>
            )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddModalOpen && (
            <AddTradeModal 
              key={editingTrade ? editingTrade.id : 'add-trade'} 
              isOpen={true} 
              onClose={() => setIsAddModalOpen(false)} 
              date={selectedDate} 
              onAdd={handleAddOrUpdateTrade} 
              initialData={editingTrade} 
            />
          )}
          {isDetailModalOpen && (
            <DayDetailsModal 
              isOpen={true} 
              onClose={() => setIsDetailModalOpen(false)} 
              date={selectedDate} 
              trades={selectedTrades} 
              onEdit={handleEditTrade} 
              onDelete={handleDeleteTrade} 
              onAddTrade={() => { setIsDetailModalOpen(false); handleAddTradeBtnClick(); }} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
