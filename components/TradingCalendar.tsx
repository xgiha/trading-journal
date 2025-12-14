import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Activity, Trophy } from 'lucide-react';
import { Trade } from '../types';

interface TradingCalendarProps {
  trades: Trade[];
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  onAddTradeClick: (date: string) => void;
  onViewDayClick: (date: string) => void;
  onViewWeekClick: (trades: Trade[], weekLabel: string) => void;
  monthlyStats: {
    totalPnl: number;
    count: number;
    winRate: number;
  };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TradingCalendar: React.FC<TradingCalendarProps> = ({ 
  trades, 
  currentDate, 
  onMonthChange,
  onAddTradeClick, 
  onViewDayClick, 
  onViewWeekClick,
  monthlyStats
}) => {

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    
    // Adjust for Monday start (Monday=0, Sunday=6)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    return { days, firstDay: adjustedFirstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : '';
    const absVal = Math.abs(val);
    return `${sign}$${absVal.toLocaleString()}`;
  };

  // Generate calendar grid
  const renderCalendarDays = () => {
    const totalSlots = Math.ceil((days + firstDay) / 7) * 7;
    const grid = [];
    
    let currentWeek: React.ReactNode[] = [];

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - firstDay + 1;
      const isDay = dayNum > 0 && dayNum <= days;
      
      const dateStr = isDay 
        ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
        : '';

      const dayTrades = trades.filter(t => t.date === dateStr);
      const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      const dayTradeCount = dayTrades.length;

      currentWeek.push(
        <div 
          key={`day-${i}`} 
          onClick={() => {
            if (isDay) {
              if (dayTradeCount > 0) onViewDayClick(dateStr);
              else onAddTradeClick(dateStr);
            }
          }}
          className={`relative p-1 md:p-2 flex flex-col justify-between transition-all group rounded-lg md:rounded-xl border border-white/5 shadow-sm overflow-hidden aspect-square ${
            isDay 
              ? 'bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg cursor-pointer' 
              : 'opacity-0 pointer-events-none'
          }`}
        >
          {isDay && (
            <>
              <div className="flex justify-between items-start">
                 <span className={`text-[10px] md:text-xs font-semibold ${dayTradeCount > 0 ? 'text-nexus-muted' : 'text-nexus-muted/40'}`}>{dayNum}</span>
              </div>
              
              {dayTradeCount > 0 ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <span className={`text-xs md:text-sm lg:text-base font-bold tracking-tight ${dayPnl >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'}`}>
                    {formatCurrency(dayPnl)}
                  </span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-nexus-muted mt-0.5 hidden md:block">
                    {dayTradeCount} {dayTradeCount === 1 ? 'Trade' : 'Trades'}
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-nexus-accent text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Plus size={14} className="md:w-[18px] md:h-[18px]" />
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      );

      // End of week logic (Every 7 days)
      if ((i + 1) % 7 === 0) {
        // Calculate weekly total
        let weekPnl = 0;
        let weekTradesCount = 0;
        const weekTradesList: Trade[] = [];

        for (let k = 0; k < 7; k++) {
             const dNum = (i - 6 + k) - firstDay + 1;
             if (dNum > 0 && dNum <= days) {
                const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
                const t = trades.filter(tr => tr.date === dStr);
                weekTradesList.push(...t);
                weekPnl += t.reduce((sum, tr) => sum + tr.pnl, 0);
                weekTradesCount += t.length;
             }
        }
        
        const weekStartDay = (i - 6) - firstDay + 1;
        const safeStartDay = weekStartDay < 1 ? 1 : weekStartDay; 
        const weekLabel = `Week of ${currentDate.toLocaleString('default', { month: 'short' })} ${safeStartDay}`;

        grid.push(
            <React.Fragment key={`row-${i}`}>
               {currentWeek}
               {/* Weekly Summary Column */}
               <div 
                onClick={() => weekTradesCount > 0 && onViewWeekClick(weekTradesList, weekLabel)}
                className={`rounded-lg md:rounded-xl p-1 md:p-2 flex flex-col items-center justify-center transition-all border border-white/5 relative overflow-hidden aspect-square ${
                    weekTradesCount > 0 
                      ? 'bg-white/10 hover:bg-white/15 cursor-pointer hover:border-nexus-accent/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                      : 'bg-white/[0.02]'
                }`}
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                  {weekTradesCount > 0 && (
                      <>
                        <span className={`text-xs md:text-lg lg:text-xl font-bold tracking-tighter z-10 ${weekPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                             {formatCurrency(weekPnl)}
                        </span>
                        <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-nexus-muted mt-1 z-10 hidden md:block">
                            {weekTradesCount} {weekTradesCount === 1 ? 'Trade' : 'Trades'}
                        </span>
                      </>
                  )}
               </div>
            </React.Fragment>
        );
        currentWeek = [];
      }
    }
    return grid;
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Controls Header Row - Responsive Wrap */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 shrink-0 w-full">
         
         {/* Month Nav Pill */}
         <div className="liquid-card rounded-full p-1.5 pr-6 flex items-center gap-4 hover:bg-white/5 transition-colors">
            <div className="flex gap-1">
                <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-nexus-muted hover:text-white transition-colors">
                <ChevronLeft size={16} />
                </button>
                <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-nexus-muted hover:text-white transition-colors">
                <ChevronRight size={16} />
                </button>
            </div>
            <span className="text-sm font-bold text-white tracking-wider uppercase whitespace-nowrap">
               {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
         </div>

         {/* Compact Monthly Stats Pill - Responsive Layout */}
         <div className="liquid-card rounded-full p-1.5 px-4 flex items-center justify-between gap-6 h-[46px] ml-auto w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2">
               <span className={`text-sm font-bold ${monthlyStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(monthlyStats.totalPnl)}
               </span>
               <span className="text-[9px] uppercase tracking-widest text-nexus-muted">P&L</span>
            </div>
            
            <div className="w-px h-4 bg-white/10"></div>
            
            <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-white">{monthlyStats.count}</span>
               <span className="text-[9px] uppercase tracking-widest text-nexus-muted hidden md:inline">Trades</span>
               <Activity size={12} className="text-nexus-muted md:hidden" />
            </div>

            <div className="w-px h-4 bg-white/10"></div>

            <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-white">{monthlyStats.winRate.toFixed(0)}%</span>
               <span className="text-[9px] uppercase tracking-widest text-nexus-muted hidden md:inline">Win Rate</span>
               <Trophy size={12} className="text-nexus-muted md:hidden" />
            </div>
         </div>

      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Grid Header */}
        <div className="grid grid-cols-8 gap-1 md:gap-2 mb-2 shrink-0 px-1">
            {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] uppercase tracking-widest text-nexus-muted font-bold opacity-60">
                {d}
            </div>
            ))}
            <div className="text-center text-[10px] uppercase tracking-widest text-nexus-accent font-bold opacity-80">
            Total
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-8 gap-1 md:gap-2 flex-1 auto-rows-min overflow-y-auto custom-scrollbar px-1 content-start">
            {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
};