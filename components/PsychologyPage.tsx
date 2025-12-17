import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ChevronDown, 
  ArrowUpRight, 
  MoreVertical, 
  Zap, 
  History,
  Activity,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Trade } from '../types';

interface PsychologyPageProps {
  trades: Trade[];
  onBack: () => void;
}

const PsychologyPage: React.FC<PsychologyPageProps> = ({ trades, onBack }) => {
  const stats = useMemo(() => {
    const total = trades.length;
    if (total === 0) {
      return { 
        score: 0, avgScore: 15368, 
        monthlyTrends: { current: { disciplined: 45, emotional: 35 }, previous: { disciplined: 40, emotional: 25 } },
        insights: ["Start journaling to see patterns."],
        patience: 0, risk: 0, growthPct: 0
      };
    }

    const disciplinedTrades = trades.filter(t => t.notes?.toLowerCase().match(/plan|rule|patient|waited|process/));
    const emotionalTrades = trades.filter(t => t.notes?.toLowerCase().match(/fomo|nervous|fear|greedy|revenge|chased/));
    
    const score = Math.round((disciplinedTrades.length / total) * 100);
    const avgScore = 15000 + (score * 50);

    // Month over month comparison (last 2 months)
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const currentTrades = trades.filter(t => t.date.startsWith(currentMonthPrefix));
    const prevTrades = trades.filter(t => t.date.startsWith(lastMonthPrefix));

    const getMonthStats = (list: Trade[]) => ({
      disciplined: list.filter(t => t.notes?.toLowerCase().match(/plan|rule|patient|waited/)).length,
      emotional: list.filter(t => t.notes?.toLowerCase().match(/fomo|nervous|fear|greedy|revenge/)).length
    });

    // Recent specific insights
    const insights = trades.slice(-2).map(t => {
      const isPositive = t.pnl > 0;
      if (t.notes?.toLowerCase().includes('fomo')) return "Impulse detected: FOMO entry on " + t.pair;
      if (t.notes?.toLowerCase().includes('plan')) return "Clean execution: Followed rules on " + t.pair;
      return isPositive ? "Result-bias potential on " + t.pair : "Emotional friction on " + t.pair;
    });

    // Metrics for widgets
    const avgWinnerPnl = trades.filter(t => t.pnl > 0).reduce((a, b) => a + b.pnl, 0) / (trades.filter(t => t.pnl > 0).length || 1);
    const patienceVal = Math.min(score * 1.2, 100); // Mocked but tied to discipline
    const riskVal = Math.abs(trades.filter(t => t.pnl < 0).reduce((a, b) => a + b.pnl, 0));

    return { 
      score, avgScore, 
      monthlyTrends: { 
        current: getMonthStats(currentTrades), 
        previous: getMonthStats(prevTrades),
        currMonthName: now.toLocaleString('default', { month: 'short' }),
        prevMonthName: lastMonth.toLocaleString('default', { month: 'short' })
      },
      insights,
      patience: patienceVal,
      patienceAmount: avgWinnerPnl,
      riskAmount: riskVal,
      growthPct: (score / 100) * 28.21
    };
  }, [trades]);

  return (
    <div className="w-full h-full flex flex-col p-2 lg:p-4 overflow-hidden bg-transparent">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 w-full">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
          
          {/* Emotional Statistics */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight">Emotional statistics</h3>
                <p className="text-nexus-muted text-[10px] uppercase tracking-widest mt-0.5">Updated 1 days ago</p>
              </div>
              <button className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 text-nexus-muted text-[9px] uppercase tracking-widest hover:text-white transition-colors">
                Monthly <ChevronDown size={10} />
              </button>
            </div>

            <div className="flex-1 flex items-end justify-between min-h-0">
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-1.5 text-[#A7F3D0]">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Resilience</span>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#A7F3D0]/20 flex items-center justify-center">
                    <ArrowUpRight size={10} />
                  </div>
                </div>
                <span className="text-5xl font-light text-white tracking-tighter leading-none">
                  {stats.avgScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex gap-4 items-end pr-2 h-full">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[8px] text-nexus-muted uppercase font-bold tracking-widest">{stats.monthlyTrends.prevMonthName}</span>
                  <div className="w-12 h-20 rounded-xl bg-white/5 relative overflow-hidden flex flex-col justify-end border border-white/5">
                    <div className="bg-[#C4B5FD]/80" style={{ height: `${stats.monthlyTrends.previous.emotional * 15}%` }}></div>
                    <div className="bg-[#A7F3D0]/80" style={{ height: `${stats.monthlyTrends.previous.disciplined * 15}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[8px] text-nexus-muted uppercase font-bold tracking-widest">{stats.monthlyTrends.currMonthName}</span>
                  <div className="w-12 h-28 rounded-xl bg-white/5 relative overflow-hidden flex flex-col justify-end border border-white/5">
                    <div className="bg-[#C4B5FD]/80" style={{ height: `${stats.monthlyTrends.current.emotional * 15}%` }}></div>
                    <div className="bg-[#A7F3D0]/80" style={{ height: `${stats.monthlyTrends.current.disciplined * 15}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Mindset Gauge */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight">Mindset Accuracy</h3>
              <div className="flex gap-2">
                 <button className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-nexus-muted border border-white/10 hover:text-white transition-colors" onClick={onBack}><ArrowLeft size={12}/></button>
                 <button className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white border border-white/10 hover:bg-white/5 transition-colors"><ArrowRight size={12}/></button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center relative mt-2 min-h-0">
               <div className="relative w-full aspect-[2/1] max-w-[240px]">
                  <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke="#222" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke="#A7F3D0" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={`${(stats.score / 100) * 126} 126`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                    <span className="text-2xl font-light text-white tracking-tighter">${stats.avgScore.toLocaleString()}</span>
                  </div>
               </div>

               <div className="absolute bottom-0 left-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xl font-bold text-white leading-none">{stats.score}%</span>
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><ArrowUpRight size={10} className="text-white"/></div>
                  </div>
                  <p className="text-[8px] text-nexus-muted uppercase tracking-widest font-bold">Flow Consistency</p>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
          
          {/* Recent Insights */}
          <div className="h-32 bg-[#111111] rounded-[2rem] p-5 border border-white/5 flex flex-col justify-center shrink-0">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white border border-white/10">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">Live Feedback</h3>
                  <p className="text-nexus-muted text-[8px] uppercase tracking-widest font-bold">Behavioral detection</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
                {stats.insights.map((insight, i) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg p-2 flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Zap size={10} className={i % 2 === 0 ? "text-[#A7F3D0]" : "text-[#C4B5FD]"} fill="currentColor" />
                            <span className="text-[9px] font-mono text-white/90 truncate">{insight}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Growth Roadmap */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-[#A7F3D0]/20 flex items-center justify-center text-[#A7F3D0]">
                <Activity size={18} />
              </div>
              <h3 className="text-base font-medium text-white tracking-tight leading-tight">Growth<br/>roadmap</h3>
            </div>

            <div className="flex gap-4 h-full min-h-0">
              <div className="flex flex-col items-center relative h-full w-24 shrink-0">
                <div className="absolute top-0 bottom-0 w-px bg-white/5 left-1 tracking-widest"></div>
                <div className="flex flex-col gap-6 relative z-10 py-1 h-full justify-between items-start">
                  {[2023, 2024, 2025, 2027].map((year, i) => (
                    <div key={year} className="flex items-start gap-3 relative">
                      <div className={`w-2 h-2 mt-1 rounded-full border border-[#111] ${i === 3 ? 'bg-white shadow-[0_0_8px_white]' : 'bg-[#222]'}`}></div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[9px] font-bold ${i === 3 ? 'text-white' : 'text-nexus-muted'}`}>{year}</span>
                        <p className="text-[7px] text-nexus-muted max-w-[60px] leading-tight mt-0.5 opacity-60">
                           {i === 0 ? 'Strategy foundation' : i === 1 ? 'Consistent execution' : i === 2 ? 'Account scaling' : 'Widespread mastery'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="bg-[#A7F3D0] rounded-[1.5rem] p-4 relative overflow-hidden flex-1 flex flex-col justify-between group cursor-default">
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-black opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Patience score</span>
                    <span className="text-xl font-bold text-black mt-0.5 leading-none">
                      {stats.patienceAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}$
                    </span>
                  </div>
                  <div className="mt-2">
                     <span className="text-[9px] font-bold text-black/30">+{stats.growthPct.toFixed(2)}% Efficiency</span>
                     <div className="w-full h-1.5 bg-black/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-black/20" style={{ width: `${stats.patience}%` }}></div>
                     </div>
                  </div>
                </div>

                <div className="bg-[#C4B5FD] rounded-[1.5rem] p-4 relative overflow-hidden flex-1 flex flex-col justify-between group cursor-default">
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-black opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Risk Forecast</span>
                    <span className="text-xl font-bold text-black mt-0.5 leading-none">
                      {stats.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}$
                    </span>
                  </div>
                  <div className="mt-2 h-8 w-full">
                    <svg viewBox="0 0 100 40" className="w-full h-full stroke-black/20 fill-none">
                      <path d="M0,40 Q25,35 50,20 T100,10" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="80" cy="15" r="2.5" fill="black/40" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PsychologyPage;