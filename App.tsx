
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutGrid, BookOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EnergyChart from './components/EnergyChart';
import { InsightCard } from './components/InsightCard';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import { VoiceChat } from './components/VoiceChat';
import TotalPnlCard from './components/TotalPnlCard';
import { ActivityDropdown } from './components/ActivityDropdown';
import TradeStats from './components/TradeStats';
import { Trade, ActivityLog } from './types';

const MotionDiv = motion.div as any;

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedSidebarCard, setExpandedSidebarCard] = useState<'voice' | 'activity'>('voice');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const addActivity = useCallback((type: ActivityLog['type'], title: string, description: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      title,
      description,
      time: 'Just Now',
      timestamp: Date.now()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  }, []);

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
      const trade = prev.find(t => t.id === tradeId);
      if (trade) {
        addActivity('delete', 'Trade Deleted', `${trade.pair} ${trade.type} position removed.`);
      }
      return prev.filter(t => t.id !== tradeId);
    });
  }, [addActivity]);

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
      if (existingIndex >= 0) {
        addActivity('edit', 'Trade Updated', `${tradeData.pair} details modified.`);
      } else {
        addActivity('add', 'Trade Added', `New ${tradeData.type} position on ${tradeData.pair}.`);
      }
      let newTrades = existingIndex >= 0 ? [...prev] : [...prev, tradeData];
      if (existingIndex >= 0) newTrades[existingIndex] = tradeData;
      return newTrades;
    });
  }, [addActivity]);

  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="h-screen w-screen relative flex items-center justify-center p-2 lg:p-3 overflow-hidden font-sans selection:bg-nexus-accent selection:text-black">
      <div className="w-full h-full glass-card rounded-[25px] relative overflow-hidden flex flex-col p-4 lg:p-6 transition-all duration-500 shadow-2xl">
        
        <AnimatePresence mode="wait">
            <MotionDiv 
              key="dashboard-grid"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="flex-1 min-h-0 flex flex-row gap-4 lg:gap-6 z-10 items-stretch h-full w-full"
            >
              {/* LEFT WING - FIXED WIDTH TO STOP JUMPS */}
              <div className="flex flex-row h-full gap-4 lg:gap-6 w-[460px] shrink-0">
                <div className="flex flex-col gap-4 w-[218px] shrink-0">
                  <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
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
                <div className="hidden lg:flex flex-col gap-4 w-[218px] shrink-0">
                  <TradeStats trades={trades} />
                </div>
              </div>

              {/* CENTER AREA - FLEX-1 TO FILL REMAINING SPACE */}
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
                        />
                      )}
                    </MotionDiv>
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT WING - FIXED WIDTH TO STOP JUMPS */}
              <div className="flex flex-col h-full w-[460px] shrink-0 gap-4 lg:gap-6">
                <div className="flex-1 min-h-0">
                    <InsightCard trades={trades} />
                </div>
                <div className="flex-1 min-h-0">
                    <EnergyChart trades={trades} stats={globalStats} />
                </div>
              </div>
            </MotionDiv>
        </AnimatePresence>

        {/* NAVIGATION DOCK (Container is visually invisible) */}
        <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-6 pointer-events-auto">
            {/* Tab Switcher - Visually Floating */}
            <div className="relative p-1 rounded-full flex items-center bg-white/5 backdrop-blur-md w-[260px] shadow-lg">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-300 z-10 ${activeTab === tab.id ? 'text-white font-bold' : 'text-nexus-muted hover:text-white/60'}`}
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

            {/* Add Trade Button - White, No Hover Scale, Press Animation, Glow */}
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
