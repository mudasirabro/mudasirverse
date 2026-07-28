import { MediaItem } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get API Key safely from Vite environment or process environment
const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.TMDB_API_KEY) {
    return process.env.TMDB_API_KEY;
  }
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv.VITE_TMDB_API_KEY) {
    return metaEnv.VITE_TMDB_API_KEY as string;
  }
  if (metaEnv && metaEnv.TMDB_API_KEY) {
    return metaEnv.TMDB_API_KEY as string;
  }
  return 'f06852c78364a22b2f9768da1bba0aa3';
};

// Helper to map TMDB genre IDs to standard names
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export const formatTmdbPoster = (posterPath: string | null): string => {
  if (!posterPath) return 'https://picsum.photos/500/750';
  if (posterPath.startsWith('http')) return posterPath;
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
};

export const formatTmdbBackdrop = (backdropPath: string | null): string => {
  if (!backdropPath) return 'https://picsum.photos/1280/720';
  if (backdropPath.startsWith('http')) return backdropPath;
  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
};

export async function searchMovie(query: string): Promise<MediaItem[]> {
  const apiKey = getApiKey();
  if (!query || query.trim().length < 2) return [];

  if (!apiKey) {
    console.warn('TMDB_API_KEY not set. Using fallback search...');
    return [];
  }

  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      id: `tmdb_m_${item.id}`,
      title: item.title,
      type: 'movie' as const,
      posterUrl: formatTmdbPoster(item.poster_path),
      backdropUrl: formatTmdbBackdrop(item.backdrop_path || item.poster_path),
      overview: item.overview || `Movie release: ${item.title}`,
      tagline: 'Popular Cinema',
      releaseYear: item.release_date ? new Date(item.release_date).getFullYear() : 2024,
      rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 7.5,
      voteCount: item.vote_count || 1000,
      genres: item.genre_ids ? item.genre_ids.map((id: number) => GENRE_MAP[id] || 'Drama').filter(Boolean) : ['Drama'],
      duration: '2h 10m',
      ageRating: 'PG-13',
      director: 'Featured Director',
      cast: [],
      trailerYoutubeId: 'YoHD9XEInc0',
      streamingPlatforms: ['Netflix', 'Prime Video'],
      trending: item.popularity > 50
    }));
  } catch (err) {
    console.error('Error in TMDB searchMovie:', err);
    return [];
  }
}

export async function searchSeries(query: string): Promise<MediaItem[]> {
  const apiKey = getApiKey();
  if (!query || query.trim().length < 2) return [];

  if (!apiKey) {
    return [];
  }

  try {
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results.map((item: any) => ({
      id: `tmdb_s_${item.id}`,
      title: item.name,
      type: 'series' as const,
      posterUrl: formatTmdbPoster(item.poster_path),
      backdropUrl: formatTmdbBackdrop(item.backdrop_path || item.poster_path),
      overview: item.overview || `TV Series release: ${item.name}`,
      tagline: 'Featured TV Show',
      releaseYear: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 2024,
      rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 7.8,
      voteCount: item.vote_count || 800,
      genres: item.genre_ids ? item.genre_ids.map((id: number) => GENRE_MAP[id] || 'Drama').filter(Boolean) : ['Drama'],
      duration: 'Ongoing Series',
      ageRating: 'TV-MA',
      creator: 'TV Creator',
      cast: [],
      trailerYoutubeId: 'xEQP4VVuyrY',
      streamingPlatforms: ['HBO Max', 'Disney+'],
      trending: item.popularity > 40
    }));
  } catch (err) {
    console.error('Error in TMDB searchSeries:', err);
    return [];
  }
}

export async function getMovieDetails(id: string | number): Promise<MediaItem | null> {
  const apiKey = getApiKey();
  const tmdbId = String(id).replace('tmdb_m_', '');
  if (!apiKey) return null;

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${apiKey}&append_to_response=credits,videos`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const item = await res.json();
    const directorObj = item.credits?.crew?.find((c: any) => c.job === 'Director');
    const castList = (item.credits?.cast || []).slice(0, 6).map((c: any) => ({
      id: `c_${c.id}`,
      name: c.name,
      role: c.character || 'Actor',
      avatar: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'https://picsum.photos/200/200'
    }));

    const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || 'YoHD9XEInc0';

    return {
      id: `tmdb_m_${item.id}`,
      title: item.title,
      type: 'movie',
      posterUrl: formatTmdbPoster(item.poster_path),
      backdropUrl: formatTmdbBackdrop(item.backdrop_path),
      overview: item.overview || '',
      tagline: item.tagline || 'Popular Motion Picture',
      releaseYear: item.release_date ? new Date(item.release_date).getFullYear() : 2024,
      rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 8.0,
      voteCount: item.vote_count || 1000,
      genres: item.genres ? item.genres.map((g: any) => g.name) : ['Drama'],
      duration: item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '2h 00m',
      ageRating: item.adult ? 'R' : 'PG-13',
      director: directorObj?.name || 'Filmmaker',
      cast: castList,
      trailerYoutubeId: trailer,
      streamingPlatforms: ['Netflix', 'Prime Video', 'HBO Max'],
      trending: true
    };
  } catch (err) {
    console.error('Error fetching TMDB movie details:', err);
    return null;
  }
}

export async function getSeriesDetails(id: string | number): Promise<MediaItem | null> {
  const apiKey = getApiKey();
  const tmdbId = String(id).replace('tmdb_s_', '');
  if (!apiKey) return null;

  try {
    const url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${apiKey}&append_to_response=credits,videos`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const item = await res.json();
    const castList = (item.credits?.cast || []).slice(0, 6).map((c: any) => ({
      id: `c_${c.id}`,
      name: c.name,
      role: c.character || 'Actor',
      avatar: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'https://picsum.photos/200/200'
    }));

    const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || 'xEQP4VVuyrY';

    return {
      id: `tmdb_s_${item.id}`,
      title: item.name,
      type: 'series',
      posterUrl: formatTmdbPoster(item.poster_path),
      backdropUrl: formatTmdbBackdrop(item.backdrop_path),
      overview: item.overview || '',
      tagline: item.tagline || 'Popular TV Series',
      releaseYear: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 2024,
      rating: item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 8.1,
      voteCount: item.vote_count || 1000,
      genres: item.genres ? item.genres.map((g: any) => g.name) : ['Drama'],
      duration: `${item.number_of_seasons || 1} Season${(item.number_of_seasons || 1) > 1 ? 's' : ''}`,
      ageRating: 'TV-MA',
      creator: item.created_by?.[0]?.name || 'Creator',
      cast: castList,
      trailerYoutubeId: trailer,
      streamingPlatforms: ['HBO Max', 'Netflix', 'Apple TV+'],
      trending: true
    };
  } catch (err) {
    console.error('Error fetching TMDB series details:', err);
    return null;
  }
}
