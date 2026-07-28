import React, { useState } from 'react';
import { Filter, SlidersHorizontal, RotateCcw, Star, Tv, Film, MonitorPlay, Calendar, ArrowUpDown } from 'lucide-react';
import { FilterOptions, StreamingPlatform } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  allGenres: string[];
  totalResults: number;
}

const PLATFORMS: StreamingPlatform[] = [
  'Netflix',
  'Prime Video',
  'HBO Max',
  'Disney+',
  'Apple TV+',
  'Hulu',
  'Paramount+'
];

const REQUIRED_GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
  'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  allGenres,
  totalResults
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Combine provided allGenres with REQUIRED_GENRES and deduplicate
  const combinedGenres = Array.from(new Set([...allGenres, ...REQUIRED_GENRES])).sort();

  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      genre: 'all',
      yearRange: [1980, 2026],
      minRating: 0,
      sortBy: 'popularity',
      platform: 'all'
    });
  };

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.genre !== 'all' ||
    filters.minRating > 0 ||
    filters.platform !== 'all' ||
    filters.sortBy !== 'popularity' ||
    filters.yearRange[0] > 1980 ||
    filters.yearRange[1] < 2026;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl space-y-4" id="filter-bar-container">
      
      {/* Top Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Type Toggle Tabs (All, Movies, TV Series) */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800" id="filter-type-tabs">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, type: 'all' }))}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.type === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Titles
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, type: 'movie' }))}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.type === 'movie'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Movies
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, type: 'series' }))}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.type === 'series'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            TV Series
          </button>
        </div>

        {/* Quick Genre Select & Sort By */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Genre Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Genre:</span>
            <select
              value={filters.genre}
              onChange={(e) => setFilters((prev) => ({ ...prev, genre: e.target.value }))}
              className="bg-zinc-950 text-zinc-200 text-xs font-medium px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">All Genres</option>
              {combinedGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-zinc-950 text-zinc-200 text-xs font-medium px-3 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="year">Newest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showAdvanced || hasActiveFilters
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-rose-400 bg-zinc-950 border border-zinc-800 hover:border-rose-500/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
          
          {/* Minimum Rating */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Minimum Audience Rating
              </span>
              <span className="text-amber-400 font-bold">{filters.minRating > 0 ? `${filters.minRating}+ Stars` : 'Any'}</span>
            </label>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={filters.minRating}
              onChange={(e) => setFilters((prev) => ({ ...prev, minRating: parseFloat(e.target.value) }))}
              className="w-full accent-rose-500 cursor-pointer bg-zinc-800 h-2 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Any</span>
              <span>7.0+</span>
              <span>8.0+</span>
              <span>9.0+</span>
            </div>
          </div>

          {/* Streaming Platform */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <MonitorPlay className="w-3.5 h-3.5 text-rose-400" />
              Streaming Service
            </label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters((prev) => ({ ...prev, platform: e.target.value }))}
              className="w-full bg-zinc-950 text-zinc-200 text-xs font-medium p-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">All Services</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Release Era
              </span>
              <span className="text-zinc-400 font-medium text-xs">
                {filters.yearRange[0]} - {filters.yearRange[1]}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={filters.yearRange[0]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    yearRange: [parseInt(e.target.value, 10), prev.yearRange[1]]
                  }))
                }
                className="w-full bg-zinc-950 text-zinc-200 text-xs p-2 rounded-xl border border-zinc-800"
              >
                <option value={1900}>1900s or earlier</option>
                <option value={1980}>1980s</option>
                <option value={2000}>2000s</option>
                <option value={2010}>2010s</option>
                <option value={2020}>2020s</option>
              </select>
              <span className="text-zinc-500 text-xs">to</span>
              <select
                value={filters.yearRange[1]}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    yearRange: [prev.yearRange[0], parseInt(e.target.value, 10)]
                  }))
                }
                className="w-full bg-zinc-950 text-zinc-200 text-xs p-2 rounded-xl border border-zinc-800"
              >
                <option value={2026}>Current (2026)</option>
                <option value={2023}>2023</option>
                <option value={2020}>2020</option>
                <option value={2015}>2015</option>
              </select>
            </div>
          </div>

        </div>
      )}

      {/* Results counter & active filter tags */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
        <span>
          Found <strong className="text-white font-bold">{totalResults}</strong> titles
        </span>

        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.type !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] capitalize">
                {filters.type}s
              </span>
            )}
            {filters.genre !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px]">
                Genre: {filters.genre}
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                {filters.minRating}+ Stars
              </span>
            )}
            {filters.platform !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                {filters.platform}
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
