import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Star, Info, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';

interface HeroBannerProps {
  items: MediaItem[];
  onSelectMedia: (item: MediaItem) => void;
  onOpenTrailer: (youtubeId: string, title: string) => void;
  isInWatchlist: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  items,
  onSelectMedia,
  onOpenTrailer,
  isInWatchlist,
  toggleWatchlist
}) => {
  const featuredItems = items.filter((m) => m.featured || m.rating >= 8.7).slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  if (featuredItems.length === 0) return null;

  const current = featuredItems[currentIndex];
  const inWatchlist = isInWatchlist(current.id);

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[620px] overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl mb-8 group" id="hero-banner">
      {/* Background Image with Cinematic Gradient Overlay */}
      <div className="absolute inset-0">
        <img
          src={current.backdropUrl}
          alt={current.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://picsum.photos/1280/720';
          }}
          className="w-full h-full object-cover object-center transition-all duration-1000 transform scale-105 group-hover:scale-100 filter brightness-90"
        />
        {/* Multilayer Gradients for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-full md:w-3/4"></div>
      </div>

      {/* Hero Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-12 pt-20">
        <div className="max-w-2xl space-y-4">
          
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-md bg-rose-600/90 text-white font-bold tracking-wider uppercase text-[11px] shadow-sm">
              Featured {current.type}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900/80 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {current.rating}
              <span className="text-zinc-400 font-normal">({(current.voteCount / 1000).toFixed(0)}k votes)</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900/80 text-zinc-300 border border-zinc-700/50">
              {current.releaseYear}
            </span>
            {current.duration && (
              <span className="px-2.5 py-1 rounded-md bg-zinc-900/80 text-zinc-300 border border-zinc-700/50">
                {current.duration}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {current.ageRating}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {current.title}
          </h1>

          {/* Tagline */}
          {current.tagline && (
            <p className="text-rose-400/90 text-sm sm:text-base font-medium italic">
              "{current.tagline}"
            </p>
          )}

          {/* Genres */}
          <div className="flex flex-wrap gap-2 pt-1">
            {current.genres.map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-0.5 rounded-full text-xs bg-zinc-900/90 text-zinc-300 border border-zinc-800"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Overview */}
          <p className="text-zinc-300 text-sm sm:text-base line-clamp-3 leading-relaxed font-normal">
            {current.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              id="hero-play-trailer-btn"
              onClick={() => onOpenTrailer(current.trailerYoutubeId, current.title)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Trailer
            </button>

            <button
              id="hero-more-info-btn"
              onClick={() => onSelectMedia(current)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-semibold text-sm border border-zinc-700/80 transition-all hover:scale-105 active:scale-95"
            >
              <Info className="w-4 h-4 text-zinc-300" />
              Details
            </button>

            <button
              id="hero-watchlist-btn"
              onClick={() => toggleWatchlist(current.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                inWatchlist
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {inWatchlist ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-zinc-400" />
                  Add to Watchlist
                </>
              )}
            </button>
          </div>

          {/* Streaming Available On */}
          {current.streamingPlatforms.length > 0 && (
            <div className="pt-2 flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">Streaming on:</span>
              <div className="flex flex-wrap gap-1.5">
                {current.streamingPlatforms.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded bg-zinc-900/90 text-zinc-300 border border-zinc-800 text-[11px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Hero Carousel Navigation Controls */}
      {featuredItems.length > 1 && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length)}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700/60 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1.5 px-3">
            {featuredItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-rose-500' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredItems.length)}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700/60 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
