
import * as React from "react";
import { Trade } from "../types";
import { MarketStatusCard } from "./MarketStatusCard";

interface TotalPnlCardProps {
  trades: Trade[];
  totalPnl: number;
  growthPct: number;
}

const TotalPnlCardComponent: React.FC<TotalPnlCardProps> = ({ totalPnl, growthPct }) => {
  const getFontSize = (val: number) => {
    const length = Math.floor(Math.abs(val)).toString().length;
    if (length <= 4) return "text-[3.4rem]";
    if (length === 5) return "text-[2.8rem]";
    if (length === 6) return "text-[2.5rem]";
    return "text-[2.2rem]";
  };

  const formatCurrencyInteger = (val: number) => {
    return Math.floor(Math.abs(val)).toLocaleString();
  };

  return (
    <div className="relative w-full aspect-square group">
      <div
        className="absolute inset-0 bg-white/[0.03] rounded-[25px] flex flex-col items-center justify-center overflow-hidden transition-all duration-500"
      >
        <div className="flex flex-col items-center z-10">
          <div className="flex items-start gap-1">
            <span className="font-pixel text-2xl text-white/20 mt-3">$</span>
            <h2
              className={`font-pixel ${getFontSize(
                totalPnl
              )} text-white tracking-tighter leading-none`}
            >
              {totalPnl < 0 ? "-" : ""}
              {formatCurrencyInteger(totalPnl)}
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
          <MarketStatusCard />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TotalPnlCardComponent);
