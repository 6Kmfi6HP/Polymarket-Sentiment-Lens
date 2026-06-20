'use client';

import React from 'react';
import useSWR from 'swr';
import MarketDetailHeader from '@/components/market-detail-header';
import SentimentTrendChart from '@/components/sentiment-trend-chart';
import NewsList from '@/components/news-list';
import { Loader2, ArrowLeft, HeartCrack } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarketDetailPage({ params }: PageProps) {
  // Safe Next.js 15 / React 19 parameters unwrapping
  const { id } = React.use(params);

  const { data, error, isLoading } = useSWR(`/api/markets/${id}`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Sync details every minute
  });

  const market = data?.data;

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-800 pb-16">
      
      {/* Detail Header area */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Market Explanations</span>
          </Link>
          <div className="text-[10px] uppercase font-mono tracking-wider bg-slate-100 p-1 px-2 rounded font-semibold text-slate-500">
            Market Analyser ID: {id.slice(0, 12)}
          </div>
        </div>
      </header>

      {/* Main Container slots */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500 font-sans animate-pulse">
              Hydrating market cache and parsing sentiment summaries...
            </p>
          </div>
        ) : error || !market ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex flex-col items-center space-y-2">
              <HeartCrack className="h-10 w-10 text-rose-500" />
              <h3 className="font-bold text-rose-800 text-sm">Failed to Load Explanation</h3>
              <p className="text-xs text-rose-700 leading-relaxed font-sans max-w-sm">
                The targeted prediction market coordinates are not synced or are temporarily unavailable from the platform provider.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
            >
              Return to Observatory
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* A. Market title and probabilities panel */}
            <MarketDetailHeader market={market} />

            {/* B. Trend Chart visual comparison */}
            <SentimentTrendChart
              priceSnapshots={market.priceSnapshots}
              currentYesPrice={market.yesPrice}
            />

            {/* C. News Feed and Sentiment List */}
            <div className="border-t border-slate-200/60 pt-6">
              <NewsList marketId={id} />
            </div>

          </div>
        )}

      </div>

    </main>
  );
}
