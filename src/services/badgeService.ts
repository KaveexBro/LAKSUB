import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getTMDBDetails } from './tmdbService';

export interface SeriesBadgeInfo {
  text: string;
  isCompleted: boolean;
}

const badgeCache = new Map<string, SeriesBadgeInfo>();
const inFlightBadges = new Map<string, Promise<SeriesBadgeInfo | null>>();

export const getSeriesBadge = async (
  movieTitle: string, 
  tmdbId?: number, 
  cachedSubtitles?: any[]
): Promise<SeriesBadgeInfo | null> => {
  if (!tmdbId || !movieTitle) return null;

  // 1. Check in-memory / sessionStorage cache
  const cacheKey = `series_badge_${movieTitle}`;
  if (badgeCache.has(cacheKey)) {
    return badgeCache.get(cacheKey)!;
  }

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as SeriesBadgeInfo;
      badgeCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {
    // Ignore storage errors
  }

  if (inFlightBadges.has(cacheKey)) {
    return inFlightBadges.get(cacheKey)!;
  }

  const computeBadge = async (): Promise<SeriesBadgeInfo | null> => {
    try {
      // Fetch TMDB details for episode counts (cached by tmdbService)
      const tmdbData = await getTMDBDetails(tmdbId, 'tv');
      if (!tmdbData || !tmdbData.seasons) return null;

      const tmdbSeasons = new Map<number, number>(); // seasonNumber -> episodeCount
      tmdbData.seasons.forEach((s: any) => {
        // Ignore specials (season 0) unless it's the only one
        if (s.season_number > 0 || tmdbData.seasons.length === 1) {
          tmdbSeasons.set(s.season_number, s.episode_count);
        }
      });

      // Get series episodes from cachedSubtitles or query Firestore
      let seriesDocs: any[] = [];
      if (cachedSubtitles && cachedSubtitles.length > 0) {
        seriesDocs = cachedSubtitles.filter(
          s => s.type === 'series' && s.movieTitle === movieTitle && (s.status === 'approved' || !s.status)
        );
      }

      if (seriesDocs.length === 0) {
        const q = query(
          collection(db, 'subtitles'),
          where('type', '==', 'series'),
          where('movieTitle', '==', movieTitle),
          where('status', '==', 'approved')
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        seriesDocs = snap.docs.map(d => d.data());
      }

      // Group episodes by season
      const dbSeasons = new Map<number, Set<number>>();
      seriesDocs.forEach(data => {
        const season = data.season || 1;
        const episode = data.episode || 1;

        if (!dbSeasons.has(season)) {
          dbSeasons.set(season, new Set());
        }
        dbSeasons.get(season)!.add(episode);
      });

      if (dbSeasons.size === 0) return null;

      // Calculate completed seasons
      const completedSeasons: number[] = [];
      Array.from(dbSeasons.keys()).sort((a, b) => a - b).forEach(season => {
        const dbCount = dbSeasons.get(season)!.size;
        const tmdbCount = tmdbSeasons.get(season) || 999;

        if (dbCount >= tmdbCount) {
          completedSeasons.push(season);
        }
      });

      // Generate Badge Text
      const highestSeasonInDB = Math.max(...Array.from(dbSeasons.keys()));
      let resultBadge: SeriesBadgeInfo | null = null;

      if (completedSeasons.includes(highestSeasonInDB)) {
        let minCompleted = highestSeasonInDB;
        for (let i = highestSeasonInDB - 1; i >= 1; i--) {
          if (completedSeasons.includes(i)) {
            minCompleted = i;
          } else {
            break;
          }
        }

        if (minCompleted === highestSeasonInDB) {
          resultBadge = { text: `S${String(highestSeasonInDB).padStart(2, '0')} Completed`, isCompleted: true };
        } else {
          resultBadge = { 
            text: `S${String(minCompleted).padStart(2, '0')}-S${String(highestSeasonInDB).padStart(2, '0')} Completed`, 
            isCompleted: true 
          };
        }
      } else {
        const eps = Array.from(dbSeasons.get(highestSeasonInDB)!).sort((a, b) => a - b);
        if (eps.length === 0) return null;
        
        const minEp = eps[0];
        const maxEp = eps[eps.length - 1];

        if (minEp === maxEp) {
          resultBadge = { 
            text: `S${String(highestSeasonInDB).padStart(2, '0')} E${String(minEp).padStart(2, '0')}`, 
            isCompleted: false 
          };
        } else {
          resultBadge = { 
            text: `S${String(highestSeasonInDB).padStart(2, '0')} E${String(minEp).padStart(2, '0')}-${String(maxEp).padStart(2, '0')}`, 
            isCompleted: false 
          };
        }
      }

      if (resultBadge) {
        badgeCache.set(cacheKey, resultBadge);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(resultBadge));
        } catch (e) {
          // Ignore storage quota
        }
      }

      return resultBadge;
    } catch (err) {
      console.error("Error generating series badge:", err);
      return null;
    } finally {
      inFlightBadges.delete(cacheKey);
    }
  };

  const promise = computeBadge();
  inFlightBadges.set(cacheKey, promise);
  return promise;
};
