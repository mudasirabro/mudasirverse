import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { FilterBar } from './components/FilterBar';
import { MediaGrid } from './components/MediaGrid';
import { MediaDetailModal } from './components/MediaDetailModal';
import { TrailerModal } from './components/TrailerModal';
import { AiMatchmakerSection } from './components/AiMatchmakerSection';
import { CustomListsView } from './components/CustomListsView';
import { useWatchlist } from './hooks/useWatchlist';
import { MediaItem, FilterOptions } from './types';
import { Flame, Sparkles, Film, Bookmark, Clapperboard, Award, Tv } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'ai' | 'trending' | 'watchlist' | 'lists'>('explore');
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item for modal details
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Trailer modal state
  const [activeTrailer, setActiveTrailer] = useState<{ youtubeId: string | null; title: string }>({
    youtubeId: null,
    title: ''
  });

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    genre: 'all',
    yearRange: [1980, 2026],
    minRating: 0,
    sortBy: 'popularity',
    platform: 'all'
  });

  // Watchlist & Lists hook
  const {
    watchlist,
    toggleWatchlist,
    isInWatchlist,
    customLists,
    createCustomList,
    deleteCustomList,
    removeFromList
  } = useWatchlist();

  // Load catalog & genres from API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [medRes, genRes] = await Promise.all([
          fetch('/api/media'),
          fetch('/api/genres')
        ]);

        if (medRes.ok) {
          const medData = await medRes.json();
          setCatalog(medData.items || []);
        }

        if (genRes.ok) {
          const genData = await genRes.json();
          setGenres(genData.genres || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Fetch real-time online data when searching
  useEffect(() => {
    if (!filters.search || filters.search.trim().length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/media?search=${encodeURIComponent(filters.search.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setCatalog((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = data.items.filter((i: MediaItem) => !existingIds.has(i.id));
              return [...prev, ...newItems];
            });
          }
        }
      } catch (err) {
        console.error('Realtime fetch effect error:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Filtered catalog calculation
  const displayedItems = useMemo(() => {
    let result = [...catalog];

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.overview.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.director?.toLowerCase().includes(q) ||
          m.cast.some((c) => c.name.toLowerCase().includes(q))
      );
    }

    // Type
    if (filters.type !== 'all') {
      result = result.filter((m) => m.type === filters.type);
    }

    // Genre
    if (filters.genre !== 'all') {
      result = result.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === filters.genre.toLowerCase())
      );
    }

    // Minimum Rating
    if (filters.minRating > 0) {
      result = result.filter((m) => m.rating >= filters.minRating);
    }

    // Platform
    if (filters.platform !== 'all') {
      result = result.filter((m) =>
        m.streamingPlatforms.some((p) => p.toLowerCase() === filters.platform.toLowerCase())
      );
    }

    // Release year
    result = result.filter(
      (m) => m.releaseYear >= filters.yearRange[0] && m.releaseYear <= filters.yearRange[1]
    );

    // Tab specific views
    if (activeTab === 'trending') {
      result = result.filter((m) => m.trending || m.rating >= 8.6);
    } else if (activeTab === 'watchlist') {
      result = result.filter((m) => watchlist.includes(m.id));
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'year') return b.releaseYear - a.releaseYear;
      if (filters.sortBy === 'title') return a.title.localeCompare(b.title);
      return b.voteCount - a.voteCount;
    });

    return result;
  }, [catalog, filters, activeTab, watchlist]);

  const handleOpenTrailer = (youtubeId: string, title: string) => {
    setActiveTrailer({ youtubeId, title });
  };

  const handleCloseTrailer = () => {
    setActiveTrailer({ youtubeId: null, title: '' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
        searchQuery={filters.search}
        setSearchQuery={(q) => setFilters((prev) => ({ ...prev, search: q }))}
        catalog={catalog}
        onSelectMedia={setSelectedMedia}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* VIEW 1: EXPLORE / CATALOG VIEW */}
        {activeTab === 'explore' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Hero Spotlight Banner */}
            {!filters.search && (
              <HeroBanner
                items={catalog}
                onSelectMedia={setSelectedMedia}
                onOpenTrailer={handleOpenTrailer}
                isInWatchlist={isInWatchlist}
                toggleWatchlist={toggleWatchlist}
              />
            )}

            {/* Filter & Search Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              allGenres={genres}
              totalResults={displayedItems.length}
            />

            {/* Media Items Grid */}
            <MediaGrid
              items={displayedItems}
              onSelectMedia={setSelectedMedia}
              onOpenTrailer={handleOpenTrailer}
              isInWatchlist={isInWatchlist}
              toggleWatchlist={toggleWatchlist}
              isLoading={isLoading}
              onResetFilters={() =>
                setFilters({
                  search: '',
                  type: 'all',
                  genre: 'all',
                  yearRange: [1980, 2026],
                  minRating: 0,
                  sortBy: 'popularity',
                  platform: 'all'
                })
              }
            />
          </div>
        )}

        {/* VIEW 2: AI MATCHMAKER HUB */}
        {activeTab === 'ai' && (
          <AiMatchmakerSection
            onSelectMedia={setSelectedMedia}
            onOpenTrailer={handleOpenTrailer}
            isInWatchlist={isInWatchlist}
            toggleWatchlist={toggleWatchlist}
          />
        )}

        {/* VIEW 3: TRENDING NOW */}
        {activeTab === 'trending' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-xl">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Flame className="w-6 h-6 text-amber-500 animate-bounce" />
                  Trending Movies & TV Series
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  The most searched and critically acclaimed titles across all streaming platforms
                </p>
              </div>
            </div>

            <MediaGrid
              items={displayedItems}
              onSelectMedia={setSelectedMedia}
              onOpenTrailer={handleOpenTrailer}
              isInWatchlist={isInWatchlist}
              toggleWatchlist={toggleWatchlist}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* VIEW 4: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-xl">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-emerald-400" />
                  My Watchlist
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Saved titles to watch next ({displayedItems.length} items)
                </p>
              </div>
            </div>

            <MediaGrid
              items={displayedItems}
              onSelectMedia={setSelectedMedia}
              onOpenTrailer={handleOpenTrailer}
              isInWatchlist={isInWatchlist}
              toggleWatchlist={toggleWatchlist}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* VIEW 5: CUSTOM CURATED LISTS */}
        {activeTab === 'lists' && (
          <CustomListsView
            customLists={customLists}
            createCustomList={createCustomList}
            deleteCustomList={deleteCustomList}
            removeFromList={removeFromList}
            catalog={catalog}
            onSelectMedia={setSelectedMedia}
            onOpenTrailer={handleOpenTrailer}
            isInWatchlist={isInWatchlist}
            toggleWatchlist={toggleWatchlist}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 px-4 text-center text-xs text-zinc-500 space-y-2 mt-12">
        <div className="flex items-center justify-center gap-2 text-zinc-400 font-semibold">
          <Film className="w-4 h-4 text-rose-500" />
          <span>MudasirVerse - Movies & Series Explorer</span>
        </div>
        <p>Real-Time Cinema Catalog • AI Matchmaker Powered by Google Gemini</p>
      </footer>

      {/* Media Detail Modal */}
      <MediaDetailModal
        item={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onOpenTrailer={handleOpenTrailer}
        isInWatchlist={isInWatchlist}
        toggleWatchlist={toggleWatchlist}
        onSelectMedia={setSelectedMedia}
        allCatalog={catalog}
      />

      {/* Interactive Trailer Player Modal */}
      <TrailerModal
        youtubeId={activeTrailer.youtubeId}
        title={activeTrailer.title}
        onClose={handleCloseTrailer}
      />

    </div>
  );
}
