import { MediaItem } from '../types';

export async function fetchRealtimeMoviesAndSeries(query: string): Promise<MediaItem[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();
  const results: MediaItem[] = [];

  try {
    // 1. Fetch Movies from iTunes Search API (Free public API with high-res artwork)
    const itunesMovieUrl = `https://itunes.apple.com/search?media=movie&term=${encodeURIComponent(cleanQuery)}&limit=10`;
    const itunesRes = await fetch(itunesMovieUrl);
    if (itunesRes.ok) {
      const data = await itunesRes.json();
      if (Array.isArray(data.results)) {
        data.results.forEach((item: any, idx: number) => {
          if (!item.trackName) return;

          // Convert low-res 100x100 artwork to ultra HD 800x800 poster artwork
          const poster = item.artworkUrl100
            ? item.artworkUrl100.replace('100x100bb', '800x800bb')
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';

          const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024;
          const genre = item.primaryGenreName || 'Drama';

          results.push({
            id: `rt_itunes_${item.trackId || idx}_${Date.now()}`,
            title: item.trackName,
            type: 'movie',
            posterUrl: poster,
            backdropUrl: poster, // High res cover as backdrop fallback
            overview: item.longDescription || item.shortDescription || `A featured motion picture "${item.trackName}".`,
            tagline: item.collectionName || 'Official Release',
            releaseYear,
            rating: item.contentAdvisoryRating === 'R' ? 8.4 : 8.1,
            voteCount: Math.floor(Math.random() * 50000) + 10000,
            genres: [genre, 'Cinema'],
            duration: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}m` : '2h',
            ageRating: item.contentAdvisoryRating || 'PG-13',
            director: item.artistName || 'Renowned Director',
            cast: [],
            trailerYoutubeId: 'YoHD9XEInc0',
            streamingPlatforms: ['Apple TV+', 'Prime Video'],
            trending: idx < 3
          });
        });
      }
    }
  } catch (err) {
    console.error('iTunes Movie API Fetch Error:', err);
  }

  try {
    // 2. Fetch TV Series from TVmaze API (Free public API with real poster images)
    const tvmazeUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanQuery)}`;
    const tvRes = await fetch(tvmazeUrl);
    if (tvRes.ok) {
      const tvData = await tvRes.json();
      if (Array.isArray(tvData)) {
        tvData.slice(0, 8).forEach((item: any) => {
          const show = item.show;
          if (!show || !show.name) return;

          const poster = show.image?.original || show.image?.medium || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop';
          const cleanOverview = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : `Official TV series "${show.name}".`;
          const releaseYear = show.premiered ? new Date(show.premiered).getFullYear() : 2023;

          results.push({
            id: `rt_tvmaze_${show.id}_${Date.now()}`,
            title: show.name,
            type: 'series',
            posterUrl: poster,
            backdropUrl: poster,
            overview: cleanOverview,
            tagline: show.network?.name ? `On ${show.network.name}` : 'Popular TV Show',
            releaseYear,
            rating: show.rating?.average ? parseFloat(show.rating.average.toFixed(1)) : 8.2,
            voteCount: Math.floor(Math.random() * 40000) + 12000,
            genres: show.genres?.length ? show.genres : ['Drama', 'Series'],
            duration: show.status === 'Ended' ? 'Completed' : 'Ongoing Series',
            ageRating: 'TV-MA',
            creator: show.network?.name || 'TV Network',
            cast: [],
            trailerYoutubeId: 'xEQP4VVuyrY',
            streamingPlatforms: [show.network?.name || 'HBO Max', 'Netflix'],
            trending: true
          });
        });
      }
    }
  } catch (err) {
    console.error('TVmaze API Fetch Error:', err);
  }

  return results;
}
