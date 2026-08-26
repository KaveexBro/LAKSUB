import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getTMDBDetails } from './tmdbService';

export interface SeriesBadgeInfo {
  text: string;
  isCompleted: boolean;
}

export const getSeriesBadge = async (movieTitle: string, tmdbId?: number): Promise<SeriesBadgeInfo | null> => {
  if (!tmdbId) return null;

  try {
    // 1. Fetch TMDB details for episode counts
    const tmdbData = await getTMDBDetails(tmdbId, 'tv');
    if (!tmdbData || !tmdbData.seasons) return null;

    const tmdbSeasons = new Map<number, number>(); // seasonNumber -> episodeCount
    tmdbData.seasons.forEach((s: any) => {
      // Ignore specials (season 0) unless it's the only one
      if (s.season_number > 0 || tmdbData.seasons.length === 1) {
        tmdbSeasons.set(s.season_number, s.episode_count);
      }
    });

    // 2. Fetch all subtitles for this series from DB
    const q = query(
      collection(db, 'subtitles'),
      where('type', '==', 'series'),
      where('movieTitle', '==', movieTitle),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);

    if (snap.empty) return null;

    // 3. Group episodes by season
    const dbSeasons = new Map<number, Set<number>>();
    snap.docs.forEach(doc => {
      const data = doc.data();
      const season = data.season || 1;
      const episode = data.episode || 1;

      if (!dbSeasons.has(season)) {
        dbSeasons.set(season, new Set());
      }
      dbSeasons.get(season)!.add(episode);
    });

    // 4. Calculate completed seasons
    const completedSeasons: number[] = [];

    Array.from(dbSeasons.keys()).sort((a, b) => a - b).forEach(season => {
      const dbCount = dbSeasons.get(season)!.size;
      const tmdbCount = tmdbSeasons.get(season) || 999; // fallback if TMDB doesn't have it

      if (dbCount >= tmdbCount) {
        completedSeasons.push(season);
      }
    });

    // 5. Generate Badge Text
    const highestSeasonInDB = Math.max(...Array.from(dbSeasons.keys()));

    if (completedSeasons.includes(highestSeasonInDB)) {
      // The highest season we have is completed!
      // Check if we have consecutive completed seasons to show e.g. "S01-S02 Completed"
      let minCompleted = highestSeasonInDB;
      for (let i = highestSeasonInDB - 1; i >= 1; i--) {
        if (completedSeasons.includes(i)) {
          minCompleted = i;
        } else {
          break;
        }
      }

      if (minCompleted === highestSeasonInDB) {
        return { text: `S${String(highestSeasonInDB).padStart(2, '0')} Completed`, isCompleted: true };
      } else {
        return { 
          text: `S${String(minCompleted).padStart(2, '0')}-S${String(highestSeasonInDB).padStart(2, '0')} Completed`, 
          isCompleted: true 
        };
      }
    } else {
      // The highest season is INCOMPLETE
      const eps = Array.from(dbSeasons.get(highestSeasonInDB)!).sort((a, b) => a - b);
      if (eps.length === 0) return null;
      
      const minEp = eps[0];
      const maxEp = eps[eps.length - 1];

      if (minEp === maxEp) {
        return { 
          text: `S${String(highestSeasonInDB).padStart(2, '0')} E${String(minEp).padStart(2, '0')}`, 
          isCompleted: false 
        };
      } else {
        // "S01 E01-03"
        return { 
          text: `S${String(highestSeasonInDB).padStart(2, '0')} E${String(minEp).padStart(2, '0')}-${String(maxEp).padStart(2, '0')}`, 
          isCompleted: false 
        };
      }
    }
  } catch (err) {
    console.error("Error generating series badge:", err);
    return null;
  }
};
