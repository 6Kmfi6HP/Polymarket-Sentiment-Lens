import React from 'react';
import { Sparkles, Minus, AlertCircle } from 'lucide-react';

interface SentimentBadgeProps {
  label: 'Positive' | 'Neutral' | 'Negative' | string;
  confidence: number;
}

export default function SentimentBadge({ label, confidence }: SentimentBadgeProps) {
  const isWeak = confidence < 0.55;
  const isStrong = confidence >= 0.8;

  let bgClass = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';
  let icon = <Minus className="h-3.5 w-3.5" />;
  let translatedLabel = 'Neutral';

  if (label === 'Positive') {
    bgClass = isWeak 
      ? 'bg-emerald-50/50 text-emerald-800/80 border-emerald-100' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotClass = 'bg-emerald-500';
    icon = <Sparkles className="h-3.5 w-3.5 text-emerald-500" />;
    translatedLabel = 'Positive';
  } else if (label === 'Negative') {
    bgClass = isWeak 
      ? 'bg-rose-50/50 text-rose-800/80 border-rose-100' 
      : 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-500';
    icon = <AlertCircle className="h-3.5 w-3.5 text-rose-500" />;
    translatedLabel = 'Negative';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium tracking-tight whitespace-nowrap transition-all ${bgClass}`}>
      {icon}
      <span>{translatedLabel}</span>
      <span className="text-[10px] opacity-60">{(confidence * 100).toFixed(0)}%</span>
      {isWeak && (
        <span className="text-[9px] bg-slate-100 px-1 rounded-sm text-slate-500 font-normal">
          weak
        </span>
      )}
      {isStrong && (
        <span className="text-[9px] bg-sky-100 text-sky-700 px-1 rounded-sm font-semibold">
          strong
        </span>
      )}
    </div>
  );
}
