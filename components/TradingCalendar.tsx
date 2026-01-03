import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Trade } from '../types';
import { Skeleton } from './Skeleton';

interface TradingCalendarProps {
  trades: Trade[];
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  onAddTradeClick: (date: string) => void;
  onViewDayClick: (date: string) => void;
  onViewWeekClick: (trades: Trade[], weekLabel: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TradingCalendarComponent: React.FC<TradingCalendarProps> = ({ 
  trades, 
  currentDate, 
  onMonthChange,
  onAddTradeClick, 
  onViewDayClick, 
  onViewWeekClick,
  readOnly = false,
  loading = false
}) => {

  const monthlyStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthTrades = trades.filter(t => t.date.startsWith(monthPrefix));
    
    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
    const count = monthTrades.length;
    const wins = monthTrades.filter(t => t.pnl > 0).length;
    const winRate = count > 0 ? (wins / count) * 100 : 0;
    
    return { totalPnl, count, winRate };
  }, [trades, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    return { days, firstDay: adjustedFirstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 10000) return `${sign}$${(absVal / 1000).toFixed(1)}k`;
    return `${sign}$${absVal.toLocaleString()}`;
  };

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
              else if (!readOnly) onAddTradeClick(dateStr);
            }
          }}
          className={`relative p-1 md:p-2 flex flex-col transition-all group rounded-lg md:rounded-xl overflow-hidden min-h-[60px] md:min-h-[80px] lg:min-h-[90px] ${
            isDay ? 'bg-white/5 hover:bg-white/10 cursor-pointer' : 'opacity-0 pointer-events-none'
          }`}
        >
          {isDay && (
            <>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] md:text-xs font-semibold ${dayTradeCount > 0 ? 'text-xgiha-muted' : 'text-xgiha-muted/40'}`}>{dayNum}</span>
                {dayTradeCount > 0 && (
                  <span className="text-[8px] font-bold bg-white/5 text-xgiha-muted/60 px-1.5 py-0.5 rounded-md min-w-[16px] text-center border border-white/5 group-hover:text-white transition-colors">
                    {dayTradeCount}
                  </span>
                )}
              </div>
              
              {dayTradeCount > 0 ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <span className={`text-xs md:text-sm lg:text-base font-bold tracking-tight ${dayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)}
                  </span>
                </div>
              ) : !readOnly && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      <Plus size={14} strokeWidth={3} />
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      );

      if ((i + 1) % 7 === 0) {
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
        grid.push(
            <React.Fragment key={`row-${i}`}>
               {currentWeek}
               <div 
                onClick={() => weekTradesCount > 0 && onViewWeekClick(weekTradesList, `Week of ${currentDate.toLocaleString('default', { month: 'short' })} ${Math.max(1, (i - 6) - firstDay + 1)}`)}
                className={`hidden md:flex rounded-lg md:rounded-xl p-1 md:p-2 flex-col items-center justify-center transition-all relative group overflow-hidden min-h-[60px] md:min-h-[80px] lg:min-h-[90px] ${
                    weekTradesCount > 0 ? 'bg-white/10 hover:bg-white/15 cursor-pointer' : 'bg-white/[0.02]'
                }`}
               >
                  {weekTradesCount > 0 && (
                    <>
                      <span className={`text-xs md:text-lg lg:text-xl font-bold tracking-tighter z-10 ${weekPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                           {weekPnl >= 0 ? '+' : ''}{formatCurrency(weekPnl)}
                      </span>
                      <div className="absolute top-1.5 right-1.5">
                        <span className="text-[8px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md min-w-[16px] text-center border border-emerald-500/30 transition-colors">
                          {weekTradesCount}
                        </span>
                      </div>
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

  const handleMonthPrev = () => onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleMonthNext = () => onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col gap-6 bg-white/[0.03] rounded-[25px] relative overflow-hidden">
      <div className="flex items-center justify-between shrink-0 w-full px-2 z-10">
         <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-1.5">
            <div className="flex gap-2">
                {loading ? (
                    <>
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </>
                ) : (
                    <>
                        <button onClick={handleMonthPrev} className="text-xgiha-muted hover:text-white transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={handleMonthNext} className="text-xgiha-muted hover:text-white transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </>
                )}
            </div>
            {loading ? (
                <Skeleton className="h-4 w-32 rounded-full" />
            ) : (
                <span className="text-[12px] font-bold text-white tracking-[0.2em] uppercase">
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
            )}
         </div>
         {loading ? (
            <Skeleton className="h-8 w-48 rounded-full" />
         ) : (
            <div className="flex items-center gap-6 bg-white/5 rounded-full px-6 py-2">
                <div className="flex items-center gap-2">
                <span className={`text-[12px] font-bold font-mono ${monthlyStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {monthlyStats.totalPnl >= 0 ? '+' : ''}{formatCurrency(monthlyStats.totalPnl)}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-xgiha-muted font-bold opacity-60">P&L</span>
                </div>
                <div className="w-px h-3 bg-white/10"></div>
                <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-white font-mono">{monthlyStats.winRate.toFixed(0)}%</span>
                <span className="text-[9px] uppercase tracking-widest text-xgiha-muted font-bold opacity-60">Win Rate</span>
                </div>
            </div>
         )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 z-10">
        <div className="grid grid-cols-7 md:grid-cols-8 gap-2 mb-3 shrink-0 px-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center flex justify-center">
                {loading ? (
                  <Skeleton className="h-2 w-8 rounded-full opacity-20" />
                ) : (
                  <div className="text-[10px] uppercase tracking-[0.2em] text-xgiha-muted font-bold opacity-40">{d}</div>
                )}
              </div>
            ))}
            <div className="hidden md:flex justify-center text-center">
              {loading ? (
                <Skeleton className="h-2 w-10 rounded-full opacity-40" />
              ) : (
                <div className="text-[10px] uppercase tracking-[0.2em] text-xgiha-accent font-bold opacity-80">Total</div>
              )}
            </div>
        </div>
        <div className="grid grid-cols-7 md:grid-cols-8 gap-2 flex-1 auto-rows-min overflow-y-auto custom-scrollbar px-2 content-start pb-4">
            {loading ? (
                [...Array(32)].map((_, i) => (
                    <Skeleton key={i} className="min-h-[60px] md:min-h-[80px] lg:min-h-[90px] rounded-xl" />
                ))
            ) : (
                renderCalendarDays()
            )}
        </div>
      </div>
    </div>
  );
};

export const TradingCalendar = React.memo(TradingCalendarComponent);