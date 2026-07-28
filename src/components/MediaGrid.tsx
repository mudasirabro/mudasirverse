import React from 'react';
import { MediaCard } from './MediaCard';
import { MediaItem } from '../types';
import { Film, RefreshCw } from 'lucide-react';

interface MediaGridProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onOpenTrailer: (youtubeId: string, title: string) => void;
  isInWatchlist: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  onSelectMedia,
  onOpenTrailer,
  isInWatchlist,
  toggleWatchlist,
  isLoading,
  onResetFilters
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] bg-zinc-900 rounded-2xl animate-pulse border border-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 px-4 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl my-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500">
          <Film className="w-8 h-8 text-rose-500/60" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Titles Found</h3>
        <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
          We couldn't find any movies or TV series matching your current filter criteria or search query.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-rose-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6" id="media-grid">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onSelect={onSelectMedia}
          onOpenTrailer={onOpenTrailer}
          isInWatchlist={isInWatchlist(item.id)}
          toggleWatchlist={toggleWatchlist}
          matchScore={item.matchScore}
        />
      ))}
    </div>
  );
};
