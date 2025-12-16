import React, { useMemo } from 'react';
import { Trade } from '../types';
import { Brain, AlertCircle, TrendingDown, TrendingUp, Microscope } from 'lucide-react';

interface PsychologicalAnalysisProps {
  trades: Trade[];
  className?: string;
}

type EmotionType = 'Fear' | 'Greed' | 'FOMO' | 'Revenge' | 'Flow' | 'Disciplined' | 'Neutral';

const KEYWORDS: Record<string, EmotionType> = {
  // Fear
  'scared': 'Fear', 'afraid': 'Fear', 'nervous': 'Fear', 'hesitated': 'Fear', 'panic': 'Fear', 'anxious': 'Fear', 'early exit': 'Fear', 'doubt': 'Fear', 'uncertain': 'Fear',
  // Greed
  'greedy': 'Greed', 'held too long': 'Greed', 'wanted more': 'Greed', 'oversized': 'Greed', 'hope': 'Greed', 'pushed it': 'Greed', 'target moved': 'Greed',
  // FOMO
  'fomo': 'FOMO', 'chased': 'FOMO', 'missed out': 'FOMO', 'jumped in': 'FOMO', 'impulsive': 'FOMO', 'rushed': 'FOMO', 'late entry': 'FOMO',
  // Revenge
  'revenge': 'Revenge', 'make back': 'Revenge', 'angry': 'Revenge', 'frustrated': 'Revenge', 'recover': 'Revenge', 'tilted': 'Revenge', 'fight': 'Revenge',
  // Flow / Disciplined
  'plan': 'Disciplined', 'patient': 'Disciplined', 'waited': 'Disciplined', 'calm': 'Flow', 'zone': 'Flow', 'perfect': 'Flow', 'rules': 'Disciplined', 'process': 'Disciplined', 'clean': 'Flow'
};

const PsychologicalAnalysis: React.FC<PsychologicalAnalysisProps> = ({ trades, className = '' }) => {
  const analysis = useMemo(() => {
    let negativePnl = 0;
    let positivePnl = 0;
    let negativeCount = 0;
    let positiveCount = 0;
    let emotionCounts: Record<string, number> = {};
    let dominantEmotion = 'Neutral';
    let maxCount = 0;

    trades.forEach(t => {
      const note = (t.notes || '').toLowerCase();
      let detected: EmotionType = 'Neutral';

      // Simple keyword matching
      // We prioritize specific phrases over general words by checking longer keys first? 
      // JavaScript object iteration order isn't guaranteed for keys, but generally insertion order for non-integer keys.
      // We'll iterate entries.
      for (const [key, emotion] of Object.entries(KEYWORDS)) {
        if (note.includes(key)) {
          detected = emotion;
          break; // Take first match
        }
      }

      // Tally
      emotionCounts[detected] = (emotionCounts[detected] || 0) + 1;
      if (emotionCounts[detected] > maxCount && detected !== 'Neutral') {
          maxCount = emotionCounts[detected];
          dominantEmotion = detected;
      }

      // PnL Impact
      if (['Fear', 'Greed', 'FOMO', 'Revenge'].includes(detected)) {
        negativePnl += t.pnl;
        negativeCount++;
      } else if (['Flow', 'Disciplined'].includes(detected)) {
        positivePnl += t.pnl;
        positiveCount++;
      }
    });

    return { negativePnl, positivePnl, dominantEmotion, negativeCount, positiveCount };
  }, [trades]);

  const costOfEmotions = analysis.negativePnl;
  const isCostly = costOfEmotions < 0;

  return (
    <div className={`liquid-card rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden group ${className}`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
             <Brain size={16} />
           </div>
           <span className="text-[10px] uppercase tracking-widest text-nexus-muted font-bold">Psychological Analysis</span>
        </div>
        
        {analysis.dominantEmotion !== 'Neutral' && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border backdrop-blur-md ${
                ['Fear', 'Greed', 'FOMO', 'Revenge'].includes(analysis.dominantEmotion)
                ? 'border-red-500/30 text-red-400 bg-red-500/10'
                : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
            }`}>
                <Microscope size={10} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{analysis.dominantEmotion} Detected</span>
            </div>
        )}
      </div>

      {/* Main Stat Area */}
      <div className="relative z-10 mt-1">
         <div className="flex items-baseline justify-between mb-1">
             <span className="text-[10px] text-nexus-muted uppercase tracking-wider font-medium">
                {isCostly ? "Emotional Cost" : "Discipline Gain"}
             </span>
             {analysis.negativeCount > 0 && (
                <span className="text-[9px] text-red-400 font-mono">
                   {analysis.negativeCount} {analysis.negativeCount === 1 ? 'Error' : 'Errors'}
                </span>
             )}
         </div>
         
         <div className="flex items-center gap-3">
             <span className={`text-3xl font-light tracking-tighter ${
                 isCostly 
                 ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]' 
                 : 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'
             }`}>
                {costOfEmotions < 0 ? '-' : '+'}${Math.abs(costOfEmotions).toLocaleString()}
             </span>
             
             {/* Mini Trend Indicator */}
             <div className={`p-1 rounded-full ${isCostly ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {isCostly ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
             </div>
         </div>
         
         <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50 rounded-l-xl"></div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-medium pl-1">
               {isCostly 
                 ? <span className="text-gray-300">Your trading journal indicates patterns of <strong className="text-red-400">{['Fear', 'Greed', 'FOMO', 'Revenge'].find(e => analysis.dominantEmotion === e) || 'emotional instability'}</strong>. This behavior is currently the biggest leak in your profitability.</span>
                 : <span className="text-gray-300">You are demonstrating strong psychological resilience. The data shows clear <strong className="text-emerald-400">Flow State</strong> alignment with your trading plan.</span>}
            </p>
         </div>
      </div>

      {/* Breakdown Visualization */}
      <div className="flex flex-col gap-2 mt-1 z-10">
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-nexus-muted/60 font-bold">
              <span>Negative States</span>
              <span>Flow States</span>
          </div>
          <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden flex">
              {/* Negative Bar */}
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400" 
                style={{ width: `${Math.min(100, Math.abs(analysis.negativePnl) / ((Math.abs(analysis.negativePnl) + Math.abs(analysis.positivePnl)) || 1) * 100)}%` }}
              ></div>
              {/* Spacer/Neutral */}
              <div className="flex-1"></div>
              {/* Positive Bar */}
              <div 
                 className="h-full bg-gradient-to-l from-emerald-600 to-emerald-400" 
                 style={{ width: `${Math.min(100, Math.abs(analysis.positivePnl) / ((Math.abs(analysis.negativePnl) + Math.abs(analysis.positivePnl)) || 1) * 100)}%` }}
              ></div>
          </div>
      </div>
      
    </div>
  );
};

export default PsychologicalAnalysis;