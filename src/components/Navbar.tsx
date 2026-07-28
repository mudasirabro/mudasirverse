import React, { useState, useEffect, useRef } from 'react';
import { Film, Sparkles, Bookmark, Search, Tv, Flame, ListPlus, X, Clapperboard, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';

interface NavbarProps {
  activeTab: 'explore' | 'ai' | 'trending' | 'watchlist' | 'lists';
  setActiveTab: (tab: 'explore' | 'ai' | 'trending' | 'watchlist' | 'lists') => void;
  watchlistCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  catalog: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  watchlistCount,
  searchQuery,
  setSearchQuery,
  catalog,
  onSelectMedia
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [apiResults, setApiResults] = useState<MediaItem[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  // 300ms Debounce effect on search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch from /api/search endpoint when debounced query changes
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setApiResults([]);
      setIsSearchingApi(false);
      return;
    }

    let isMounted = true;
    setIsSearchingApi(true);

    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data) => {
        if (isMounted) {
          setApiResults(data.results || []);
          setIsSearchingApi(false);
        }
      })
      .catch((err) => {
        console.error('Navbar search fetch error:', err);
        if (isMounted) setIsSearchingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Comprehensive local search across title, cast, director, genre, plot overview
  const lowerQ = debouncedQuery.toLowerCase().trim();
  const localMatches = lowerQ.length >= 2
    ? catalog.filter((item) =>
        item.title.toLowerCase().includes(lowerQ) ||
        item.genres.some((g) => g.toLowerCase().includes(lowerQ)) ||
        item.director?.toLowerCase().includes(lowerQ) ||
        item.overview.toLowerCase().includes(lowerQ) ||
        item.cast.some((c) => c.name.toLowerCase().includes(lowerQ) || c.role.toLowerCase().includes(lowerQ))
      )
    : [];

  // Merge local matches and API results, removing duplicates
  const searchSuggestionsMap = new Map<string, MediaItem>();
  localMatches.forEach((item) => searchSuggestionsMap.set(item.id, item));
  apiResults.forEach((item) => searchSuggestionsMap.set(item.id, item));
  const combinedSuggestions = Array.from(searchSuggestionsMap.values()).slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          id="navbar-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-rose-500 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              MudasirVerse
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-rose-400 tracking-wider ml-2 px-1.5 py-0.5 bg-rose-500/10 rounded border border-rose-500/20">
              HD
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60" id="navbar-nav-tabs">
          <button
            id="nav-tab-explore"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'explore'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Clapperboard className="w-4 h-4 text-rose-400" />
            Explore
          </button>

          <button
            id="nav-tab-ai"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            AI Matchmaker
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          </button>

          <button
            id="nav-tab-trending"
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            Trending
          </button>

          <button
            id="nav-tab-watchlist"
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'watchlist'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <Bookmark className="w-4 h-4 text-emerald-400" />
            Watchlist
            {watchlistCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-lists"
            onClick={() => setActiveTab('lists')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'lists'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            <ListPlus className="w-4 h-4 text-blue-400" />
            Custom Lists
          </button>
        </nav>

        {/* Header Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm" id="navbar-search-wrapper">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
            <input
              id="navbar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'explore') setActiveTab('explore');
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search title, cast, genre..."
              className="w-full bg-zinc-900 text-zinc-100 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/60 transition-all placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-white rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Auto-Suggest Dropdown */}
          {isSearchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
              {isSearchingApi && combinedSuggestions.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  Searching catalog...
                </div>
              )}

              {!isSearchingApi && combinedSuggestions.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400">
                  No results found for "<span className="text-zinc-200">{searchQuery}</span>"
                </div>
              )}

              {combinedSuggestions.map((item) => (
                <div
                  key={item.id}
                  onMouseDown={() => {
                    onSelectMedia(item);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3 p-2.5 hover:bg-zinc-800/80 cursor-pointer transition-colors"
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/500/750`;
                    }}
                    className="w-10 h-14 object-cover rounded-md border border-zinc-700/50 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span className="capitalize text-rose-400 font-medium">{item.type}</span>
                      <span>•</span>
                      <span className="bg-zinc-800 px-1.5 py-0.2 rounded text-[11px] text-zinc-300">{item.releaseYear}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">★ {item.rating}</span>
                    </div>
                    {item.genres && item.genres.length > 0 && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {item.genres.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Sticky Navigation Tabs */}
      <div className="md:hidden flex items-center justify-around bg-zinc-900/90 border-t border-zinc-800 px-2 py-2 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'explore' ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-400'
          }`}
        >
          <Clapperboard className="w-4 h-4 mb-0.5" />
          Explore
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'ai' ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-amber-400" />
          AI Match
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'trending' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'
          }`}
        >
          <Flame className="w-4 h-4 mb-0.5" />
          Trending
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'watchlist' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400'
          }`}
        >
          <Bookmark className="w-4 h-4 mb-0.5" />
          Watchlist ({watchlistCount})
        </button>
        <button
          onClick={() => setActiveTab('lists')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium whitespace-nowrap ${
            activeTab === 'lists' ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400'
          }`}
        >
          <ListPlus className="w-4 h-4 mb-0.5" />
          Lists
        </button>
      </div>
    </header>
  );
};
