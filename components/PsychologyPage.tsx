import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import PsychologicalAnalysis from './PsychologicalAnalysis';
import { Trade } from '../types';

interface PsychologyPageProps {
  trades: Trade[];
  onBack: () => void;
}

const PsychologyPage: React.FC<PsychologyPageProps> = ({ trades, onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-12"
    >
      <div className="max-w-4xl w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-nexus-accent/50 transition-all active:scale-95"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-light text-white tracking-tight">Psychological Profile</h1>
                <p className="text-nexus-muted text-sm mt-1">AI-driven analysis of your emotional trading patterns.</p>
            </div>
        </div>

        {/* The Card - Expanded view */}
        <div className="w-full">
            <PsychologicalAnalysis trades={trades} className="min-h-[400px]" />
        </div>

        {/* Additional Insight (Placeholder for future expansion) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-[#0F0F0F] border border-white/5 p-6 rounded-3xl">
                 <span className="text-xs text-nexus-muted uppercase tracking-widest font-bold">Total Trades</span>
                 <div className="text-4xl font-light text-white mt-2">{trades.length}</div>
             </div>
             <div className="bg-[#0F0F0F] border border-white/5 p-6 rounded-3xl">
                 <span className="text-xs text-nexus-muted uppercase tracking-widest font-bold">Notes Logged</span>
                 <div className="text-4xl font-light text-white mt-2">
                     {trades.filter(t => t.notes && t.notes.length > 0).length}
                 </div>
             </div>
             <div className="bg-[#0F0F0F] border border-white/5 p-6 rounded-3xl">
                 <span className="text-xs text-nexus-muted uppercase tracking-widest font-bold">Analysis Depth</span>
                 <div className="text-4xl font-light text-nexus-accent mt-2">High</div>
             </div>
        </div>

      </div>
    </motion.div>
  );
};

export default PsychologyPage;