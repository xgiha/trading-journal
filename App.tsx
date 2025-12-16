import React, { useState, useEffect, useMemo } from 'react';
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
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EnergyChart from './components/EnergyChart';
import PerformanceRadar from './components/PerformanceRadar';
import PaperBackground from './components/PaperBackground';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import PsychologyPage from './components/PsychologyPage'; // Updated import
import AsciiPyramid from './components/AsciiPyramid';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import { Trade } from './types';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketCountdown, setMarketCountdown] = useState<string>('');
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'psychology'>('dashboard');
  const [activeTab, setActiveTab] = useState('dashboard'); // Inner tab for the dashboard view
  
  // Trade State with Persistence
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_trades');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load trades", e);
    }
    
    // Fallback Mock Data
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

  // Helper to Sync to Cloud
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

  // Load from Cloud on Mount (Priority Source)
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

  // Save to LocalStorage whenever trades change
  useEffect(() => {
    localStorage.setItem('nexus_trades', JSON.stringify(trades));
  }, [trades]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  // Helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  // Initialize with local date
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const updateTimeAndMarketStatus = () => {
      const now = new Date();
      setCurrentTime(now);

      // CME Futures Logic (UTC based)
      const day = now.getUTCDay(); // 0 = Sunday, 1 = Mon ... 5 = Fri, 6 = Sat
      const hour = now.getUTCHours();
      let isOpen = true;

      if (day === 6) isOpen = false; 
      if (day === 5 && hour >= 22) isOpen = false;
      if (day === 0 && hour < 23) isOpen = false;
      if ((day >= 1 && day <= 4) && (hour === 22)) isOpen = false;

      setIsMarketOpen(isOpen);

      // --- Countdown Logic ---
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
          setMarketCountdown(`${h}h ${m}m ${s}s`);
      } else {
          setMarketCountdown("00h 00m 00s");
      }
    };

    updateTimeAndMarketStatus();
    const timer = setInterval(updateTimeAndMarketStatus, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Time for Colombo
  const colomboTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Colombo',
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

  // Calculate Global Stats
  const globalStats = useMemo(() => {
    let totalPnl = 0;
    let maxPnl = -Infinity;
    let minPnl = Infinity;
    let totalDurationMinutes = 0;
    let timedTradeCount = 0;
    
    // Holding Time Tracking
    let minDuration = Infinity;
    let maxDuration = 0;

    // News/Normal split
    let newsCount = 0;
    let normalCount = 0;

    if (trades.length === 0) {
      return { 
          totalPnl: 0, 
          bestTrade: 0, 
          worstTrade: 0, 
          avgTime: '0m', 
          growthPct: 0,
          shortestHold: '0m',
          longestHold: '0m',
          avgHoldNum: 0,
          shortestHoldNum: 0,
          longestHoldNum: 0,
          avgTradePnl: 0,
          newsCount: 0,
          normalCount: 0,
          currentBalance: 50000
      };
    }

    trades.forEach(t => {
      totalPnl += t.pnl;
      if (t.pnl > maxPnl) maxPnl = t.pnl;
      if (t.pnl < minPnl) minPnl = t.pnl;

      if (t.newsEvent) newsCount++;
      else normalCount++;

      // Ensure we are using the real trades from the journal
      if (t.exitTime && t.entryTime && t.entryTime !== '00:00:00' && t.exitTime !== '00:00:00') {
         const [h1, m1] = t.entryTime.split(':').map(Number);
         const [h2, m2] = t.exitTime.split(':').map(Number);
         let minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
         if (minutes < 0) minutes += 24 * 60; 
         if (minutes > 0 && minutes < 1440) {
            totalDurationMinutes += minutes;
            timedTradeCount++;
            if (minutes < minDuration) minDuration = minutes;
            if (minutes > maxDuration) maxDuration = minutes;
         }
      }
    });

    const avgMinutes = timedTradeCount > 0 ? Math.floor(totalDurationMinutes / timedTradeCount) : 0;
    
    const formatDur = (m: number) => {
        if (m === Infinity || m === 0) return '0m';
        const h = Math.floor(m / 60);
        const mins = m % 60;
        if (h > 0) return `${h}h ${mins}m`;
        return `${mins}m`;
    };

    const initialBalance = 50000;
    const currentBalance = initialBalance + totalPnl;
    const growthPct = (totalPnl / initialBalance) * 100;
    const avgTradePnl = trades.length > 0 ? totalPnl / trades.length : 0;

    return {
      totalPnl,
      bestTrade: maxPnl === -Infinity ? 0 : maxPnl,
      worstTrade: minPnl === Infinity ? 0 : minPnl,
      avgTime: formatDur(avgMinutes),
      growthPct,
      shortestHold: minDuration === Infinity ? '0m' : formatDur(minDuration),
      longestHold: formatDur(maxDuration),
      shortestHoldNum: minDuration === Infinity ? 0 : minDuration,
      longestHoldNum: maxDuration,
      avgHoldNum: avgMinutes,
      avgTradePnl,
      newsCount,
      normalCount,
      currentBalance
    };
  }, [trades]);

  const performanceChartData = useMemo(() => {
    const dailyMap = new Map<string, { total: number; normal: number; news: number }>();
    
    trades.forEach(t => {
      const entry = dailyMap.get(t.date) || { total: 0, normal: 0, news: 0 };
      entry.total += t.pnl;
      if (t.newsEvent) {
        entry.news += t.pnl;
      } else {
        entry.normal += t.pnl;
      }
      dailyMap.set(t.date, entry);
    });

    const sortedDates = Array.from(dailyMap.keys()).sort();

    let runningTotal = 50000;
    let runningNormal = 50000;
    let runningNews = 50000;

    const fullHistory = [
       { date: 'Start', price: 50000, normal: 50000, news: 50000 }
    ];

    sortedDates.forEach(date => {
        const stats = dailyMap.get(date)!;
        runningTotal += stats.total;
        runningNormal += stats.normal;
        runningNews += stats.news;

        fullHistory.push({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            price: runningTotal, 
            normal: runningNormal, 
            news: runningNews
        });
    });
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

  const rankingStats = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthTrades = trades.filter(t => t.date.startsWith(monthPrefix));
    
    const counts = { es: 0, nq: 0, gc: 0, other: 0 };
    
    monthTrades.forEach(t => {
       const p = t.pair.toUpperCase();
       if (p.includes('ES') || p.includes('S&P')) counts.es++;
       else if (p.includes('NQ') || p.includes('NAS')) counts.nq++;
       else if (p.includes('GC') || p.includes('GOLD') || p.includes('XAU')) counts.gc++;
       else counts.other++;
    });

    const TARGET = 20;

    return {
      es: Math.min(counts.es / TARGET, 1),
      nq: Math.min(counts.nq / TARGET, 1),
      gc: Math.min(counts.gc / TARGET, 1),
      other: Math.min(counts.other / TARGET, 1)
    };
  }, [trades, currentCalendarDate]);

  const radarData = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
        return [
            { subject: 'Win Rate', A: 0, fullMark: 100 },
            { subject: 'Profit Factor', A: 0, fullMark: 100 },
            { subject: 'Consistency', A: 0, fullMark: 100 },
            { subject: 'Risk/Reward', A: 0, fullMark: 100 },
            { subject: 'Discipline', A: 0, fullMark: 100 },
        ];
    }
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = (wins.length / totalTrades) * 100;

    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 3 : 0) : grossProfit / grossLoss;
    const pfScore = Math.min((profitFactor / 3) * 100, 100);

    const consistencyScore = Math.min((totalTrades / 50) * 100, 100);

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 1; 
    const rrRatio = avgLoss === 0 ? 0 : avgWin / avgLoss;
    const rrScore = Math.min((rrRatio / 2) * 100, 100);

    let disciplineScore = 100;
    losses.forEach(l => {
        if (Math.abs(l.pnl) > avgLoss * 2) disciplineScore -= 10;
    });
    disciplineScore = Math.max(0, disciplineScore);

    return [
        { subject: 'Win Rate', A: winRate, fullMark: 100 },
        { subject: 'Profit Factor', A: pfScore, fullMark: 100 },
        { subject: 'Consistency', A: consistencyScore, fullMark: 100 },
        { subject: 'Risk/Reward', A: rrScore, fullMark: 100 },
        { subject: 'Discipline', A: disciplineScore, fullMark: 100 },
    ];
  }, [trades]);


  const handleAddTradeClick = (date: string) => {
    setSelectedDate(date);
    setEditingTrade(undefined); // Reset edit mode
    setIsAddModalOpen(true);
  };

  const handleAddTradeBtnClick = () => {
    const dateStr = getLocalDateString();
    setSelectedDate(dateStr);
    setEditingTrade(undefined); // Reset edit mode
    setIsAddModalOpen(true);
  }

  const handleEditTrade = (trade: Trade) => {
    setSelectedDate(trade.date);
    setEditingTrade(trade);
    setIsAddModalOpen(true);
  }

  const handleDeleteTrade = (tradeId: string) => {
    let updatedTrades: Trade[] = [];
    setTrades(prev => {
        updatedTrades = prev.filter(t => t.id !== tradeId);
        return updatedTrades;
    });
    syncToCloud(updatedTrades);
  }

  const handleViewDayClick = (date: string) => {
    setSelectedDate(date);
    setSelectedTrades(trades.filter(t => t.date === date));
    setIsDetailModalOpen(true);
  };

  const handleViewWeekClick = (weekTrades: Trade[], weekLabel: string) => {
    setSelectedDate(weekLabel);
    setSelectedTrades(weekTrades);
    setIsDetailModalOpen(true);
  }

  const handleAddOrUpdateTrade = (tradeData: Trade) => {
    const currentTrades = trades;
    let newTrades: Trade[] = [];
    
    const existingIndex = currentTrades.findIndex(t => t.id === tradeData.id);
    if (existingIndex >= 0) {
        newTrades = [...currentTrades];
        newTrades[existingIndex] = tradeData;
    } else {
        newTrades = [...currentTrades, tradeData];
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

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex items-center justify-center p-2 md:p-4 lg:p-6 overflow-y-auto lg:overflow-hidden font-sans selection:bg-nexus-accent selection:text-black bg-black">
      <PaperBackground />
      
      {/* Main Container - Responsive Sizing */}
      <div className="w-full max-w-[1500px] h-auto lg:h-full glass-panel rounded-2xl md:rounded-3xl lg:rounded-[3rem] relative overflow-hidden flex flex-col p-3 md:p-6 lg:p-8 transition-all duration-500">
        
        {/* ================= HEADER AREA ================= */}
        <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 shrink-0 z-20 w-full min-h-[50px] gap-4 md:gap-0">
           {/* Welcome Text */}
           <div className="md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 text-center md:text-left">
             <h2 className="text-white font-bold text-xl md:text-xl tracking-tight">Welcome, Gehan</h2>
             <p className="text-xs text-nexus-muted">Good to see you again.</p>
           </div>
           
           {/* Market Status Card */}
           <div className="group relative">
             <div className="liquid-card rounded-full pl-3 pr-5 py-2 flex items-center gap-4 cursor-default transition-transform active:scale-95">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-md">
                   <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`}></div>
                </div>
                <div className="flex flex-col text-left">
                  <h1 className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-md">
                    {isMarketOpen ? 'Market Open' : 'Market Closed'}
                  </h1>
                  <span className="text-[9px] text-nexus-muted uppercase tracking-widest font-mono">
                    CMB {colomboTime}
                  </span>
                </div>
              </div>
              
              {/* Detailed Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 w-[300px]">
                  <div className="bg-[#18181b] border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-3 text-left">
                     <div className="flex items-center gap-2 text-nexus-muted">
                        {isMarketOpen ? <CheckCircle size={16} /> : <MinusCircle size={16} />}
                        <span className="font-bold text-sm text-[#e4e4e7]">{isMarketOpen ? 'Market open' : 'Market closed'}</span>
                     </div>
                     <p className="text-sm text-[#a1a1aa] leading-snug">
                       {isMarketOpen 
                         ? <span>Market is active. It'll close in <strong className="text-white">{verboseCountdown}</strong>.</span>
                         : <span>Time for a walk — this market is closed. It'll open in <strong className="text-white">{verboseCountdown}</strong>.</span>
                       }
                     </p>
                     <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-[#52525b] mb-1 font-bold tracking-wider">
                           <span>{chicagoDayName} 00:00</span>
                           <span>24:00</span>
                        </div>
                        <div className="relative h-1.5 bg-[#27272a] rounded-full w-full overflow-hidden">
                            {renderTimelineSegments()}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_white] z-20" style={{ left: `${chicagoProgress}%` }}></div>
                        </div>
                        <div className="mt-3 text-center">
                            <span className="text-[10px] text-[#52525b] font-medium">Exchange timezone: Chicago (UTC-6)</span>
                        </div>
                     </div>
                  </div>
              </div>
           </div>
        </div>

        {/* ================= VIEW SWITCHING CONTENT ================= */}
        <AnimatePresence mode="wait">
        
        {currentView === 'dashboard' ? (
        
        <motion.div 
            key="dashboard-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 z-10 pb-4 lg:pb-0"
        >
          
          {/* ================= LEFT COLUMN (Stats) ================= */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full min-h-0 order-2 lg:order-1">
            
            {/* Total P&L Card */}
            <div className="liquid-card rounded-3xl p-5 relative overflow-hidden flex flex-col group h-auto shrink-0 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="relative z-10 w-full mb-auto">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest text-nexus-muted group-hover:text-white transition-colors">Total P&L</span>
                </div>
              </div>
              <div className="relative z-10 flex items-end justify-between gap-1 md:gap-2 mt-4">
                 <div className="w-20 h-16 md:w-28 md:h-20 xl:w-40 xl:h-28 relative shrink-0 -ml-2 md:-ml-4 translate-y-2 md:translate-y-3 mix-blend-screen opacity-100 flex items-end transition-all duration-300">
                      <AsciiPyramid fillLevels={rankingStats} />
                 </div>
                 <div className="flex flex-col items-end gap-1 md:gap-2 flex-1 min-w-0">
                     <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                         globalStats.growthPct >= 0 
                         ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                         : 'text-red-400 bg-red-500/10 border-red-500/20'
                     }`}>
                         {globalStats.growthPct >= 0 ? '+' : ''}{globalStats.growthPct.toFixed(2)}% Growth
                     </span>
                     <span className={`text-2xl sm:text-3xl xl:text-5xl font-light tracking-tighter glow-text whitespace-nowrap transition-all duration-300 ${globalStats.totalPnl >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatCurrency(globalStats.totalPnl)}
                     </span>
                 </div>
              </div>
            </div>

            {/* Performance Radar Chart - Fixed Height, doesn't grow */}
            <div className="liquid-card rounded-3xl p-5 w-full h-[320px] lg:h-[340px] shrink-0 flex flex-col group relative overflow-hidden">
                <span className="text-[10px] uppercase tracking-widest text-nexus-muted block mb-2 group-hover:text-white transition-colors z-10 relative">Performance Metrics</span>
                <div className="flex-1 w-full relative z-10 flex items-center justify-center">
                   <PerformanceRadar data={radarData} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-nexus-accent/5 to-transparent opacity-50 pointer-events-none"></div>
            </div>
            
            {/* Empty space placeholder - No Card */}
            <div className="hidden lg:block flex-1 min-h-[50px]"></div>

          </div>


          {/* ================= CENTER COLUMN (CALENDAR / JOURNAL) ================= */}
          <div className="col-span-1 md:col-span-2 lg:col-span-6 relative flex flex-col items-center h-[500px] lg:h-full lg:min-h-0 min-h-[600px] order-1 lg:order-2 pb-24 lg:pb-0">
            
            <div className="w-full flex-1 mb-6 min-h-0 relative overflow-hidden">
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
                     <TradingCalendar 
                       trades={trades}
                       currentDate={currentCalendarDate}
                       onMonthChange={setCurrentCalendarDate}
                       onAddTradeClick={handleAddTradeClick}
                       onViewDayClick={handleViewDayClick}
                       onViewWeekClick={handleViewWeekClick}
                       monthlyStats={monthlyStats}
                     />
                   ) : (
                     <JournalTable 
                       trades={trades} 
                       onEdit={handleEditTrade}
                       onDelete={handleDeleteTrade}
                       onViewDay={handleViewDayClick}
                     />
                   )}
                 </motion.div>
               </AnimatePresence>
            </div>
            {/* Floating Menu is now outside this grid */}
          </div>


          {/* ================= RIGHT COLUMN ================= */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full min-h-0 order-3 lg:order-3">
            
            {/* 1. Performance Chart - Modified Header */}
            <div className="liquid-card rounded-3xl p-5 h-[320px] lg:h-auto lg:flex-1 lg:min-h-0 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start shrink-0 z-10 mb-2">
                 <div className="w-full">
                    <span className="text-[9px] uppercase tracking-widest text-nexus-muted block mb-2 group-hover:text-white transition-colors">Performance</span>
                    <div className="flex justify-between items-center w-full px-1">
                         <div className="flex flex-col">
                            <span className="text-[8px] text-nexus-muted uppercase font-bold opacity-60">Balance</span>
                            <span className="text-sm font-bold text-white tracking-tight">${globalStats.currentBalance.toLocaleString()}</span>
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="text-[8px] text-nexus-muted uppercase font-bold opacity-60">Normal</span>
                            <span className="text-sm font-bold text-emerald-400">{globalStats.normalCount}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[8px] text-nexus-muted uppercase font-bold opacity-60">News</span>
                            <span className="text-sm font-bold text-yellow-500">{globalStats.newsCount}</span>
                         </div>
                    </div>
                 </div>
              </div>
              <div className="flex-1 w-full relative min-h-0 -mx-2 mt-2">
                 <EnergyChart data={performanceChartData} />
              </div>
            </div>

            {/* 2. Trade Holding Time - Fixed Height */}
            <div className="liquid-card rounded-3xl p-5 h-[160px] shrink-0 flex flex-col relative overflow-hidden group">
                <div className="flex justify-between items-start shrink-0 z-10">
                    <div>
                        <span className="text-[9px] uppercase tracking-widest text-nexus-muted block mb-0.5 group-hover:text-white transition-colors">Efficiency</span>
                        <div className="flex items-center gap-1.5">
                             <Clock size={14} className="text-nexus-accent" />
                             <span className="text-xs font-bold text-white">Trade Holding Time</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full relative min-h-0 mt-3 flex flex-col justify-center gap-3">
                    
                    {/* Shortest */}
                    <div className="flex flex-col gap-1.5">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] text-nexus-muted uppercase tracking-widest font-medium">Shortest</span>
                          <span className="text-xs font-bold text-white font-mono">{globalStats.shortestHold}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div 
                             className="h-full bg-emerald-500 rounded-full opacity-80" 
                             style={{ width: `${Math.max(2, (globalStats.shortestHoldNum / (globalStats.longestHoldNum || 1)) * 100)}%` }}
                          ></div>
                       </div>
                    </div>

                    {/* Average */}
                    <div className="flex flex-col gap-1.5">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] text-nexus-muted uppercase tracking-widest font-medium">Average</span>
                          <span className="text-xs font-bold text-white font-mono">{globalStats.avgTime}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex">
                           <div 
                             className="h-full bg-nexus-accent rounded-full" 
                             style={{ width: `${Math.max(2, (globalStats.avgHoldNum / (globalStats.longestHoldNum || 1)) * 100)}%` }}
                          ></div>
                       </div>
                    </div>

                     {/* Longest */}
                    <div className="flex flex-col gap-1.5">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] text-nexus-muted uppercase tracking-widest font-medium">Longest</span>
                          <span className="text-xs font-bold text-white font-mono">{globalStats.longestHold}</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex">
                           <div 
                             className="h-full bg-blue-500 rounded-full opacity-80" 
                             style={{ width: '100%' }}
                          ></div>
                       </div>
                    </div>

                </div>
            </div>

            {/* 3. Stats Card - Compact Fixed Height */}
            <div className="liquid-card rounded-3xl p-4 shrink-0 flex flex-col gap-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-nexus-muted">Session Insights</span>
                    <Activity size={14} className="text-nexus-muted" />
                 </div>
                 
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                           <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                             <ArrowUpRight size={10} />
                           </div>
                           <span className="text-[10px] text-nexus-muted">Best Trade</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{formatCurrency(globalStats.bestTrade)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2">
                           <div className="p-1 rounded-full bg-red-500/20 text-red-500">
                             <ArrowDownRight size={10} />
                           </div>
                           <span className="text-[10px] text-nexus-muted">Worst Trade</span>
                        </div>
                        <span className="text-xs font-bold text-red-400">{formatCurrency(globalStats.worstTrade)}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                         <div className="flex items-center gap-2">
                           <div className="p-1 rounded-full bg-blue-500/20 text-blue-500">
                             <TrendingUp size={10} />
                           </div>
                           <span className="text-[10px] text-nexus-muted">Avg Trade</span>
                        </div>
                        <span className="text-xs font-bold text-white">{formatCurrency(globalStats.avgTradePnl)}</span>
                    </div>
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
                 <PsychologyPage trades={trades} />
             </motion.div>
        )}
        </AnimatePresence>

        {/* Floating Menu - New Animated Version */}
        <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center items-center pointer-events-none">
            <motion.div 
               layout
               className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-2 pointer-events-auto shadow-2xl"
               transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
                {/* Psychology Button */}
                <motion.button
                    layout
                    onClick={() => setCurrentView(currentView === 'psychology' ? 'dashboard' : 'psychology')}
                    className={`relative flex items-center justify-center gap-2 rounded-full transition-colors overflow-hidden ${
                        currentView === 'psychology' 
                        ? 'bg-white/10 text-purple-400 px-6 py-3' 
                        : 'w-12 h-12 text-nexus-muted hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Brain size={20} className="shrink-0" />
                    <AnimatePresence mode="popLayout">
                    {currentView === 'psychology' && (
                        <motion.span 
                            initial={{ opacity: 0, width: 0 }} 
                            animate={{ opacity: 1, width: 'auto' }} 
                            exit={{ opacity: 0, width: 0 }}
                            className="text-xs font-medium whitespace-nowrap overflow-hidden"
                        >
                            Psychology
                        </motion.span>
                    )}
                    </AnimatePresence>
                </motion.button>

                {/* Dashboard Tab */}
                <motion.button
                    layout
                    onClick={() => { setCurrentView('dashboard'); setActiveTab('dashboard'); }}
                    className={`relative flex items-center justify-center gap-2 rounded-full transition-colors overflow-hidden ${
                        currentView === 'dashboard' && activeTab === 'dashboard'
                        ? 'bg-white/10 text-white px-6 py-3 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : currentView === 'psychology'
                            ? 'w-12 h-12 text-nexus-muted hover:text-white hover:bg-white/10' // Icon mode
                            : 'w-12 h-12 text-nexus-muted hover:text-white hover:bg-white/10' 
                    }`}
                >
                    <LayoutGrid size={20} className="shrink-0" />
                    <AnimatePresence mode="popLayout">
                    {currentView === 'dashboard' && (
                        <motion.span 
                            initial={{ opacity: 0, width: 0 }} 
                            animate={{ opacity: 1, width: 'auto' }} 
                            exit={{ opacity: 0, width: 0 }}
                            className="text-xs font-medium whitespace-nowrap overflow-hidden"
                        >
                            Dashboard
                        </motion.span>
                    )}
                    </AnimatePresence>
                </motion.button>

                {/* Journal Tab */}
                <AnimatePresence mode="popLayout">
                    {currentView === 'dashboard' && (
                        <motion.button
                            layout
                            initial={{ opacity: 0, width: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, width: 'auto', scale: 1 }} 
                            exit={{ opacity: 0, width: 0, scale: 0.8 }}
                            onClick={() => setActiveTab('journal')}
                            className={`relative flex items-center justify-center gap-2 rounded-full transition-colors overflow-hidden ${
                                activeTab === 'journal'
                                ? 'bg-white/10 text-white px-6 py-3 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                : 'px-6 py-3 text-nexus-muted hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <BookOpen size={20} className="shrink-0" />
                            <span className="text-xs font-medium whitespace-nowrap">Journal</span>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Add Trade Button */}
                <AnimatePresence mode="popLayout">
                    {currentView === 'dashboard' && (
                        <motion.button
                            layout
                            initial={{ opacity: 0, width: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, width: 'auto', scale: 1 }} 
                            exit={{ opacity: 0, width: 0, scale: 0.8 }}
                            onClick={handleAddTradeBtnClick}
                            className="bg-nexus-accent text-black px-6 py-3 rounded-full flex items-center gap-2 font-medium text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-lg whitespace-nowrap overflow-hidden"
                        >
                            <Plus size={16} className="shrink-0" />
                            <span>Add Trade</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>

        {/* MODALS */}
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
          
          {isDetailModalOpen && selectedDate && (
             <DayDetailsModal 
               key="day-details"
               isOpen={true}
               onClose={() => setIsDetailModalOpen(false)}
               date={selectedDate}
               trades={selectedTrades}
               onEdit={handleEditTrade}
               onDelete={handleDeleteTrade}
               onAddTrade={() => {
                  setIsDetailModalOpen(false);
                  setEditingTrade(undefined);
                  setTimeout(() => setIsAddModalOpen(true), 200); 
               }}
             />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default App;