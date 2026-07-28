import React, { useState } from 'react';
import { Sparkles, Send, Flame, Star, Brain, Compass, Clapperboard, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AIRecommendationItem, MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface AiMatchmakerSectionProps {
  onSelectMedia: (item: MediaItem) => void;
  onOpenTrailer: (youtubeId: string, title: string) => void;
  isInWatchlist: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
}

const MOOD_PRESETS = [
  { label: '🧠 Mind-Bending', prompt: 'Mind-bending plots with psychological twists and complex narratives' },
  { label: '🍿 Fast-Paced Action', prompt: 'High octane adrenaline filled action packed thriller' },
  { label: '🕯️ Dark & Moody', prompt: 'Atmospheric dark gritty suspenseful crime or noir' },
  { label: '🌌 Sci-Fi Cosmos', prompt: 'Futuristic space exploration, dystopian tech and outer space journey' },
  { label: '🎭 Emotional Drama', prompt: 'Deep emotional character-driven drama that touches the heart' },
  { label: '🤣 Comfort Comedy', prompt: 'Witty, hilarious feel-good comedy to relax and laugh out loud' },
  { label: '😱 Psychological Horror', prompt: 'Terrifying suspenseful horror with eerie atmosphere and chills' }
];

export const AiMatchmakerSection: React.FC<AiMatchmakerSectionProps> = ({
  onSelectMedia,
  onOpenTrailer,
  isInWatchlist,
  toggleWatchlist
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [preferredType, setPreferredType] = useState<'all' | 'movie' | 'series'>('all');
  const [pacing, setPacing] = useState<string>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AIRecommendationItem[] | null>(null);
  const [aiSource, setAiSource] = useState<string>('gemini');

  const handleSearch = async (overridePrompt?: string) => {
    const activePrompt = overridePrompt || promptInput || (selectedMood ? MOOD_PRESETS.find(m => m.label === selectedMood)?.prompt : '');
    if (!activePrompt) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/recommendations/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          preferredType,
          mood: selectedMood || undefined,
          pacing
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.recommendations || []);
        setAiSource(data.source || 'gemini');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-4" id="ai-matchmaker-hub">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-900/40 via-zinc-900 to-indigo-900/40 border border-purple-500/30 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            Gemini AI Powered Recommendation Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Find What to Watch <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300">By Vibe</span>
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            Tell MudasirVerse AI what you're craving in plain English—whether it's a specific plot trope, mood, or film combination—and receive tailored recommendations with personalized match breakdowns.
          </p>
        </div>

        {/* Ambient Decorative Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Prompt Search Controls Box */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        
        {/* Natural Language Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-rose-400" />
            Describe your ideal movie or series
          </label>
          <div className="relative flex items-center">
            <textarea
              id="ai-prompt-input"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              rows={2}
              placeholder="e.g., A dark atmospheric sci-fi thriller like Severance with corporate mystery and mind twists..."
              className="w-full bg-zinc-950 text-zinc-100 text-xs sm:text-sm p-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition-all placeholder:text-zinc-500 resize-none"
            />
          </div>
        </div>

        {/* Quick Mood Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Or Pick a Vibe / Mood
          </label>
          <div className="flex flex-wrap gap-2">
            {MOOD_PRESETS.map((mood) => (
              <button
                key={mood.label}
                onClick={() => {
                  setSelectedMood(mood.label);
                  setPromptInput(mood.prompt);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  selectedMood === mood.label || promptInput === mood.prompt
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Customizations (Format & Pacing) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
          <div>
            <label className="text-xs text-zinc-400 font-semibold block mb-1">Format Type</label>
            <div className="flex gap-2">
              {(['all', 'movie', 'series'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPreferredType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    preferredType === t
                      ? 'bg-zinc-800 text-white border-zinc-600 shadow'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-semibold block mb-1">Pacing Preference</label>
            <select
              value={pacing}
              onChange={(e) => setPacing(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 text-xs p-2 rounded-xl border border-zinc-800 focus:outline-none focus:border-purple-500"
            >
              <option value="fast">⚡ Fast-Paced / Action Heavy</option>
              <option value="balanced">⚖️ Balanced Storytelling</option>
              <option value="slowburn">🕯️ Slow Burn / Character Depth</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            id="ai-generate-btn"
            onClick={() => handleSearch()}
            disabled={isLoading || (!promptInput.trim() && !selectedMood)}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:from-purple-500 hover:via-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                Analyzing Cinematic Patterns & Generating AI Matches...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                Generate Smart AI Matches
              </>
            )}
          </button>
        </div>

      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300" id="ai-results-wrapper">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Top AI Matched Recommendations
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculated match scores & personalized reasoning based on Gemini model analysis
              </p>
            </div>

            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-900 text-purple-300 border border-zinc-800">
              Engine: {aiSource === 'gemini' ? 'Gemini 3.6 Flash' : 'Smart Catalog Logic'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((rec, idx) => {
              if (!rec.item) return null;
              const item = rec.item;

              return (
                <div
                  key={item.id + '_' + idx}
                  className="bg-zinc-900 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl overflow-hidden p-4 flex flex-col sm:flex-row gap-4 shadow-xl transition-all"
                >
                  {/* Poster Thumbnail */}
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    onClick={() => onSelectMedia(item)}
                    className="w-full sm:w-32 aspect-[2/3] object-cover rounded-xl border border-zinc-700/80 cursor-pointer hover:scale-105 transition-transform shrink-0"
                  />

                  {/* Info Column */}
                  <div className="flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded bg-purple-600/90 text-amber-300 font-black text-xs shadow flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          {rec.matchScore}% Match
                        </span>

                        <span className="text-xs font-bold text-amber-400">
                          ★ {item.rating}
                        </span>
                      </div>

                      <h4
                        onClick={() => onSelectMedia(item)}
                        className="text-lg font-bold text-white cursor-pointer hover:text-rose-400 transition-colors"
                      >
                        {item.title}
                      </h4>

                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {item.overview}
                      </p>
                    </div>

                    {/* AI Reasoning Note */}
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs text-purple-200">
                      <span className="font-bold text-amber-300 block text-[10px] uppercase mb-0.5">Why you'll love it:</span>
                      {rec.reasoning}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectMedia(item)}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onOpenTrailer(item.trailerYoutubeId, item.title)}
                        className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
                      >
                        Trailer
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
