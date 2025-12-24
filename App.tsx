import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Activity, 
  Clock, 
  MinusCircle, 
  CheckCircle,
  TrendingUp,
  Brain,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EnergyChart from './components/EnergyChart';
import InsightCard from './components/InsightCard';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import PsychologicalAnalysis from './components/PsychologicalAnalysis';
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

  const toggleSidebar = (target: 'voice' | 'activity') => {
    setExpandedSidebarCard(prev => {
      if (prev === target) {
        return target === 'voice' ? 'activity' : 'voice';
      }
      return target;
    });
  };

  const addActivity = (type: ActivityLog['type'], title: string, description: string) => {
    const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        type,
        title,
        description,
        time: 'Just Now',
        timestamp: Date.now()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_trades');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load trades", e);
    }
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return [
      { id: '1', date: `${year}-${month}-02`, pair: 'XAU/USD', pnl: 450, entryTime: '09:30:00', exitTime: '10:15:00', type: 'Long', entryPrice: 2045.50, exitPrice: 2050.00, size: '2.0', fee: 12, strategy: 'VWAP Rejection', notes: 'Stuck to the plan perfectly. Waited for the setup.' },
      { id: '2', date: `${year}-${month}-02`, pair: 'EUR/USD', pnl: -120, entryTime: '14:15:00', exitTime: '14:45:00', type: 'Short', entryPrice: 1.0850, exitPrice: 1.0865, size: '1.5', fee: 5, strategy: 'Fair Value Gap', notes: 'Got nervous and exited early. Should have held.' },
      { id: '3', date: `${year}-${month}-05`, pair: 'BTC/USD', pnl: 1250, entryTime: '11:00:00', exitTime: '18:00:00', type: 'Long', entryPrice: 42100, exitPrice: 43500, size: '0.5', fee: 45, strategy: 'Break & Retest', newsEvent: 'ETF Approval', notes: 'Great flow state today. Saw the move coming.' },
      { id: '4', date: `${year}-${month}-09`, pair: 'NVDA', pnl: -300, entryTime: '10:00:00', exitTime: '10:30:00', type: 'Long', entryPrice: 850.20, exitPrice: 845.00, size: '100 Shares', fee: 2, strategy: 'VWAP Rejection', notes: 'FOMO entry. Chased the green candle.' },
      { id: '5', date: `${year}-${month}-09`, pair: 'TSLA', pnl: 800, entryTime: '15:45:00', exitTime: '15:55:00', type: 'Short', entryPrice: 175.50, exitPrice: 172.00, size: '200 Shares', fee: 4, strategy: 'Scalp', notes: 'Quick scalp, followed rules.' },
      { id: '6', date: `${year}-${month}-12`, pair: 'ES', pnl: -500, entryTime: '10:00:00', exitTime: '10:15:00', type: 'Short', entryPrice: 5100, exitPrice: 5110, size: '1', fee: 5, strategy: 'Trend Continuity', notes: 'Tried to make back losses. Revenge trading.' },
    ];
  });

  const syncToCloud = async (newTrades: Trade[]) => {
      try {
          await fetch('/api/trades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newTrades)
          });
      } catch (err) {
          console.error("Failed to sync trades to cloud", err);
      }
  };

  useEffect(() => {
    const fetchCloudTrades = async () => {
        try {
            const res = await fetch('/api/trades');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setTrades(data);
                    localStorage.setItem('nexus_trades', JSON.stringify(data));
                }
            }
        } catch (err) {
            console.error("Failed to fetch from cloud", err);
        }
    };
    fetchCloudTrades();
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_trades', JSON.stringify(trades));
  }, [trades]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const getLocalDateString = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const globalStats = useMemo(() => {
    let totalPnl = 0, growthPct = 0;
    if (trades.length === 0) return { totalPnl: 0, growthPct: 0 };
    trades.forEach(t => {
      totalPnl += t.pnl;
    });
    const initialBalance = 50000;
    growthPct = (totalPnl / initialBalance) * 100;
    return { totalPnl, growthPct };
  }, [trades]);

  const monthlyStats = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthTrades = trades.filter(t => t.date.startsWith(monthPrefix));
    
    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const count = monthTrades.length;
    const wins = monthTrades.filter(t => t.pnl > 0).length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    return { totalPnl, count, winRate };
  }, [trades, currentCalendarDate]);

  const handleAddTradeClick = (date: string) => { setSelectedDate(date); setEditingTrade(undefined); setIsAddModalOpen(true); };
  const handleAddTradeBtnClick = () => { setSelectedDate(getLocalDateString()); setEditingTrade(undefined); setIsAddModalOpen(true); };
  const handleEditTrade = (trade: Trade) => { setSelectedDate(trade.date); setEditingTrade(trade); setIsAddModalOpen(true); };
  
  const handleDeleteTrade = (tradeId: string) => { 
    const updatedTrades = trades.filter(t => t.id !== tradeId); 
    setTrades(updatedTrades);
    syncToCloud(updatedTrades); 
  };

  const handleViewDayClick = (date: string) => { setSelectedDate(date); setSelectedTrades(trades.filter(t => t.date === date)); setIsDetailModalOpen(true); };
  const handleViewWeekClick = (weekTrades: Trade[], weekLabel: string) => { setSelectedDate(weekLabel); setSelectedTrades(weekTrades); setIsDetailModalOpen(true); };
  
  const handleAddOrUpdateTrade = (tradeData: Trade) => { 
    const existingIndex = trades.findIndex(t => t.id === tradeData.id); 
    let newTrades: Trade[] = []; 
    if (existingIndex >= 0) { 
        newTrades = [...trades]; 
        newTrades[existingIndex] = tradeData; 
    } else { 
        newTrades = [...trades, tradeData]; 
    } 
    setTrades(newTrades); 
    syncToCloud(newTrades); 
  };

  const handleTabChange = (tabId: string) => { setCurrentView('dashboard'); setActiveTab(tabId); };
  const handlePsychologyClick = () => { setCurrentView(currentView === 'psychology' ? 'dashboard' : 'psychology'); };

  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex items-center justify-center p-2 md:p-4 lg:p-6 overflow-hidden font-sans selection:bg-nexus-accent selection:text-black bg-black">
      <div className="w-[98vw] h-auto lg:h-full glass-panel rounded-2xl md:rounded-3xl lg:rounded-[3rem] relative overflow-hidden flex flex-col p-3 md:p-6 lg:p-10 pb-6 lg:pb-10 transition-all duration-500">
        
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
            {/* Sidebar */}
            <div className="flex flex-col h-full min-h-0 w-[220px] shrink-0">
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 pb-4">
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

            {/* Stats Cards Gutter */}
            <div className="hidden lg:flex flex-col gap-4 items-stretch w-[240px] shrink-0 h-full justify-start overflow-hidden">
               <div className="w-full flex flex-col gap-4 items-stretch pb-4 custom-scrollbar overflow-y-auto">
                  <TradeStats trades={trades} />
               </div>
            </div>
          </div>

          {/* CENTER WORKSPACE */}
          <div className="relative flex flex-col items-center h-[700px] lg:h-full lg:min-h-0 order-1 lg:order-none w-full max-w-[800px] mx-auto shrink-0 pb-24">
            <div className="w-full h-full min-0 relative overflow-hidden">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, scale: 0.99 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.99 }}
                   transition={{ duration: 0.2, ease: "easeOut" }}
                   className="absolute inset-0 w-full h-full flex flex-col"
                 >
                   {activeTab === 'dashboard' ? (
                     <TradingCalendar trades={trades} currentDate={currentCalendarDate} onMonthChange={setCurrentCalendarDate} onAddTradeClick={handleAddTradeClick} onViewDayClick={handleViewDayClick} onViewWeekClick={handleViewWeekClick} monthlyStats={monthlyStats} />
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
                <EnergyChart trades={trades} stats={{ totalPnl: globalStats.totalPnl, growthPct: globalStats.growthPct }} />
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

        {/* Floating Menu */}
        <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center items-center pointer-events-none">
            <div className="flex items-center gap-6 pointer-events-auto">
               <button
                  onClick={handlePsychologyClick}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 duration-100 group shadow-2xl relative overflow-hidden bg-white/[0.03] backdrop-blur-[120px] border border-white/10 isolate ${currentView === 'psychology' ? 'text-purple-400 border-purple-500/30' : 'text-nexus-muted hover:text-white'}`}
               >
                   {/* Glossy Highlights */}
                   <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"></div>
                   <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
                   <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/5 to-transparent opacity-30 blur-2xl pointer-events-none -z-10"></div>
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none z-0"></div>
                   <Brain size={24} className="group-hover:text-purple-400 transition-colors z-10" />
               </button>

               <div className="relative p-1.5 rounded-full flex items-center justify-center shadow-2xl isolate overflow-hidden w-[280px] bg-white/[0.03] backdrop-blur-[120px] border border-white/10">
                  {/* Glossy Highlights */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"></div>
                  <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
                  <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/5 to-transparent opacity-30 blur-3xl pointer-events-none -z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none z-0"></div>

                  <div className="relative flex items-center justify-center w-full z-10">
                    {TABS.map((tab) => (
                      <button
                        key={`bg-${tab.id}`}
                        onClick={() => handleTabChange(tab.id)}
                        className="flex-1 py-3 rounded-full flex items-center justify-center gap-2 text-nexus-muted hover:text-white/60 transition-colors duration-200 z-10"
                      >
                        <tab.icon size={18} className="shrink-0" />
                        <span className="text-sm font-medium tracking-tight">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <motion.div
                    className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] z-20 pointer-events-none overflow-hidden rounded-full border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    initial={false}
                    animate={{ x: `${activeIndex * 100}%` }}
                    transition={{ type: "spring", stiffness: 450, damping: 38, mass: 0.8 }}
                  >
                    <motion.div 
                        className="absolute top-0 bottom-0 flex items-center justify-center"
                        style={{ width: 'calc(280px - 12px)' }}
                        animate={{ x: `-${activeIndex * 50}%` }}
                        transition={{ type: "spring", stiffness: 450, damping: 38, mass: 0.8 }}
                    >
                      {TABS.map((tab) => (
                        <div
                          key={`fg-${tab.id}`}
                          className="flex-1 py-3 flex items-center justify-center gap-2 text-white font-bold"
                        >
                          <tab.icon size={18} className="shrink-0" />
                          <span className="text-sm tracking-tight">{tab.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
               </div>

               <button 
                  onClick={handleAddTradeBtnClick}
                  className="relative rounded-full flex items-center justify-center gap-2 text-nexus-muted hover:text-white transition-all active:scale-95 duration-100 group shadow-2xl px-8 py-4 overflow-hidden whitespace-nowrap bg-white/[0.03] backdrop-blur-[120px] border border-white/10 isolate"
               >
                    {/* Glossy Highlights */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20"></div>
                    <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
                    <div className="absolute inset-0 bg-gradient-radial from-nexus-accent/5 to-transparent opacity-30 blur-2xl pointer-events-none -z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none z-0"></div>
                    
                    <Plus size={20} className="group-hover:text-nexus-accent transition-colors shrink-0 z-10" />
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