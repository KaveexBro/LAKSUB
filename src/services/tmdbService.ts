const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.warn('VITE_TMDB_API_KEY is not set in environment variables.');
}
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Multi-tier caching helpers (In-Memory + SessionStorage)
const memoryCache = new Map<string, any>();
const inFlightRequests = new Map<string, Promise<any>>();

function getFromCache<T>(key: string): T | null {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }
  try {
    const raw = sessionStorage.getItem(`tmdb_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(key, parsed);
      return parsed as T;
    }
  } catch (e) {
    // Ignore storage quota or disabled storage
  }
  return null;
}

function setToCache(key: string, data: any): void {
  memoryCache.set(key, data);
  try {
    sessionStorage.setItem(`tmdb_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore storage quota errors
  }
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  overview: string;
  genre_ids: number[];
  original_language?: string;
  media_type?: 'movie' | 'tv' | 'person';
}

export const searchTMDB = async (query: string, type: 'movie' | 'tv' = 'movie') => {
  if (!query || !query.trim()) return [];
  const cacheKey = `search_${type}_${query.trim().toLowerCase()}`;
  const cached = getFromCache<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    const results = (data.results || []) as TMDBMovie[];
    setToCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return [];
  }
};

export const searchTMDBMulti = async (query: string): Promise<TMDBMovie[]> => {
  if (!query || !query.trim()) return [];
  const cacheKey = `search_multi_${query.trim().toLowerCase()}`;
  const cached = getFromCache<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    const results = ((data.results || []).filter(
      (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
    )) as TMDBMovie[];
    setToCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('TMDB Multi Search Error:', error);
    return [];
  }
};

export const languageMap: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  ru: 'Russian',
  pt: 'Portuguese',
  ar: 'Arabic',
  th: 'Thai',
  id: 'Indonesian',
  tr: 'Turkish',
};

export const getTMDBLanguage = async (id: number, type: 'movie' | 'tv' | 'series' = 'movie'): Promise<string | null> => {
  const tmdbType = type === 'series' ? 'tv' : type;
  const cacheKey = `lang_${tmdbType}_${id}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached) return cached;

  try {
    const details = await getTMDBDetails(id, tmdbType);
    if (details && details.original_language) {
      const langCode = details.original_language;
      let fullLang = languageMap[langCode];
      
      if (!fullLang) {
        try {
          const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
          fullLang = displayNames.of(langCode) || langCode.toUpperCase();
        } catch (e) {
          fullLang = langCode.toUpperCase();
        }
      }
      
      if (fullLang) {
        setToCache(cacheKey, fullLang);
        return fullLang;
      }
    }
  } catch (error) {
    console.error('Error fetching TMDB language:', error);
  }
  return null;
};

export const getTMDBDetails = async (id: number, type: 'movie' | 'tv' | 'series' = 'movie') => {
  const tmdbType = type === 'series' ? 'tv' : type;
  const cacheKey = `details_${tmdbType}_${id}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/${tmdbType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
      );
      const data = await response.json();
      if (data && !data.status_code) {
        setToCache(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.error('TMDB Details Error:', error);
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
};

export const getTMDBSeasonDetails = async (seriesId: number, seasonNumber: number) => {
  const cacheKey = `season_${seriesId}_${seasonNumber}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      if (data && !data.status_code) {
        setToCache(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.error('TMDB Season Details Error:', error);
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
};

export const getTMDBEpisodeDetails = async (seriesId: number, seasonNumber: number, episodeNumber: number) => {
  const cacheKey = `ep_${seriesId}_${seasonNumber}_${episodeNumber}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      if (data && !data.status_code) {
        setToCache(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.error('TMDB Episode Details Error:', error);
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
};

export const getTMDBImageUrl = (path: string | null | undefined, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getTrending = async (type: 'movie' | 'tv' = 'movie') => {
  const cacheKey = `trending_${type}`;
  const cached = getFromCache<TMDBMovie[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    const results = (data.results || []) as TMDBMovie[];
    setToCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('TMDB Trending Error:', error);
    return [];
  }
};
