'use client';

import React from 'react';
import Link from 'next/link';
import { Landmark, Newspaper, Activity, ChevronRight, Zap } from 'lucide-react';

interface MarketCardProps {
  market: {
    id: string;
    question: string;
    category: string | null;
    yesPrice: number | null;
    noPrice: number | null;
    volume: number | null;
    liquidity: number | null;
    endDate: string | Date | null;
    newsCount: number;
    sentimentSummary: {
      positive: number;
      neutral: number;
      negative: number;
      weightedScore: number;
    };
    fetchedAt: string;
    stale: boolean;
  };
}

export default function MarketCard({ market }: MarketCardProps) {
  const yesProb = market.yesPrice !== null ? Math.round(market.yesPrice * 100) : 50;
  const noProb = market.noPrice !== null ? Math.round(market.noPrice * 100) : 50;

  const score = market.sentimentSummary.weightedScore;
  
  // Choose sentiment banner style based on weightedScore
  let sentimentTheme = 'bg-slate-50 text-slate-700 border-slate-100';
  let sentimentLabel = 'Neutral Sentiment';
  
  if (score > 0.15) {
    sentimentTheme = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    sentimentLabel = 'Bullish Sentiment';
  } else if (score < -0.15) {
    sentimentTheme = 'bg-rose-50 text-rose-700 border-rose-100';
    sentimentLabel = 'Bearish Sentiment';
  }

  // Format big volumes
  const formatCurrency = (val: number | null) => {
    if (!val) return '$0';
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <Link
      href={`/markets/${market.id}`}
      id={`market-card-${market.id}`}
      className="group block bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all duration-200"
    >
      <div className="p-5 flex flex-col h-full min-h-[220px] justify-between">
        
        {/* Top Header Row */}
        <div>
          <div className="flex justify-between items-start gap-4 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
              {market.category || 'General'}
            </span>
            {market.stale && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-100">
                stale
              </span>
            )}
          </div>

          <h3 className="font-sans font-semibold text-sm text-slate-800 line-clamp-2 md:line-clamp-3 group-hover:text-slate-900 leading-snug">
            {market.question}
          </h3>
        </div>

        {/* Pricing Odds Meter */}
        <div className="my-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1 font-mono font-medium">
            <span>Yes {yesProb}%</span>
            <span>No {noProb}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${yesProb}%` }} 
              className="bg-emerald-500 h-full transition-all duration-300"
            />
            <div 
              style={{ width: `${noProb}%` }} 
              className="bg-rose-500 h-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Footer Meta Stats */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Volume">
              <Activity className="h-3 w-3 text-slate-400" />
              {formatCurrency(market.volume)}
            </span>
            <span className="flex items-center gap-1" title="Liquidity">
              <Landmark className="h-3 w-3 text-slate-400" />
              {formatCurrency(market.liquidity)}
            </span>
            <span className="flex items-center gap-1" title="Sourced News">
              <Newspaper className="h-3 w-3 text-slate-400" />
              {market.newsCount}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100/80 p-1 px-2 rounded border border-slate-100 transition-colors">
            <span className="font-sans font-medium text-slate-600">Analyze</span>
            <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Sentiment ribbon */}
        {market.newsCount > 0 && (
          <div className={`mt-3 flex items-center justify-between px-2.5 py-1 rounded-lg border text-[10px] font-medium tracking-tight ${sentimentTheme}`}>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 opacity-80" />
              {sentimentLabel}
            </span>
            <span className="font-mono">Score: {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}</span>
          </div>
        )}

      </div>
    </Link>
  );
}
