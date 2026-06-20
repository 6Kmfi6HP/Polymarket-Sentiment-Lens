'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, BarChart3, Coins, Database } from 'lucide-react';

interface MarketDetailHeaderProps {
  market: {
    id: string;
    question: string;
    category: string | null;
    yesPrice: number | null;
    noPrice: number | null;
    volume: number | null;
    liquidity: number | null;
    endDate: string | Date | null;
    fetchedAt: string | Date | null;
    provider: string;
  };
}

export default function MarketDetailHeader({ market }: MarketDetailHeaderProps) {
  const yesProb = market.yesPrice !== null ? Math.round(market.yesPrice * 100) : 50;
  const noProb = market.noPrice !== null ? Math.round(market.noPrice * 100) : 50;

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return 'Flexible';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Flexible';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (val: number | null) => {
    if (!val) return '$0';
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 space-y-6">
      
      {/* Back navigation & Categorization banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium border border-slate-200 px-2.5 py-1 rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Prediction Markets</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-slate-50 text-slate-500 border border-slate-100 px-2.5 py-1 rounded-md">
            {market.category || 'General'}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-sky-50 text-sky-800 border border-sky-100 px-2.5 py-1 rounded-md">
            {market.provider}
          </span>
        </div>
      </div>

      {/* Main question prompt */}
      <div>
        <h1 className="font-sans font-medium text-xl md:text-2xl text-slate-900 leading-tight tracking-tight">
          {market.question}
        </h1>
      </div>

      {/* Probability Gauge Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* YES Panel */}
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">Yes Predicts</span>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">{yesProb}%</p>
          </div>
          <div className="bg-emerald-500 text-white font-mono font-bold text-xs p-2 px-3 rounded-lg">
            ${market.yesPrice?.toFixed(2) || '0.50'}
          </div>
        </div>

        {/* NO Panel */}
        <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-widest">No Predicts</span>
            <p className="text-3xl font-extrabold text-rose-700 mt-1">{noProb}%</p>
          </div>
          <div className="bg-rose-500 text-white font-mono font-bold text-xs p-2 px-3 rounded-lg">
            ${market.noPrice?.toFixed(2) || '0.50'}
          </div>
        </div>

      </div>

      {/* Metadata Indicators strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 opacity-75">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            END DATE
          </span>
          <p className="font-sans font-semibold text-slate-800 text-xs">{formatDate(market.endDate)}</p>
        </div>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 opacity-75">
            <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
            VOLUME
          </span>
          <p className="font-sans font-semibold text-slate-800 text-xs">{formatCurrency(market.volume)}</p>
        </div>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 opacity-75">
            <Coins className="h-3.5 w-3.5 text-slate-400" />
            LIQUIDITY
          </span>
          <p className="font-sans font-semibold text-slate-800 text-xs">{formatCurrency(market.liquidity)}</p>
        </div>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 opacity-75">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            LAST CAPTURED
          </span>
          <p className="font-sans font-semibold text-slate-800 text-xs">
            {market.fetchedAt ? new Date(market.fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
          </p>
        </div>
      </div>

    </div>
  );
}
