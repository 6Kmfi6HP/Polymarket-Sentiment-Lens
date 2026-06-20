'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface RefreshButtonProps {
  marketId: string;
  onComplete?: () => void;
}

export default function RefreshButton({ marketId, onComplete }: RefreshButtonProps) {
  const [status, setStatus] = useState<'idle' | 'queued' | 'running' | 'success' | 'failed'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startRefresh = async () => {
    if (status === 'queued' || status === 'running') return;
    
    setStatus('queued');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/markets/${marketId}/refresh`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.jobId) {
        throw new Error(data.error || 'Failed to trigger refresh');
      }

      setJobId(data.jobId);
      setStatus(data.status || 'queued');
    } catch (err: any) {
      console.error('Trigger refresh error:', err);
      setErrorMsg(err.message || 'Failed to refresh');
      setStatus('failed');
    }
  };

  // Poll for job status
  useEffect(() => {
    if (!jobId || (status !== 'queued' && status !== 'running')) return;

    let timer: NodeJS.Timeout;

    const checkJobStatus = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();

        if (res.ok) {
          if (data.status === 'success') {
            setStatus('success');
            setJobId(null);
            if (onComplete) onComplete();
            // Reset to idle after 3s
            timer = setTimeout(() => setStatus('idle'), 3000);
          } else if (data.status === 'failed') {
            setStatus('failed');
            setErrorMsg(data.error || 'Job failed in background');
            setJobId(null);
          } else {
            // Keep polling
            setStatus(data.status);
            timer = setTimeout(checkJobStatus, 1500);
          }
        } else {
          setStatus('failed');
          setErrorMsg('Error checking job progress');
          setJobId(null);
        }
      } catch (err) {
        console.error('Check job status error:', err);
        setStatus('failed');
        setErrorMsg('Network error checking job progress');
        setJobId(null);
      }
    };

    timer = setTimeout(checkJobStatus, 1500);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [jobId, status, marketId, onComplete]);

  return (
    <div className="flex flex-col gap-1 items-end">
      <button
        onClick={startRefresh}
        disabled={status === 'queued' || status === 'running'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 shadow-sm ${
          status === 'queued' || status === 'running'
            ? 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
            : status === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : status === 'failed'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 active:scale-95'
        }`}
      >
        {status === 'queued' || status === 'running' ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Analyzing News...</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Refreshed</span>
          </>
        ) : status === 'failed' ? (
          <>
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Retry Sync</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync News & Sentiment</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span className="text-[10px] text-rose-500 font-medium">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
