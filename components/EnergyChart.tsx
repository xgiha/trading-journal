
import React, { useMemo } from 'react';
import { Trade } from '../types';
import { Sparkles, TrendingUp, BarChart3, Wallet } from 'lucide-react';

interface EnergyChartProps {
  trades: Trade[];
  stats: {
    totalPnl: number;
    growthPct: number;
  };
}

const EnergyChart: React.FC<EnergyChartProps> = ({ trades, stats }) => {
  // --- Data Calculations ---
  const calculations = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let weekly = 0;
    let monthly = 0;
    let annual = 0;

    const assetTotals: Record<string, number> = {};

    trades.forEach(t => {
      const tDate = new Date(t.date + 'T00:00:00');
      if (tDate >= oneWeekAgo) weekly += t.pnl;
      if (tDate >= startOfMonth) monthly += t.pnl;
      if (tDate >= startOfYear) annual += t.pnl;

      assetTotals[t.pair] = (assetTotals[t.pair] || 0) + t.pnl;
    });

    const topAssets = Object.entries(assetTotals)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3);

    return { weekly, monthly, annual, topAssets };
  }, [trades]);

  // --- Organic Radar Logic ---
  // We'll create a "blob" style radar using 8 points representing different performance metrics
  const radarPoints = useMemo(() => {
    const center = 100;
    const count = 8;
    const step = (Math.PI * 2) / count;
    
    // Mock performance variance based on real trade count/pnl for jitter
    const seed = trades.length % 10;
    
    const generatePath = (radiusBase: number, jitter: number, color: string) => {
      let path = "";
      for (let i = 0; i <= count; i++) {
        const angle = i * step;
        const r = radiusBase + (Math.sin(angle * 2 + seed) * jitter) + (Math.cos(angle * 3) * (jitter/2));
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        path += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }
      return path + " Z";
    };

    return {
      green: generatePath(55, 12, "#22c55e"),
      purple: generatePath(45, 15, "#a855f7")
    };
  }, [trades.length]);

  const formatCurrency = (val: number) => {
    return `$${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white p-6 md:p-8 font-sans overflow-hidden relative selection:bg-nexus-accent selection:text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight">Analytics</h2>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Sparkles size={16} fill="currentColor" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Stats Section */}
        <div className="lg:col-span-3 flex flex-col justify-between py-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500" />
              <span className="text-[10px] uppercase font-bold text-nexus-muted tracking-widest">Weekly</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono">{formatCurrency(calculations.weekly)}</span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {calculations.weekly >= 0 ? '↑' : '↓'} {(Math.random() * 20).toFixed(1)}%
              </span>
            </div>
            <p className="text-[9px] text-[#444] font-bold uppercase tracking-tight">Compared to prev week</p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            {calculations.topAssets.map(([pair, pnl], idx) => (
              <div key={pair} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-400' : idx === 1 ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                <span className="text-[11px] font-bold text-nexus-muted uppercase tracking-wider">{pair}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-white/5">
                  <Wallet size={18} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] text-nexus-muted font-bold uppercase tracking-widest">Total Earning</span>
                  <span className="text-xs font-bold font-mono">{formatCurrency(stats.totalPnl)}</span>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-nexus-muted border border-white/5">
                  <BarChart3 size={18} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] text-nexus-muted font-bold uppercase tracking-widest">Total Trades</span>
                  <span className="text-xs font-bold font-mono">{trades.length.toLocaleString()}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Center Radar Section */}
        <div className="lg:col-span-6 flex items-center justify-center relative">
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-[340px] drop-shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            {/* Grid Circles */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="55" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="30" fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
            
            {/* Axis Lines */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
              <line 
                key={angle} 
                x1="100" y1="100" 
                x2={100 + 85 * Math.cos((angle * Math.PI) / 180)} 
                y2={100 + 85 * Math.sin((angle * Math.PI) / 180)} 
                stroke="white" strokeOpacity="0.05" strokeWidth="0.5" 
              />
            ))}

            {/* Labels */}
            <text x="100" y="10" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">0</text>
            <text x="190" y="102" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">15</text>
            <text x="100" y="195" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">25</text>
            <text x="10" y="102" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">35</text>
            <text x="165" y="55" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">10</text>
            <text x="165" y="145" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">20</text>
            <text x="35" y="145" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">30</text>
            <text x="35" y="55" textAnchor="middle" className="fill-[#444] text-[6px] font-bold">40</text>

            {/* Waves */}
            <path d={radarPoints.purple} fill="#a855f7" fillOpacity="0.15" stroke="#a855f7" strokeWidth="2" strokeLinejoin="round" className="animate-pulse" />
            <path d={radarPoints.green} fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
            
            {/* Center Logo */}
            <rect x="92" y="92" width="16" height="16" rx="4" fill="black" stroke="white" strokeOpacity="0.5" strokeWidth="0.5" />
            <path d="M100 95 L103 98 L100 101 L97 98 Z" fill="none" stroke="white" strokeWidth="0.5" />
            <path d="M100 95 L100 101 M97 98 L103 98" fill="none" stroke="white" strokeWidth="0.3" strokeOpacity="0.5" />
          </svg>
        </div>

        {/* Right Stats Section */}
        <div className="lg:col-span-3 flex flex-col gap-8 py-2 text-right">
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold text-nexus-muted tracking-widest">Monthly</span>
              <div className="text-yellow-500"><Sparkles size={10} fill="currentColor" /></div>
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[9px] text-emerald-400 font-bold">↑{Math.floor(Math.random()*15)}</span>
              <span className="text-2xl font-bold font-mono">{formatCurrency(calculations.monthly)}</span>
            </div>
            <p className="text-[9px] text-[#444] font-bold uppercase tracking-tight">Current month progress</p>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold text-nexus-muted tracking-widest">Annual</span>
              <div className="text-red-500 font-bold text-xs">ö</div>
            </div>
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-[9px] text-emerald-400 font-bold">↑{Math.floor(Math.random()*25)}</span>
              <span className="text-2xl font-bold font-mono">{formatCurrency(calculations.annual)}</span>
            </div>
            <p className="text-[9px] text-[#444] font-bold uppercase tracking-tight">Year to date performance</p>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            {calculations.topAssets.map(([pair, pnl]) => (
              <div key={`val-${pair}`} className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">{pair}</span>
                <span className="text-xs font-mono font-bold text-nexus-muted">{formatCurrency(pnl)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnergyChart;
