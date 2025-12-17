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
  AlertCircle,
  TrendingDown,
  Target
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

  // 1. Behavioral Classification & Cost Analysis
  const stats = useMemo(() => {
    const total = trades.length;
    if (total === 0) {
      return { 
        score: 0, 
        disciplinedPnl: 0, 
        emotionalCost: 0,
        breakdown: { Fear: 0, Greed: 0, FOMO: 0, Revenge: 0, Flow: 0, Disciplined: 0, Neutral: 0 }
      };
    }

    const map = {
      Fear: { count: 0, pnl: 0, color: 'bg-orange-500' },
      Greed: { count: 0, pnl: 0, color: 'bg-yellow-500' },
      FOMO: { count: 0, pnl: 0, color: 'bg-red-400' },
      Revenge: { count: 0, pnl: 0, color: 'bg-red-600' },
      Flow: { count: 0, pnl: 0, color: 'bg-emerald-400' },
      Disciplined: { count: 0, pnl: 0, color: 'bg-emerald-600' },
      Neutral: { count: 0, pnl: 0, color: 'bg-zinc-700' }
    };

    trades.forEach(t => {
      const notes = (t.notes || '').toLowerCase();
      let cat: keyof typeof map = 'Neutral';

      if (notes.match(/plan|rule|rules|disciplined|stuck to/)) cat = 'Disciplined';
      else if (notes.match(/flow|zone|perfect|clean|waited/)) cat = 'Flow';
      else if (notes.match(/fomo|chased|missed|jumped|late/)) cat = 'FOMO';
      else if (notes.match(/fear|nervous|scared|hesitated|panic|early exit/)) cat = 'Fear';
      else if (notes.match(/revenge|angry|frustrated|recover|make back/)) cat = 'Revenge';
      else if (notes.match(/greedy|held too long|wanted more|pushed/)) cat = 'Greed';

      map[cat].count++;
      map[cat].pnl += t.pnl;
    });

    const emotionalCost = map.Fear.pnl + map.Greed.pnl + map.FOMO.pnl + map.Revenge.pnl;
    const disciplinedPnl = map.Flow.pnl + map.Disciplined.pnl;
    const score = Math.round(((map.Flow.count + map.Disciplined.count) / total) * 100);

    return { 
      score, 
      disciplinedPnl, 
      emotionalCost, 
      breakdown: map,
      totalTrades: total
    };
  }, [trades]);

  // 2. Psychologist Persona AI Analysis
  useEffect(() => {
    const runClinicalAnalysis = async () => {
      if (trades.length === 0) return;
      setIsAnalyzing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const history = trades.map(t => `- Trade [${t.pair}]: Notes="${t.notes || 'None'}", PnL=${t.pnl}`).join('\n');
        
        const prompt = `Act as a world-class Behavioral Psychologist specializing in high-stakes trading. 
        Analyze the following trade history and behavioral notes:
        ${history}

        Calculated Data:
        - Emotional Cost (Fear/Greed/FOMO/Revenge losses): $${stats.emotionalCost.toFixed(2)}
        - Disciplined P&L (Flow/Rules gains): $${stats.disciplinedPnl.toFixed(2)}

        Provide a psychological profile including:
        1. A primary diagnosis of their "Mental Leak" (e.g., Revenge Bias or Impulsive FOMO).
        2. A direct explanation of exactly how much money their current emotional state is costing them compared to their disciplined potential.
        3. One specific cognitive exercise to fix their primary leak.

        Keep the tone clinical, sharp, and results-oriented. Max 150 words. Use Markdown for structure.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text || '');
      } catch (err) {
        console.error("AI analysis failed", err);
        setAiAnalysis("Error connecting to the Psychological Diagnostic Service. Please check your connection and try again.");
      } finally {
        setIsAnalyzing(false);
      }
    };

    runClinicalAnalysis();
  }, [trades, stats.emotionalCost, stats.disciplinedPnl]);

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : '+';
    return `${sign}$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="w-full h-full flex flex-col p-2 lg:p-4 overflow-hidden bg-transparent">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 w-full">
        
        {/* LEFT COLUMN: The Psychologist's Hub */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
          
          {/* Main Diagnostic Card */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                    <Brain size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white tracking-tight">Psychological Profile</h3>
                  <p className="text-nexus-muted text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    {isAnalyzing ? (
                        <><Loader2 size={10} className="animate-spin text-purple-400" /> Clinical Assessment In Progress...</>
                    ) : (
                        <><Sparkles size={10} className="text-purple-400" /> Diagnosis Complete</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[9px] text-white/50 uppercase font-bold tracking-widest">
                    Behavioral AI
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 z-10">
              {/* Financial Impact Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 relative group hover:border-red-500/30 transition-colors">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Emotional Cost</span>
                      <TrendingDown size={12} className="text-red-500 opacity-50" />
                   </div>
                   <span className={`text-4xl font-light tracking-tighter leading-none ${stats.emotionalCost < 0 ? 'text-red-400' : 'text-white/60'}`}>
                      {formatCurrency(stats.emotionalCost)}
                   </span>
                   <p className="text-[8px] text-nexus-muted mt-2 font-medium opacity-60">PnL lost to Fear, FOMO, or Greed</p>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 relative group hover:border-emerald-500/30 transition-colors">
                   <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Disciplined P&L</span>
                      <TrendingUp size={12} className="text-emerald-500 opacity-50" />
                   </div>
                   <span className="text-4xl font-light tracking-tighter leading-none text-emerald-400">
                      {formatCurrency(stats.disciplinedPnl)}
                   </span>
                   <p className="text-[8px] text-nexus-muted mt-2 font-medium opacity-60">PnL from Flow or Rules</p>
                </div>
              </div>

              {/* AI Psychologist Report Summary */}
              <div className="flex-1 bg-[#0a0a0a] rounded-2xl p-5 border border-white/5 overflow-y-auto custom-scrollbar shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} className="text-purple-400" />
                    <span className="text-[10px] text-white uppercase tracking-widest font-bold">Behavioral Summary</span>
                </div>
                {isAnalyzing && !aiAnalysis ? (
                  <div className="flex flex-col gap-2">
                    <div className="h-2 w-3/4 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-2 w-2/3 bg-white/5 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="text-[11px] text-nexus-muted leading-relaxed prose prose-invert max-w-none">
                      {aiAnalysis || "Begin recording your thoughts in the trade notes to activate behavioral mapping."}
                  </div>
                )}
              </div>
              
              {/* Emotion Distribution Bar */}
              <div className="mt-5">
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-[9px] text-nexus-muted uppercase font-bold tracking-widest">Emotion Mapping</span>
                      <span className="text-[9px] text-nexus-muted font-mono">{trades.length} Samples</span>
                  </div>
                  <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
                    {Object.entries(stats.breakdown).map(([name, data]) => {
                        const pct = (data.count / (trades.length || 1)) * 100;
                        if (pct === 0) return null;
                        return (
                            <div 
                                key={name} 
                                className={`${data.color} h-full transition-all duration-500`} 
                                style={{ width: `${pct}%` }}
                                title={`${name}: ${data.count} trades`}
                            ></div>
                        );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {Object.entries(stats.breakdown).map(([name, data]) => {
                          if (data.count === 0) return null;
                          return (
                              <div key={name} className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${data.color}`}></div>
                                  <span className="text-[8px] text-nexus-muted uppercase font-bold">{name}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
            </div>
          </div>

          {/* Mindset Consistency */}
          <div className="h-44 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-bold text-white tracking-tight">Mindset Consistency</h3>
              <div className="flex gap-2">
                 <button className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-nexus-muted border border-white/10 hover:text-white transition-colors" onClick={onBack}><ArrowLeft size={12}/></button>
                 <button className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white border border-white/10 hover:bg-white/5 transition-colors"><ArrowRight size={12}/></button>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center relative mt-2 min-h-0">
               <div className="relative w-full aspect-[2/1] max-w-[180px]">
                  <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#A7F3D0" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(stats.score / 100) * 126} 126`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end">
                    <span className="text-xl font-light text-white tracking-tighter">{stats.score}% Accuracy</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
          
          {/* Behavior Detection Log */}
          <div className="h-32 bg-[#111111] rounded-[2rem] p-5 border border-white/5 flex flex-col justify-center shrink-0">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white border border-white/10">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">Behavioral Log</h3>
                  <p className="text-nexus-muted text-[8px] uppercase tracking-widest font-bold">Recent Detection</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
                {trades.length > 0 ? trades.slice(-2).reverse().map((t, i) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg p-2 flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Zap size={10} className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"} fill="currentColor" />
                            <span className="text-[9px] font-mono text-white/90 truncate">{t.pair}: {t.notes?.slice(0, 25) || 'No assessment notes'}</span>
                        </div>
                    </div>
                )) : (
                    <div className="text-[9px] text-nexus-muted italic text-center py-2">No activity detected</div>
                )}
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
                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Self-Regulation</span>
                    <span className="text-xl font-bold text-black mt-0.5 leading-none">
                      {stats.score}% Accuracy
                    </span>
                  </div>
                  <div className="mt-2">
                     <span className="text-[9px] font-bold text-black/30">Target: 95% Flow</span>
                     <div className="w-full h-1.5 bg-black/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-black/20" style={{ width: `${stats.score}%` }}></div>
                     </div>
                  </div>
                </div>

                <div className="bg-[#C4B5FD] rounded-[1.5rem] p-4 relative overflow-hidden flex-1 flex flex-col justify-between group cursor-default">
                  <ArrowUpRight size={14} className="absolute top-3 right-3 text-black opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Risk Tolerance</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <Target size={12} className="text-black/40" />
                        <span className="text-xl font-bold text-black leading-none">Optimal</span>
                    </div>
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