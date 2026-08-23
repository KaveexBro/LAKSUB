import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Subtitle } from '../types';
import { Play, Star, Calendar, Film, Users, Clock, ArrowLeft, Info, ExternalLink, ChevronDown, Bookmark, Send } from 'lucide-react';
import { getTMDBImageUrl, getTMDBDetails, getTMDBSeasonDetails } from '../services/tmdbService';
import TMDBLanguageBadge from '../components/TMDBLanguageBadge';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { AdZone } from '../components/AdZone';

export const SeriesDetails: React.FC<{ params?: { slug?: string } }> = ({ params: paramsProp }) => {
  const [, paramsRoute] = useRoute<{ title: string, slug: string }>('/series/:title');
  const titleParam = paramsProp?.slug || paramsRoute?.title || paramsRoute?.slug;
  const title = titleParam ? decodeURIComponent(titleParam) : '';
  
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const { user, userData, signIn } = useAuth();
  const [isSeriesWatchlisted, setIsSeriesWatchlisted] = useState(false);

  useEffect(() => {
    if (userData && title) {
      setIsSeriesWatchlisted(userData.seriesWatchlist?.includes(title) || false);
    }
  }, [userData, title]);

  const toggleSeriesWatchlist = async () => {
    if (!user || !userData) {
      signIn();
      return;
    }

    const newSeriesWatchlist = isSeriesWatchlisted
      ? (userData.seriesWatchlist || []).filter(t => t !== title)
      : [...(userData.seriesWatchlist || []), title];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        seriesWatchlist: newSeriesWatchlist
      });
    } catch (err) {
      console.error("Error updating series watchlist:", err);
    }
  };

  useEffect(() => {
    if (!title) {
      setLoading(false);
      return;
    }
    
    const fetchSeries = async () => {
      try {
        const q = query(
          collection(db, 'subtitles'), 
          where('movieTitle', '==', title), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        
        // Sort by season and episode
        subs.sort((a, b) => {
          const sA = a.season || 0;
          const sB = b.season || 0;
          const eA = a.episode || 0;
          const eB = b.episode || 0;
          
          if (sA !== sB) return sA - sB;
          return eA - eB;
        });
        
        setSubtitles(subs);

        // Set initial selected season
        const seasons = Array.from(new Set(subs.map(s => s.season).filter(s => s !== undefined))) as number[];
        if (seasons.length > 0) {
          setSelectedSeason(Math.min(...seasons));
        } else if (subs.length > 0) {
          setSelectedSeason(0); // For specials/unassigned
        }

        // Fetch TMDB data for the series
        if (subs.length > 0 && subs[0].tmdbId) {
          try {
            const tmdb = await getTMDBDetails(subs[0].tmdbId, 'tv');
            setTmdbData(tmdb);
          } catch (err) {
            console.error("Error fetching TMDB series details:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching series:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [title]);

  useEffect(() => {
    const fetchSeasonData = async () => {
      if (!tmdbData?.id || selectedSeason === null || selectedSeason === 0) return;
      
      setLoadingSeason(true);
      try {
        const data = await getTMDBSeasonDetails(tmdbData.id, selectedSeason);
        setSeasonData(data);
      } catch (err) {
        console.error("Error fetching season details:", err);
      } finally {
        setLoadingSeason(false);
      }
    };

    fetchSeasonData();
  }, [tmdbData?.id, selectedSeason]);

  if (loading) return <div className="min-h-screen bg-netflix-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div></div>;
  if (subtitles.length === 0) return <div className="min-h-screen bg-netflix-bg text-white flex items-center justify-center">Series not found</div>;

  const seasons = Array.from(new Set(subtitles.map(s => s.season).filter(s => s !== undefined))) as number[];
  seasons.sort((a, b) => a - b);

  const filteredEpisodes = subtitles.filter(s => s.season === selectedSeason || (selectedSeason === 0 && s.season === undefined));

  const featured = subtitles[0];
  const backdropUrl = featured.backdropPath 
    ? getTMDBImageUrl(featured.backdropPath, 'original') 
    : `https://picsum.photos/seed/${(featured.movieTitle || '').replace(/\s+/g, '')}/1920/1080`;

  const trailer = tmdbData?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

  const seoTitle = `${title} Sinhala Subtitles | ${title} Sinhala Sub | LAKSUB`;
  const seoDescription = `Download high-quality Sinhala subtitles (Sinhala sub) for ${title}. Latest seasons and episodes available. Join Sri Lanka's largest subtitle community.`;
  const slugLink = encodeURIComponent(title);
  const canonicalUrl = `https://www.laksub.com/series/${slugLink}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": title,
    "description": seoDescription,
    "url": canonicalUrl,
    "image": backdropUrl,
    "inLanguage": "si",
    "isAccessibleForFree": true,
    "numberOfEpisodes": subtitles.length,
    "author": {
      "@type": "Organization",
      "name": "LakSub",
      "url": "https://www.laksub.com"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.laksub.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "TV Series",
        "item": "https://www.laksub.com/series"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": canonicalUrl
      }
    ]
  };


  return (
    <article className="min-h-screen bg-netflix-bg text-white pb-20">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${title} Sinhala subtitles, ${title} Sinhala sub, ${title} Sinhala subtitle, download ${title} Sinhala sub, tv series subtitles, Sinhala sub, LAKSUB`} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="video.tv_show" />
        <meta property="og:image" content={backdropUrl || undefined} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>
      {/* Hero Section */}
      <div className="relative min-h-[50vh] md:h-[60vh] w-full overflow-hidden flex flex-col">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-netflix-bg/40 to-netflix-bg z-10" />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="h-full w-full"
          >
            <img 
              src={backdropUrl || undefined} 
              alt={featured.movieTitle}
              className="w-full h-full object-cover scale-105 animate-slow-zoom"
              referrerPolicy="no-referrer"
              fetchPriority="high"
            />
          </motion.div>
        </div>

        {/* Content Container */}
        <div className="relative z-20 flex-1 flex flex-col pt-16 px-4 md:px-12 max-w-6xl mx-auto w-full">
          {/* Back Button */}
          <div className="mb-6 md:absolute md:top-28 md:left-12 md:mb-0">
            <Link href="/explore?type=series" className="inline-flex items-center gap-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              <span className="text-xs font-semibold tracking-wide">Back to Explore</span>
            </Link>
          </div>

          <div className="mt-auto pb-12 md:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-3 md:mb-6 drop-shadow-lg tracking-tight leading-tight">{featured.movieTitle}</h1>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm font-medium mb-6 md:mb-3 text-gray-300">
                <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1 rounded-md border border-green-500/20">
                  <Star className="w-4 h-4 fill-green-500" />
                  {tmdbData?.vote_average ? tmdbData.vote_average.toFixed(1) : (featured.averageRating > 0 ? featured.averageRating.toFixed(1) : 'Not Rated Yet')}
                </div>
                <span className="text-gray-600 hidden md:inline">|</span>
                <span className="bg-white/10 px-3 py-1 rounded-lg font-semibold text-xs">{featured.releaseYear}</span>
                <span className="text-gray-600 hidden md:inline">|</span>
                <span className="bg-netflix-red/10 text-netflix-red px-3 py-1 rounded-lg border border-netflix-red/20 font-semibold tracking-wide text-xs">TV Series</span>
                <span className="text-gray-600 hidden md:inline">|</span>
                <span className="text-white/80">{subtitles.length} Subtitles</span>
                <span className="text-gray-600 hidden md:inline">|</span>
                <TMDBLanguageBadge tmdbId={featured.tmdbId} type="series" className="bg-white/10 text-white px-3 py-1 rounded-lg font-semibold tracking-wide text-xs" />
                {tmdbData?.genres && tmdbData.genres.length > 0 && (
                  <>
                    <span className="text-gray-600 hidden md:inline">|</span>
                    <div className="flex flex-wrap gap-2">
                      {tmdbData.genres.map((genre: any) => (
                        <span key={genre.id} className="text-white/60 hover:text-white transition-colors cursor-default">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                {trailer && (
                  <a 
                    href={`https://www.youtube.com/watch?v=${trailer.key}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white text-black px-5 py-2.5 rounded-md font-bold text-sm md:text-base hover:bg-netflix-red hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 shadow-xl"
                  >
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" /> WATCH TRAILER
                  </a>
                )}
                <button 
                  onClick={() => document.getElementById('episodes')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gray-500/30 backdrop-blur-md text-white px-5 py-2.5 rounded-md font-bold text-sm md:text-base hover:bg-gray-500/50 transition-all transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 border border-white/5"
                >
                  <Info className="w-5 h-5 md:w-6 md:h-6" /> EPISODES
                </button>
                {user && (
                  <button 
                    onClick={toggleSeriesWatchlist}
                    className={`px-5 py-2.5 rounded-md font-bold text-sm md:text-base transition-all transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 border ${
                      isSeriesWatchlisted 
                        ? 'bg-netflix-red text-white border-netflix-red' 
                        : 'bg-white/10 text-white border-white/5 hover:bg-white/20'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 md:w-6 md:h-6 ${isSeriesWatchlisted ? 'fill-current' : ''}`} />
                    {isSeriesWatchlisted ? 'IN WATCHLIST' : 'ADD TO WATCHLIST'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-12 mx-auto pb-4">
        <AdZone zoneName="series-details-top" />
      </div>

      {/* Season Selector & Episode List */}
      <div id="episodes" className="max-w-7xl mx-auto px-4 md:px-12 mt-0 md:-mt-10 relative z-30">
        <div className="bg-[#181818]/60 backdrop-blur-2xl rounded-2xl md:rounded-2xl border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Season Selector */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 bg-black/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 bg-white/5 hover:bg-white/10 border border-white/5 px-4 md:px-6 py-2 md:py-3 rounded-2xl transition-all group"
              >
                <span className="text-base md:text-lg font-bold tracking-tight">
                  {selectedSeason === 0 ? 'Specials' : `Season ${selectedSeason}`}
                </span>
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform duration-300 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSeasonDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSeasonDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-64 bg-[#181818]/95 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                    >
                      <div className="max-h-80 overflow-y-auto py-2 hide-scrollbar">
                        {seasons.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setSelectedSeason(s);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between group ${
                              selectedSeason === s 
                                ? 'bg-netflix-red text-white' 
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>Season {s}</span>
                            {selectedSeason === s && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
                          </button>
                        ))}
                        {subtitles.some(s => s.season === undefined) && (
                          <button
                            onClick={() => {
                              setSelectedSeason(0);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between group ${
                              selectedSeason === 0 
                                ? 'bg-netflix-red text-white' 
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>Specials</span>
                            {selectedSeason === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-500 tracking-wide font-semibold text-xs">
              <Film className="w-4 h-4" />
              {filteredEpisodes.length} Episodes in this season
            </div>
          </div>

          {/* Episode List View */}
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSeason}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loadingSeason ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Loading Season Details...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEpisodes.length === 0 ? (
                      <div className="py-20 text-center text-gray-500">
                        <Play className="w-16 h-16 mx-auto mb-6 opacity-10" />
                        <p className="text-xl font-bold">No subtitles found for this season.</p>
                      </div>
                    ) : (
                      filteredEpisodes.map((sub) => {
                        const tmdbEpisode = seasonData?.episodes?.find((e: any) => e.episode_number === sub.episode);
                        return (
                          <div key={sub.id} className="group relative hover:bg-white/5 border-b border-white/5 last:border-0 rounded-none transition-all duration-300 overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-center gap-3 py-2 px-3">
                              {/* Episode Info */}
                              <div className="flex-1 min-w-0 flex items-center gap-4 w-full">
                                <div className="bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10 text-[10px] font-bold flex-shrink-0">
                                  EP {sub.episode?.toString().padStart(2, '0')}
                                </div>
                                <h4 className="text-sm font-medium text-gray-300 group-hover:text-netflix-red transition-colors truncate">
                                  {tmdbEpisode?.name || `${sub.language} Subtitle`}
                                </h4>
                                {sub.proOnlyUntil && new Date(sub.proOnlyUntil) > new Date() && (
                                  <span className="bg-netflix-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-lg flex-shrink-0">
                                    Pro Only
                                  </span>
                                )}
                              </div>

                              {/* Action */}
                              <div className="w-full sm:w-auto flex-shrink-0 flex items-center gap-2">
                                {sub.telegramLink && (
                                  <a href={sub.telegramLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-[#0088cc] text-white px-3 py-1.5 rounded-lg font-semibold text-[10px] hover:bg-[#0077b5] transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg group/btn">
                                    <Send className="w-3 h-3" /> TELEGRAM
                                  </a>
                                )}
                                <Link href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
                                  <button className="w-full sm:w-auto bg-white text-black px-3 py-1.5 rounded-lg font-semibold text-[10px] hover:bg-netflix-red hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg group/btn">
                                    DOWNLOAD <Play className="w-3 h-3 fill-current group-hover/btn:translate-x-1 transition-transform" />
                                  </button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                    <div className="w-full px-4 md:px-6 mx-auto"><AdZone zoneName="series-details" /></div>
                  </div>
                )}
              </motion.div>
              <div className="mt-4 px-6">
                <AdZone zoneName="series-details-middle" />
              </div>
            </AnimatePresence>
          </div>
        </div>

        {/* TMDB Extra Info */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {tmdbData?.credits?.cast && (
              <section>
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-3 uppercase tracking-tighter">
                  <Users className="w-6 h-6 text-netflix-red" /> Starring Cast
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {tmdbData.credits.cast.slice(0, 6).map((person: any) => (
                    <div key={person.id} className="group flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/10">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-netflix-red transition-colors flex-shrink-0 shadow-lg transform-gpu backface-hidden">
                        <img 
                          src={person.profile_path ? getTMDBImageUrl(person.profile_path) || undefined : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`} 
                          alt={person.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-300 truncate">{person.name}</p>
                        <p className="text-xs text-gray-500 truncate font-medium">{person.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-6 shadow-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4">Series Details</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Status</span>
                <span className="text-sm font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-md">{tmdbData?.status}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Network</span>
                <div className="flex items-center gap-2">
                  {tmdbData?.networks?.[0]?.logo_path && (
                    <img 
                      src={getTMDBImageUrl(tmdbData.networks[0].logo_path) || undefined} 
                      alt={tmdbData.networks[0].name}
                      className="h-4 invert opacity-70"
                    />
                  )}
                  <span className="text-sm font-bold text-white">{tmdbData?.networks?.[0]?.name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Total Seasons</span>
                <span className="text-sm font-bold text-white">{tmdbData?.number_of_seasons}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Total Episodes</span>
                <span className="text-sm font-bold text-white">{tmdbData?.number_of_episodes}</span>
              </div>

              {tmdbData?.homepage && (
                <a 
                  href={tmdbData.homepage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-2xl text-xs font-bold tracking-wide text-xs transition-all"
                >
                  Official Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pb-10">
        <AdZone zoneName="series-details-bottom" />
      </div>
    </article>
  );
};
