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
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EnergyChart from './components/EnergyChart';
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
    
    // Fallback Mock Data if empty (Will be overwritten by cloud fetch if exists)
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
                    // Also update localStorage to stay in sync locally
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
    
    // Holding Time Tracking
    let minDuration = Infinity;
    let maxDuration = 0;

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
          avgTradePnl: 0
      };
    }

    trades.forEach(t => {
      totalPnl += t.pnl;
      if (t.pnl > maxPnl) maxPnl = t.pnl;
      if (t.pnl < minPnl) minPnl = t.pnl;

      // Ensure we are using the real trades from the journal
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
            
            // Track min/max
            if (minutes < minDuration) minDuration = minutes;
            if (minutes > maxDuration) maxDuration = minutes;
         }
      }
    });

    const avgMinutes = timedTradeCount > 0 ? Math.floor(totalDurationMinutes / timedTradeCount) : 0;
    
    // Helper to format duration
    const formatDur = (m: number) => {
        if (m === Infinity || m === 0) return '0m';
        const h = Math.floor(m / 60);
        const mins = m % 60;
        if (h > 0) return `${h}h ${mins}m`;
        return `${mins}m`;
    };

    const avgTimeStr = formatDur(avgMinutes);
    
    // Percentage growth based on assumed 50k starting balance
    const initialBalance = 50000;
    const growthPct = (totalPnl / initialBalance) * 100;

    // Average Trade PnL
    const avgTradePnl = trades.length > 0 ? totalPnl / trades.length : 0;

    return {
      totalPnl,
      bestTrade: maxPnl === -Infinity ? 0 : maxPnl,
      worstTrade: minPnl === Infinity ? 0 : minPnl,
      avgTime: avgTimeStr,
      growthPct,
      // New Stats for Holding Time Card
      shortestHold: minDuration === Infinity ? '0m' : formatDur(minDuration),
      longestHold: formatDur(maxDuration),
      shortestHoldNum: minDuration === Infinity ? 0 : minDuration,
      longestHoldNum: maxDuration,
      avgHoldNum: avgMinutes,
      avgTradePnl
    };
  }, [trades]);

  // Calculate Chart Data (Cumulative P&L)
  const performanceChartData = useMemo(() => {
    // 1. Group by date and separate into Total, Normal, News
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

    // 2. Sort dates chronologically
    const sortedDates = Array.from(dailyMap.keys()).sort();

    // 3. Build Full History of Cumulative Data
    // We assume a base account balance of 50,000 for visualization context
    let runningTotal = 50000;
    let runningNormal = 50000;
    let runningNews = 50000;

    // Force explicit start point for the chart so all lines originate from 50k
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
            price: runningTotal,   // Total Balance
            normal: runningNormal, // Hypothetical Balance (Normal Only)
            news: runningNews      // Hypothetical Balance (News Only)
        });
    });
    
    // Return full history to ensure chart starts at 50k (no slicing)
    return fullHistory;
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
    // Current day at end of day
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // 7 days ago at start of day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const weekTrades = trades.filter(t => {
        // Parse date string (YYYY-MM-DD) into a local date object for comparison
        const [y, m, d] = t.date.split('-').map(Number);
        // Create date object at noon to avoid boundary issues
        const tradeDate = new Date(y, m - 1, d);
        tradeDate.setHours(12, 0, 0, 0);
        
        // Strict timestamp comparison
        return tradeDate.getTime() >= sevenDaysAgo.getTime() && tradeDate.getTime() <= today.getTime();
    });

    const weekPnl = weekTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    // Profit Factor Calculation
    const wins = weekTrades.filter(t => t.pnl > 0);
    const losses = weekTrades.filter(t => t.pnl < 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    
    let pf = 0;
    if (grossLoss === 0) {
        pf = grossProfit > 0 ? 100 : 0; // Show high value if profitable with no losses
    } else {
        pf = grossProfit / grossLoss;
    }
    
    return {
        pnl: weekPnl,
        profitFactor: pf
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
    // Use local date string instead of UTC
    const dateStr = getLocalDateString();
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
    let updatedTrades: Trade[] = [];
    setTrades(prev => {
        updatedTrades = prev.filter(t => t.id !== tradeId);
        return updatedTrades;
    });
    // Sync to cloud
    syncToCloud(updatedTrades);
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
    <div className="min-h-screen lg:h-screen w-full relative flex items-center justify-center p-2 md:p-4 lg:p-6 overflow-y-auto lg:overflow-hidden font-sans selection:bg-nexus-accent selection:text-black bg-black">
      <PaperBackground />
      
      {/* Main Dashboard Card - Responsive Sizing */}
      <div className="w-full max-w-[1500px] h-auto lg:h-full glass-panel rounded-2xl md:rounded-3xl lg:rounded-[3rem] relative overflow-hidden flex flex-col p-3 md:p-6 lg:p-8 transition-all duration-500">
        
        {/* ================= HEADER AREA ================= */}
        <div className="relative flex flex-col md:flex-row items-center justify-center mb-6 shrink-0 z-20 w-full min-h-[50px] gap-4 md:gap-0">
           {/* Welcome Text (Absolute Left on Desktop) */}
           <div className="md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2 text-center md:text-left">
             <h2 className="text-white font-bold text-xl md:text-xl tracking-tight">Welcome, Gehan</h2>
             <p className="text-xs text-nexus-muted">Good to see you again.</p>
           </div>
           
           {/* Center: Market Status Card */}
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
        {/* Responsive Grid: 1 Col (Mobile), 2 Cols (Tablet), 12 Cols (Desktop) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 z-10 pb-4 lg:pb-0">
          
          {/* ================= LEFT COLUMN (Stats) ================= */}
          {/* Mobile: Order 2. Tablet: Order 2. Desktop: Order 1 */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full min-h-0 order-2 lg:order-1">
            
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
                         globalStats.growthPct >= 0 
                         ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                         : 'text-red-400 bg-red-500/10 border-red-500/20'
                     }`}>
                         {globalStats.growthPct >= 0 ? '+' : ''}{globalStats.growthPct.toFixed(2)}% Growth
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
                className="shrink-0" 
            />

            {/* Performance Radar Chart - Fills remaining space or fixed height on mobile */}
            <div className="liquid-card rounded-3xl p-5 w-full h-[320px] lg:h-auto lg:flex-1 lg:min-h-0 flex flex-col group relative overflow-hidden">
                <span className="text-[10px] uppercase tracking-widest text-nexus-muted block mb-4 group-hover:text-white transition-colors z-10 relative">Performance Metrics</span>
                <div className="flex-1 -ml-4 -mr-4 -mb-4 relative z-10">
                   <PerformanceRadar data={radarData} />
                </div>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-nexus-accent/5 to-transparent opacity-50 pointer-events-none"></div>
            </div>
            
          </div>


          {/* ================= CENTER COLUMN (CALENDAR / JOURNAL) ================= */}
          {/* Mobile: Order 1. Tablet: Order 1 (Full Width). Desktop: Order 2 */}
          <div className="col-span-1 md:col-span-2 lg:col-span-6 relative flex flex-col items-center h-[500px] lg:h-full lg:min-h-0 min-h-[600px] order-1 lg:order-2">
            
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

            {/* Floating Menu with Separate Add Trade Button */}
            <div className="mb-2 lg:mb-6 relative z-30 flex items-center gap-4">
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
          {/* Mobile: Order 3. Tablet: Order 3. Desktop: Order 3 */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full min-h-0 order-3 lg:order-3">
            
            {/* 1. Performance Chart - Fixed height on mobile to prevent stretching, flex on desktop */}
            <div className="liquid-card rounded-3xl p-5 h-[320px] lg:h-auto lg:flex-1 lg:min-h-0 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start shrink-0 z-10">
                 <div>
                    <span className="text-[9px] uppercase tracking-widest text-nexus-muted block mb-0.5 group-hover:text-white transition-colors">My Performance</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{weeklyPerformance.profitFactor.toFixed(2)}</span>
                      <span className="text-xs text-nexus-muted">Profit Factor</span>
                    </div>
                 </div>
              </div>
              <div className="flex-1 w-full relative min-h-0 -mx-2 mt-4">
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