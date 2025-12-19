
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
import InsightsChart from './components/InsightsChart';
import PaperBackground from './components/PaperBackground';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import PsychologicalAnalysis from './components/PsychologicalAnalysis';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import PsychologyPage from './components/PsychologyPage';
import { VoiceChat } from './components/VoiceChat';
import TotalPnlCard from './components/TotalPnlCard';
import { ActivityDropdown } from './components/ActivityDropdown';
import { Trade, ActivityLog } from './types';

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
];

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketCountdown, setMarketCountdown] = useState<string>('');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'psychology'>('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

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
      { id: '1', date: `${year}-${month}-02`, pair: 'XAU/USD', pnl: 450, entryTime: '09:30', exitTime: '10:15', type: 'Long', entryPrice: 2045.50, exitPrice: 2050.00, size: '2.0', fee: 12, notes: 'Stuck to the plan perfectly. Waited for the setup.' },
      { id: '2', date: `${year}-${month}-02`, pair: 'EUR/USD', pnl: -120, entryTime: '14:15', exitTime: '14:45', type: 'Short', entryPrice: 1.0850, exitPrice: 1.0865, size: '1.5', fee: 5, notes: 'Got nervous and exited early. Should have held.' },
      { id: '3', date: `${year}-${month}-05`, pair: 'BTC/USD', pnl: 1250, entryTime: '11:00', exitTime: '18:00', type: 'Long', entryPrice: 42100, exitPrice: 43500, size: '0.5', fee: 45, newsEvent: 'ETF Approval', notes: 'Great flow state today. Saw the move coming.' },
      { id: '4', date: `${year}-${month}-09`, pair: 'NVDA', pnl: -300, entryTime: '10:00', exitTime: '10:30', type: 'Long', entryPrice: 850.20, exitPrice: 845.00, size: '100 Shares', fee: 2, notes: 'FOMO entry. Chased the green candle.' },
      { id: '5', date: `${year}-${month}-09`, pair: 'TSLA', pnl: 800, entryTime: '15:45', exitTime: '15:55', type: 'Short', entryPrice: 175.50, exitPrice: 172.00, size: '200 Shares', fee: 4, notes: 'Quick scalp, followed rules.' },
      { id: '6', date: `${year}-${month}-12`, pair: 'ES', pnl: -500, entryTime: '10:00', exitTime: '10:15', type: 'Short', entryPrice: 5100, exitPrice: 5110, size: '1', fee: 5, notes: 'Tried to make back losses. Revenge trading.' },
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

  useEffect(() => {
    const updateTimeAndMarketStatus = () => {
      const now = new Date();
      setCurrentTime(now);

      const day = now.getUTCDay();
      const hour = now.getUTCHours();
      let isOpen = true;

      if (day === 6) isOpen = false; 
      if (day === 5 && hour >= 22) isOpen = false;
      if (day === 0 && hour < 23) isOpen = false;
      if ((day >= 1 && day <= 4) && (hour === 22)) isOpen = false;

      setIsMarketOpen(isOpen);

      let targetDate = new Date(now);
      if (isOpen) {
          targetDate.setUTCHours(22, 0, 0, 0);
          if (day === 0) targetDate.setUTCDate(targetDate.getUTCDate() + 1);
          else if (hour >= 22) targetDate.setUTCDate(targetDate.getUTCDate() + 1);
      } else {
          if (day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 23)) {
              targetDate.setUTCHours(23, 0, 0, 0);
              const daysUntilSunday = (7 - day) % 7; 
              if (day !== 0) targetDate.setUTCDate(targetDate.getUTCDate() + daysUntilSunday); 
          } else {
              targetDate.setUTCHours(23, 0, 0, 0);
          }
      }

      const diff = targetDate.getTime() - now.getTime();
      if (diff > 0) {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setMarketCountdown(`${h} h ${m} m ${s} s`);
      } else {
          setMarketCountdown("00h 00m 00s");
      }
    };

    updateTimeAndMarketStatus();
    const timer = setInterval(updateTimeAndMarketStatus, 1000);
    return () => clearInterval(timer);
  }, []);

  const colomboTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const nyTimeStr = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const chicagoTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const chicagoDayName = chicagoTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const chicagoProgress = ((chicagoTime.getHours() * 60 + chicagoTime.getMinutes()) / (24 * 60)) * 100;
  
  const verboseCountdown = useMemo(() => {
    return marketCountdown
      .replace(/ \d+s$/, '') 
      .replace(/(\d+)h/, '$1 hours and')
      .replace(/(\d+)m/, '$1 minutes');
  }, [marketCountdown]);

  const renderTimelineSegments = () => {
    const day = chicagoTime.getDay();
    const OPEN_Start = 70.83; 
    const CLOSE_End = 66.66; 
    
    let segments = [];
    if (day === 0) { 
        segments.push({ left: 0, width: OPEN_Start, color: 'bg-[#3f3f46]' });
        segments.push({ left: OPEN_Start, width: 100 - OPEN_Start, color: 'bg-emerald-500' }); 
    } else if (day >= 1 && day <= 4) { 
        segments.push({ left: 0, width: CLOSE_End, color: 'bg-emerald-500' }); 
        segments.push({ left: CLOSE_End, width: OPEN_Start - CLOSE_End, color: 'bg-[#3f3f46]' }); 
        segments.push({ left: OPEN_Start, width: 100 - OPEN_Start, color: 'bg-emerald-500' }); 
    } else if (day === 5) { 
        segments.push({ left: 0, width: CLOSE_End, color: 'bg-emerald-500' }); 
        segments.push({ left: CLOSE_End, width: 100 - CLOSE_End, color: 'bg-[#3f3f46]' }); 
    } else { 
        segments.push({ left: 0, width: 100, color: 'bg-[#3f3f46]' }); 
    }
    return segments.map((s, i) => (
        <div key={i} className={`absolute top-0 bottom-0 h-full ${s.color} rounded-sm`} style={{ left: `${s.left}%`, width: `${s.width}%` }}></div>
    ));
  };

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : '';
    const absVal = Math.abs(val);
    return `${sign}$${absVal.toLocaleString()}`;
  };

  const globalStats = useMemo(() => {
    let totalPnl = 0, maxPnl = -Infinity, minPnl = Infinity, totalDurationMinutes = 0, timedTradeCount = 0, minDuration = Infinity, maxDuration = 0, newsCount = 0, normalCount = 0, wins = 0;
    if (trades.length === 0) return { totalPnl: 0, bestTrade: 0, worstTrade: 0, avgTime: '0m', growthPct: 0, shortestHold: '0m', longestHold: '0m', avgHoldNum: 0, shortestHoldNum: 0, longestHoldNum: 0, avgTradePnl: 0, newsCount: 0, normalCount: 0, currentBalance: 50000, winRate: 0, totalTrades: 0 };
    trades.forEach(t => {
      totalPnl += t.pnl;
      if (t.pnl > maxPnl) maxPnl = t.pnl;
      if (t.pnl < minPnl) minPnl = t.pnl;
      if (t.pnl > 0) wins++;
      if (t.newsEvent) newsCount++; else normalCount++;
      if (t.exitTime && t.entryTime && t.entryTime !== '00:00:00' && t.exitTime !== '00:00:00') {
         const [h1, m1] = t.entryTime.split(':').map(Number);
         const [h2, m2] = t.exitTime.split(':').map(Number);
         let minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
         if (minutes < 0) minutes += 24 * 60; 
         if (minutes > 0 && minutes < 1440) { totalDurationMinutes += minutes; timedTradeCount++; if (minutes < minDuration) minDuration = minutes; if (minutes > maxDuration) maxDuration = minutes; }
      }
    });
    const avgMinutes = timedTradeCount > 0 ? Math.floor(totalDurationMinutes / timedTradeCount) : 0;
    const formatDur = (m: number) => { if (m === Infinity || m === 0) return '0m'; const h = Math.floor(m / 60); const mins = m % 60; if (h > 0) return `${h}h ${mins}m`; return `${mins}m`; };
    const initialBalance = 50000;
    const currentBalance = initialBalance + totalPnl;
    const growthPct = (totalPnl / initialBalance) * 100;
    const avgTradePnl = trades.length > 0 ? totalPnl / trades.length : 0;
    const winRate = (wins / trades.length) * 100;
    return { totalPnl, bestTrade: maxPnl === -Infinity ? 0 : maxPnl, worstTrade: minPnl === Infinity ? 0 : minPnl, avgTime: formatDur(avgMinutes), growthPct, shortestHold: minDuration === Infinity ? '0m' : formatDur(minDuration), longestHold: formatDur(maxDuration), shortestHoldNum: minDuration === Infinity ? 0 : minDuration, longestHoldNum: maxDuration, avgHoldNum: avgMinutes, avgTradePnl, newsCount, normalCount, currentBalance, winRate, totalTrades: trades.length };
  }, [trades]);

  const performanceChartData = useMemo(() => {
    const dailyMap = new Map<string, { total: number; normal: number; news: number }>();
    trades.forEach(t => { const entry = dailyMap.get(t.date) || { total: 0, normal: 0, news: 0 }; entry.total += t.pnl; if (t.newsEvent) entry.news += t.pnl; else entry.normal += t.pnl; dailyMap.set(t.date, entry); });
    const sortedDates = Array.from(dailyMap.keys()).sort();
    let runningTotal = 50000, runningNormal = 50000, runningNews = 50000;
    const fullHistory = [{ date: 'Start', price: 50000, normal: 50000, news: 50000 }];
    sortedDates.forEach(date => { const stats = dailyMap.get(date)!; runningTotal += stats.total; runningNormal += stats.normal; runningNews += stats.news; fullHistory.push({ date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), price: runningTotal, normal: runningNormal, news: runningNews }); });
    return fullHistory;
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
    const tradeToDelete = trades.find(t => t.id === tradeId);
    let updatedTrades: Trade[] = []; 
    setTrades(prev => { 
        updatedTrades = prev.filter(t => t.id !== tradeId); 
        return updatedTrades; 
    }); 
    syncToCloud(updatedTrades); 
    if (tradeToDelete) {
        addActivity('delete', 'Entry Removed', `Deleted ${tradeToDelete.pair} ${tradeToDelete.type} from history.`);
    }
  };

  const handleViewDayClick = (date: string) => { setSelectedDate(date); setSelectedTrades(trades.filter(t => t.date === date)); setIsDetailModalOpen(true); };
  const handleViewWeekClick = (weekTrades: Trade[], weekLabel: string) => { setSelectedDate(weekLabel); setSelectedTrades(weekTrades); setIsDetailModalOpen(true); };
  
  const handleAddOrUpdateTrade = (tradeData: Trade) => { 
    const currentTrades = trades; 
    let newTrades: Trade[] = []; 
    const existingIndex = currentTrades.findIndex(t => t.id === tradeData.id); 
    
    if (existingIndex >= 0) { 
        newTrades = [...currentTrades]; 
        newTrades[existingIndex] = tradeData; 
        addActivity('edit', 'Journal Updated', `Entry for ${tradeData.pair} has been modified.`);
    } else { 
        newTrades = [...currentTrades, tradeData]; 
        addActivity('add', 'Trade Executed', `${tradeData.pair} ${tradeData.type} position recorded.`);
    } 
    
    setTrades(newTrades); 
    syncToCloud(newTrades); 
    
    if (selectedDate === tradeData.date) { 
        setSelectedTrades(prev => { 
            const existingIndex = prev.findIndex(t => t.id === tradeData.id); 
            if (existingIndex >= 0) { 
                const newSelected = [...prev]; 
                newSelected[existingIndex] = tradeData; 
                return newSelected; 
            } else { 
                return [...prev, tradeData]; 
            } 
        }); 
    } 
  };

  const handleTabChange = (tabId: string) => { setCurrentView('dashboard'); setActiveTab(tabId); };
  const handlePsychologyClick = () => { setCurrentView(currentView === 'psychology' ? 'dashboard' : 'psychology'); };

  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex items-center justify-center p-2 md:p-4 lg:p-6 overflow-hidden font-sans selection:bg-nexus-accent selection:text-black bg-black">
      <PaperBackground />
      
      {/* Main Dashboard Card - Fixed padding issue */}
      <div className="w-[98vw] h-auto lg:h-full glass-panel rounded-2xl md:rounded-3xl lg:rounded-[3rem] relative overflow-hidden flex flex-col p-3 md:p-6 lg:p-10 pb-6 lg:pb-10 transition-all duration-500">
        
        <AnimatePresence mode="wait">
        {currentView === 'dashboard' ? (
        <motion.div 
            key="dashboard-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[220px_1fr_800px_1fr_220px] gap-4 md:gap-0 z-10 items-start"
        >
          {/* LEFT SIDEBAR */}
          <div className="flex flex-col gap-4 h-full min-h-0 order-2 lg:order-none max-w-[220px] w-full justify-start overflow-y-auto custom-scrollbar pr-1">
            <TotalPnlCard trades={trades} totalPnl={globalStats.totalPnl} growthPct={globalStats.growthPct} />
            
            {/* Voice Chat Moved Here to replace Performance Card */}
            <div className="shrink-0 flex justify-center">
              <VoiceChat />
            </div>

            <div className="group relative liquid-card rounded-3xl p-5 shrink-0 flex flex-col gap-4 transition-all hover:bg-white/[0.04] cursor-default border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1c1c21] border border-white/10 flex items-center justify-center text-nexus-accent shadow-2xl overflow-hidden shrink-0">
                        <img 
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/profile-pic-uN0Tq8r9C5bXj3Z.png" 
                          alt="Avatar" 
                          className="w-full h-full object-cover scale-125 translate-y-2 opacity-90"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-white font-bold text-sm tracking-tight leading-tight">Gehan</h2>
                        <p className="text-[10px] text-nexus-muted leading-tight font-medium uppercase tracking-widest opacity-60">Active session</p>
                    </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex flex-col">
                        <h1 className="text-[10px] font-bold tracking-widest uppercase text-white drop-shadow-md">
                            {isMarketOpen ? 'Market Open' : 'Market Closed'}
                        </h1>
                        <span className="text-[9px] text-nexus-muted uppercase tracking-widest font-mono mt-0.5">
                            UTC +5:30 Colombo {colomboTime}
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-md shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`}></div>
                    </div>
                </div>
            </div>

            <div className="shrink-0 flex justify-center mb-6">
              <ActivityDropdown logs={activityLogs} />
            </div>
          </div>

          {/* LEFT GUTTER */}
          <div className="hidden lg:flex flex-col gap-4 items-center p-0 px-4 h-full justify-start">
             <div className="w-full flex flex-col gap-4 items-center pb-4">
                <div className="liquid-card rounded-3xl p-6 w-full max-w-[220px] h-[140px] flex items-center justify-center group hover:border-nexus-accent/30 transition-all duration-300 relative overflow-hidden shrink-0">
                    <span className="text-nexus-muted font-bold text-3xl group-hover:text-white transition-colors z-10">4</span>
                </div>
                <div className="liquid-card rounded-3xl p-6 w-full max-w-[220px] h-[140px] flex items-center justify-center group hover:border-nexus-accent/30 transition-all duration-300 relative overflow-hidden shrink-0">
                    <span className="text-nexus-muted font-bold text-3xl group-hover:text-white transition-colors z-10">5</span>
                </div>
                <div className="liquid-card rounded-3xl p-6 w-full max-w-[220px] h-[140px] flex items-center justify-center group hover:border-nexus-accent/30 transition-all duration-300 relative overflow-hidden shrink-0">
                   <span className="text-nexus-muted font-bold text-3xl group-hover:text-white transition-colors z-10">6</span>
                </div>

                <div className="liquid-card rounded-3xl p-5 h-[150px] w-full max-w-[220px] shrink-0 flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start shrink-0 z-10">
                        <div>
                            <span className="text-[9px] uppercase tracking-widest text-nexus-muted block mb-0.5 group-hover:text-white transition-colors">Efficiency</span>
                            <div className="flex items-center gap-1.5">
                                 <Activity size={12} className="text-nexus-accent" />
                                 <span className="text-[10px] font-bold text-white">Hold Time</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full mt-3 flex flex-col justify-center gap-2">
                        <div className="flex flex-col gap-1">
                           <div className="flex justify-between items-end">
                              <span className="text-[8px] text-nexus-muted uppercase tracking-widest font-medium">Avg</span>
                              <span className="text-[10px] font-bold text-white font-mono">{globalStats.avgTime}</span>
                           </div>
                           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex">
                               <div className="h-full bg-nexus-accent rounded-full" style={{ width: `${Math.max(5, (globalStats.avgHoldNum / (globalStats.longestHoldNum || 1)) * 100)}%` }}></div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="liquid-card rounded-3xl p-4 w-full max-w-[220px] shrink-0 flex flex-col gap-2">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-[8px] text-nexus-muted uppercase font-bold tracking-widest">High</span>
                            <span className="text-[10px] font-bold text-emerald-400 font-mono">{formatCurrency(globalStats.bestTrade)}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-[8px] text-nexus-muted uppercase font-bold tracking-widest">Low</span>
                            <span className="text-[10px] font-bold text-red-400 font-mono">{formatCurrency(globalStats.worstTrade)}</span>
                        </div>
                     </div>
                </div>
             </div>
          </div>

          {/* CENTER WORKSPACE */}
          <div className="relative flex flex-col items-center h-[700px] lg:h-full lg:min-h-0 order-1 lg:order-none w-full max-w-[800px] mx-auto shrink-0">
            <div className="w-full h-full min-h-0 relative overflow-hidden">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.98 }}
                   animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                   exit={{ opacity: 0, filter: 'blur(8px)', scale: 0.98 }}
                   transition={{ duration: 0.3, ease: "easeInOut" }}
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

          {/* RIGHT SECTION - Optimized for full visibility */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full order-3 lg:order-none lg:pl-4 overflow-hidden">
            
            {/* Analytics Card */}
            <div className="w-full flex-1 min-h-0">
                <div className="liquid-card rounded-3xl h-full flex flex-col relative overflow-hidden border-white/5 shadow-lg">
                  <EnergyChart 
                    trades={trades}
                    stats={{
                        totalPnl: globalStats.totalPnl,
                        growthPct: globalStats.growthPct
                    }}
                  />
                </div>
            </div>

            {/* Insights Comparative Chart Card */}
            <div className="w-full flex-1 min-h-0">
                <div className="liquid-card rounded-3xl h-full flex flex-col relative overflow-hidden border-white/5 shadow-lg">
                  <InsightsChart trades={trades} />
                </div>
            </div>

          </div>
        </motion.div>
        ) : (
             <motion.div 
               key="psychology-view"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.3 }}
               className="flex-1 w-full h-full flex items-center justify-center overflow-hidden"
             >
                 <PsychologyPage trades={trades} onBack={() => setCurrentView('dashboard')} />
             </motion.div>
        )}
        </AnimatePresence>

        {/* Floating Menu - Truly independent */}
        <div className="absolute bottom-6 left-0 right-0 z-[100] flex justify-center items-center pointer-events-none">
            <div className="flex items-center gap-6 pointer-events-auto">
               <button
                  onClick={handlePsychologyClick}
                  className={`liquid-card w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 duration-100 group shadow-2xl relative ${currentView === 'psychology' ? 'bg-white/10 text-purple-400' : 'text-nexus-muted hover:text-white hover:bg-white/10'}`}
               >
                   <Brain size={24} className="group-hover:text-purple-400 transition-colors" />
               </button>

               <div className="relative liquid-card p-1.5 rounded-full flex items-center justify-center shadow-2xl isolate overflow-hidden w-[280px]">
                  <div className="relative flex items-center justify-center w-full">
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
                  className="liquid-card rounded-full flex items-center justify-center gap-2 text-nexus-muted hover:text-white hover:bg-white/10 transition-all active:scale-95 duration-100 group shadow-2xl px-8 py-4 overflow-hidden whitespace-nowrap"
               >
                    <Plus size={20} className="group-hover:text-nexus-accent transition-colors shrink-0" />
                    <span className="text-sm font-bold uppercase tracking-widest shrink-0">Add Trade</span>
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
