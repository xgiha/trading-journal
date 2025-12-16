import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Timer,
  Flame,
  Brain,
  Target
} from 'lucide-react';
import { Trade } from '../types';
import PsychologicalAnalysis from './PsychologicalAnalysis';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, AreaChart, Area } from 'recharts';

interface PsychologyPageProps {
  trades: Trade[];
}

// --- Helper Functions ---
const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getDuration = (t: Trade) => {
  if (!t.exitTime) return 0;
  let start = parseTime(t.entryTime);
  let end = parseTime(t.exitTime);
  if (end < start) end += 24 * 60; // Handle overnight (basic)
  return end - start;
};

// --- Sub-Components (Cards) ---

// 1. Patience Profile Card
const PatienceProfile = ({ trades }: { trades: Trade[] }) => {
  const stats = useMemo(() => {
    const winners = trades.filter(t => t.pnl > 0);
    const losers = trades.filter(t => t.pnl <= 0);

    const avgWinHold = winners.length ? winners.reduce((a, b) => a + getDuration(b), 0) / winners.length : 0;
    const avgLossHold = losers.length ? losers.reduce((a, b) => a + getDuration(b), 0) / losers.length : 0;
    
    // Expectancy Ratio (Time)
    const ratio = avgLossHold === 0 ? avgWinHold : avgWinHold / avgLossHold;
    const isHealthy = avgWinHold > avgLossHold;

    return { avgWinHold, avgLossHold, ratio, isHealthy };
  }, [trades]);

  const data = [
    { name: 'Winners', value: Math.round(stats.avgWinHold), color: '#10b981' },
    { name: 'Losers', value: Math.round(stats.avgLossHold), color: '#ef4444' },
  ];

  return (
    <div className="liquid-card rounded-3xl p-5 flex flex-col h-full relative overflow-hidden group">
       <div className="flex items-center gap-2 mb-4 z-10">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
             <Timer size={16} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-nexus-muted font-bold">Patience Profile</span>
       </div>
       
       <div className="flex-1 flex flex-col justify-end z-10">
          <div className="flex items-end justify-between mb-2">
              <div>
                  <div className="text-xs text-nexus-muted mb-0.5">Hold Ratio</div>
                  <div className={`text-2xl font-light ${stats.isHealthy ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {stats.ratio.toFixed(1)}x
                  </div>
              </div>
              <div className="text-right">
                   <div className="text-[10px] text-nexus-muted uppercase tracking-widest">Verdict</div>
                   <div className="text-xs font-bold text-white">
                       {stats.isHealthy ? 'Letting Winners Run' : 'Cutting Winners Early'}
                   </div>
              </div>
          </div>

          {/* Bar Visualization */}
          <div className="h-32 w-full mt-2">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" barSize={20}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={50} tick={{fill:'#888', fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#18181b', borderRadius: '8px', border: 'none'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
       </div>
       
       {/* Background Glow */}
       <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none"></div>
    </div>
  );
};

// 2. Tilt Risk Meter
const TiltMeter = ({ trades }: { trades: Trade[] }) => {
  const analysis = useMemo(() => {
      // Sort by date/time
      const sorted = [...trades].sort((a, b) => {
          return new Date(`${a.date}T${a.entryTime}`).getTime() - new Date(`${b.date}T${b.entryTime}`).getTime();
      });

      let revengeTrades = 0;
      let revengePnl = 0;
      let normalTradesCount = 0;
      
      for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i-1];
          const curr = sorted[i];

          // If previous was a loss
          if (prev.pnl < 0) {
             // Check if current trade is on same day
             if (prev.date === curr.date) {
                 const diff = parseTime(curr.entryTime) - parseTime(prev.exitTime || prev.entryTime);
                 // If taken within 20 mins of a loss -> Potential Tilt
                 if (diff >= 0 && diff < 20) {
                     revengeTrades++;
                     revengePnl += curr.pnl;
                     continue; // Don't count as normal
                 }
             }
          }
          normalTradesCount++;
      }
      
      return { revengeTrades, revengePnl };
  }, [trades]);

  const riskLevel = analysis.revengeTrades > 3 ? 'High' : analysis.revengeTrades > 0 ? 'Moderate' : 'Low';
  const color = riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Moderate' ? 'text-yellow-500' : 'text-emerald-500';

  return (
    <div className="liquid-card rounded-3xl p-5 flex flex-col h-full relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 z-10">
          <div className={`p-1.5 rounded-lg bg-opacity-10 ${riskLevel === 'High' ? 'bg-red-500 text-red-500' : 'bg-orange-500 text-orange-500'}`}>
             <AlertTriangle size={16} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-nexus-muted font-bold">Tilt Risk Meter</span>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <div className={`text-4xl font-black tracking-tighter ${color} drop-shadow-lg mb-1`}>
                {riskLevel}
            </div>
            <span className="text-[10px] text-nexus-muted uppercase tracking-wider">Revenge Risk Level</span>
            
            <div className="w-full grid grid-cols-2 gap-2 mt-6">
                <div className="bg-white/5 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-white">{analysis.revengeTrades}</div>
                    <div className="text-[8px] text-nexus-muted uppercase">Impulse Trades</div>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                    <div className={`text-lg font-bold ${analysis.revengePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {analysis.revengePnl >= 0 ? '+' : ''}{analysis.revengePnl}
                    </div>
                    <div className="text-[8px] text-nexus-muted uppercase">Tilt Cost</div>
                </div>
            </div>
       </div>

       {/* Radial Gradient Background */}
       <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[50px] opacity-20 pointer-events-none ${riskLevel === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
    </div>
  );
};

// 3. Hourly Performance (Golden Hour)
const HourlyPerformance = ({ trades }: { trades: Trade[] }) => {
    const data = useMemo(() => {
        const hours = new Array(24).fill(0).map((_, i) => ({ hour: i, pnl: 0, count: 0 }));
        trades.forEach(t => {
            const h = parseInt(t.entryTime.split(':')[0]);
            if (!isNaN(h) && h >= 0 && h < 24) {
                hours[h].pnl += t.pnl;
                hours[h].count += 1;
            }
        });
        // Filter out empty hours to keep chart clean, or keep range 08-18 usually
        return hours.filter(h => h.count > 0);
    }, [trades]);

    return (
        <div className="liquid-card rounded-3xl p-5 flex flex-col h-full relative overflow-hidden col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2 z-10">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Clock size={16} />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-nexus-muted font-bold">Zone of Performance</span>
            </div>

            <div className="flex-1 w-full min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="hour" 
                            tickFormatter={(h) => `${h}:00`} 
                            tick={{fontSize: 10, fill: '#666'}} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{fill: 'white', opacity: 0.05}}
                            contentStyle={{backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px'}}
                            formatter={(val: number) => [`$${val}`, 'Net PnL']}
                            labelFormatter={(label) => `${label}:00 Hour`}
                        />
                        <ReferenceLine y={0} stroke="#333" />
                        <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// 4. Streak Psychology
const StreakAnalysis = ({ trades }: { trades: Trade[] }) => {
    const stats = useMemo(() => {
        const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let currentStreak = 0;
        let maxWinStreak = 0;
        let maxLossStreak = 0;
        let tradeAfterWinPnl = 0;
        let tradeAfterWinCount = 0;

        for (let i = 0; i < sorted.length; i++) {
            const t = sorted[i];
            const isWin = t.pnl > 0;

            if (isWin) {
                if (currentStreak > 0) currentStreak++;
                else currentStreak = 1;
                maxWinStreak = Math.max(maxWinStreak, currentStreak);
            } else {
                if (currentStreak < 0) currentStreak--;
                else currentStreak = -1;
                maxLossStreak = Math.min(maxLossStreak, currentStreak); // negative number
            }

            // Check "After Win" performance (Hubris check)
            if (i > 0 && sorted[i-1].pnl > 0) {
                tradeAfterWinPnl += t.pnl;
                tradeAfterWinCount++;
            }
        }
        
        const avgAfterWin = tradeAfterWinCount ? tradeAfterWinPnl / tradeAfterWinCount : 0;
        return { maxWinStreak, maxLossStreak: Math.abs(maxLossStreak), avgAfterWin };
    }, [trades]);

    return (
        <div className="liquid-card rounded-3xl p-5 flex flex-col h-full relative overflow-hidden">
             <div className="flex items-center gap-2 mb-4 z-10">
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                    <Flame size={16} />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-nexus-muted font-bold">Streak Momentum</span>
            </div>

            <div className="grid grid-cols-2 gap-4 z-10">
                 <div>
                     <span className="text-[9px] text-nexus-muted uppercase">Max Win Streak</span>
                     <div className="text-2xl font-bold text-white mt-1">{stats.maxWinStreak}</div>
                 </div>
                 <div>
                     <span className="text-[9px] text-nexus-muted uppercase">Avg Post-Win PnL</span>
                     <div className={`text-xl font-bold mt-1 ${stats.avgAfterWin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                         ${Math.round(stats.avgAfterWin)}
                     </div>
                 </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                   {stats.avgAfterWin < 0 
                     ? "Caution: You tend to give back profits immediately after a win. (Overconfidence Hazard)" 
                     : "Great! You maintain discipline even after winning."}
                </p>
            </div>
        </div>
    )
}

// --- Main Page Component ---
const PsychologyPage: React.FC<PsychologyPageProps> = ({ trades }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-2">
            <div>
                <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                    <Brain className="text-nexus-accent" size={32} />
                    Psychology Center
                </h1>
                <p className="text-nexus-muted text-sm mt-1 max-w-lg">
                    Advanced behavioral analytics decoding your hidden trading patterns, emotional leaks, and performance drivers.
                </p>
            </div>
            <div className="hidden md:flex gap-2">
                 <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-nexus-muted">
                    AI Analysis Active
                 </div>
                 <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-nexus-muted">
                    {trades.length} Data Points
                 </div>
            </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-min">
            
            {/* 1. Main Linguistic Analysis (Spans 2 cols on LG) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <PsychologicalAnalysis trades={trades} className="h-full min-h-[280px]" />
            </div>

            {/* 2. Patience Profile */}
            <div className="col-span-1">
                <PatienceProfile trades={trades} />
            </div>

            {/* 3. Tilt Meter */}
            <div className="col-span-1">
                <TiltMeter trades={trades} />
            </div>

            {/* 4. Hourly Performance (Spans 2 cols) */}
            <div className="col-span-1 md:col-span-2">
                 <HourlyPerformance trades={trades} />
            </div>

             {/* 5. Streak Analysis */}
             <div className="col-span-1">
                 <StreakAnalysis trades={trades} />
             </div>

             {/* 6. Placeholder for Future/Notes Stats */}
             <div className="liquid-card rounded-3xl p-5 flex flex-col justify-between col-span-1">
                 <div className="flex items-center gap-2">
                     <div className="p-1.5 rounded-lg bg-gray-500/10 text-gray-400">
                        <Activity size={16} />
                     </div>
                     <span className="text-[10px] uppercase tracking-widest text-nexus-muted font-bold">Journal Depth</span>
                 </div>
                 <div className="text-center py-4">
                     <div className="text-4xl font-light text-white">
                         {Math.round((trades.filter(t => t.notes && t.notes.length > 20).length / (trades.length || 1)) * 100)}%
                     </div>
                     <div className="text-[9px] uppercase text-nexus-muted mt-2">Detailed Entry Rate</div>
                 </div>
             </div>

        </div>

      </div>
    </motion.div>
  );
};

export default PsychologyPage;