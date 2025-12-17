import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  ChevronDown, 
  ArrowUpRight, 
  MoreVertical, 
  Zap, 
  History,
  Activity,
  ArrowRight,
  ArrowLeft,
  Brain,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Trade } from '../types';

interface PsychologyPageProps {
  trades: Trade[];
  onBack: () => void;
}

const PsychologyPage: React.FC<PsychologyPageProps> = ({ trades, onBack }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Local Heuristic Analysis (for immediate feedback)
  const stats = useMemo(() => {
    const total = trades.length;
    if (total === 0) {
      return { 
        score: 0, avgScore: 15368, 
        disciplinedPnl: 0, 
        emotionalCost: 0,
        emotionBreakdown: { Disciplined: 0, Fear: 0, FOMO: 0, Revenge: 0, Greed: 0, Flow: 0 },
        insights: [],
        patience: 0, risk: 0, growthPct: 0
      };
    }

    const emotionMap = {
      Disciplined: { count: 0, pnl: 0 },
      Fear: { count: 0, pnl: 0 },
      FOMO: { count: 0, pnl: 0 },
      Revenge: { count: 0, pnl: 0 },
      Greed: { count: 0, pnl: 0 },
      Flow: { count: 0, pnl: 0 },
      Neutral: { count: 0, pnl: 0 }
    };

    trades.forEach(t => {
      const notes = t.notes?.toLowerCase() || '';
      let emotion: keyof typeof emotionMap = 'Neutral';

      if (notes.match(/plan|rule|patient|waited|process|disciplined/)) emotion = 'Disciplined';
      else if (notes.match(/fomo|chased|missed|jumped/)) emotion = 'FOMO';
      else if (notes.match(/fear|nervous|scared|hesitated|panic/)) emotion = 'Fear';
      else if (notes.match(/revenge|angry|frustrated|recover|tilted/)) emotion = 'Revenge';
      else if (notes.match(/greedy|held too long|wanted more|oversized/)) emotion = 'Greed';
      else if (notes.match(/flow|zone|perfect|clean|calm/)) emotion = 'Flow';

      emotionMap[emotion].count++;
      emotionMap[emotion].pnl += t.pnl;
    });

    const emotionalCost = emotionMap.FOMO.pnl + emotionMap.Fear.pnl + emotionMap.Revenge.pnl + emotionMap.Greed.pnl;
    const disciplinedPnl = emotionMap.Disciplined.pnl + emotionMap.Flow.pnl;
    
    const score = Math.round(((emotionMap.Disciplined.count + emotionMap.Flow.count) / total) * 100);
    const avgScore = 15000 + (score * 50);

    const patienceVal = Math.min(score * 1.2, 100);
    const riskVal = Math.abs(trades.filter(t => t.pnl < 0).reduce((a, b) => a + b.pnl, 0));

    return { 
      score, avgScore, 
      disciplinedPnl,
      emotionalCost,
      emotionBreakdown: emotionMap,
      patience: patienceVal,
      riskAmount: riskVal,
      growthPct: (score / 100) * 28.21
    };
  }, [trades]);

  // 2. Gemini AI Deep Analysis
  useEffect(() => {
    const fetchAiAnalysis = async () => {
      if (trades.length === 0) return;
      setIsAnalyzing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const notes = trades.map(t => `Trade (${t.pair}): ${t.notes || 'No notes'}`).join('\n');
        
        const prompt = `You are a Behavioral Psychologist specializing in trading psychology.
        Analyze these trade notes for a user:
        ${notes}
        
        Task: 
        1. Identify the dominant emotional state.
        2. Provide a 2-sentence summary of the user's psychological state.
        3. Explain the "Emotional Cost" (current estimate: $${stats.emotionalCost.toFixed(2)}) and how to fix the primary leak.
        
        Keep it professional, encouraging, and clinical. Format with brief sections.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text || 'Analysis unavailable.');
      } catch (err) {
        console.error("AI Analysis failed", err);
        setAiAnalysis('Analysis service currently unavailable. Using local heuristic insights.');
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchAiAnalysis();
  }, [trades, stats.emotionalCost]);

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : '+';
    return `${sign}$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="w-full h-full flex flex-col p-2 lg:p-4 overflow-hidden bg-transparent">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 w-full">
        
        {/* LEFT COLUMN: Psychological Analysis */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
          
          {/* Main AI Card: Psychological Analysis */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <Brain size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white tracking-tight">Psychological Analysis</h3>
                  <p className="text-nexus-muted text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    {isAnalyzing ? (
                        <><Loader2 size={10} className="animate-spin" /> Analyzing behavior...</>
                    ) : (
                        <><Sparkles size={10} className="text-purple-400" /> Behavioral profile: Active</>
                    )}
                  </p>
                </div>
              </div>
              <button className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5 text-nexus-muted text-[9px] uppercase tracking-widest hover:text-white transition-colors">
                AI Driven <ChevronDown size={10} />
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {/* Cost of Emotions Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                   <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold mb-1">Emotional Cost</span>
                   <span className={`text-4xl font-light tracking-tighter leading-none ${stats.emotionalCost < 0 ? 'text-red-400' : 'text-white'}`}>
                      {formatCurrency(stats.emotionalCost)}
                   </span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                   <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold mb-1">Disciplined P&L</span>
                   <span className="text-4xl font-light tracking-tighter leading-none text-emerald-400">
                      {formatCurrency(stats.disciplinedPnl)}
                   </span>
                </div>
              </div>

              {/* AI Report Summary */}
              <div className="flex-1 bg-white/[0.03] rounded-2xl p-4 border border-white/5 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} className="text-purple-400" />
                    <span className="text-[10px] text-white uppercase tracking-widest font-bold">Psychologist's Report</span>
                </div>
                <div className="text-xs text-nexus-muted leading-relaxed whitespace-pre-line italic">
                    {aiAnalysis || "Aggregating trading patterns for deeper psychological mapping..."}
                </div>
              </div>
              
              {/* Emotion Bar Chart */}
              <div className="mt-4 flex gap-1 h-3 rounded-full overflow-hidden">
                {Object.entries(stats.emotionBreakdown).map(([emotion, data], idx) => {
                    const percentage = (data.count / (trades.length || 1)) * 100;
                    if (percentage === 0) return null;
                    const colors = {
                        Disciplined: 'bg-emerald-500',
                        Flow: 'bg-emerald-400',
                        Fear: 'bg-red-500',
                        FOMO: 'bg-red-400',
                        Revenge: 'bg-red-600',
                        Greed: 'bg-yellow-500',
                        Neutral: 'bg-zinc-700'
                    };
                    return (
                        <div 
                            key={emotion} 
                            className={colors[emotion as keyof typeof colors]} 
                            style={{ width: `${percentage}%` }}
                            title={`${emotion}: ${data.count} trades`}
                        ></div>
                    );
                })}
              </div>
              <div className="flex justify-between mt-2">
                 <span className="text-[9px] text-nexus-muted uppercase font-bold tracking-widest">Self Regulation</span>
                 <span className="text-[9px] text-nexus-muted uppercase font-bold tracking-widest">Performance</span>
              </div>
            </div>
          </div>

          {/* Current Mindset Gauge (Static but relevant) */}
          <div className="h-48 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Mindset Accuracy</h3>
              <div className="flex gap-2">
                 <button className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-nexus-muted border border-white/10 hover:text-white transition-colors" onClick={onBack}><ArrowLeft size={12}/></button>
                 <button className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white border border-white/10 hover:bg-white/5 transition-colors"><ArrowRight size={12}/></button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center relative mt-2 min-h-0">
               <div className="relative w-full aspect-[2/1] max-w-[200px]">
                  <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke="#222" 
                      strokeWidth="6" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke="#A7F3D0" 
                      strokeWidth="6" 
                      strokeLinecap="round"
                      strokeDasharray={`${(stats.score / 100) * 126} 126`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end">
                    <span className="text-xl font-light text-white tracking-tighter">{stats.score}% Flow</span>
                  </div>
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
                  <h3 className="text-xs font-bold text-white tracking-tight">Recent Activity</h3>
                  <p className="text-nexus-muted text-[8px] uppercase tracking-widest font-bold">Emotion mapping</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
                {trades.slice(-2).map((t, i) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg p-2 flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Zap size={10} className={t.pnl > 0 ? "text-[#A7F3D0]" : "text-[#ef4444]"} fill="currentColor" />
                            <span className="text-[9px] font-mono text-white/90 truncate">{t.pair}: {t.notes?.slice(0, 30)}...</span>
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
                      {stats.score}% Accuracy
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
                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Risk Management</span>
                    <span className="text-xl font-bold text-black mt-0.5 leading-none">
                      {formatCurrency(stats.riskAmount)}
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