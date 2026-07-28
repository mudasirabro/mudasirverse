export type MediaType = 'movie' | 'series';

export type StreamingPlatform = 
  | 'Netflix' 
  | 'Prime Video' 
  | 'HBO Max' 
  | 'Disney+' 
  | 'Apple TV+' 
  | 'Hulu' 
  | 'Paramount+'
  | 'Peacock'
  | 'BBC iPlayer';

export interface CastMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  overview: string;
  durationMinutes: number;
  stillPath?: string;
}

export interface Season {
  seasonNumber: number;
  title: string;
  episodeCount: number;
  overview: string;
  episodes?: Episode[];
}

export interface Review {
  id: string;
  mediaId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  content: string;
  containsSpoilers: boolean;
  likesCount: number;
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  posterUrl: string;
  backdropUrl: string;
  overview: string;
  tagline?: string;
  releaseYear: number;
  rating: number;
  voteCount: number;
  genres: string[];
  duration?: string;
  ageRating: string;
  director?: string;
  creator?: string;
  cast: CastMember[];
  trailerYoutubeId: string;
  streamingPlatforms: StreamingPlatform[];
  seasons?: Season[];
  trending?: boolean;
  featured?: boolean;
  topRated?: boolean;
  matchScore?: number;
}

export interface FilterOptions {
  search: string;
  type: 'all' | 'movie' | 'series';
  genre: string;
  yearRange: [number, number];
  minRating: number;
  sortBy: 'popularity' | 'rating' | 'year' | 'title';
  platform: string;
}

export interface AIRecommendationRequest {
  prompt?: string;
  preferredType?: 'all' | 'movie' | 'series';
  mood?: string;
  favoriteGenres?: string[];
  pacing?: string;
  favoriteTitle?: string;
}

export interface AIRecommendationItem {
  mediaId?: string;
  title: string;
  type: MediaType;
  releaseYear?: number;
  genres?: string[];
  matchScore: number;
  reasoning: string;
  keyHighlights: string[];
  item?: MediaItem;
}

export interface UserList {
  id: string;
  name: string;
  description: string;
  items: string[]; // media ids
  createdAt: string;
  color?: string;
}
