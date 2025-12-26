
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutGrid, BookOpen, Plus, Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import WeeklyChart from './components/WeeklyChart';
import GrowthChart from './components/GrowthChart';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import TotalPnlCard from './components/TotalPnlCard';
import TradeStats from './components/TradeStats';
import FearGreedIndex from './components/FearGreedIndex';
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

  // 1. Load data from Cloud on mount
  useEffect(() => {
    const initData = async () => {
      try {
        setSyncStatus('syncing');
        const response = await fetch('/api/trades');
        if (response.ok) {
          const cloudTrades = await response.json();
          if (cloudTrades && Array.isArray(cloudTrades) && cloudTrades.length > 0) {
            setTrades(cloudTrades);
          } else {
            // Fallback to local if cloud is empty
            const saved = localStorage.getItem('xgiha_trades');
            if (saved) setTrades(JSON.parse(saved));
          }
        }
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        console.error("Failed to sync with cloud", e);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
        // Final fallback
        const saved = localStorage.getItem('xgiha_trades');
        if (saved) setTrades(JSON.parse(saved));
      } finally {
        setIsInitialLoading(false);
      }
    };
    initData();
  }, []);

  // 2. Sync to Cloud and LocalStorage whenever trades change
  useEffect(() => {
    if (isInitialLoading) return; // Don't sync empty state over existing data

    const syncTrades = async () => {
      // Save locally first for speed
      localStorage.setItem('xgiha_trades', JSON.stringify(trades));

      try {
        setSyncStatus('syncing');
        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trades),
        });
        if (!response.ok) throw new Error('Sync failed');
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (e) {
        console.error("Cloud sync failed", e);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };

    const timeout = setTimeout(syncTrades, 1000); // Debounce sync
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
    a.download = `xgiha-backup-${new Date().toISOString().split('T')[0]}.json`;
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
        
        {/* Sync Status Header - Sliding Animation */}
        <AnimatePresence>
          {syncStatus !== 'idle' && (
            <MotionDiv
              initial={{ y: -60, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: -60, x: '-50%', opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-6 left-1/2 z-[100] flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg"
            >
                {syncStatus === 'syncing' && <RefreshCw size={10} className="text-xgiha-accent animate-spin" />}
                {syncStatus === 'success' && <Check size={10} className="text-emerald-400" />}
                {syncStatus === 'error' && <CloudOff size={10} className="text-red-400" />}
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/70">
                    {syncStatus === 'syncing' ? 'Journal Syncing' : syncStatus === 'error' ? 'Sync Error' : 'Success'}
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
                  className="flex-1 flex flex-col items-center justify-center gap-4"
               >
                  <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-xgiha-muted">Initializing xgiha Core</span>
               </MotionDiv>
            ) : (
              <MotionDiv 
                key="dashboard-grid"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="flex-1 min-h-0 flex flex-row gap-4 lg:gap-6 z-10 items-stretch h-full w-full"
              >
                {/* LEFT WING */}
                <div className="flex flex-row h-full gap-4 lg:gap-6 w-[460px] shrink-0">
                  <div className="flex flex-col gap-4 w-[218px] shrink-0">
                    <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                    {/* FEAR & GREED INDEX CARD */}
                    <FearGreedIndex trades={trades} />
                  </div>
                  <div className="hidden lg:flex flex-col gap-4 w-[218px] shrink-0">
                    <TradeStats trades={trades} />
                  </div>
                </div>

                {/* CENTER AREA */}
                <div className="relative flex flex-col items-center h-full min-w-0 flex-1 pb-20">
                  <div className="w-full h-full relative">
                    <AnimatePresence mode="wait" initial={false}>
                      <MotionDiv
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
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
            )}
        </AnimatePresence>

        {/* NAVIGATION DOCK */}
        <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-6 pointer-events-auto">
            {/* Tab Switcher */}
            <div className="relative p-1 rounded-full flex items-center bg-white/5 backdrop-blur-md w-[260px] shadow-lg">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-xgiha-muted hover:text-white/60'}`}
                  >
                    <tab.icon size={14} />
                    <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
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

            {/* Add Trade Button */}
            <button 
              onClick={handleAddTradeBtnClick}
              className="bg-white text-black px-6 py-2.5 rounded-full flex items-center gap-2 active:scale-[0.95] transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.3)]"
            >
              <Plus size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Add Trade</span>
            </button>
          </div>
        </div>

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
