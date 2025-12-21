import * as React from 'react';
import { Trade } from '../types';

interface EnergyChartProps {
  trades: Trade[];
  stats: {
    totalPnl: number;
    growthPct: number;
  };
  className?: string;
}

/**
 * EnergyChart - Placeholder State
 * This component has been emptied and is ready for a new implementation.
 */
const EnergyChart: React.FC<EnergyChartProps> = ({ className }) => {
  return (
    <div
      className={`w-full h-full rounded-[2.5rem] bg-[#111] p-8 text-white border border-white/5 shadow-2xl flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <div className="flex flex-col items-center gap-4 opacity-20">
        <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/20 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white text-center">
          Ready for New Module
        </span>
      </div>
    </div>
  );
};

export default React.memo(EnergyChart);