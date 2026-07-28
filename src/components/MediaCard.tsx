import React, { useState } from 'react';
import { Star, Bookmark, Play, Info, Check, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onOpenTrailer: (youtubeId: string, title: string) => void;
  isInWatchlist: boolean;
  toggleWatchlist: (id: string) => void;
  matchScore?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onSelect,
  onOpenTrailer,
  isInWatchlist,
  toggleWatchlist,
  matchScore
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div
      id={`media-card-${item.id}`}
      className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-zinc-700/80 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {/* Loading Skeleton */}
        {isImageLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse z-0 flex items-center justify-center">
            <span className="text-zinc-700 text-xs font-semibold">Loading...</span>
          </div>
        )}

        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          onLoad={() => setIsImageLoading(false)}
          onError={(e) => {
            setIsImageLoading(false);
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/500/750`;
          }}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            isImageLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Top Badges (Type, Rating, Watchlist Toggle) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700/60 shadow">
            {item.type}
          </span>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {matchScore && (
              <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-amber-300 font-extrabold text-xs shadow flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {matchScore}%
              </span>
            )}

            <button
              id={`watchlist-btn-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(item.id);
              }}
              className={`p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
                isInWatchlist
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-zinc-950/70 hover:bg-zinc-900 text-zinc-300 border border-zinc-700/60 hover:text-white'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Hover Action Overlay */}
        <div 
          onClick={() => onSelect(item)}
          className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10"
        >
          <div className="space-y-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
              {item.overview}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTrailer(item.trailerYoutubeId, item.title);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Trailer
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item);
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="View Full Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Rating Floating Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-zinc-950/90 backdrop-blur-md text-amber-400 font-bold text-xs border border-zinc-800 flex items-center gap-1 shadow">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {item.rating}
        </div>
      </div>

      {/* Card Information Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2 bg-zinc-900">
        <div>
          <h3 
            onClick={() => onSelect(item)}
            className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-1"
          >
            {item.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-medium">
            <span>{item.releaseYear}</span>
            {item.duration && (
              <>
                <span>•</span>
                <span>{item.duration}</span>
              </>
            )}
            <span>•</span>
            <span className="text-zinc-500 font-normal">{item.ageRating}</span>
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1">
          {item.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium"
            >
              {g}
            </span>
          ))}
          {item.genres.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 text-zinc-500">
              +{item.genres.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
