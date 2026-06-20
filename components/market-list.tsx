'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import MarketCard from './market-card';
import { Search, SlidersHorizontal, RefreshCw, Layers } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CATEGORIES = [
  { id: '', name: 'All Categories' },
  { id: 'Crypto', name: 'Crypto' },
  { id: 'Politics', name: 'Politics' },
  { id: 'Science', name: 'Science' },
  { id: 'Business', name: 'Business' },
  { id: 'Pop Culture', name: 'Pop Culture' },
];

const SORTS = [
  { id: 'volume', name: 'Highest Volume' },
  { id: 'liquidity', name: 'Highest Liquidity' },
  { id: 'endDate', name: 'Ends Soonest' },
  { id: 'updated', name: 'Recently Updated' },
];

export default function MarketList() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('volume');
  const [debouncedInput, setDebouncedInput] = useState('');

  // Handle simple debounce or trigger search on enter/submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedInput(q);
  };

  // Build query URL
  let queryUrl = `/api/markets?sort=${sort}`;
  if (category) queryUrl += `&category=${encodeURIComponent(category)}`;
  if (debouncedInput) queryUrl += `&q=${encodeURIComponent(debouncedInput)}`;

  const { data, error, isLoading, mutate, isValidating } = useSWR(queryUrl, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // auto check every minute
  });

  const handleClearFilters = () => {
    setQ('');
    setDebouncedInput('');
    setCategory('');
    setSort('volume');
  };

  const markets = data?.data || [];

  return (
    <div id="market-list-section" className="space-y-6">
      
      {/* Category selector capsules */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100" role="group" aria-label="Filter categories">
        <Layers className="h-4 w-4 text-slate-400 shrink-0 mr-1" aria-hidden="true" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={`px-3 py-1 text-xs font-semibold rounded-full border tracking-tight shrink-0 transition-all cursor-pointer ${
              category === cat.id
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Query Filters row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input block */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md" role="search">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            aria-label="Search prediction markets"
            placeholder="Search prediction markets..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              // Simple live backup search trigger
              if (e.target.value === '') {
                setDebouncedInput('');
              }
            }}
            className="w-full pl-10 pr-20 py-2 text-sm bg-white border border-slate-200 focus:border-slate-400 rounded-xl outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>

        {/* Sort select details */}
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 font-sans">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <label htmlFor="sort-markets">Sort By</label>
            <select
              id="sort-markets"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer font-sans"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white px-2.5 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
            title="Reload Markets list"
            aria-label="Reload Markets list"
          >
            <RefreshCw className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

      </div>

      {/* Skeletons & Content presentation */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200/60 rounded-xl h-[240px] animate-pulse p-5 flex flex-col justify-between">
              <div>
                <div className="h-3.5 bg-slate-200 rounded w-16 mb-4" />
                <div className="h-5 bg-slate-200 rounded w-full mb-2" />
                <div className="h-5 bg-slate-200 rounded w-4/5" />
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-8 rounded-xl text-center">
          <p className="font-semibold">Failed to fetch markets</p>
          <p className="text-xs opacity-85 mt-1">{error.message || 'Check your connections and database setup.'}</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      ) : markets.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-slate-50 p-12 text-center rounded-xl">
          <p className="text-slate-500 font-medium">No active markets matched your criteria.</p>
          {(q || category) && (
            <button
              onClick={handleClearFilters}
              className="mt-3 text-xs bg-slate-900 text-white font-semibold px-3 py-1.5 rounded-lg border border-slate-900 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((m: any) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </div>
  );
}
