
import React from 'react';
import { Trade } from '../types';

interface FearGreedIndexProps {
  trades: Trade[];
}

const FearGreedIndex: React.FC<FearGreedIndexProps> = ({ trades }) => {
  return (
    <div className="w-full h-full bg-white/[0.03] rounded-[25px] border border-white/5 shadow-xl transition-all duration-500">
      {/* Empty card container */}
    </div>
  );
};

export default FearGreedIndex;
