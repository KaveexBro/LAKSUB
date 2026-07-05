const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.warn('VITE_TMDB_API_KEY is not set in environment variables.');
}
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

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
}

export const searchTMDB = async (query: string, type: 'movie' | 'tv' = 'movie') => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results as TMDBMovie[];
  } catch (error) {
    console.error('TMDB Search Error:', error);
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

const languageCache: Record<string, string> = {};

export const getTMDBLanguage = async (id: number, type: 'movie' | 'tv' | 'series' = 'movie'): Promise<string | null> => {
  const tmdbType = type === 'series' ? 'tv' : type;
  const cacheKey = `${tmdbType}-${id}`;
  if (languageCache[cacheKey]) {
    return languageCache[cacheKey];
  }

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
        languageCache[cacheKey] = fullLang;
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
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${tmdbType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
    );
    return await response.json();
  } catch (error) {
    console.error('TMDB Details Error:', error);
    return null;
  }
};

export const getTMDBSeasonDetails = async (seriesId: number, seasonNumber: number) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error('TMDB Season Details Error:', error);
    return null;
  }
};

export const getTMDBEpisodeDetails = async (seriesId: number, seasonNumber: number, episodeNumber: number) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error('TMDB Episode Details Error:', error);
    return null;
  }
};

export const getTMDBImageUrl = (path: string | null | undefined, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getTrending = async (type: 'movie' | 'tv' = 'movie') => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}`
    );
    const data = await response.json();
    return data.results as TMDBMovie[];
  } catch (error) {
    console.error('TMDB Trending Error:', error);
    return [];
  }
};
