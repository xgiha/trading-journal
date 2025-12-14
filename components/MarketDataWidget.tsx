import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  pctChange: number;
}

const MarketDataWidget: React.FC = () => {
  const [data, setData] = useState<MarketTicker[]>([
    { symbol: 'NQ', name: 'E-Mini Nas 100', price: 17985.25, change: 45.50, pctChange: 0.25 },
    { symbol: 'ES', name: 'E-Mini S&P 500', price: 5120.50, change: -12.25, pctChange: -0.24 },
    { symbol: 'GC', name: 'Gold Futures', price: 2165.80, change: 15.30, pctChange: 0.71 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => {
        // Different volatility for different assets
        const volatility = item.symbol === 'GC' ? 0.4 : 1.2;
        // Random price movement
        const changeAmount = (Math.random() - 0.48) * volatility; 
        
        const newPrice = item.price + changeAmount;
        // Update daily change accumulating the movement
        const newChange = item.change + changeAmount;
        const newPct = (newChange / (newPrice - newChange)) * 100;
        
        return {
          ...item,
          price: newPrice,
          change: newChange,
          pctChange: newPct
        };
      }));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      {data.map((item) => (
        <div key={item.symbol} className="flex items-center justify-between group cursor-default">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-bold text-white shrink-0">{item.symbol}</span>
            <span className="text-[10px] text-nexus-muted uppercase tracking-wider truncate">{item.name}</span>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <span className="text-xs font-mono text-white tracking-tight min-w-[60px] text-right">
               {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
             <div className={`flex items-center justify-end gap-1 w-14 px-1.5 py-0.5 rounded ${
               item.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
             }`}>
                {item.change >= 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                <span className="text-[9px] font-mono font-medium">
                  {Math.abs(item.pctChange).toFixed(2)}%
                </span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketDataWidget;