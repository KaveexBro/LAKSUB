import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useSearch } from 'wouter';
import { Subtitle } from '../types';
import { Search, Filter, ArrowDownWideNarrow } from 'lucide-react';
import { getTMDBImageUrl, getTMDBLanguage } from '../services/tmdbService';
import TMDBLanguageBadge from '../components/TMDBLanguageBadge';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';
import { getSeriesBadge, SeriesBadgeInfo } from '../services/badgeService';
import { MovieSkeleton } from '../components/MovieSkeleton';

export const Explore: React.FC<{ initialType?: 'movie' | 'series' | 'all', initialGenre?: string }> = ({ initialType = 'all', initialGenre = '' }) => {
  const searchString = useSearch();
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [filteredSubtitles, setFilteredSubtitles] = useState<Subtitle[]>([]);
  const [tmdbLanguages, setTmdbLanguages] = useState<Record<string, string>>({});
  const [seriesBadges, setSeriesBadges] = useState<Record<string, SeriesBadgeInfo>>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState<'movie' | 'series' | 'all'>(initialType);
  const [language, setLanguage] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenre ? [initialGenre] : []);
  const [year, setYear] = useState('');
  const [sortByRating, setSortByRating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const qGenre = params.get('genre');
    const qType = params.get('type') as 'movie' | 'series' | 'all';
    
    if (qGenre) {
      setSelectedGenres([qGenre]);
    } else if (initialGenre) {
      setSelectedGenres([initialGenre]);
    } else {
      setSelectedGenres([]);
    }
    
    if (qType) {
      setType(qType);
    } else {
      setType(initialType);
    }
  }, [searchString, initialType, initialGenre]);

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        const q = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        setSubtitles(subs);
        setFilteredSubtitles(subs);

        // Fetch TMDB languages for filtering in chunks to avoid freezing the browser
        const uniqueTmdbIds = Array.from(new Set(subs.map(s => `${s.type}-${s.tmdbId}`)));
        const langMap: Record<string, string> = {};
        
        const chunkSize = 20;
        for (let i = 0; i < uniqueTmdbIds.length; i += chunkSize) {
          const chunk = uniqueTmdbIds.slice(i, i + chunkSize);
          await Promise.all(chunk.map(async (key) => {
            const [type, id] = key.split('-');
            if (id && id !== 'undefined') {
              try {
                const lang = await getTMDBLanguage(Number(id), type as 'movie' | 'series');
                if (lang) {
                  langMap[key] = lang;
                }
              } catch (e) {
                console.error(e);
              }
            }
          }));
        }
        
        setTmdbLanguages(langMap);

        // Fetch badges for unique series
        const allSeries = subs.filter(s => s.type === 'series');
        const uniqueSeries = new Map<string, number | undefined>();
        allSeries.forEach(s => {
          if (!uniqueSeries.has(s.movieTitle)) {
            uniqueSeries.set(s.movieTitle, s.tmdbId);
          }
        });

        const newBadges: Record<string, SeriesBadgeInfo> = {};
        await Promise.all(
          Array.from(uniqueSeries.entries()).map(async ([title, tmdbId]) => {
            const badge = await getSeriesBadge(title, tmdbId);
            if (badge) {
              newBadges[title] = badge;
            }
          })
        );
        setSeriesBadges(newBadges);

      } catch (err) {
        console.error("Error fetching explore data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExploreData();
  }, []);

  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    let result = [...subtitles];
    
    // reset visible count when filters change
    setVisibleCount(24);

    if (type !== 'all') {
      result = result.filter(sub => sub.type === type);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(sub => 
        sub.movieTitle.toLowerCase().includes(term) || 
        (sub.description || '').toLowerCase().includes(term)
      );
    }

    if (language) {
      result = result.filter(sub => {
        const subLang = tmdbLanguages[`${sub.type}-${sub.tmdbId}`] || sub.language;
        return subLang === language;
      });
    }

    if (selectedGenres.length > 0) {
      result = result.filter(sub => {
        const subGenres = Array.isArray(sub.genres) ? sub.genres : (typeof sub.genres === 'string' ? [sub.genres] : []);
        return selectedGenres.some(genre => 
          subGenres.some(g => g.toLowerCase() === genre.toLowerCase())
        );
      });
    }

    if (year) {
      result = result.filter(sub => sub.releaseYear.toString() === year);
    }

    if (sortByRating) {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    setFilteredSubtitles(result);
  }, [searchTerm, type, language, selectedGenres, year, sortByRating, subtitles, tmdbLanguages]);

  const uniqueLanguages = Array.from(new Set(subtitles.map(s => tmdbLanguages[`${s.type}-${s.tmdbId}`] || s.language))).filter(Boolean).sort();
  const uniqueGenres = Array.from(new Set(subtitles.flatMap(s => Array.isArray(s.genres) ? s.genres : (typeof s.genres === 'string' ? [s.genres] : [])))).sort() as string[];
  const uniqueYears = Array.from(new Set(subtitles.map(s => s.releaseYear.toString()))).sort().reverse();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  // Group series by title for a cleaner look
  const groupedResults: (Subtitle & { isGroup?: boolean; groupBadge?: string; isGroupCompleted?: boolean })[] = [];
  const seriesMap = new Map<string, { count: number; maxSeason: number; maxEpisode: number; minSeason: number; minEpisode: number }>();

  filteredSubtitles.forEach(sub => {
    if (sub.type === 'series') {
      const title = sub.movieTitle;
      const s = sub.season || 1;
      const e = sub.episode || 1;
      if (!seriesMap.has(title)) {
        seriesMap.set(title, { count: 1, maxSeason: s, maxEpisode: e, minSeason: s, minEpisode: e });
      } else {
        const data = seriesMap.get(title)!;
        data.count++;
        data.maxSeason = Math.max(data.maxSeason, s);
        data.maxEpisode = Math.max(data.maxEpisode, e);
        data.minSeason = Math.min(data.minSeason, s);
        data.minEpisode = Math.min(data.minEpisode, e);
      }
    }
  });

  const addedSeries = new Set<string>();

  filteredSubtitles.forEach(sub => {
    if (sub.type === 'series') {
      if (!addedSeries.has(sub.movieTitle)) {
        addedSeries.add(sub.movieTitle);
        const data = seriesMap.get(sub.movieTitle)!;
        
        let groupBadge = '';
        let isGroupCompleted = false;
        
        const fetchedBadge = seriesBadges[sub.movieTitle];
        if (fetchedBadge) {
          groupBadge = fetchedBadge.text;
          isGroupCompleted = fetchedBadge.isCompleted;
        } else {
          // Fallback while loading TMDB info
          if (data.count === 1) {
            groupBadge = `New: S${String(sub.season || 1).padStart(2, '0')} E${String(sub.episode || 1).padStart(2, '0')}`;
          } else if (data.maxSeason === data.minSeason) {
            groupBadge = `New: S${String(data.maxSeason).padStart(2, '0')} E${String(data.minEpisode).padStart(2, '0')}-E${String(data.maxEpisode).padStart(2, '0')}`;
          } else {
            groupBadge = `${data.count} New Eps`;
          }
        }
        groupedResults.push({ ...sub, isGroup: true, groupBadge, isGroupCompleted });
      }
    } else {
      groupedResults.push(sub);
    }
  });

  if (loading) return <MovieSkeleton />;

  return (
    <main className="min-h-screen bg-netflix-bg text-white pb-12">
      <Helmet>
        <title>{searchTerm ? `Search Results for "${searchTerm}" Sinhala Subtitles` : initialType === 'movie' ? 'Sinhala Subtitles for Movies & Sinhala Sub' : initialType === 'series' ? 'Sinhala Subtitles for TV Series & Sinhala Sub' : 'Explore All Sinhala Subtitles & Sinhala Sub'} | LAKSUB</title>
        <meta name="description" content={`Browse and download high-quality Sinhala subtitles (Sinhala sub) for your favorite ${initialType === 'movie' ? 'Hollywood and latest movies' : initialType === 'series' ? 'Netflix and popular TV series' : 'movies and TV shows'} on LAKSUB.`} />
        <meta name="keywords" content={`Sinhala subtitles, Sinhala sub, download Sinhala sub, ${initialType === 'movie' ? 'movies Sinhala sub, English movie Sinhala subtitles' : initialType === 'series' ? 'TV series Sinhala subtitles, Netflix Sinhala subtitles' : 'Sinhala movie subtitles, Korean dramas Sinhala subtitles, Anime Sinhala subtitles'}`} />
        <link rel="canonical" href={`https://www.laksub.com/${initialType === 'movie' ? 'movies' : initialType === 'series' ? 'series' : 'explore'}`} />
      </Helmet>

      {/* Compact Header & Filters */}
      <section className="pt-24 pb-12 px-4 md:px-12 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{initialType === 'movie' ? 'Movies' : initialType === 'series' ? 'TV Series' : 'Explore'} Sinhala Subtitles</h1>
          
          {/* Compact Search */}
          <div className="relative w-full md:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search movies, shows..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-netflix-surface border border-gray-800 rounded-2xl pl-9 pr-4 py-2 text-sm text-white focus:border-gray-500 focus:outline-none transition-colors"
            />
          </div>
        </header>

        {/* Compact Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
          <div className="flex items-center gap-2 text-gray-400 mr-1 hidden sm:flex">
            <Filter className="w-4 h-4" />
          </div>

          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as 'movie' | 'series' | 'all')}
            className="bg-netflix-surface border border-gray-800 rounded-2xl px-3 py-1.5 text-sm text-white focus:border-gray-500 focus:outline-none hover:bg-gray-900 transition-colors cursor-pointer appearance-none pr-8 relative"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
          >
            <option value="all">All Types</option>
            <option value="movie">Movies</option>
            <option value="series">TV Series</option>
          </select>

          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-netflix-surface border border-gray-800 rounded-2xl px-3 py-1.5 text-sm text-white focus:border-gray-500 focus:outline-none hover:bg-gray-900 transition-colors cursor-pointer appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
          >
            <option value="">All Languages</option>
            {uniqueLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
          
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="bg-netflix-surface border border-gray-800 rounded-2xl px-3 py-1.5 text-sm text-white focus:border-gray-500 focus:outline-none hover:bg-gray-900 transition-colors cursor-pointer appearance-none pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='gray'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
          >
            <option value="">All Years</option>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            onClick={() => setSortByRating(!sortByRating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all whitespace-nowrap text-sm font-medium ml-auto md:ml-0 ${
              sortByRating 
                ? 'bg-netflix-red/10 border-netflix-red text-netflix-red' 
                : 'bg-netflix-surface border-gray-800 text-gray-300 hover:text-white hover:border-gray-500'
            }`}
          >
            <ArrowDownWideNarrow className="w-3.5 h-3.5" />
            <span>Top Rated</span>
          </button>
        </div>

        {/* Horizontal Genre Tags */}
        <div className="flex overflow-x-auto pb-4 mb-2 scrollbar-hide gap-2">
          <button
            onClick={() => setSelectedGenres([])}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedGenres.length === 0 
                ? 'bg-netflix-red text-white' 
                : 'bg-netflix-surface border border-gray-800 text-gray-300 hover:text-white hover:border-gray-500'
            }`}
          >
            All Genres
          </button>
          {uniqueGenres.map(genre => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedGenres.includes(genre) 
                  ? 'bg-netflix-red text-white' 
                  : 'bg-netflix-surface border border-gray-800 text-gray-300 hover:text-white hover:border-gray-500'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <AdZone zoneName="explore-top" />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-gray-300">
            {filteredSubtitles.length} {filteredSubtitles.length === 1 ? 'Result' : 'Results'} Found
          </h2>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {groupedResults.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-netflix-surface/30 rounded-2xl border border-white/5">
              <Filter className="w-16 h-16 mx-auto mb-6 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                We couldn't find any subtitles matching your current filters. Try adjusting your search or clearing some filters.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setType('all');
                  setLanguage('');
                  setSelectedGenres([]);
                  setYear('');
                  setSortByRating(false);
                }}
                className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {groupedResults.slice(0, visibleCount).map((sub, index) => (
                <React.Fragment key={sub.id}>
                  <Link href={sub.isGroup ? `/series/${encodeURIComponent(sub.movieTitle)}` : (sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`)}>
                    <div className="aspect-[2/3] relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:z-40 shadow-md hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 bg-netflix-surface">
                      <img 
                        src={sub.posterPath ? getTMDBImageUrl(sub.posterPath) : `https://picsum.photos/seed/${(sub.movieTitle || '').replace(/\s+/g, '')}/400/600`} 
                        alt={sub.movieTitle}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />

                      {sub.isGroup && sub.groupBadge && (
                        <div className={`absolute top-2 left-2 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider shadow-md z-20 border border-white/20 ${sub.isGroupCompleted ? 'bg-green-600/90' : 'bg-blue-600/90'}`}>
                          {sub.groupBadge}
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Content Overlay */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="font-bold text-sm md:text-base text-white leading-tight mb-2 line-clamp-2 drop-shadow-md">
                          {sub.movieTitle}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-medium text-gray-300 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          <span className="text-green-400 font-bold bg-green-400/10 px-1.5 py-0.5 rounded">
                            {sub.averageRating > 0 ? `★ ${sub.averageRating.toFixed(1)}` : 'NEW'}
                          </span>
                          <span>{sub.releaseYear}</span>
                          {sub.isGroup && (
                            <span className="bg-white/20 text-white px-1.5 py-0.5 rounded">Series</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                          <TMDBLanguageBadge tmdbId={sub.tmdbId} type={sub.type} />
                          {sub.genres && (Array.isArray(sub.genres) ? sub.genres.length > 0 : typeof sub.genres === 'string') && (
                            <span className="text-[10px] text-gray-400 truncate">
                              {Array.isArray(sub.genres) ? sub.genres[0] : sub.genres}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {sub.proOnlyUntil && new Date(sub.proOnlyUntil) > new Date() && (
                          <div className="bg-netflix-red text-white text-[9px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-widest backdrop-blur-md">
                            Pro
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  {index === 7 && (
                    <div className="col-span-full my-4">
                      <AdZone zoneName="explore-middle-1" />
                    </div>
                  )}
                  {index === 15 && (
                    <div className="col-span-full my-4">
                      <AdZone zoneName="explore-middle-2" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
        
        {visibleCount < groupedResults.length && (
          <div className="mt-12 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
            >
              Load More
            </button>
          </div>
        )}

        <div className="mt-12">
          <AdZone zoneName="explore-bottom" />
        </div>
      </section>
    </main>
  );
};
