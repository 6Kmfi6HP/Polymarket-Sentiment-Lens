import React from 'react';
import MarketList from '@/components/market-list';
import { Newspaper } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-800">
      
      {/* Visual Identity Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-sans font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  Polymarket Sentiment Lens
                </h1>
                <p className="text-[10px] font-mono font-medium text-slate-400">
                  REAL-TIME FINBERT OBSERVATORY
                </p>
              </div>
            </div>

            {/* Utility Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1.5 px-3 rounded-xl text-xs font-mono font-semibold text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Feed ACTIVE</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Editorial Greeting Info Panel */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-850 text-white p-6 md:p-8 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-y-12 translate-x-12 opacity-5 pointer-events-none">
            <Newspaper className="h-64 w-64" />
          </div>
          <span className="text-[10px] font-mono text-emerald-400 tracking-widest font-extrabold uppercase">
            Odds Explained
          </span>
          <h2 className="font-sans font-medium text-xl md:text-2xl tracking-tight leading-snug max-w-2xl text-slate-100">
            Why do Polymarket prediction parameters fluctuate?
          </h2>
          <p className="font-sans text-xs md:text-sm text-slate-350 max-w-3xl leading-relaxed font-light">
            Don&apos;t just view the odds—understand them. Polymarket Sentiment Lens correlates outcome probabilities with current news feeds. Using <b>FinBERT (Financial BERT)</b> classification, we automatically pull RSSHub search streams, calculate temporal weight decays, and evaluate whether external events validate market direction.
          </p>
        </section>

        {/* Real-time listings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h2 className="font-sans font-bold text-sm tracking-tight text-slate-800">
                Observatory Desk
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                SELECT A PREDICATE TO ANALYZE NEWS SENTIMENT OR VIEW PRICE CHARTS
              </p>
            </div>
          </div>
          <MarketList />
        </section>

      </div>

      {/* Footer information credit */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-center text-xs text-slate-400 font-mono">
        <p>© 2026 Polymarket Sentiment Lens • Powered by RSSHub & FinBERT ML API</p>
        <p className="text-[10px] opacity-75 mt-1">First-tier Offline-First caching active for sub-500ms API speeds</p>
      </footer>

    </main>
  );
}
