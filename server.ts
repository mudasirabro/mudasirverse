import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_CATALOG, INITIAL_REVIEWS } from './src/data/mockCatalog';
import { MediaItem, Review, AIRecommendationRequest } from './src/types';

// ============================================================
// CREATE APP AT MODULE LEVEL (required for Vercel serverless)
// ============================================================
const app = express();

// In-memory database store
let catalog: MediaItem[] = [...INITIAL_CATALOG];
let reviews: Review[] = [...INITIAL_REVIEWS];

const TMDB_POSTER = (p: string) => `https://image.tmdb.org/t/p/w500${p.startsWith('/') ? p : `/${p}`}`;
const TMDB_BACKDROP = (p: string) => `https://image.tmdb.org/t/p/w1280${p.startsWith('/') ? p : `/${p}`}`;

// ============================================================
// Fetch trailer from TMDB
// ============================================================
async function fetchTmdbTrailer(tmdbId: number, type: 'movie' | 'series'): Promise<string | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();

    const trailer = data.results?.find((v: any) =>
      (v.type === 'Trailer' || v.type === 'Teaser') &&
      v.site === 'YouTube' &&
      v.official === true
    ) || data.results?.find((v: any) =>
      v.type === 'Trailer' && v.site === 'YouTube'
    );

    return trailer ? trailer.key : null;
  } catch (error) {
    console.error('TMDB trailer fetch error:', error);
    return null;
  }
}

// ============================================================
// Fetch trailer from YouTube (fallback)
// ============================================================
async function fetchYouTubeTrailer(title: string, year?: number): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const query = `${title} ${year || ''} official trailer`.trim();
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=video&maxResults=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    return data.items?.[0]?.id?.videoId || null;
  } catch (error) {
    console.error('YouTube fetch error:', error);
    return null;
  }
}

// ============================================================
// Enrich item with TMDB data AND trailer
// ============================================================
async function enrichItemFromTmdb(item: MediaItem): Promise<MediaItem> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return item;

  try {
    const match = await searchTmdbByTitle(item.title, item.type, item.releaseYear);
    if (!match) return item;

    if (match.posterPath) item.posterUrl = TMDB_POSTER(match.posterPath);
    if (match.backdropPath) item.backdropUrl = TMDB_BACKDROP(match.backdropPath);
    if (match.overview && match.overview.length > 20) item.overview = match.overview;

    const mediaType = item.type === 'movie' ? 'movie' : 'tv';
    const detailUrl = `https://api.themoviedb.org/3/${mediaType}/${match.tmdbId}?api_key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    if (detailRes.ok) {
      const detail: any = await detailRes.json();
      if (detail.genres?.length) {
        item.genres = detail.genres.map((g: any) => g.name);
      }
      if (detail.backdrop_path && !match.backdropPath) {
        item.backdropUrl = TMDB_BACKDROP(detail.backdrop_path);
      }
      if (detail.poster_path && !match.posterPath) {
        item.posterUrl = TMDB_POSTER(detail.poster_path);
      }
    }

    const trailerId = await fetchTmdbTrailer(match.tmdbId, item.type);
    if (trailerId) {
      item.trailerYoutubeId = trailerId;
    }
  } catch (err) {
    console.error(`Enrichment failed for "${item.title}":`, err);
  }

  return item;
}

// ============================================================
// Search TMDB by title
// ============================================================
async function searchTmdbByTitle(title: string, type: 'movie' | 'series', year?: number) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${apiKey}&query=${encodeURIComponent(title)}&include_adult=false${year ? `&year=${year}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data.results?.length) return null;

    const match = data.results.find((r: any) => {
      const t = (r.title || r.name || '').toLowerCase();
      return t === title.toLowerCase() || t.includes(title.toLowerCase()) || title.toLowerCase().includes(t);
    }) || data.results[0];

    return {
      tmdbId: match.id,
      title: match.title || match.name,
      posterPath: match.poster_path,
      backdropPath: match.backdrop_path,
      overview: match.overview,
      genres: [] as string[],
      rating: match.vote_average ? parseFloat(match.vote_average.toFixed(1)) : 8.0,
      releaseYear: match.release_date || match.first_air_date
        ? new Date(match.release_date || match.first_air_date).getFullYear()
        : year || 2024,
      type,
    };
  } catch {
    return null;
  }
}

// ============================================================
// Fetch TMDB similar/recommended titles
// ============================================================
async function fetchTmdbSimilar(tmdbId: number, type: 'movie' | 'series'): Promise<any[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  try {
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const endpoint = type === 'movie' ? 'recommendations' : 'similar';
    const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/${endpoint}?api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// ============================================================
// Convert TMDB result to MediaItem
// ============================================================
function tmdbResultToMediaItem(item: any, mediaType: 'movie' | 'tv'): MediaItem | null {
  const title = item.title || item.name;
  if (!title) return null;

  const type = mediaType === 'movie' ? 'movie' : 'series';
  const id = `tmdb_${mediaType === 'movie' ? 'm' : 's'}_${item.id}`;

  return {
    id,
    title,
    type,
    posterUrl: item.poster_path ? TMDB_POSTER(item.poster_path) : '',
    backdropUrl: item.backdrop_path ? TMDB_BACKDROP(item.backdrop_path) : (item.poster_path ? TMDB_POSTER(item.poster_path) : ''),
    overview: item.overview || `Discover "${title}" — a must-watch ${type}.`,
    tagline: 'TMDB Recommended',
    releaseYear: item.release_date || item.first_air_date
      ? new Date(item.release_date || item.first_air_date).getFullYear()
      : 2024,
    rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 7.5,
    voteCount: item.vote_count || 1000,
    genres: ['Recommended'],
    duration: type === 'movie' ? '2h 00m' : 'Multi-Season',
    ageRating: 'PG-13',
    director: 'Filmmaker',
    cast: [],
    trailerYoutubeId: 'YoHD9XEInc0',
    streamingPlatforms: ['Netflix', 'Prime Video'],
    trending: true,
  };
}

// ============================================================
// Background catalog image enrichment (local only)
// ============================================================
async function enrichCatalogInBackground() {
  if (!process.env.TMDB_API_KEY) {
    console.warn('TMDB_API_KEY not set — skipping image enrichment.');
    return;
  }

  console.log('Enriching catalog images from TMDB...');
  let enriched = 0;

  for (const item of catalog) {
    await enrichItemFromTmdb(item);
    enriched++;
    if (enriched % 10 === 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log(`Catalog enrichment complete — ${enriched} items processed.`);
}

// ============================================================
// Real-time TMDB Fetcher
// ============================================================
async function fetchTmdbMedia(query: string): Promise<MediaItem[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !query || query.trim().length < 2) return [];

  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query.trim())}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!Array.isArray(data.results)) return [];

    const fetchedItems: MediaItem[] = [];
    for (const item of data.results) {
      if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;
      const id = `tmdb_${item.media_type === 'movie' ? 'm' : 's'}_${item.id}`;
      const title = item.title || item.name;
      if (!title) continue;

      if (!catalog.some((m) => m.id === id || m.title.toLowerCase() === title.toLowerCase())) {
        const newItem: MediaItem = {
          id,
          title,
          type: item.media_type === 'movie' ? 'movie' : 'series',
          posterUrl: item.poster_path ? TMDB_POSTER(item.poster_path) : '',
          backdropUrl: item.backdrop_path ? TMDB_BACKDROP(item.backdrop_path) : (item.poster_path ? TMDB_POSTER(item.poster_path) : ''),
          overview: item.overview || `Featured ${item.media_type === 'movie' ? 'Movie' : 'TV Show'} "${title}".`,
          tagline: 'TMDB Featured',
          releaseYear: item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 2024,
          rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 8.0,
          voteCount: item.vote_count || 500,
          genres: ['Popular', item.media_type === 'movie' ? 'Movie' : 'Series'],
          duration: item.media_type === 'movie' ? '2h 00m' : 'Ongoing',
          ageRating: 'PG-13',
          director: 'Filmmaker',
          cast: [],
          trailerYoutubeId: 'YoHD9XEInc0',
          streamingPlatforms: ['Netflix', 'Prime Video'],
          trending: true
        };

        const trailerId = await fetchTmdbTrailer(item.id, item.media_type === 'movie' ? 'movie' : 'series');
        if (trailerId) {
          newItem.trailerYoutubeId = trailerId;
        }

        fetchedItems.push(newItem);
      }
    }
    if (fetchedItems.length > 0) {
      catalog.push(...fetchedItems);
    }
    return fetchedItems;
  } catch (err) {
    console.error('TMDB Search error in server:', err);
    return [];
  }
}

// ============================================================
// Real-time live movie and TV show fetcher
// ============================================================
async function fetchRealtimeMedia(query: string): Promise<MediaItem[]> {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = query.trim();
  const fetchedItems: MediaItem[] = [];

  try {
    const movieUrl = `https://itunes.apple.com/search?media=movie&term=${encodeURIComponent(cleanQuery)}&limit=8`;
    const res = await fetch(movieUrl);
    if (res.ok) {
      const data: any = await res.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          if (!item.trackName) continue;
          const poster = item.artworkUrl100
            ? item.artworkUrl100.replace('100x100bb', '800x800bb')
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
          const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024;
          const genre = item.primaryGenreName || 'Cinema';
          const id = `rt_m_${item.trackId || Date.now() + Math.random()}`;

          if (!catalog.some((m) => m.id === id || m.title.toLowerCase() === item.trackName.toLowerCase())) {
            const trailerId = await fetchYouTubeTrailer(item.trackName, releaseYear);

            const newItem: MediaItem = {
              id,
              title: item.trackName,
              type: 'movie',
              posterUrl: poster,
              backdropUrl: poster,
              overview: item.longDescription || item.shortDescription || `Realtime motion picture "${item.trackName}".`,
              tagline: item.collectionName || 'Featured Online',
              releaseYear,
              rating: item.contentAdvisoryRating === 'R' ? 8.5 : 8.2,
              voteCount: Math.floor(Math.random() * 50000) + 10000,
              genres: [genre, 'Featured'],
              duration: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}m` : '2h',
              ageRating: item.contentAdvisoryRating || 'PG-13',
              director: item.artistName || 'Filmmaker',
              cast: [],
              trailerYoutubeId: trailerId || 'dQw4w9WgXcQ',
              streamingPlatforms: ['Apple TV+', 'Prime Video'],
              trending: true
            };
            fetchedItems.push(newItem);
          }
        }
      }
    }
  } catch (err) {
    console.error('Realtime Movie Fetch error:', err);
  }

  try {
    const tvUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanQuery)}`;
    const tvRes = await fetch(tvUrl);
    if (tvRes.ok) {
      const tvData: any = await tvRes.json();
      if (Array.isArray(tvData)) {
        for (const item of tvData.slice(0, 6)) {
          const show = item.show;
          if (!show || !show.name) continue;
          const poster = show.image?.original || show.image?.medium || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop';
          const cleanOverview = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : `Realtime TV show "${show.name}".`;
          const releaseYear = show.premiered ? new Date(show.premiered).getFullYear() : 2023;
          const id = `rt_tv_${show.id}`;

          if (!catalog.some((m) => m.id === id || m.title.toLowerCase() === show.name.toLowerCase())) {
            const trailerId = await fetchYouTubeTrailer(show.name, releaseYear);

            const newItem: MediaItem = {
              id,
              title: show.name,
              type: 'series',
              posterUrl: poster,
              backdropUrl: poster,
              overview: cleanOverview,
              tagline: show.network?.name ? `Airing on ${show.network.name}` : 'Live TV Series',
              releaseYear,
              rating: show.rating?.average ? parseFloat(show.rating.average.toFixed(1)) : 8.3,
              voteCount: Math.floor(Math.random() * 40000) + 15000,
              genres: show.genres?.length ? show.genres : ['Drama', 'Series'],
              duration: 'Ongoing',
              ageRating: 'TV-MA',
              creator: show.network?.name || 'Network',
              cast: [],
              trailerYoutubeId: trailerId || 'dQw4w9WgXcQ',
              streamingPlatforms: ['Netflix', 'HBO Max'],
              trending: true
            };
            fetchedItems.push(newItem);
          }
        }
      }
    }
  } catch (err) {
    console.error('Realtime TV Fetch error:', err);
  }

  if (fetchedItems.length > 0) {
    catalog.push(...fetchedItems);
  }

  return fetchedItems;
}

// ============================================================
// Initialize Gemini Client safely
// ============================================================
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. AI features will fallback gracefully.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ============================================================
// MIDDLEWARE (registered at module level — works for Vercel)
// ============================================================
app.use(express.json());

// CORS headers for Vercel (allow frontend to call API)
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// ============================================================
// API ROUTES (all registered at module level)
// ============================================================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Genres
app.get('/api/genres', (_req: Request, res: Response) => {
  const genresSet = new Set<string>();
  catalog.forEach((item) => item.genres.forEach((g) => genresSet.add(g)));
  const genres = Array.from(genresSet).sort();
  res.json({ genres });
});

// Get Media List with filters & optional realtime API fetching
app.get('/api/media', async (req: Request, res: Response) => {
  const {
    search = '',
    type = 'all',
    genre = '',
    minRating = '0',
    sortBy = 'popularity',
    platform = '',
    trending = 'false',
    topRated = 'false',
    yearFrom,
    yearTo
  } = req.query;

  if (search && typeof search === 'string' && search.trim().length >= 2) {
    await fetchRealtimeMedia(search.trim());
  }

  let filtered = [...catalog];

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q) ||
        m.director?.toLowerCase().includes(q) ||
        m.cast.some((c) => c.name.toLowerCase().includes(q))
    );
  }

  if (type !== 'all') {
    filtered = filtered.filter((m) => m.type === type);
  }

  if (genre && typeof genre === 'string' && genre !== 'all') {
    filtered = filtered.filter((m) =>
      m.genres.some((g) => g.toLowerCase() === (genre as string).toLowerCase())
    );
  }

  const numRating = parseFloat(minRating as string);
  if (!isNaN(numRating) && numRating > 0) {
    filtered = filtered.filter((m) => m.rating >= numRating);
  }

  if (platform && typeof platform === 'string' && platform !== 'all') {
    filtered = filtered.filter((m) =>
      m.streamingPlatforms.some((p) => p.toLowerCase() === (platform as string).toLowerCase())
    );
  }

  if (trending === 'true') {
    filtered = filtered.filter((m) => m.trending);
  }
  if (topRated === 'true') {
    filtered = filtered.filter((m) => m.topRated || m.rating >= 8.7);
  }

  if (yearFrom) {
    const yFrom = parseInt(yearFrom as string, 10);
    if (!isNaN(yFrom)) filtered = filtered.filter((m) => m.releaseYear >= yFrom);
  }
  if (yearTo) {
    const yTo = parseInt(yearTo as string, 10);
    if (!isNaN(yTo)) filtered = filtered.filter((m) => m.releaseYear <= yTo);
  }

  filtered.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'year') return b.releaseYear - a.releaseYear;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return b.voteCount - a.voteCount;
  });

  res.json({
    total: filtered.length,
    items: filtered,
  });
});

// Search endpoint
app.get('/api/search', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    return res.json({ results: [], total: 0 });
  }

  if (process.env.TMDB_API_KEY) {
    await fetchTmdbMedia(q);
  } else {
    await fetchRealtimeMedia(q);
  }

  const lowerQ = q.toLowerCase();
  const results = catalog.filter((m) =>
    m.title.toLowerCase().includes(lowerQ) ||
    m.overview.toLowerCase().includes(lowerQ) ||
    m.director?.toLowerCase().includes(lowerQ) ||
    m.genres.some((g) => g.toLowerCase().includes(lowerQ)) ||
    m.cast.some((c) => c.name.toLowerCase().includes(lowerQ) || c.role.toLowerCase().includes(lowerQ))
  );

  res.json({ results, total: results.length });
});

// Real-time search
app.get('/api/realtime-search', async (req: Request, res: Response) => {
  const q = req.query.q;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query string required' });
  }
  try {
    const items = await fetchRealtimeMedia(q.trim());
    res.json({ query: q.trim(), count: items.length, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch realtime data' });
  }
});

// Get Media Detail with trailer
app.get('/api/media/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  let item = catalog.find((m) => m.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Media title not found.' });
  }

  if (item.trailerYoutubeId === 'YoHD9XEInc0' || item.trailerYoutubeId === 'xEQP4VVuyrY' || !item.trailerYoutubeId) {
    const apiKey = process.env.TMDB_API_KEY;
    if (apiKey) {
      const match = await searchTmdbByTitle(item.title, item.type, item.releaseYear);
      if (match) {
        const trailerId = await fetchTmdbTrailer(match.tmdbId, item.type);
        if (trailerId) {
          item.trailerYoutubeId = trailerId;
        }
      }
    }

    if (item.trailerYoutubeId === 'YoHD9XEInc0' || item.trailerYoutubeId === 'xEQP4VVuyrY') {
      const trailerId = await fetchYouTubeTrailer(item.title, item.releaseYear);
      if (trailerId) {
        item.trailerYoutubeId = trailerId;
      }
    }
  }

  res.json(item);
});

// Enrich media images
app.get('/api/media/:id/enrich-images', async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = catalog.find((m) => m.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Media not found.' });
  }

  const enriched = await enrichItemFromTmdb(item);
  res.json({
    posterUrl: enriched.posterUrl,
    backdropUrl: enriched.backdropUrl,
    genres: enriched.genres,
    trailerYoutubeId: enriched.trailerYoutubeId,
  });
});

// Get reviews
app.get('/api/reviews/:mediaId', (req: Request, res: Response) => {
  const { mediaId } = req.params;
  const itemReviews = reviews.filter((r) => r.mediaId === mediaId);
  res.json({ reviews: itemReviews });
});

// Add review
app.post('/api/reviews', (req: Request, res: Response) => {
  const { mediaId, userName, rating, content, containsSpoilers } = req.body;

  if (!mediaId || !userName || !rating || !content) {
    return res.status(400).json({ error: 'Missing required review fields.' });
  }

  const newReview: Review = {
    id: 'rev_' + Date.now(),
    mediaId,
    userName,
    userAvatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 1000)}?q=80&w=100&auto=format&fit=crop`,
    rating: parseFloat(rating),
    date: new Date().toISOString().split('T')[0],
    content,
    containsSpoilers: !!containsSpoilers,
    likesCount: 0,
  };

  reviews.unshift(newReview);

  const item = catalog.find((m) => m.id === mediaId);
  if (item) {
    const itemRevs = reviews.filter((r) => r.mediaId === mediaId);
    const avg = itemRevs.reduce((acc, r) => acc + r.rating, 0) / itemRevs.length;
    item.rating = parseFloat(avg.toFixed(1));
    item.voteCount += 1;
  }

  res.status(201).json(newReview);
});

// ============================================================
// AI Smart Recommendation Engine
// ============================================================
app.post('/api/recommendations/ai', async (req: Request, res: Response) => {
  const {
    prompt = '',
    preferredType = 'all',
    mood = 'any',
    favoriteGenres = [],
    pacing = 'balanced',
    favoriteTitle = ''
  }: AIRecommendationRequest = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    const fallbackList = catalog
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((item, idx) => ({
        mediaId: item.id,
        title: item.title,
        type: item.type,
        releaseYear: item.releaseYear,
        genres: item.genres,
        matchScore: 95 - idx * 3,
        reasoning: `Top-rated ${item.genres.join(', ')} title.`,
        keyHighlights: [item.tagline || 'Top Choice', `${item.rating}/10`],
        whereToWatch: item.streamingPlatforms.join(', '),
        item,
      }));
    return res.json({ recommendations: fallbackList, source: 'fallback' });
  }

  try {
    const userMessage = `The user is looking for movie/TV show recommendations based on these preferences:

${favoriteTitle ? `🔹 They LOVE this title: "${favoriteTitle}"` : ''}
${prompt ? `🔹 Their request: "${prompt}"` : ''}
${favoriteGenres.length > 0 ? `🔹 Favorite genres: ${favoriteGenres.join(', ')}` : ''}
${mood !== 'any' ? `🔹 Mood they want: ${mood}` : ''}
${preferredType !== 'all' ? `🔹 Type: ${preferredType}` : ''}
${pacing !== 'balanced' ? `🔹 Pacing: ${pacing}` : ''}

Based on ALL of the above, recommend 5 movies or TV series that would be a PERFECT MATCH.

For EACH recommendation, provide:
- title: The exact name
- type: "movie" or "series"
- releaseYear: The year it came out
- genres: Array of genres
- matchScore: 0-100 (how perfect it is for them)
- reasoning: 2-3 sentences EXPLAINING EXACTLY WHY this is a perfect match
- keyHighlights: 2-3 standout features
- whereToWatch: Where they can stream it
- overview: Brief plot summary
- rating: 0-10 score
- director: Who directed/created it
- cast: 3-4 main actors

IMPORTANT: 
- Return DIFFERENT recommendations for each request
- Don't repeat the same movies
- Base recommendations SPECIFICALLY on the user's input
- If they mention a specific movie, find SIMILAR titles in terms of tone, themes, genre`;

    const systemInstruction = `You are MudasirVerse's AI Movie Matcher - a specialized recommendation engine.

Your ONLY job is to recommend movies and TV shows that perfectly match user preferences.

RULES:
1. You know ALL movies and TV series ever made
2. Base recommendations on the user's SPECIFIC input
3. If they like "Squid Game", recommend Korean thrillers, survival dramas, etc.
4. If they like "The Notebook", recommend romance, period dramas, etc.
5. If they say "action comedy", recommend movies like that
6. NEVER give generic recommendations - always specific and personalized
7. Each request should get UNIQUE recommendations
8. Return EXACTLY 5 recommendations

Be specific, be diverse, be accurate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['movie', 'series'] },
                  releaseYear: { type: Type.INTEGER },
                  genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                  matchScore: { type: Type.INTEGER },
                  reasoning: { type: Type.STRING },
                  keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  whereToWatch: { type: Type.STRING },
                  overview: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  director: { type: Type.STRING },
                  cast: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'type', 'releaseYear', 'genres', 'matchScore', 'reasoning', 'keyHighlights', 'overview', 'rating'],
              },
            },
          },
          required: ['recommendations'],
        },
      },
    });

    const jsonText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse Gemini response:', jsonText);
      throw new Error('Invalid JSON response from Gemini');
    }

    let recommendations = await Promise.all((parsed.recommendations || []).map(async (rec: any) => {
      let existingItem = catalog.find(
        (m) => m.title.toLowerCase() === rec.title?.toLowerCase()
      );

      if (!existingItem) {
        const apiKey = process.env.TMDB_API_KEY;
        if (apiKey) {
          const mediaType = rec.type === 'series' ? 'series' : 'movie';
          const match = await searchTmdbByTitle(rec.title, mediaType, rec.releaseYear);

          if (match) {
            const posterUrl = match.posterPath ? TMDB_POSTER(match.posterPath) : '';
            const backdropUrl = match.backdropPath ? TMDB_BACKDROP(match.backdropPath) : posterUrl;
            const trailerId = await fetchTmdbTrailer(match.tmdbId, mediaType);

            const newItem: MediaItem = {
              id: `ai_${Date.now()}_${rec.title.replace(/\s/g, '_')}`,
              title: rec.title,
              type: rec.type === 'movie' ? 'movie' : 'series',
              posterUrl: posterUrl || '',
              backdropUrl: backdropUrl || posterUrl,
              overview: rec.overview || `Discover "${rec.title}" — a must-watch ${rec.type}.`,
              tagline: 'AI Recommended',
              releaseYear: rec.releaseYear || 2024,
              rating: rec.rating || 8.0,
              voteCount: Math.floor(Math.random() * 50000) + 10000,
              genres: rec.genres || ['Recommended'],
              duration: rec.type === 'movie' ? '2h 00m' : 'Multi-Season',
              ageRating: 'PG-13',
              director: rec.director || 'Filmmaker',
              cast: rec.cast?.map((name: string, idx: number) => ({
                id: `cast_${idx}`,
                name,
                role: 'Actor'
              })) || [],
              trailerYoutubeId: trailerId || 'YoHD9XEInc0',
              streamingPlatforms: rec.whereToWatch ? rec.whereToWatch.split(',').map((s: string) => s.trim()) : ['Netflix', 'Prime Video'],
              trending: true,
              topRated: rec.rating >= 8,
            };

            if (!catalog.some((m) => m.title.toLowerCase() === newItem.title.toLowerCase())) {
              catalog.push(newItem);
            }
            existingItem = newItem;
          }
        }
      }

      if (!existingItem) {
        existingItem = {
          id: `ai_${Date.now()}_${rec.title.replace(/\s/g, '_')}`,
          title: rec.title,
          type: rec.type === 'movie' ? 'movie' : 'series',
          posterUrl: '',
          backdropUrl: '',
          overview: rec.overview || `Discover "${rec.title}" — a must-watch ${rec.type}.`,
          tagline: 'AI Recommended',
          releaseYear: rec.releaseYear || 2024,
          rating: rec.rating || 8.0,
          voteCount: Math.floor(Math.random() * 50000) + 10000,
          genres: rec.genres || ['Recommended'],
          duration: rec.type === 'movie' ? '2h 00m' : 'Multi-Season',
          ageRating: 'PG-13',
          director: rec.director || 'Filmmaker',
          cast: rec.cast?.map((name: string, idx: number) => ({
            id: `cast_${idx}`,
            name,
            role: 'Actor'
          })) || [],
          trailerYoutubeId: 'YoHD9XEInc0',
          streamingPlatforms: rec.whereToWatch ? rec.whereToWatch.split(',').map((s: string) => s.trim()) : ['Netflix', 'Prime Video'],
          trending: true,
          topRated: rec.rating >= 8,
        };
        catalog.push(existingItem);
      }

      return {
        mediaId: existingItem.id,
        title: rec.title,
        type: rec.type || 'movie',
        releaseYear: rec.releaseYear || 2024,
        genres: rec.genres || [],
        matchScore: rec.matchScore || 90,
        reasoning: rec.reasoning || `Perfect match for your preferences.`,
        keyHighlights: rec.keyHighlights || ['AI Recommended', 'Top Match'],
        whereToWatch: rec.whereToWatch || existingItem.streamingPlatforms.join(', '),
        item: existingItem,
      };
    }));

    if (recommendations.length === 0) {
      const fallbackList = catalog
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map((item, idx) => ({
          mediaId: item.id,
          title: item.title,
          type: item.type,
          releaseYear: item.releaseYear,
          genres: item.genres,
          matchScore: 95 - idx * 3,
          reasoning: `Top-rated ${item.genres.join(', ')} title.`,
          keyHighlights: [item.tagline || 'Top Choice', `${item.rating}/10`],
          whereToWatch: item.streamingPlatforms.join(', '),
          item,
        }));
      return res.json({ recommendations: fallbackList, source: 'fallback' });
    }

    if (recommendations.length > 5) {
      recommendations = recommendations.slice(0, 5);
    }

    res.json({
      recommendations,
      source: 'gemini_unrestricted',
      requestContext: { prompt, favoriteTitle, mood, favoriteGenres }
    });

  } catch (err: any) {
    console.error('Error generating AI recommendations:', err);
    const fallbackList = catalog
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((item, idx) => ({
        mediaId: item.id,
        title: item.title,
        type: item.type,
        releaseYear: item.releaseYear,
        genres: item.genres,
        matchScore: 95 - idx * 3,
        reasoning: `Top-rated ${item.genres.join(', ')} title.`,
        keyHighlights: [item.tagline || 'Top Choice', `${item.rating}/10`],
        whereToWatch: item.streamingPlatforms.join(', '),
        item,
      }));
    res.json({ recommendations: fallbackList, source: 'fallback_error' });
  }
});

// Recommendations based on a favorite movie/series title
app.post('/api/recommendations/by-favorite', async (req: Request, res: Response) => {
  const { favoriteTitle, preferredType = 'all' } = req.body;

  if (!favoriteTitle || favoriteTitle.trim().length < 2) {
    return res.status(400).json({ error: 'Please provide a favorite movie or series title.' });
  }

  const title = favoriteTitle.trim();
  const apiKey = process.env.TMDB_API_KEY;

  let sourceItem = catalog.find((m) => m.title.toLowerCase() === title.toLowerCase());
  let sourceGenres: string[] = sourceItem?.genres || [];
  let sourceOverview = sourceItem?.overview || '';
  let tmdbId: number | null = null;
  let sourceType: 'movie' | 'series' = sourceItem?.type || 'movie';

  if (apiKey) {
    const movieMatch = await searchTmdbByTitle(title, 'movie');
    const seriesMatch = await searchTmdbByTitle(title, 'series');

    let bestMatch = movieMatch;
    if (seriesMatch) {
      const movieScore = movieMatch ? (movieMatch.title.toLowerCase() === title.toLowerCase() ? 2 : 1) : 0;
      const seriesScore = seriesMatch.title.toLowerCase() === title.toLowerCase() ? 2 : 1;
      if (seriesScore > movieScore) bestMatch = seriesMatch;
    }

    if (bestMatch) {
      tmdbId = bestMatch.tmdbId;
      sourceType = bestMatch.type;
      sourceGenres = bestMatch.genres.length ? bestMatch.genres : sourceGenres;
      sourceOverview = bestMatch.overview || sourceOverview;

      if (!sourceItem) {
        const newItem = tmdbResultToMediaItem(
          { id: bestMatch.tmdbId, title: bestMatch.title, poster_path: bestMatch.posterPath, backdrop_path: bestMatch.backdropPath, overview: bestMatch.overview, vote_average: bestMatch.rating, release_date: `${bestMatch.releaseYear}-01-01` },
          bestMatch.type === 'movie' ? 'movie' : 'tv'
        );
        if (newItem && !catalog.some((m) => m.id === newItem.id)) {
          catalog.push(newItem);
          sourceItem = newItem;
        }
      }
    }
  }

  const similarFromTmdb: MediaItem[] = [];
  if (tmdbId && apiKey) {
    const similarResults = await fetchTmdbSimilar(tmdbId, sourceType);
    for (const result of similarResults.slice(0, 15)) {
      const mediaType = sourceType === 'movie' ? 'movie' : 'tv';
      const newItem = tmdbResultToMediaItem(result, mediaType);
      if (newItem && !catalog.some((m) => m.id === newItem.id || m.title.toLowerCase() === newItem.title.toLowerCase())) {
        catalog.push(newItem);
        similarFromTmdb.push(newItem);
      } else if (newItem) {
        const existing = catalog.find((m) => m.title.toLowerCase() === newItem.title.toLowerCase());
        if (existing) similarFromTmdb.push(existing);
      }
    }
  }

  const scoreItem = (item: MediaItem): number => {
    if (item.title.toLowerCase() === title.toLowerCase()) return -1;
    if (preferredType !== 'all' && item.type !== preferredType) return -1;

    let score = item.rating * 5;
    const genreOverlap = item.genres.filter((g) =>
      sourceGenres.some((sg) => sg.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(sg.toLowerCase()))
    ).length;
    score += genreOverlap * 15;

    if (similarFromTmdb.some((s) => s.id === item.id)) score += 30;
    if (item.type === sourceType) score += 5;

    const overviewWords = sourceOverview.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const itemWords = item.overview.toLowerCase();
    const themeOverlap = overviewWords.filter((w) => itemWords.includes(w)).length;
    score += themeOverlap * 2;

    return score;
  };

  let candidates = catalog
    .map((item) => ({ item, score: scoreItem(item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (candidates.length < 5) {
    const extras = catalog
      .filter((m) => m.title.toLowerCase() !== title.toLowerCase() && !candidates.some((c) => c.item.id === m.id))
      .filter((m) => preferredType === 'all' || m.type === preferredType)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10 - candidates.length)
      .map((item) => ({ item, score: item.rating * 5 }));
    candidates = [...candidates, ...extras];
  }

  const ai = getGeminiClient();

  if (ai && candidates.length > 0) {
    try {
      const candidateSummary = candidates.slice(0, 15).map((c) => ({
        id: c.item.id,
        title: c.item.title,
        type: c.item.type,
        rating: c.item.rating,
        genres: c.item.genres.join(', '),
        overview: c.item.overview.slice(0, 200),
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `The user loves "${title}" (${sourceType}, genres: ${sourceGenres.join(', ')}).
Overview: "${sourceOverview.slice(0, 300)}"

Pick the 5 best matching titles from this list that someone who loves "${title}" would enjoy.
Explain WHY each matches in terms of tone, themes, genre, and storytelling style.

Candidates:
${JSON.stringify(candidateSummary)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER },
                    reasoning: { type: Type.STRING },
                    keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'matchScore', 'reasoning', 'keyHighlights'],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const enriched = (parsed.recommendations || []).map((rec: any) => {
        const matchedItem = catalog.find((m) => m.title.toLowerCase() === rec.title?.toLowerCase()) || candidates[0]?.item;
        return {
          mediaId: matchedItem.id,
          title: matchedItem.title,
          type: matchedItem.type,
          releaseYear: matchedItem.releaseYear,
          genres: matchedItem.genres,
          matchScore: rec.matchScore || Math.min(99, Math.floor(matchedItem.rating * 10 + 5)),
          reasoning: rec.reasoning || `Similar vibe and genre to "${title}".`,
          keyHighlights: rec.keyHighlights || [matchedItem.tagline || 'Recommended', `${matchedItem.rating}/10`],
          item: matchedItem,
        };
      });

      if (enriched.length > 0) {
        return res.json({
          recommendations: enriched.slice(0, 5),
          source: 'gemini',
          favoriteTitle: title,
          sourceGenres,
        });
      }
    } catch (err) {
      console.error('AI favorite matching error:', err);
    }
  }

  const fallbackMatches = candidates.slice(0, 5).map(({ item }, idx) => ({
    mediaId: item.id,
    title: item.title,
    type: item.type,
    releaseYear: item.releaseYear,
    genres: item.genres,
    matchScore: Math.min(99, 95 - idx * 4),
    reasoning: `Shares ${item.genres.filter((g) => sourceGenres.includes(g)).join(', ') || 'similar'} themes with "${title}". Rated ${item.rating}/10 by audiences.`,
    keyHighlights: [item.tagline || 'Great Match', `${item.rating}/10 Rating`],
    item,
  }));

  res.json({
    recommendations: fallbackMatches,
    source: apiKey ? 'genre_similarity' : 'catalog_fallback',
    favoriteTitle: title,
    sourceGenres,
  });
});

// AI Review Summary
app.post('/api/ai/review-summary', async (req: Request, res: Response) => {
  const { mediaId } = req.body;
  const item = catalog.find((m) => m.id === mediaId);
  if (!item) return res.status(404).json({ error: 'Media not found' });

  const itemReviews = reviews.filter((r) => r.mediaId === mediaId);
  const ai = getGeminiClient();

  if (!ai || itemReviews.length === 0) {
    return res.json({
      summary: `Audience feedback for "${item.title}" praises its engaging plot, stellar directorial execution, and immersive cinematography.`,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Summarize audience reviews for "${item.title}" in 2 concise, engaging sentences.
Reviews:
${itemReviews.map((r) => `- Rating: ${r.rating}/5. "${r.content}"`).join('\n')}`,
    });

    res.json({ summary: response.text || 'Overall positive audience sentiment.' });
  } catch (e) {
    res.json({
      summary: `Viewers celebrate "${item.title}" for its outstanding character arcs, memorable musical score, and visual depth.`,
    });
  }
});

// ============================================================
// STATIC FILE SERVING — only for local dev (Vercel uses CDN)
// ============================================================
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  // Only serve static files when running the compiled server locally (not on Vercel)
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ============================================================
// LOCAL DEV SERVER — only starts when run directly, not on Vercel
// ============================================================
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    const PORT = parseInt(process.env.PORT || '3000', 10);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎬 MudasirVerse running at http://localhost:${PORT}`);
      enrichCatalogInBackground();
    });
  })();
}

// ============================================================
// EXPORT FOR VERCEL SERVERLESS
// ============================================================
export default app;