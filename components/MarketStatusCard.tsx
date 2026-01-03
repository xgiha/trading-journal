import React, { useState, useEffect } from 'react';
import { Skeleton } from './Skeleton';

interface MarketStatusCardProps {
  loading?: boolean;
}

export const MarketStatusCard: React.FC<MarketStatusCardProps> = ({ loading = false }) => {
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      const day = now.getUTCDay();
      const hour = now.getUTCHours();
      let isOpen = true;

      // Simple market hours logic (Forex/Futures standard)
      if (day === 6) isOpen = false; 
      if (day === 5 && hour >= 22) isOpen = false;
      if (day === 0 && hour < 23) isOpen = false;
      if ((day >= 1 && day <= 4) && (hour === 22)) isOpen = false;

      setIsMarketOpen(isOpen);
    };

    updateMarketStatus();
    const timer = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] shadow-inner">
        <Skeleton className="h-2.5 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] shadow-inner">
      <span className="text-[8px] font-bold text-xgiha-muted uppercase tracking-[0.15em]">
        {isMarketOpen ? 'Market Open' : 'Market Closed'}
      </span>
      <div className="relative flex items-center justify-center">
        <div className={`w-1 h-1 rounded-full ${isMarketOpen ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'} animate-pulse`}></div>
      </div>
    </div>
  );
};