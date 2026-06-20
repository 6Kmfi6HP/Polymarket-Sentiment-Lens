'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import SentimentBadge from './sentiment-badge';
import RefreshButton from './refresh-button';
import { Newspaper, Calendar, ExternalLink, Activity, Info, AlertTriangle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NewsListProps {
  marketId: string;
}

export default function NewsList({ marketId }: NewsListProps) {
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [now] = useState(() => Date.now());
  const { data, error, isLoading, mutate } = useSWR(`/api/markets/${marketId}/news`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 120000, // every 2 minutes
  });

  const newsItems = data?.data || [];
  const summary = data?.summary || { positive: 0, neutral: 0, negative: 0, weightedScore: 0.0, lastAnalyzedAt: null };

  const handleRefreshComplete = () => {
    // Relode the SWR data
    mutate();
  };

  // Filter items locally for immediate client responsiveness
  const filteredItems = newsItems.filter((item: any) => {
    if (!sentimentFilter) return true;
    if (!item.sentiment) return false;
    return item.sentiment.label === sentimentFilter;
  });

  // Calculate high quality values for visual score representations
  const score = summary.weightedScore;
  let summaryTitle = 'Neutral';
  let summaryClass = 'text-slate-600 bg-slate-50 border-slate-100';
  let gaugeColor = 'bg-slate-400';

  if (score > 0.15) {
    summaryTitle = 'Bullish Sentiment';
    summaryClass = 'text-emerald-700 bg-emerald-50 border-emerald-100';
    gaugeColor = 'bg-emerald-500';
  } else if (score < -0.15) {
    summaryTitle = 'Bearish Sentiment';
    summaryClass = 'text-rose-700 bg-rose-50 border-rose-100';
    gaugeColor = 'bg-rose-500';
  }

  // Format date readable
  const formatTimeAgo = (dateStr: string) => {
    try {
       const d = new Date(dateStr);
       if (isNaN(d.getTime())) return '';
       const seconds = Math.floor((now - d.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return 'just now';
    } catch {
      return '';
    }
  };

  return (
    <div id="news-section-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Left hand Metrics summary index card */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-slate-400" />
              Sentiment Core
            </h2>
            <RefreshButton marketId={marketId} onComplete={handleRefreshComplete} />
          </div>

          {/* Core Score Gage block */}
          <div className={`p-4 rounded-xl border border-dashed rounded-xl flex flex-col items-center justify-center text-center ${summaryClass}`}>
            <span className="text-[10px] uppercase font-mono tracking-widest font-extrabold opacity-75">
              Weighted Sentiment Score
            </span>
            <p className="text-4xl font-extrabold tracking-tighter mt-1 font-mono">
              {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
            </p>
            <span className="text-xs font-bold mt-2.5 inline-block">
              {summaryTitle}
            </span>
            <span className="text-[10px] opacity-65 font-sans font-medium mt-1">
              Decayed exponentially by news freshness (72h half-life)
            </span>
          </div>

          {/* Gauge distributions */}
          <div className="space-y-2.5 pt-2 text-xs">
            <h4 className="font-semibold text-slate-700">Classification Spread</h4>
            
            {/* Positive bar */}
            <button
              onClick={() => setSentimentFilter(sentimentFilter === 'Positive' ? '' : 'Positive')}
              className={`w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                sentimentFilter === 'Positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent hover:bg-slate-150'
              }`}
            >
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Positive
              </span>
              <span className="font-mono font-bold text-slate-700">{summary.positive}</span>
            </button>

            {/* Neutral bar */}
            <button
              onClick={() => setSentimentFilter(sentimentFilter === 'Neutral' ? '' : 'Neutral')}
              className={`w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                sentimentFilter === 'Neutral' ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-transparent hover:bg-slate-150'
              }`}
            >
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Neutral
              </span>
              <span className="font-mono font-bold text-slate-700">{summary.neutral}</span>
            </button>

            {/* Negative bar */}
            <button
              onClick={() => setSentimentFilter(sentimentFilter === 'Negative' ? '' : 'Negative')}
              className={`w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                sentimentFilter === 'Negative' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-transparent hover:bg-slate-150'
              }`}
            >
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Negative
              </span>
              <span className="font-mono font-bold text-slate-700">{summary.negative}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1 justify-center font-mono">
            <Info className="h-3 w-3 shrink-0" />
            <span>
              Last Sourced: {summary.lastAnalyzedAt ? new Date(summary.lastAnalyzedAt).toLocaleString() : 'Never'}
            </span>
          </div>

        </div>
      </div>

      {/* 2. Right hand Detailed feed columns */}
      <div className="lg:col-span-2 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-sans font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
            <Newspaper className="h-4.5 w-4.5 text-slate-400" />
            Sourced News Context 
            <span className="font-mono font-normal text-slate-400">({filteredItems.length})</span>
          </h3>
          
          {sentimentFilter && (
            <button
              onClick={() => setSentimentFilter('')}
              className="text-[10px] text-slate-500 hover:text-slate-800 hover:underline border border-slate-200 bg-white p-1 px-2 rounded-md"
            >
              Clear Filter: {sentimentFilter}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-11/12" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center border border-dashed border-rose-250 bg-rose-50/50 rounded-xl text-rose-800 text-xs font-semibold">
            Failed to fetch news feed details. Try refreshing the page.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-slate-50 p-12 text-center rounded-xl space-y-2">
            <Newspaper className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-medium text-xs">No matching news articles found.</p>
            <p className="text-[10px] text-slate-400">
              {newsItems.length === 0 
                ? "Click 'Sync News & Sentiment' to trigger real-time RSSHub indexing and sentiment calculations!" 
                : "Try clearing individual sentiment filter selections."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border hover:border-slate-300 rounded-xl p-4 shadow-sm transition-all duration-200 text-slate-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    
                    {/* Header: source icon and time */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="uppercase text-slate-500 font-semibold">{item.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.publishedAt ? formatTimeAgo(item.publishedAt) : 'Recent'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-sans font-semibold text-slate-800 text-sm leading-snug pr-4">
                      {item.title}
                    </h4>

                  </div>

                  {/* Sentiment Badge info */}
                  <div className="shrink-0 self-start">
                    {item.sentiment ? (
                      <SentimentBadge
                        label={item.sentiment.label}
                        confidence={item.sentiment.confidence}
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-slate-100 bg-slate-50 text-[10px] font-medium rounded-full text-slate-400">
                        Analyzing Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer link trigger */}
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {item.id.slice(0, 8)}
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 hover:underline font-semibold"
                  >
                    <span>View original report</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
