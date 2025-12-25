
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreHorizontal, 
  Share2, 
  Play, 
  Video, 
  FileText, 
  Mic, 
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Target,
  Layers,
  Zap,
  Phone,
  History
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
    const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const grouped: Record<string, Trade[]> = {};
    sorted.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return {
      grouped,
      total: trades.length,
      recent: sorted.slice(0, 5)
    };
  }, [trades]);

  useEffect(() => {
    const runClinicalAnalysis = async () => {
      if (trades.length === 0) return;
      setIsAnalyzing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const history = trades.slice(-10).map(t => `- Trade [${t.pair}]: Notes="${t.notes || 'None'}", PnL=${t.pnl}`).join('\n');
        
        const prompt = `Act as an AI Mindset Assistant. Analyze these trade notes and provide a very brief, high-level summary of the user's current psychological state. 
        Focus on identifying patterns like FOMO, Fear, or Flow. 
        Output format: A single paragraph, max 60 words. No markdown.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(response.text || '');
      } catch (err) {
        setAiAnalysis("Syncing mindset data...");
      } finally {
        setIsAnalyzing(false);
      }
    };
    runClinicalAnalysis();
  }, [trades]);

  return (
    <div className="w-full h-full bg-[#F5F4EE] text-[#1C1C1C] flex overflow-hidden font-sans rounded-[3rem] shadow-inner border border-black/5">
      
      {/* LEFT SIDEBAR */}
      <div className="w-72 border-r border-black/5 flex flex-col p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Brain size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">Psychology</h1>
          </div>
          <Search size={18} className="text-[#7A7A7A]" />
        </div>

        {/* Mini Mini Calendar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#1C1C1C]">May 2025</span>
            <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E54D2E]" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-3 text-center text-[10px] text-[#7A7A7A] font-medium">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const isToday = day === 3;
              return (
                <span key={i} className={`flex items-center justify-center h-6 w-6 rounded-full ${isToday ? 'bg-[#E54D2E] text-white font-bold' : ''}`}>
                  {day}
                </span>
              );
            })}
          </div>
        </div>

        {/* Exercises / Events */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#7A7A7A]">Drills</h3>
            <Plus size={14} className="text-[#7A7A7A]" />
          </div>
          <div className="space-y-4">
            {[
              { name: 'Breathing Prep', time: '08:00', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
              { name: 'Rules Review', time: '09:15', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
              { name: 'Focus Session', time: '13:00', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={e.img} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-[11px] font-bold">{e.name}</div>
                </div>
                <div className="text-[9px] text-[#7A7A7A] font-mono">{e.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals / Tasks */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#7A7A7A]">Tasks</h3>
            <Plus size={14} className="text-[#7A7A7A]" />
          </div>
          <div className="space-y-3">
            {['Review 5 losses', 'Journal FOMO entry', 'Meditation 10m'].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded border border-black/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-black/5" />
                </div>
                <span className="text-[11px] font-medium text-[#4A4A4A]">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER TIMELINE */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/50">
        <div className="px-10 pt-10 pb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Timeline <span className="text-[#7A7A7A] font-light ml-2">May 2025</span></h2>
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <Share2 size={14} /> Share
            </div>
            <button onClick={onBack} className="text-[#7A7A7A] hover:text-black transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-20">
          <div className="border-t-2 border-black/5 pt-10 space-y-20">
            {Object.entries(stats.grouped).slice(0, 3).map(([date, dayTrades], idx) => {
              const d = new Date(date + 'T00:00:00');
              const dayNum = String(d.getDate()).padStart(2, '0');
              const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <div key={date} className="flex gap-12 group">
                  <div className="flex flex-col items-start w-24 shrink-0">
                    <div className="text-7xl font-bold tracking-tighter leading-none mb-2">{dayNum}</div>
                    <div className="text-xl font-bold text-[#E54D2E] ml-1">{dayLabel}</div>
                  </div>

                  <div className="flex-1 space-y-6">
                    {dayTrades.map((t, i) => (
                      <div key={t.id} className="relative bg-white border border-black/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex items-start gap-6 group/item">
                        <div className="w-32 text-xs font-mono text-[#7A7A7A] pt-1">
                          {t.entryTime} <span className="mx-1 opacity-30">—</span> {t.exitTime || 'Ongoing'}
                        </div>
                        <div className="w-px h-12 bg-black/5 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                             <div className={`w-2 h-2 rounded-full ${t.pnl >= 0 ? 'bg-[#10B981]' : 'bg-[#E54D2E]'}`} />
                             <h4 className="text-sm font-bold">{t.notes ? 'Behavioral Log' : 'Execution Check'}</h4>
                          </div>
                          <p className="text-xs text-[#7A7A7A] leading-relaxed line-clamp-2">
                            {t.notes || `No specific psychological notes recorded for this ${t.pair} ${t.type} trade.`}
                          </p>
                          <div className="mt-4 flex items-center gap-4">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider">
                                <Zap size={12} className="text-[#E54D2E]" />
                                Mindset Detail
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider">
                                <Video size={12} />
                                Session Clip
                             </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex -space-x-2">
                            <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop" />
                            <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=50&h=50&fit=crop" />
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-[#F5F4EE] flex items-center justify-center text-[10px] font-bold">+2</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT ASSISTANT SIDEBAR */}
      <div className="w-[340px] border-l border-black/5 flex flex-col p-6 bg-[#F5F4EE]/50">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-lg font-bold tracking-tight">Ai Assistant</h2>
           <div className="flex gap-3 text-[#7A7A7A]">
              <Layers size={18} />
              <History size={18} />
           </div>
        </div>

        {/* AI Summary Card */}
        <div className="bg-white rounded-3xl border border-black/5 p-5 shadow-sm mb-6">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A7A7A]">Ai Mindset Sumari</span>
           </div>
           
           {/* Visualizer Mockup */}
           <div className="flex items-center gap-1.5 h-12 mb-4 justify-center">
              {[3,5,8,4,10,12,15,10,8,4,2,6,12,8,4].map((h, i) => (
                <div key={i} className="w-[3px] bg-black rounded-full" style={{ height: `${h * 2}px` }} />
              ))}
           </div>

           <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white">
                <Play size={14} fill="white" className="ml-0.5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#7A7A7A]">0:19</span>
           </div>
           
           <p className="text-[11px] text-[#4A4A4A] mt-5 leading-relaxed font-medium">
             {aiAnalysis || "Aggregating recent behavioral markers from your journal entries..."}
           </p>
        </div>

        {/* Timer Card */}
        <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm mb-6 flex flex-col items-center">
           <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A7A7A] mb-4">Focus Session</span>
           <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="58" fill="none" stroke="#F5F4EE" strokeWidth="6" />
                <circle cx="64" cy="64" r="58" fill="none" stroke="#E54D2E" strokeWidth="6" strokeDasharray="364" strokeDashoffset="120" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-2xl font-bold tracking-tighter">00:15</span>
                 <span className="text-[8px] font-bold text-[#7A7A7A] uppercase">Remains</span>
              </div>
           </div>
        </div>

        {/* Evidence Card */}
        <div className="bg-white rounded-3xl border border-black/5 p-5 shadow-sm flex-1 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A7A7A]">Mental Assets</span>
           </div>
           <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {[
                'https://images.unsplash.com/photo-1551288049-bbbda5366991?w=200&h=200&fit=crop',
                'https://images.unsplash.com/photo-1611974715853-2b8ef9a3d136?w=200&h=200&fit=crop',
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop',
                'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&h=200&fit=crop'
              ].map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-black/5 relative group">
                  <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                  {i === 0 && <div className="absolute inset-0 bg-[#E54D2E]/20 flex items-center justify-center"><Target size={20} className="text-white" /></div>}
                </div>
              ))}
           </div>
           <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold">Mindset Report</span>
                <span className="text-[9px] text-[#7A7A7A] font-bold uppercase">April Analysis</span>
              </div>
              <ChevronRight size={16} className="text-[#7A7A7A]" />
           </div>
        </div>
      </div>

      {/* FLOATING ACTION DOCK (SIMULATED PHONE DOCK) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]">
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full flex items-center gap-8 shadow-2xl">
           <button className="text-white/60 hover:text-white transition-colors">
              <MessageSquare size={20} />
           </button>
           <button className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold border border-white/10 hover:bg-white/20 transition-all">
              <Phone size={14} fill="currentColor" /> Mindset Call
           </button>
           <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all">
              <Plus size={20} />
           </button>
           <button className="text-white/60 hover:text-white transition-colors">
              <Mic size={20} />
           </button>
        </div>
      </div>

    </div>
  );
};

export default PsychologyPage;
