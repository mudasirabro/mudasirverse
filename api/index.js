// api/index.js
import express from 'express';

const app = express();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API is working!'
  });
});

// Movies endpoint
app.get('/api/media', async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.json({ 
        total: 0, 
        items: [], 
        error: 'TMDB_API_KEY not set on Vercel' 
      });
    }

    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(url);
    const data = await response.json();

    const items = (data.results || []).map(movie => ({
      id: `tmdb_m_${movie.id}`,
      title: movie.title,
      type: 'movie',
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '',
      overview: movie.overview || '',
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : 2024,
      rating: movie.vote_average || 0,
      voteCount: movie.vote_count || 0,
      genres: ['Popular'],
      duration: '2h 00m',
      ageRating: 'PG-13',
      director: 'Various',
      cast: [],
      trailerYoutubeId: 'YoHD9XEInc0',
      streamingPlatforms: ['Netflix', 'Prime Video', 'HBO Max'],
      trending: true,
    }));

    res.json({ total: items.length, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies', details: String(error) });
  }
});

// TV Series endpoint
app.get('/api/tv/popular', async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.json({ total: 0, items: [], error: 'TMDB_API_KEY not set' });
    }

    const url = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=1`;
    const response = await fetch(url);
    const data = await response.json();

    const items = (data.results || []).map(show => ({
      id: `tmdb_s_${show.id}`,
      title: show.name,
      type: 'series',
      posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '',
      backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : '',
      overview: show.overview || '',
      releaseYear: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 2024,
      rating: show.vote_average || 0,
      voteCount: show.vote_count || 0,
      genres: ['Popular'],
      duration: 'Multi-Season',
      ageRating: 'TV-MA',
      creator: 'Various',
      cast: [],
      trailerYoutubeId: 'xEQP4VVuyrY',
      streamingPlatforms: ['Netflix', 'Prime Video', 'HBO Max'],
      trending: true,
    }));

    res.json({ total: items.length, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV shows', details: String(error) });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json({ results: [], total: 0 });
  }

  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.json({ results: [], total: 0, error: 'TMDB_API_KEY not set' });
    }

    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;
    const response = await fetch(url);
    const data = await response.json();

    const results = (data.results || []).slice(0, 10).map(item => ({
      id: `tmdb_${item.media_type}_${item.id}`,
      title: item.title || item.name,
      type: item.media_type === 'movie' ? 'movie' : 'series',
      posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
      overview: item.overview || '',
      releaseYear: item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 2024,
      rating: item.vote_average || 0,
    }));

    res.json({ results, total: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: String(error) });
  }
});

// Catch-all for API routes
app.get('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

export default app;