import * as React from "react";
import { Trade } from "../types";
import { MarketStatusCard } from "./MarketStatusCard";
import { Skeleton } from "./Skeleton";

interface TotalPnlCardProps {
  trades: Trade[];
  totalPnl: number;
  growthPct: number;
  loading?: boolean;
}

const TotalPnlCardComponent: React.FC<TotalPnlCardProps> = ({ totalPnl, growthPct, loading = false }) => {
  
  const formatCurrency = (val: number) => {
    return Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getFontSize = (val: number) => {
    const len = formatCurrency(val).length;
    // Adjusted thresholds to fit within ~200px width container with the dollar sign
    if (len <= 6) return "text-[2.5rem]"; // e.g., 999.00
    if (len <= 8) return "text-[2rem]";   // e.g., 1,000.00
    if (len <= 10) return "text-[1.6rem]"; // e.g., 10,000.00 to 100,000.00
    if (len <= 13) return "text-[1.3rem]"; // e.g., 1,000,000.00
    return "text-[1rem]";
  };

  return (
    <div className="relative w-full aspect-square group">
      <div
        className="absolute inset-0 bg-white/[0.03] rounded-[25px] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 border border-white/5 shadow-xl p-4"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-6 w-full px-8">
            <Skeleton className="h-2 w-20 rounded-full" />
            <div className="flex items-start gap-1">
              <Skeleton className="h-16 w-48 rounded-2xl" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="mt-8 w-full flex justify-center">
              <MarketStatusCard loading={true} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center z-10 w-full">
              <div className="flex items-baseline justify-center gap-1 w-full flex-wrap">
                <span className={`font-pixel text-white/20 ${totalPnl.toString().length > 7 ? 'text-lg' : 'text-2xl'}`}>$</span>
                <h2
                  className={`font-pixel ${getFontSize(
                    totalPnl
                  )} text-white tracking-tighter leading-none text-center transition-all duration-300 break-words max-w-full`}
                >
                  {totalPnl < 0 ? "-" : ""}
                  {formatCurrency(totalPnl)}
                </h2>
              </div>

              <div
                className={`flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full border bg-white/5 transition-all duration-300 ${
                  growthPct >= 0
                    ? "border-emerald-500/20 text-emerald-400"
                    : "border-red-500/20 text-red-400"
                }`}
              >
                <span className="text-[11px] font-bold font-mono">
                  {growthPct >= 0 ? "+" : ""}
                  {growthPct.toFixed(2)}%
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`transition-transform duration-300 ${growthPct >= 0 ? "rotate-0" : "rotate-180"}`}
                >
                  <path
                    d="M7 14l5-5 5 5"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
              <MarketStatusCard loading={loading} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(TotalPnlCardComponent);