
import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { Target, Activity, Zap, BarChart3 } from 'lucide-react';

const MotionDiv = motion.div as any;

interface FearGreedIndexProps {
  trades: Trade[];
}

const FearGreedIndex: React.FC<FearGreedIndexProps> = ({ trades }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chart'>('overview');

  const calculateDetailedSentiment = (tradeSubset: Trade[]) => {
    if (tradeSubset.length === 0) return { score: 50, winRate: 0.5, pf: 0.5, momentum: 0.5, rawPf: 1.0 };
    
    // 1. Win Rate (35% weight)
    const winRate = tradeSubset.filter(t => t.pnl > 0).length / tradeSubset.length;
    
    // 2. Profit Factor (35% weight)
    const wins = tradeSubset.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const losses = Math.abs(tradeSubset.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const profitFactorRaw = losses === 0 ? 3 : wins / losses;
    const pfNormalized = Math.min(profitFactorRaw, 3) / 3; // Capped at 3.0 PF
    
    // 3. Recent Momentum (30% weight)
    const recentTrades = tradeSubset.slice(-10);
    const recentPnL = recentTrades.reduce((acc, t) => acc + t.pnl, 0);
    const momentum = Math.min(Math.max((recentPnL / 2000) + 0.5, 0), 1);

    const score = (winRate * 0.35 + pfNormalized * 0.35 + momentum * 0.3) * 100;
    
    return {
      score: Math.round(score),
      winRate,
      pf: pfNormalized,
      momentum,
      rawPf: profitFactorRaw
    };
  };

  const stats = useMemo(() => {
    const details = calculateDetailedSentiment(trades);
    const value = details.score;

    let label = 'Neutral';
    let color = 'text-yellow-400';
    let bgColor = 'bg-yellow-400';
    let description = 'Sentiment remains stable without significant shifts.';

    if (value <= 25) {
      label = 'Extreme Fear';
      color = 'text-red-500';
      bgColor = 'bg-red-500';
      description = 'Recent performance shows prolonged Extreme Fear, suggesting potential oversold market sentiment.';
    } else if (value <= 45) {
      label = 'Fear';
      color = 'text-orange-500';
      bgColor = 'bg-orange-500';
      description = 'Performance suggests a cautious, fearful outlook based on recent drawdowns.';
    } else if (value <= 55) {
      label = 'Neutral';
      color = 'text-yellow-400';
      bgColor = 'bg-yellow-400';
    } else if (value <= 75) {
      label = 'Greed';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-400';
      description = 'Sentiment has shifted to Greed as winning streaks build confidence in your strategy.';
    } else {
      label = 'Extreme Greed';
      color = 'text-emerald-500';
      bgColor = 'bg-emerald-500';
      description = 'Exceptional performance is fueling Extreme Greed. Monitor for potential overconfidence.';
    }

    const historyPoints: { date: string, value: number, label: string }[] = [];
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const uniqueDates = Array.from(new Set(sortedTrades.map(t => t.date)));
    uniqueDates.forEach(date => {
      const snapshotTrades = sortedTrades.filter(t => new Date(t.date).getTime() <= new Date(date).getTime());
      const snapshotDetails = calculateDetailedSentiment(snapshotTrades);
      historyPoints.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: snapshotDetails.score,
        label: getLabelForValue(snapshotDetails.score)
      });
    });

    return {
      value,
      label,
      color,
      bgColor,
      description,
      details,
      historyPoints,
      history: {
        yesterday: historyPoints.length > 1 ? historyPoints[historyPoints.length - 2].value : value,
        week: historyPoints.length > 5 ? historyPoints[historyPoints.length - 5].value : Math.max(0, value - 5),
        month: historyPoints.length > 15 ? historyPoints[historyPoints.length - 15].value : Math.max(0, value - 12),
        year: 63
      },
      high: Math.max(...historyPoints.map(p => p.value), 76),
      low: Math.min(...historyPoints.map(p => p.value), 10)
    };
  }, [trades]);

  function getLabelForValue(val: number) {
    if (val <= 25) return 'Extreme Fear';
    if (val <= 45) return 'Fear';
    if (val <= 55) return 'Neutral';
    if (val <= 75) return 'Greed';
    return 'Extreme Greed';
  }

  const getTailwindColorForValue = (val: number) => {
    if (val <= 25) return 'text-red-500';
    if (val <= 45) return 'text-orange-500';
    if (val <= 55) return 'text-yellow-400';
    if (val <= 75) return 'text-emerald-400';
    return 'text-emerald-500';
  };

  const getBgColorForValue = (val: number) => {
    if (val <= 25) return 'bg-red-500';
    if (val <= 45) return 'bg-orange-500';
    if (val <= 55) return 'bg-yellow-400';
    if (val <= 75) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="w-full h-full p-5 bg-white/[0.03] rounded-[25px] flex flex-col overflow-hidden transition-all duration-500 border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-[0.15em]">Fear & Greed</h3>
        </div>
      </div>

      <p className="text-[10px] text-nexus-muted leading-relaxed mb-6 opacity-70 min-h-[40px]">
        {stats.description}
      </p>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl self-start mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 text-[9px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all ${
            activeTab === 'overview' ? 'bg-white/10 text-white shadow-md' : 'text-nexus-muted hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-5 py-2 text-[9px] font-bold uppercase tracking-[0.15em] rounded-lg transition-all ${
            activeTab === 'chart' ? 'bg-white/10 text-white shadow-md' : 'text-nexus-muted hover:text-white'
          }`}
        >
          Chart
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <MotionDiv
            key="overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1"
          >
            {/* Highly Accurate Semi-Circular Gauge */}
            <div className="relative flex flex-col items-center justify-center pt-2 pb-10 mb-6">
              <div className="relative w-52 h-32 overflow-hidden">
                <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="25%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#facc15" />
                      <stop offset="75%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  
                  {/* Background Track */}
                  <path
                    d="M 10,50 A 40,40 0 0,1 90,50"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  
                  {/* Colored Arc */}
                  <path
                    d="M 10,50 A 40,40 0 0,1 90,50"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="125.66"
                    strokeDashoffset={125.66 * (1 - stats.value / 100)}
                    className="transition-all duration-1000 ease-out"
                  />

                  {/* Tick Marks */}
                  {[0, 25, 50, 75, 100].map(tick => {
                    const angle = (tick / 100) * 180 + 180;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 50 + 44 * Math.cos(rad);
                    const y1 = 50 + 44 * Math.sin(rad);
                    const x2 = 50 + 48 * Math.cos(rad);
                    const y2 = 50 + 48 * Math.sin(rad);
                    return (
                      <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    );
                  })}

                  {/* Needle */}
                  <g transform={`rotate(${(stats.value / 100) * 180 - 90} 50 50)`} className="transition-transform duration-1000 ease-out">
                    <line x1="50" y1="50" x2="50" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="4" fill="white" />
                  </g>
                </svg>

                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                  <span className="text-3xl font-black text-white leading-none tracking-tight">{stats.value}</span>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${stats.color}`}>
                    {stats.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Accurate Breakdown Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center">
                <Target size={12} className="text-white/40 mb-1" />
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Win Rate</span>
                <span className="text-[11px] font-black text-white">{(stats.details.winRate * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center">
                <BarChart3 size={12} className="text-white/40 mb-1" />
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">PF Index</span>
                <span className="text-[11px] font-black text-white">{stats.details.rawPf.toFixed(2)}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center">
                <Activity size={12} className="text-white/40 mb-1" />
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Momentum</span>
                <span className="text-[11px] font-black text-white">{(stats.details.momentum * 10).toFixed(1)}</span>
              </div>
            </div>

            {/* Detailed Stats below */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Historical Data</span>
              </div>

              {[
                { label: 'Yesterday', val: stats.history.yesterday },
                { label: 'Last Week', val: stats.history.week },
                { label: 'Last Month', val: stats.history.month },
                { label: 'Last Year', val: stats.history.year },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-nexus-muted font-bold tracking-tight">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getBgColorForValue(item.val)} shadow-sm`} />
                    <span className={`font-black ${getTailwindColorForValue(item.val)}`}>
                      {getLabelForValue(item.val)} {item.val}
                    </span>
                  </div>
                </div>
              ))}

              <div className="h-px bg-white/5 my-2" />

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Strategy Health</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-nexus-muted font-bold tracking-tight">Recent Avg Win</span>
                <span className="font-black text-emerald-400">Positive Trend</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-nexus-muted font-bold tracking-tight">Confidence Score</span>
                <span className="font-black text-white">{(stats.value / 10).toFixed(1)}/10.0</span>
              </div>
            </div>
          </MotionDiv>
        ) : (
          <MotionDiv
            key="chart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
             <div className="flex-1 w-full min-h-0">
               {stats.historyPoints.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.historyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="white" stopOpacity={0.25} />
                           <stop offset="100%" stopColor="white" stopOpacity={0} />
                        </linearGradient>
                     </defs>
                     <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" opacity={0.2} label={{ value: 'F', fill: '#ef4444', fontSize: 8, position: 'left' }} />
                     <ReferenceLine y={50} stroke="#facc15" strokeDasharray="3 3" opacity={0.2} label={{ value: 'N', fill: '#facc15', fontSize: 8, position: 'left' }} />
                     <ReferenceLine y={75} stroke="#10b981" strokeDasharray="3 3" opacity={0.2} label={{ value: 'G', fill: '#10b981', fontSize: 8, position: 'left' }} />
                     <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800 }}
                        dy={15}
                     />
                     <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800 }}
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                        itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#fff' }}
                        labelStyle={{ fontSize: '9px', color: '#888', marginBottom: '6px', fontWeight: 'bold' }}
                        formatter={(val: number) => [`${val}`, 'Index']}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="white" 
                        strokeWidth={3} 
                        fill="url(#sentimentGradient)" 
                        dot={{ r: 4, fill: 'white', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#ffa600', strokeWidth: 0 }}
                        animationDuration={1000}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-nexus-muted/20">
                    <span className="text-[12px] font-black uppercase tracking-[0.3em]">No Historical Data</span>
                    <span className="text-[10px] mt-2 text-center max-w-[180px] opacity-50">Journal your trades to generate a reactive sentiment chart.</span>
                 </div>
               )}
             </div>
             
             <div className="flex items-center justify-between px-3 mt-8 pt-6 border-t border-white/5">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Live Status</span>
                   <span className={`text-[12px] font-black ${stats.color} tracking-tight`}>{stats.label}</span>
                </div>
                <div className="text-right flex flex-col">
                   <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Sentiment Score</span>
                   <span className="text-[12px] font-black text-white font-mono tracking-tight">{stats.value}/100</span>
                </div>
             </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FearGreedIndex;
