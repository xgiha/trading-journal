import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wifi, 
  Thermometer, 
  Lightbulb, 
  LayoutGrid, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sun, 
  Droplets, 
  Plus, 
  Activity, 
  Clock, 
  Zap, 
  MinusCircle, 
  CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EnergyChart from './components/EnergyChart';
import NewsChart from './components/NewsChart';
import PerformanceRadar from './components/PerformanceRadar';
import PaperBackground from './components/PaperBackground';
import { TradingCalendar } from './components/TradingCalendar';
import { JournalTable } from './components/JournalTable';
import ActivityHeatmap from './components/ActivityHeatmap';
import AsciiPyramid from './components/AsciiPyramid';
import { AddTradeModal, DayDetailsModal } from './components/TradeModals';
import { Trade } from './types';

const TABS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'journal', icon: BookOpen, label: 'Journal' },
];

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketCountdown, setMarketCountdown] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
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
    
    // Fallback Mock Data if empty
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return [
      { id: '1', date: `${year}-${month}-02`, pair: 'XAU/USD', pnl: 450, entryTime: '09:30', exitTime: '10:15', type: 'Long', entryPrice: 2045.50, exitPrice: 2050.00, size: '2.0', fee: 12 },
      { id: '2', date: `${year}-${month}-02`, pair: 'EUR/USD', pnl: -120, entryTime: '14:15', exitTime: '14:45', type: 'Short', entryPrice: 1.0850, exitPrice: 1.0865, size: '1.5', fee: 5 },
      { id: '3', date: `${year}-${month}-05`, pair: 'BTC/USD', pnl: 1250, entryTime: '11:00', exitTime: '18:00', type: 'Long', entryPrice: 42100, exitPrice: 43500, size: '0.5', fee: 45, newsEvent: 'ETF Approval' },
      { id: '4', date: `${year}-${month}-09`, pair: 'NVDA', pnl: -300, entryTime: '10:00', exitTime: '10:30', type: 'Long', entryPrice: 850.20, exitPrice: 845.00, size: '100 Shares', fee: 2 },
      { id: '5', date: `${year}-${month}-09`, pair: 'TSLA', pnl: 800, entryTime: '15:45', exitTime: '15:55', type: 'Short', entryPrice: 175.50, exitPrice: 172.00, size: '200 Shares', fee: 4 },
    ];
  });

  // Save to LocalStorage whenever trades change
  useEffect(() => {
    localStorage.setItem('nexus_trades', JSON.stringify(trades));
  }, [trades]);

  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  // Initialize with today's date to prevent null rendering issues for modals
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
      const minute = now.getUTCMinutes();
      const second = now.getUTCSeconds();

      let isOpen = true;

      // Weekend Closure
      if (day === 6) isOpen = false; // Saturday
      if (day === 5 && hour >= 22) isOpen = false; // Friday after 22:00 UTC
      if (day === 0 && hour < 23) isOpen = false; // Sunday before 23:00 UTC

      // Daily Break (Mon-Thu)
      if ((day >= 1 && day <= 4) && (hour === 22)) isOpen = false;

      setIsMarketOpen(isOpen);

      // --- Countdown Logic ---
      let targetDate = new Date(now);
      
      if (isOpen) {
          // If Open, calculate time to CLOSE (Next 22:00 UTC)
          targetDate.setUTCHours(22, 0, 0, 0);
          if (day === 0) {
              // Sunday -> Monday 22:00
              targetDate.setUTCDate(targetDate.getUTCDate() + 1);
          } else if (hour >= 22) {
              // After 22:00 -> Tomorrow
              targetDate.setUTCDate(targetDate.getUTCDate() + 1);
          }
      } else {
          // If Closed, calculate time to OPEN
          if (day === 6 || (day === 5 && hour >= 22) || (day === 0 && hour < 23)) {
              // Weekend -> Sunday 23:00
              targetDate.setUTCHours(23, 0, 0, 0);
              // Find next Sunday
              const daysUntilSunday = (7 - day) % 7; 
              if (day === 0) { /* already Sunday, just time check handled by setHours */ }
              else { targetDate.setUTCDate(targetDate.getUTCDate() + daysUntilSunday); }
          } else {
              // Weekday Break -> Today 23:00
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

  // Format Time for Colombo (UTC+5:30)
  const colomboTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Derived State for Tooltip
  const chicagoTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const chicagoDayName = chicagoTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const chicagoProgress = ((chicagoTime.getHours() * 60 + chicagoTime.getMinutes()) / (24 * 60)) * 100;
  
  const verboseCountdown = useMemo(() => {
    return marketCountdown
      .replace(/ \d+s$/, '') // Remove seconds
      .replace(/(\d+)h/, '$1 hours and')
      .replace(/(\d+)m/, '$1 minutes');
  }, [marketCountdown]);

  const renderTimelineSegments = () => {
    const day = chicagoTime.getDay();
    // 0=Sun, 1=Mon...6=Sat
    const OPEN_Start = 70.83; // 17:00
    const CLOSE_End = 66.66; // 16:00
    
    let segments = [];
    if (day === 0) { // Sunday
        segments.push({ left: 0, width: OPEN_Start, color: 'bg-[#3f3f46]' }); // Closed
        segments.push({ left: OPEN_Start, width: 100 - OPEN_Start, color: 'bg-emerald-500' }); // Open
    } else if (day >= 1 && day <= 4) { // Mon-Thu
        segments.push({ left: 0, width: CLOSE_End, color: 'bg-emerald-500' }); // Open
        segments.push({ left: CLOSE_End, width: OPEN_Start - CLOSE_End, color: 'bg-[#3f3f46]' }); // Break
        segments.push({ left: OPEN_Start, width: 100 - OPEN_Start, color: 'bg-emerald-500' }); // Open
    } else if (day === 5) { // Friday
        segments.push({ left: 0, width: CLOSE_End, color: 'bg-emerald-500' }); // Open
        segments.push({ left: CLOSE_End, width: 100 - CLOSE_End, color: 'bg-[#3f3f46]' }); // Closed
    } else { // Saturday
        segments.push({ left: 0, width: 100, color: 'bg-[#3f3f46]' }); // Closed
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

    if (trades.length === 0) {
      return { totalPnl: 0, bestTrade: 0, worstTrade: 0, avgTime: '0h 0m' };
    }

    trades.forEach(t => {
      totalPnl += t.pnl;
      if (t.pnl > maxPnl) maxPnl = t.pnl;
      if (t.pnl < minPnl) minPnl = t.pnl;

      if (t.exitTime && t.entryTime && t.entryTime !== '00:00:00' && t.exitTime !== '00:00:00') {
         const [h1, m1] = t.entryTime.split(':').map(Number);
         const [h2, m2] = t.exitTime.split(':').map(Number);
         let minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
         // Handle midnight crossing or negative result roughly
         if (minutes < 0) minutes += 24 * 60; 
         // Filter outliers
         if (minutes > 0 && minutes < 1440) {
            totalDurationMinutes += minutes;
            timedTradeCount++;
         }
      }
    });

    const avgMinutes = timedTradeCount > 0 ? Math.floor(totalDurationMinutes / timedTradeCount) : 0;
    const avgH = Math.floor(avgMinutes / 60);
    const avgM = avgMinutes % 60;
    const avgTimeStr = `${avgH}h ${avgM}m`;

    return {
      totalPnl,
      bestTrade: maxPnl === -Infinity ? 0 : maxPnl,
      worstTrade: minPnl === Infinity ? 0 : minPnl,
      avgTime: avgTimeStr
    };
  }, [trades]);

  // Calculate Chart Data (Cumulative P&L)
  const performanceChartData = useMemo(() => {
    // 1. Group by date and sum P&L
    const dailyMap = new Map<string, number>();
    trades.forEach(t => {
      const curr = dailyMap.get(t.date) || 0;
      dailyMap.set(t.date, curr + t.pnl);
    });

    // 2. Sort dates
    const sortedDates = Array.from(dailyMap.keys()).sort();

    // 3. Create Cumulative Data Points
    // Start at 50,000 as base account balance
    let running = 50000;
    
    // We'll take up to the last 14 active days to show a trend
    const slicedDates = sortedDates.slice(-14); 
    
    // If no trades, return at least one point at base
    if (slicedDates.length === 0) return [{ date: 'Start', price: running }];

    const chartPoints = slicedDates.map(date => {
      running += dailyMap.get(date)!;
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        price: running
      };
    });

    // Add initial point if only few points to show "growth" from 50k
    if (chartPoints.length < 2) {
       return [{ date: 'Start', price: 50000 }, ...chartPoints];
    }
    return chartPoints;
  }, [trades]);

  // Calculate News vs Normal Performance
  const newsVsNormalData = useMemo(() => {
      const newsTrades = trades.filter(t => !!t.newsEvent);
      const normalTrades = trades.filter(t => !t.newsEvent);
      
      const calcPnl = (subset: Trade[]) => subset.reduce((sum, t) => sum + t.pnl, 0);

      return [
        { name: 'Normal', pnl: calcPnl(normalTrades) },
        { name: 'News', pnl: calcPnl(newsTrades) }
      ];
  }, [trades]);

  // Calculate Monthly Stats for Calendar
  const monthlyStats = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1; // 0-index to 1-index
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    
    const monthTrades = trades.filter(t => t.date.startsWith(monthPrefix));
    
    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const count = monthTrades.length;
    const wins = monthTrades.filter(t => t.pnl > 0).length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;

    return { totalPnl, count, winRate };
  }, [trades, currentCalendarDate]);

  // Calculate Weekly Stats for Performance Card
  const weeklyPerformance = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    // Filter last 7 days
    const weekTrades = trades.filter(t => new Date(t.date) >= oneWeekAgo);
    const weekPnl = weekTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    // Calculate simple win rate for "Return" placeholder
    const wins = weekTrades.filter(t => t.pnl > 0).length;
    const rate = weekTrades.length > 0 ? (wins / weekTrades.length) * 100 : 0;
    
    return {
        pnl: weekPnl,
        winRate: rate
    };
  }, [trades]);

  // Calculate Pyramid Ranking Stats for Current Month
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

    // Define a "Target" trade count per month to represent 100% fill
    const TARGET = 20;

    return {
      es: Math.min(counts.es / TARGET, 1),
      nq: Math.min(counts.nq / TARGET, 1),
      gc: Math.min(counts.gc / TARGET, 1),
      other: Math.min(counts.other / TARGET, 1)
    };
  }, [trades, currentCalendarDate]);

  // Calculate Radar Chart Data
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

    // 1. Win Rate
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winRate = (wins.length / totalTrades) * 100;

    // 2. Profit Factor (Normalized: 3.0 PF = 100 score)
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 3 : 0) : grossProfit / grossLoss;
    const pfScore = Math.min((profitFactor / 3) * 100, 100);

    // 3. Consistency (Score based on trade count vs target of 20/mo roughly or just global activity cap)
    // Let's cap at 50 trades for 100 score global for now
    const consistencyScore = Math.min((totalTrades / 50) * 100, 100);

    // 4. Risk / Reward (Normalized: 2.0 RR = 100 score)
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 1; // avoid div 0
    const rrRatio = avgLoss === 0 ? 0 : avgWin / avgLoss;
    const rrScore = Math.min((rrRatio / 2) * 100, 100);

    // 5. Discipline (Mock Metric - could be based on deviations, but hard to calc without plan data)
    // We'll set a base score and subtract points for very large losses (> 2x avg loss)
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
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setEditingTrade(undefined); // Reset edit mode
    setIsAddModalOpen(true);
  }

  const handleEditTrade = (trade: Trade) => {
    setSelectedDate(trade.date); // Ensure selectedDate matches the trade so form is correct
    setEditingTrade(trade);
    setIsAddModalOpen(true);
  }

  const handleDeleteTrade = (tradeId: string) => {
    setTrades(prev => prev.filter(t => t.id !== tradeId));
  }

  const handleViewDayClick = (date: string) => {
    setSelectedDate(date);
    setSelectedTrades(trades.filter(t => t.date === date));
    setIsDetailModalOpen(true);
  };

  const handleViewWeekClick = (weekTrades: Trade[], weekLabel: string) => {
    setSelectedDate(weekLabel); // Using date field as label for the modal title
    setSelectedTrades(weekTrades);
    setIsDetailModalOpen(true);
  }

  const handleAddOrUpdateTrade = (tradeData: Trade) => {
    // 1. Update Global Trades State
    setTrades(prev => {
        const existingIndex = prev.findIndex(t => t.id === tradeData.id);
        if (existingIndex >= 0) {
            // Update existing trade
            const newTrades = [...prev];
            newTrades[existingIndex] = tradeData;
            return newTrades;
        } else {
            // Add new trade
            return [...prev, tradeData];
        }
    });

    // 2. Update Selected Trades State (if currently viewing details for this date)
    if (selectedDate === tradeData.date) {
        setSelectedTrades(prev => {
            const existingIndex = prev.findIndex(t => t.id === tradeData.id);
            if (existingIndex >= 0) {
                // Update
                const newSelected = [...prev];
                newSelected[existingIndex] = tradeData;
                return newSelected;
            } else {
                // Add
                return [...prev, tradeData];
            }
        });
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-y-auto lg:overflow-hidden font-sans selection:bg-nexus-accent selection:text-black bg-black">
      <PaperBackground />
      
      {/* Main Dashboard Card - Responsive Sizing */}
      <div className="w-full max-w-[1500px] h-auto lg:h-full glass-panel rounded-none md:rounded-3xl lg:rounded-[3rem] relative overflow-hidden flex flex-col p-4 md:p-6 lg:p-8 transition-all duration-500">
        
        {/* ================= HEADER AREA ================= */}
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-center mb-6 shrink-0 z-20 w-full min-h-[50px]">
           {/* Welcome Text (Absolute Left on Desktop) */}
           <div className="mb-4 md:mb-0 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2">
             <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">Welcome, Gehan</h2>
             <p className="text-xs text-nexus-muted">Good to see you again.</p>
           </div>
           
           {/* Center: Market Status Card */}
           <div className="group relative">
             <div className="liquid-card rounded-full pl-3 pr-5 py-2 flex items-center gap-4 cursor-default transition-transform active:scale-95">
                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-md">
                   <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`}></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xs font-bold tracking-widest uppercase text-white drop-shadow-md">
                    {isMarketOpen ? 'Market Open' : 'Market Closed'}
                  </h1>
                  <span className="text-[9px] text-nexus-muted uppercase tracking-widest font-mono">
                    CMB {colomboTime}
                  </span>
                </div>
              </div>
              
              {/* Hover Menu - Detailed Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 w-[300px]">
                  <div className="bg-[#18181b] border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-3 text-left">
                     {/* Header */}
                     <div className="flex items-center gap-2 text-nexus-muted">
                        {isMarketOpen ? <CheckCircle size={16} /> : <MinusCircle size={16} />}
                        <span className="font-bold text-sm text-[#e4e4e7]">{isMarketOpen ? 'Market open' : 'Market closed'}</span>
                     </div>

                     {/* Message */}
                     <p className="text-sm text-[#a1a1aa] leading-snug">
                       {isMarketOpen 
                         ? <span>Market is active. It'll close in <strong className="text-white">{verboseCountdown}</strong>.</span>
                         : <span>Time for a walk — this market is closed. It'll open in <strong className="text-white">{verboseCountdown}</strong>.</span>
                       }
                     </p>

                     {/* Timeline */}
                     <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-[#52525b] mb-1 font-bold tracking-wider">
                           <span>{chicagoDayName} 00:00</span>
                           <span>24:00</span>
                        </div>
                        <div className="relative h-1.5 bg-[#27272a] rounded-full w-full overflow-hidden">
                            {/* Render Sessions */}
                            {renderTimelineSegments()}
                            {/* Current Time Cursor */}
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

        {/* ================= MAIN CONTENT GRID ================= */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 z-10 pb-4 lg:pb-0">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full min-h-0 order-1 lg:order-1">
            
            {/* Total P&L Card */}
            <div className="liquid-card rounded-3xl p-5 relative overflow-hidden flex flex-col group h-auto shrink-0 transition-all">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              {/* Top: Label */}
              <div className="relative z-10 w-full mb-auto">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest text-nexus-muted group-hover:text-white transition-colors">Total P&L</span>
                </div>
              </div>
              
              {/* Bottom Row: Pyramid (Left) and Price (Right) */}
              <div className="relative z-10 flex items-end justify-between gap-1 md:gap-2 mt-4">
                 
                 {/* Mini Pyramid Visualization - Responsive Size */}
                 <div className="w-20 h-16 md:w-28 md:h-20 xl:w-40 xl:h-28 relative shrink-0 -ml-2 md:-ml-4 translate-y-2 md:translate-y-3 mix-blend-screen opacity-100 flex items-end transition-all duration-300">
                      <AsciiPyramid fillLevels={rankingStats} />
                 </div>

                 {/* Price & Badge */}
                 <div className="flex flex-col items-end gap-1 md:gap-2 flex-1 min-w-0">
                     <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                         globalStats.totalPnl >= 0 
                         ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                         : 'text-red-400 bg-red-500/10 border-red-500/20'
                     }`}>
                         {globalStats.totalPnl >= 0 ? '+' : ''}{globalStats.totalPnl >= 0 ? 'Profit' : 'Loss'}
                     </span>
                     {/* Responsive Font Size */}
                     <span className={`text-2xl sm:text-3xl xl:text-5xl font-light tracking-tighter glow-text whitespace-nowrap transition-all duration-300 ${globalStats.totalPnl >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatCurrency(globalStats.totalPnl)}
                     </span>
                 </div>
              </div>
            </div>

            {/* Consistency / Activity Heatmap (Linked to current month) - Fixed Height */}
            <ActivityHeatmap 
                trades={trades} 
                currentDate={currentCalendarDate} 
                className="shrink-0" 
            />

            {/* Performance Radar Chart - Fills remaining space, min-h-0 to avoid overflow */}
            <div className="liquid-card rounded-3xl p-5 w-full flex-1 min-h-0 flex flex-col group relative overflow-hidden">
                <span className="text-[10px] uppercase tracking-widest text-nexus-muted block mb-4 group-hover:text-white transition-colors z-10 relative">Performance Metrics</span>
                <div className="flex-1 -ml-4 -mr-4 -mb-4 relative z-10">
                   <PerformanceRadar data={radarData} />
                </div>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-nexus-accent/5 to-transparent opacity-50 pointer-events-none"></div>
            </div>
            
          </div>


          {/* ================= CENTER COLUMN (CALENDAR / JOURNAL) ================= */}
          <div className="col-span-1 lg:col-span-6 relative flex flex-col items-center h-[500px] lg:h-full lg:min-h-0 min-h-[600px] order-2 lg:order-2">
            
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
                     />
                   )}
                 </motion.div>
               </AnimatePresence>
            </div>

            {/* Floating Menu with Separate Add Trade Button */}
            <div className="mb-6 relative z-30 flex items-center gap-4">
               {/* Tab Switcher */}
               <div className="liquid-card p-1.5 rounded-full flex items-center justify-center gap-1 shadow-2xl">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative w-24 md:w-28 py-2.5 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 duration-100 z-20 ${
                      activeTab === tab.id ? 'text-white' : 'text-nexus-muted hover:text-white'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-white/10 border border-white/10 rounded-full -z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <tab.icon size={16} />
                    <span className="text-xs font-medium whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                ))}
               </div>

               {/* Add Trade Button */}
               <button 
                  onClick={handleAddTradeBtnClick}
                  className="liquid-card px-6 py-3 rounded-full flex items-center justify-center gap-2 text-nexus-muted hover:text-white hover:bg-white/10 transition-all active:scale-95 duration-100 group shadow-2xl"
               >
                    <Plus size={16} className="group-hover:text-nexus-accent transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">Add Trade</span>
               </button>
            </div>

          </div>


          {/* ================= RIGHT COLUMN ================= */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full min-h-0 order-3 lg:order-3">
            
            {/* 1. Performance Chart - Flex 1 fills remaining space */}
            <div className="liquid-card rounded-3xl p-5 flex-1 min-h-0 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start shrink-0 z-10">
                 <div>
                    <span className="text-[9px] uppercase tracking-widest text-nexus-muted block mb-0.5 group-hover:text-white transition-colors">My Performance</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{weeklyPerformance.winRate.toFixed(1)}%</span>
                      <span className="text-xs text-nexus-muted">Win Rate</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className={`text-2xl font-bold ${weeklyPerformance.pnl >= 0 ? 'text-nexus-accent' : 'text-red-400'}`}>
                          {formatCurrency(weeklyPerformance.pnl)}
                      </span>
                    </div>
                    <span className="text-[10px] text-nexus-muted">Last 7 Days</span>
                 </div>
              </div>
              <div className="flex-1 w-full relative min-h-0 -mx-2 mt-4">
                 <EnergyChart data={performanceChartData} />
              </div>
            </div>

            {/* 2. News vs Normal Performance - Fixed Height */}
            <div className="liquid-card rounded-3xl p-5 h-[160px] shrink-0 flex flex-col relative overflow-hidden group">
                <div className="flex justify-between items-start shrink-0 z-10">
                    <div>
                        <span className="text-[9px] uppercase tracking-widest text-nexus-muted block mb-0.5 group-hover:text-white transition-colors">Trade Types</span>
                        <div className="flex items-center gap-1.5">
                             <Zap size={14} className="text-nexus-accent" />
                             <span className="text-xs font-bold text-white">News vs Normal</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full relative min-h-0 -mx-2 mt-1">
                    <NewsChart data={newsVsNormalData} />
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
                             <Clock size={10} />
                           </div>
                           <span className="text-[10px] text-nexus-muted">Avg Hold Time</span>
                        </div>
                        <span className="text-xs font-bold text-white">{globalStats.avgTime}</span>
                    </div>
                 </div>
            </div>
            
          </div>

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