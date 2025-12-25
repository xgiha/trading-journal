
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutGrid, 
  BookOpen, 
  Plus, 
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EnergyChart from './components/EnergyChart';
// Fix: Use named import for InsightCard as it is exported as a named constant, not as a default export.
import { InsightCard } from './components/InsightCard';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import PsychologyPage from './components/PsychologyPage';
import { VoiceChat } from './components/VoiceChat';
import TotalPnlCard from './components/TotalPnlCard';
import { ActivityDropdown } from './components/ActivityDropdown';
import TradeStats from './components/TradeStats';
import { Trade, ActivityLog } from './types';

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'psychology'>('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedSidebarCard, setExpandedSidebarCard] = useState<'voice' | 'activity'>('voice');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const toggleSidebar = useCallback((target: 'voice' | 'activity') => {
    setExpandedSidebarCard(prev => prev === target ? (target === 'voice' ? 'activity' : 'voice') : target);
  }, []);

  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_trades');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load trades", e);
    }
    return [
      { id: '1', date: '2025-02-02', pair: 'XAU/USD', pnl: 450, entryTime: '09:30:00', exitTime: '10:15:00', type: 'Long', entryPrice: 2045.50, exitPrice: 2050.00, size: '2.0', fee: 12, strategy: 'VWAP Rejection', notes: 'Stuck to the plan perfectly.' },
      { id: '2', date: '2025-02-02', pair: 'EUR/USD', pnl: -120, entryTime: '14:15:00', exitTime: '14:45:00', type: 'Short', entryPrice: 1.0850, exitPrice: 1.0865, size: '1.5', fee: 5, strategy: 'Fair Value Gap', notes: 'Got nervous and exited early.' },
    ];
  });

  const syncToCloud = useCallback(async (newTrades: Trade[]) => {
      try {
          await fetch('/api/trades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newTrades)
          });
      } catch (err) {
          console.error("Failed to sync trades to cloud", err);
      }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_trades', JSON.stringify(trades));
  }, [trades]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const globalStats = useMemo(() => {
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const initialBalance = 50000;
    const growthPct = (totalPnl / initialBalance) * 100;
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
    setTrades(prev => {
      const updated = prev.filter(t => t.id !== tradeId);
      syncToCloud(updated);
      return updated;
    });
  }, [syncToCloud]);

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
      syncToCloud(newTrades);
      return newTrades;
    });
  }, [syncToCloud]);

  const handleTabChange = useCallback((tabId: string) => { 
    setCurrentView('dashboard'); 
    setActiveTab(tabId); 
  }, []);

  const handlePsychologyClick = useCallback(() => { 
    setCurrentView(prev => prev === 'psychology' ? 'dashboard' : 'psychology'); 
  }, []);

  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex items-center justify-center p-2 md:p-4 lg:p-6 overflow-hidden font-sans selection:bg-nexus-accent selection:text-black bg-black">
      <div className="w-[98vw] h-auto lg:h-full bg-[#141414] border border-white/10 rounded-2xl md:rounded-3xl lg:rounded-[3rem] relative overflow-hidden flex flex-col p-3 md:p-6 lg:p-10 pb-6 lg:pb-10 transition-all duration-500 shadow-2xl">
        
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' ? (
            <motion.div 
              key="dashboard-grid"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[484px_1fr_484px] gap-4 md:gap-6 z-10 items-start h-full"
            >
              {/* LEFT WING */}
              <div className="flex h-full min-h-0 order-2 lg:order-none w-full overflow-hidden gap-6">
                <div className="flex flex-col h-full min-h-0 w-[220px] shrink-0">
                  <div className="flex-1 flex flex-col gap-4 overflow-hidden pr-1 pb-4">
                    <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                    <div className="flex flex-col gap-4">
                      <VoiceChat 
                        isOpen={expandedSidebarCard === 'voice'} 
                        onToggle={() => toggleSidebar('voice')} 
                      />
                      <ActivityDropdown 
                        logs={activityLogs} 
                        isOpen={expandedSidebarCard === 'activity'} 
                        onToggle={() => toggleSidebar('activity')} 
                      />
                    </div>
                  </div>
                </div>
                <div className="hidden lg:flex flex-col gap-4 items-stretch w-[240px] shrink-0 h-full justify-start overflow-hidden">
                  <TradeStats trades={trades} />
                </div>
              </div>

              {/* CENTER AREA */}
              <div className="relative flex flex-col items-center h-[700px] lg:h-full lg:min-h-0 order-1 lg:order-none w-full max-w-[800px] mx-auto shrink-0 pb-24">
                <div className="w-full h-full min-0 relative overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute inset-0 w-full h-full flex flex-col"
                    >
                      {activeTab === 'dashboard' ? (
                        <TradingCalendar trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} />
                      ) : (
                        <JournalTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onViewDay={handleViewDayClick} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT WING */}
              <div className="flex flex-col h-full order-3 lg:order-none w-[484px] shrink-0 overflow-hidden gap-6">
                <div className="flex-1 min-h-0">
                    <InsightCard trades={trades} />
                </div>
                <div className="flex-1 min-h-0">
                    <EnergyChart trades={trades} stats={globalStats} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="psychology-view"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="flex-1 w-full h-full flex items-center justify-center overflow-hidden"
            >
              <PsychologyPage trades={trades} onBack={() => setCurrentView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* NAVIGATION DOCK AREA */}
        <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-6 pointer-events-auto px-6 py-3 rounded-full">
            <button
              onClick={handlePsychologyClick}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 duration-100 group relative overflow-hidden bg-white/5 border border-white/10 ${currentView === 'psychology' ? 'text-purple-400 border-purple-500/30' : 'text-nexus-muted'}`}
            >
              <Brain size={24} className="z-10" />
            </button>

            <div className="relative p-1.5 rounded-full flex items-center justify-center overflow-hidden w-[280px] bg-white/5 border border-white/10">
              <div className="relative flex items-center justify-center w-full z-10">
                {TABS.map((tab) => (
                  <button
                    key={`bg-${tab.id}`}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 py-3 rounded-full flex items-center justify-center gap-2 transition-colors duration-200 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-nexus-muted'}`}
                  >
                    <tab.icon size={18} className="shrink-0" />
                    <span className="text-sm font-medium tracking-tight">{tab.label}</span>
                  </button>
                ))}
              </div>

              <motion.div
                layout="position"
                className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] z-20 pointer-events-none overflow-hidden rounded-full border border-white/20 bg-white/10"
                initial={false}
                animate={{ x: `${activeIndex * 100}%` }}
                transition={{ type: "spring", stiffness: 450, damping: 38 }}
              />
            </div>

            <button 
              onClick={handleAddTradeBtnClick}
              className="relative rounded-full flex items-center justify-center gap-2 text-nexus-muted transition-all active:scale-95 duration-100 group px-8 py-4 overflow-hidden whitespace-nowrap bg-white/5 border border-white/10"
            >
              <Plus size={20} className="shrink-0 z-10" />
              <span className="text-sm font-bold uppercase tracking-widest shrink-0 z-10">Add Trade</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isAddModalOpen && (
            <AddTradeModal key={editingTrade ? editingTrade.id : 'add-trade'} isOpen={true} onClose={() => setIsAddModalOpen(false)} date={selectedDate} onAdd={handleAddOrUpdateTrade} initialData={editingTrade} />
          )}
          {isDetailModalOpen && selectedDate && (
            <DayDetailsModal key="day-details" isOpen={true} onClose={() => setIsDetailModalOpen(false)} date={selectedDate} trades={selectedTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} onAddTrade={() => { setIsDetailModalOpen(false); setEditingTrade(undefined); setTimeout(() => setIsAddModalOpen(true), 200); }} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
