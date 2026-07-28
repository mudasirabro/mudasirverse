import React, { useState, useEffect } from 'react';
import { 
  X, Star, Play, Bookmark, Check, Plus, MessageSquare, Sparkles, 
  Tv, Film, Eye, EyeOff, ThumbsUp, Send, Share2, Award, Calendar, Clock
} from 'lucide-react';
import { MediaItem, Review, Episode } from '../types';

interface MediaDetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onOpenTrailer: (youtubeId: string, title: string) => void;
  isInWatchlist: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
  onSelectMedia: (item: MediaItem) => void;
  allCatalog: MediaItem[];
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  onClose,
  onOpenTrailer,
  isInWatchlist,
  toggleWatchlist,
  onSelectMedia,
  allCatalog
}) => {
  if (!item) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'reviews'>('overview');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  // Review form state
  const [userRating, setUserRating] = useState<number>(5);
  const [userReviewText, setUserReviewText] = useState<string>('');
  const [userNameInput, setUserNameInput] = useState<string>('MovieBuff');
  const [hasSpoiler, setHasSpoiler] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch reviews & AI summary when modal opens
  useEffect(() => {
    let isMounted = true;

    async function loadReviewsAndSummary() {
      try {
        const revRes = await fetch(`/api/reviews/${item.id}`);
        if (revRes.ok) {
          const data = await revRes.json();
          if (isMounted) setReviewsList(data.reviews || []);
        }

        setIsSummaryLoading(true);
        const sumRes = await fetch('/api/ai/review-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId: item.id })
        });
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (isMounted) setReviewSummary(sumData.summary || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsSummaryLoading(false);
      }
    }

    loadReviewsAndSummary();

    return () => {
      isMounted = false;
    };
  }, [item.id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: item.id,
          userName: userNameInput.trim() || 'Anonymous',
          rating: userRating,
          content: userReviewText,
          containsSpoilers: hasSpoiler
        })
      });

      if (res.ok) {
        const newRev = await res.json();
        setReviewsList((prev) => [newRev, ...prev]);
        setUserReviewText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const inWatchlist = isInWatchlist(item.id);

  // Similar titles
  const similarTitles = allCatalog
    .filter(
      (m) =>
        m.id !== item.id &&
        (m.type === item.type || m.genres.some((g) => item.genres.includes(g)))
    )
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200" id="media-detail-modal">
      
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 backdrop-blur-md transition-all shadow-lg"
          id="modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner Header */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 shrink-0 overflow-hidden bg-zinc-900">
          <img
            src={item.backdropUrl}
            alt={item.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/1280/720';
            }}
            className="w-full h-full object-cover filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-full md:w-2/3"></div>

          {/* Header Overlay Info */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
            <div className="flex items-end gap-5">
              
              {/* Poster thumbnail */}
              <img
                src={item.posterUrl}
                alt={item.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/500/750';
                }}
                className="hidden sm:block w-28 md:w-36 aspect-[2/3] object-cover rounded-xl border-2 border-zinc-700/80 shadow-2xl shrink-0"
              />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-bold uppercase text-[10px]">
                    {item.type}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900/90 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {item.rating}
                  </span>
                  <span className="text-zinc-300 text-xs">{item.releaseYear}</span>
                  {item.duration && <span className="text-zinc-400 text-xs">• {item.duration}</span>}
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {item.ageRating}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {item.title}
                </h2>

                {item.tagline && (
                  <p className="text-rose-400/90 text-xs sm:text-sm italic">
                    "{item.tagline}"
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenTrailer(item.trailerYoutubeId, item.title)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Trailer
              </button>

              <button
                onClick={() => toggleWatchlist(item.id)}
                className={`p-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all border ${
                  inWatchlist
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {inWatchlist ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-6 flex items-center gap-6 text-sm font-semibold text-zinc-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-rose-500 text-white font-bold'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            Overview & Cast
          </button>

          {item.type === 'series' && item.seasons && item.seasons.length > 0 && (
            <button
              onClick={() => setActiveTab('episodes')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'episodes'
                  ? 'border-rose-500 text-white font-bold'
                  : 'border-transparent hover:text-zinc-200'
              }`}
            >
              <Tv className="w-4 h-4 text-purple-400" />
              Episodes ({item.seasons.length} Seasons)
            </button>
          )}

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-rose-500 text-white font-bold'
                : 'border-transparent hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            Reviews & Ratings ({reviewsList.length})
          </button>
        </div>

        {/* Modal Body Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Overview & Metadata Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-white">Storyline</h3>
                  <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                    {item.overview}
                  </p>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {item.genres.map((g) => (
                      <span key={g} className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Info Box */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3 text-xs text-zinc-300">
                  {item.director && (
                    <div>
                      <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Director</span>
                      <span className="text-white font-medium text-sm">{item.director}</span>
                    </div>
                  )}

                  {item.creator && (
                    <div>
                      <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Creator</span>
                      <span className="text-white font-medium text-sm">{item.creator}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Streaming On</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.streamingPlatforms.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-zinc-800 text-rose-300 font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block font-semibold uppercase text-[10px]">Release Year</span>
                    <span className="text-zinc-200">{item.releaseYear}</span>
                  </div>
                </div>

              </div>

              {/* AI Audience Sentiment Summary Box */}
              <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-800/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  AI Audience Sentiment Overview
                </div>
                {isSummaryLoading ? (
                  <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                ) : (
                  <p className="text-zinc-300 text-xs sm:text-sm italic leading-relaxed">
                    "{reviewSummary || `Audience feedback praises ${item.title} for its remarkable visual direction and storytelling.`}"
                  </p>
                )}
              </div>

              {/* Cast Carousel */}
              {item.cast && item.cast.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Top Cast</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {item.cast.map((actor) => (
                      <div key={actor.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                        <img
                          src={actor.avatar}
                          alt={actor.name}
                          className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{actor.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Titles */}
              {similarTitles.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-800/80">
                  <h3 className="text-lg font-bold text-white">More Like This</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {similarTitles.map((sim) => (
                      <div
                        key={sim.id}
                        onClick={() => onSelectMedia(sim)}
                        className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-rose-500/50 transition-all"
                      >
                        <div className="aspect-[2/3] overflow-hidden">
                          <img
                            src={sim.posterUrl}
                            alt={sim.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-zinc-200 line-clamp-1">{sim.title}</p>
                          <p className="text-[10px] text-zinc-400">★ {sim.rating} • {sim.releaseYear}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EPISODES (FOR SERIES) */}
          {activeTab === 'episodes' && item.seasons && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Season Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
                {item.seasons.map((season) => (
                  <button
                    key={season.seasonNumber}
                    onClick={() => setSelectedSeason(season.seasonNumber)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedSeason === season.seasonNumber
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    Season {season.seasonNumber} ({season.episodeCount} Episodes)
                  </button>
                ))}
              </div>

              {/* Episodes List */}
              {(() => {
                const curSeason = item.seasons.find((s) => s.seasonNumber === selectedSeason) || item.seasons[0];
                return (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400 italic">{curSeason.overview}</p>
                    <div className="space-y-3">
                      {(curSeason.episodes || []).map((ep) => (
                        <div
                          key={ep.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-rose-400 font-extrabold text-xs">
                                E{ep.episodeNumber}
                              </span>
                              <h4 className="text-sm font-bold text-white">{ep.title}</h4>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2">{ep.overview}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{ep.durationMinutes} mins</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* TAB 3: REVIEWS & USER RATINGS */}
          {activeTab === 'reviews' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Add Review Form */}
              <form onSubmit={handleAddReview} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Write a Review & Rating
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Your Name / Username</label>
                    <input
                      type="text"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                      placeholder="e.g. Cinephile99"
                      className="w-full bg-zinc-950 text-xs text-white p-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Rating (1 to 5 Stars)</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= userRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-zinc-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">{userRating} / 5</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Review Content</label>
                  <textarea
                    value={userReviewText}
                    onChange={(e) => setUserReviewText(e.target.value)}
                    rows={3}
                    placeholder="Share your thoughts on the acting, plot, visuals..."
                    className="w-full bg-zinc-950 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSpoiler}
                      onChange={(e) => setHasSpoiler(e.target.checked)}
                      className="accent-rose-500 rounded"
                    />
                    Contains Plot Spoilers
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingReview || !userReviewText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Review
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Community Reviews</h3>

                {reviewsList.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-4 text-center bg-zinc-900/40 rounded-xl">
                    No reviews yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  reviewsList.map((rev) => {
                    const isSpoilerRevealed = revealedSpoilers[rev.id];

                    return (
                      <div
                        key={rev.id}
                        className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'}
                              alt={rev.userName}
                              className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                            />
                            <div>
                              <p className="text-xs font-bold text-white">{rev.userName}</p>
                              <p className="text-[10px] text-zinc-500">{rev.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {rev.rating}/5
                          </div>
                        </div>

                        {rev.containsSpoilers && !isSpoilerRevealed ? (
                          <div className="p-3 bg-zinc-950 rounded-xl border border-rose-500/30 flex items-center justify-between text-xs">
                            <span className="text-rose-400 font-medium">⚠️ This review contains spoilers</span>
                            <button
                              onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [rev.id]: true }))}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Reveal
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-300 leading-relaxed">{rev.content}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
