import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  History, 
  Activity, 
  Brain, 
  Sparkles, 
  Loader2, 
  TrendingDown, 
  Target,
  FileText,
  Stethoscope,
  Activity as Pulse,
  UserCheck,
  ArrowLeft
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
        - Emotional Cost: $${stats.emotionalCost.toFixed(2)}
        - Disciplined P&L: $${stats.disciplinedPnl.toFixed(2)}

        Provide a psychological profile structured exactly as follows:
        
        DIAGNOSIS
        [Provide a one-sentence professional clinical diagnosis of their mental state]
        
        FINANCIAL IMPACT
        [A sharp explanation of exactly how their emotions are affecting their bottom line]
        
        COGNITIVE PRESCRIPTION
        [One specific actionable exercise to implement immediately]

        Keep the tone professional, authoritative, and clinical. Max 130 words.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text || '');
      } catch (err) {
        console.error("AI analysis failed", err);
        setAiAnalysis("Error connecting to the Psychological Diagnostic Service.");
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

  const renderFormattedReport = (text: string) => {
    if (!text) return null;
    const sections = text.split(/(DIAGNOSIS|FINANCIAL IMPACT|COGNITIVE PRESCRIPTION)/g);
    
    return (
      <div className="flex flex-col gap-6 font-sans">
        {sections.map((part, i) => {
          const trimmed = part.trim();
          if (trimmed === 'DIAGNOSIS' || trimmed === 'FINANCIAL IMPACT' || trimmed === 'COGNITIVE PRESCRIPTION') {
            return (
              <h4 key={i} className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] -mb-5 mt-2">
                {trimmed}
              </h4>
            );
          }
          if (trimmed.length > 0) {
            const isDiagnosis = sections[i-1]?.trim() === 'DIAGNOSIS';
            const isImpact = sections[i-1]?.trim() === 'FINANCIAL IMPACT';
            
            return (
              <p key={i} className={`
                ${isDiagnosis ? 'text-xl md:text-2xl font-light text-white tracking-tight leading-tight' : ''}
                ${isImpact ? 'text-[13px] text-white/90 font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5' : ''}
                ${!isDiagnosis && !isImpact ? 'text-xs text-nexus-muted leading-relaxed opacity-80' : ''}
              `}>
                {trimmed}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent pb-32 md:pb-28 lg:pb-24 overflow-y-auto lg:overflow-hidden custom-scrollbar">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0 w-full">
        
        {/* LEFT COLUMN - Wider analytics and roadmap */}
        <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6 min-h-0">
          
          {/* Top Card: Behavioral DNA (Financial Impact) */}
          <div className="h-auto md:h-80 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0 relative overflow-hidden shadow-2xl shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                    <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white tracking-tight">Financial DNA</h3>
                  <p className="text-nexus-muted text-[10px] uppercase tracking-widest mt-0.5">Behavioral Impact metrics</p>
                </div>
              </div>
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-nexus-muted hover:text-white transition-colors"><ArrowLeft size={14}/></button>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-2 z-10">
              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 relative group">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Emotional Cost</span>
                    <TrendingDown size={14} className="text-red-500 opacity-50" />
                 </div>
                 <span className={`text-4xl font-light tracking-tighter leading-none ${stats.emotionalCost < 0 ? 'text-red-400' : 'text-white/60'}`}>
                    {formatCurrency(stats.emotionalCost)}
                 </span>
                 <p className="text-[9px] text-nexus-muted mt-3 font-medium opacity-60 leading-tight">PnL leaked during negative psychological states.</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 relative group">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Disciplined P&L</span>
                    <TrendingUp size={14} className="text-emerald-500 opacity-50" />
                 </div>
                 <span className="text-4xl font-light tracking-tighter leading-none text-emerald-400">
                    {formatCurrency(stats.disciplinedPnl)}
                 </span>
                 <p className="text-[9px] text-nexus-muted mt-3 font-medium opacity-60 leading-tight">Net gains captured while strictly following execution rules.</p>
              </div>
            </div>
            <div className="mt-4 z-10">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] text-nexus-muted uppercase font-bold tracking-widest">Emotion Distribution</span>
                    <span className="text-[9px] text-nexus-muted font-mono">{trades.length} Samples</span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/5">
                  {Object.entries(stats.breakdown).map(([name, data]) => {
                      const pct = (data.count / (trades.length || 1)) * 100;
                      if (pct === 0) return null;
                      return <div key={name} className={`${data.color} h-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  })}
                </div>
            </div>
          </div>

          {/* Bottom Card: Growth Roadmap (Moved from Right) */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0 shadow-2xl overflow-hidden relative">
            <div className="flex items-start gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#A7F3D0]/10 flex items-center justify-center text-[#A7F3D0] border border-[#A7F3D0]/20">
                <Activity size={20} />
              </div>
              <div>
                 <h3 className="text-lg font-medium text-white tracking-tight">Growth Roadmap</h3>
                 <p className="text-nexus-muted text-[10px] uppercase tracking-widest mt-0.5">Developmental Path to Mastery</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
               <div className="w-32 flex flex-col items-center relative h-full shrink-0">
                  <div className="absolute top-0 bottom-0 w-px bg-white/5 left-1"></div>
                  <div className="flex flex-col gap-8 relative z-10 h-full justify-between items-start py-2">
                    {[2023, 2024, 2025, 2027].map((year, i) => (
                      <div key={year} className="flex items-start gap-3 relative">
                        <div className={`w-3 h-3 mt-0.5 rounded-full border-2 border-[#111] ${i === 3 ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'bg-[#333]'}`}></div>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-bold ${i === 3 ? 'text-white' : 'text-nexus-muted'}`}>{year}</span>
                          <p className="text-[8px] text-nexus-muted max-w-[80px] leading-tight mt-0.5 opacity-60">
                             {i === 0 ? 'Strategy Foundation' : i === 1 ? 'Rule Adherence' : i === 2 ? 'Capital Scaling' : 'Market Mastery'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                  <div className="bg-[#A7F3D0] rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg">
                    <ArrowUpRight size={16} className="absolute top-6 right-6 text-black opacity-30" />
                    <div>
                      <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Regulatory Status</span>
                      <span className="text-3xl font-bold text-black mt-2 block leading-none">{stats.score}% Accuracy</span>
                    </div>
                    <div>
                       <span className="text-[9px] font-bold text-black/40 uppercase">Target Consistency: 95%</span>
                       <div className="w-full h-2 bg-black/10 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-black/30 transition-all duration-1000" style={{ width: `${stats.score}%` }}></div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-[#C4B5FD] rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between group shadow-lg">
                    <ArrowUpRight size={16} className="absolute top-6 right-6 text-black opacity-30" />
                    <div>
                      <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Risk Tolerance</span>
                      <div className="flex items-center gap-2 mt-2">
                          <Target size={18} className="text-black/40" />
                          <span className="text-3xl font-bold text-black leading-none">Optimal</span>
                      </div>
                    </div>
                    <div className="h-16 w-full mt-auto">
                        <svg viewBox="0 0 100 40" className="w-full h-full stroke-black/20 fill-none">
                          <path d="M0,35 Q25,30 50,15 T100,5" strokeWidth="4" strokeLinecap="round" />
                          <circle cx="85" cy="10" r="3" fill="black/40" />
                        </svg>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Clinical Diagnostic Suite */}
        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6 min-h-0">
          
          {/* Top: Behavioral Log */}
          <div className="h-32 bg-[#111111] rounded-[2rem] p-5 border border-white/5 flex flex-col justify-center shrink-0 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white border border-white/10">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">Behavioral Log</h3>
                <p className="text-nexus-muted text-[8px] uppercase tracking-widest font-bold">State detection stream</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 overflow-hidden">
                {trades.slice(-2).reverse().map((t, i) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-xl p-2.5 flex items-center gap-3 border border-white/5">
                        <Zap size={10} className={t.pnl >= 0 ? "text-emerald-400" : "text-red-400"} fill="currentColor" />
                        <span className="text-[10px] font-mono text-white/90 truncate">{t.pair}: <span className="text-nexus-muted italic font-sans">{t.notes?.slice(0, 30) || 'Missing entry'}</span></span>
                    </div>
                ))}
            </div>
          </div>

          {/* Bottom: Clinical Diagnostic Hub (The Focus Area) */}
          <div className="flex-1 bg-[#111111] rounded-[2rem] p-6 border border-white/5 flex flex-col min-h-0 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
             
             <div className="flex items-center gap-3 mb-6 z-10 shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <Brain size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white tracking-tight">Clinical Diagnosis</h3>
                  <p className="text-nexus-muted text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    {isAnalyzing ? <Loader2 size={10} className="animate-spin text-purple-400" /> : <Sparkles size={10} className="text-purple-400" />}
                    {isAnalyzing ? 'Processing Diagnostics' : 'Assessment Finalized'}
                  </p>
                </div>
             </div>

             {/* Diagnostic Report Area */}
             <div className="flex-1 bg-gradient-to-b from-[#0a0a0a] to-[#070707] rounded-3xl p-6 border border-white/5 overflow-y-auto custom-scrollbar shadow-inner z-10 mb-6">
                <div className="flex items-center justify-between mb-8 opacity-60">
                    <div className="flex items-center gap-2">
                        <FileText size={14} className="text-purple-400" />
                        <span className="text-[10px] text-white uppercase tracking-widest font-bold tracking-[0.2em]">Patient Record</span>
                    </div>
                    <div className="px-2 py-0.5 bg-purple-500/10 rounded-md border border-purple-500/20 text-[8px] text-purple-400 font-bold uppercase tracking-widest">Level 4 Access</div>
                </div>

                {isAnalyzing && !aiAnalysis ? (
                    <div className="flex flex-col gap-8">
                      <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-white/5 rounded animate-pulse"></div>
                      <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse"></div>
                    </div>
                ) : (
                    <div className="selection:bg-purple-500/30">
                        {aiAnalysis ? renderFormattedReport(aiAnalysis) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
                             <UserCheck size={32} className="mb-4" />
                             <p className="text-xs uppercase tracking-widest font-bold">Awaiting Input</p>
                             <p className="text-[10px] mt-2">Update trade logs to initiate diagnostic analysis.</p>
                          </div>
                        )}
                    </div>
                )}
             </div>

             {/* Neural Stability Footer (Integral Metric) */}
             <div className="shrink-0 flex items-center justify-between bg-[#1a1a1a]/40 rounded-3xl border border-white/5 p-5 z-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Pulse size={12} className="text-purple-400 opacity-50" />
                        <span className="text-[10px] text-nexus-muted uppercase tracking-widest font-bold">Neural Stability</span>
                    </div>
                    <div className={`mt-2 px-3 py-1 rounded-full border bg-white/5 inline-flex items-center gap-2 ${
                        stats.score > 70 ? 'border-emerald-500/20 text-emerald-400' : stats.score > 40 ? 'border-yellow-500/20 text-yellow-400' : 'border-red-500/20 text-red-400'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            stats.score > 70 ? 'bg-emerald-400' : stats.score > 40 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className="text-[10px] uppercase font-bold tracking-widest">
                           {stats.score > 70 ? 'Stable' : stats.score > 40 ? 'Variant' : 'Alert'}
                        </span>
                    </div>
                </div>

                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                      <circle 
                          cx="50" cy="50" r="42" 
                          fill="none" 
                          stroke="#A7F3D0" 
                          strokeWidth="6" 
                          strokeLinecap="round" 
                          strokeDasharray={`${(stats.score / 100) * 263.89} 263.89`} 
                          className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(167,243,208,0.3)]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-light text-white tracking-tighter leading-none">{stats.score}%</span>
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