import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { db } from '../firebase';
import { Link } from 'wouter';
import { SiteLogo } from '../components/SiteLogo';
import { Play, Info, Volume2, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subtitle } from '../types';
import { getTMDBImageUrl } from '../services/tmdbService';
import TMDBLanguageBadge from '../components/TMDBLanguageBadge';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';
import { getSeriesBadge, SeriesBadgeInfo } from '../services/badgeService';

export const Home: React.FC = () => {
  const { settings } = useSiteSettings();
  const [featured, setFeatured] = useState<Subtitle | null>(null);
  const [latestReleases, setLatestReleases] = useState<Subtitle[]>([]);
  const [trendingNow, setTrendingNow] = useState<Subtitle[]>([]);
  const [top10, setTop10] = useState<Subtitle[]>([]);
  const [actionMovies, setActionMovies] = useState<Subtitle[]>([]);
  const [tvSeries, setTvSeries] = useState<Subtitle[]>([]);
  const [seriesBadges, setSeriesBadges] = useState<Record<string, SeriesBadgeInfo>>({});
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showWaBanner, setShowWaBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed the WhatsApp banner
    const waDismissed = localStorage.getItem('laksub_wa_banner_dismissed');
    if (!waDismissed) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setShowWaBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissWaBanner = () => {
    setShowWaBanner(false);
    localStorage.setItem('laksub_wa_banner_dismissed', 'true');
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch latest
        const latestQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'), 
          limit(50)
        );
        
        // Fetch top 10 (most downloaded)
        const top10Query = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('downloadCount', 'desc'), 
          limit(10)
        );

        // Fetch trending (highest rated)
        const trendingQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('averageRating', 'desc'), 
          limit(15)
        );

        // Fetch Action movies
        const actionQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          where('genres', 'array-contains', 'Action'), 
          limit(15)
        );

        // Fetch TV Series
        const seriesQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          where('type', '==', 'series'), 
          limit(50)
        );

        // Execute all queries in parallel
        const [latestSnap, top10Snap, trendingSnap, actionSnap, seriesSnap] = await Promise.all([
          getDocs(latestQuery),
          getDocs(top10Query),
          getDocs(trendingQuery),
          getDocs(actionQuery),
          getDocs(seriesQuery)
        ]);

        const latestSubs = latestSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        
        if (latestSubs.length > 0) {
          // Pick a random one from the latest 5 for featured to keep it fresh
          const featuredIndex = Math.floor(Math.random() * Math.min(5, latestSubs.length));
          setFeatured(latestSubs[featuredIndex]);
          setLatestReleases(latestSubs.filter((_, i) => i !== featuredIndex));
        }

        setTop10(top10Snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));
        setTrendingNow(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));
        setActionMovies(actionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));
        const tvSeriesData = seriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        setTvSeries(tvSeriesData);

        // Fetch badges for unique series
        const allSeries = [...latestSubs, ...top10Snap.docs.map(doc => doc.data() as Subtitle), ...trendingSnap.docs.map(doc => doc.data() as Subtitle), ...tvSeriesData].filter(s => s.type === 'series');
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

      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(229,9,20,0.4)]"></div>
          <SiteLogo className="h-12 w-auto object-contain" />
        </motion.div>
      </div>
    );
  }

  const renderTop10 = () => {
    if (top10.length === 0) return null;
    return (
      <section className="mb-12 relative z-30">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white px-4 md:px-12 flex items-center gap-2 uppercase tracking-tighter">
          Top 10 in Sri Lanka Today
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-4 md:px-12 scrollbar-hide snap-x">
          {top10.map((sub, index) => (
            <Link key={sub.id} href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
              <div 
                className="flex-none w-64 md:w-80 h-40 md:h-48 relative group cursor-pointer snap-start flex items-end hover:z-50 transition-transform duration-300 hover:scale-105"
              >
                <div className="absolute left-0 bottom-0 text-[80px] md:text-[140px] font-bold leading-[0.7] text-black stroke-white stroke-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] z-10 select-none opacity-80 group-hover:opacity-100 transition-opacity"
                     style={{ WebkitTextStroke: '3px rgba(255,255,255,0.6)', color: 'transparent' }}>
                  {index + 1}
                </div>
                <div className="ml-20 md:ml-28 w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
                  <img 
                    src={sub.backdropPath ? getTMDBImageUrl(sub.backdropPath, 'w500') : `https://picsum.photos/seed/${sub.movieTitle}/800/450`} 
                    alt={sub.movieTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="font-bold text-sm line-clamp-1">{sub.movieTitle}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  const renderRow = (title: string, subtitles: Subtitle[]) => {
    if (subtitles.length === 0) return null;

    const groupedContent: (Subtitle & { isGroup?: boolean; groupBadge?: string; isGroupCompleted?: boolean })[] = [];
    const seriesMap = new Map<string, { count: number; maxSeason: number; maxEpisode: number; minSeason: number; minEpisode: number }>();

    subtitles.forEach(sub => {
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

    subtitles.forEach(sub => {
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
          groupedContent.push({ ...sub, isGroup: true, groupBadge, isGroupCompleted });
        }
      } else {
        groupedContent.push(sub);
      }
    });

    const displayContent = groupedContent.slice(0, 15);

    return (
      <section className="mb-12 relative z-30">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white px-4 md:px-12 uppercase tracking-tighter">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-4 md:px-12 scrollbar-hide snap-x">
          {displayContent.map((sub) => (
            <Link 
              key={sub.id} 
              href={sub.isGroup ? `/series/${encodeURIComponent(sub.movieTitle)}` : (sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`)}
            >
              <div 
                className="flex-none w-36 md:w-52 aspect-[2/3] relative group cursor-pointer snap-start rounded-2xl overflow-hidden shadow-md border border-white/5 hover:z-50 transition-transform duration-300 hover:scale-110"
              >
                <img 
                  src={sub.posterPath ? getTMDBImageUrl(sub.posterPath) : `https://picsum.photos/seed/${(sub.movieTitle || '').replace(/\s+/g, '')}/400/600`} 
                  alt={sub.movieTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <h3 className="font-bold text-xs md:text-sm line-clamp-2 mb-1">
                    {sub.movieTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-300">
                    <span className="text-green-500 font-bold">{sub.averageRating > 0 ? sub.averageRating.toFixed(1) : 'New'}</span>
                    <span className="bg-white/10 px-1 rounded text-[8px] uppercase">{sub.type}</span>
                    <span>{sub.releaseYear}</span>
                    <TMDBLanguageBadge tmdbId={sub.tmdbId} type={sub.type} />
                    {sub.genres && (Array.isArray(sub.genres) ? sub.genres.length > 0 : typeof sub.genres === 'string') && (
                      <span className="text-gray-400 truncate max-w-[60px]">{Array.isArray(sub.genres) ? sub.genres[0] : sub.genres}</span>
                    )}
                  </div>
                </div>
                {sub.isGroup && sub.groupBadge && (
                  <div className={`absolute top-2 left-2 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider shadow-md z-20 border border-white/20 ${sub.isGroupCompleted ? 'bg-green-600/90' : 'bg-blue-600/90'}`}>
                    {sub.groupBadge}
                  </div>
                )}
                {sub.proOnlyUntil && new Date(sub.proOnlyUntil) > new Date() && (
                  <div className="absolute top-2 right-2 bg-netflix-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-md z-20">
                    PRO
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-netflix-bg text-white">
      <Helmet>
        <title>Sinhala Subtitles & Sinhala Sub | LAKSUB</title>
        <meta name="description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
        <meta name="keywords" content="Sinhala subtitle, Sinhala sub, English movie Sinhala subtitles, TV series Sinhala subtitles, Netflix Sinhala subtitles, LAKSUB, movie subtitle download" />
        <link rel="canonical" href="https://www.laksub.com/" />
        
        <meta property="og:title" content="Sinhala Subtitles & Sinhala Sub | LAKSUB" />
        <meta property="og:description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
        <meta property="og:url" content="https://www.laksub.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={settings.logoUrl || "https://www.laksub.com/logo.png"} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sinhala Subtitles & Sinhala Sub | LAKSUB" />
        <meta name="twitter:description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
        <meta name="twitter:image" content={settings.logoUrl || "https://www.laksub.com/logo.png"} />
      </Helmet>
      <AnimatePresence mode="wait">
        <motion.div
          key="home-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Hero Section */}
          {featured && (
            <div className="relative h-[85vh] md:h-[100vh] w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent z-10" />
              
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 10, ease: "linear" }}
                src={featured.backdropPath ? getTMDBImageUrl(featured.backdropPath, 'original') : `https://picsum.photos/seed/${(featured.movieTitle || '').replace(/\s+/g, '')}/1920/1080`} 
                alt={featured.movieTitle}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
                fetchPriority="high"
              />
              
              <div className="relative z-20 h-full flex flex-col justify-end px-4 md:px-12 pb-16 md:pb-32 max-w-4xl pt-32 md:pt-24">
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <div className="flex items-center gap-2 mb-2 md:mb-4">
                    <SiteLogo className="h-6 md:h-8 w-auto drop-shadow-md" />
                    <span className="text-[10px] md:text-sm font-bold tracking-[0.2em] text-white/90 uppercase drop-shadow-md">Original</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] uppercase tracking-tighter leading-[0.85] text-white">
                    {featured.movieTitle}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-8">
                    {top10.some(t => t.id === featured.id) && (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                        <div className="bg-netflix-red text-white p-0.5 md:p-1 rounded-sm">
                          <div className="text-[6px] md:text-[8px] font-bold leading-none uppercase">Top</div>
                          <div className="text-xs md:text-sm font-bold leading-none">10</div>
                        </div>
                        <span className="text-[10px] md:text-sm font-bold tracking-tight">#1 in Sri Lanka Today</span>
                      </div>
                    )}
                    {featured.genres && (Array.isArray(featured.genres) ? featured.genres.length > 0 : typeof featured.genres === 'string') && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 hidden sm:inline">|</span>
                        <div className="flex gap-2">
                          {(Array.isArray(featured.genres) ? featured.genres : [featured.genres]).slice(0, 3).map((g, i) => (
                            <span key={i} className="text-[10px] md:text-sm font-bold text-gray-300">
                              {g}{i < Math.min((Array.isArray(featured.genres) ? featured.genres : [featured.genres]).length, 3) - 1 && <span className="ml-1 md:ml-2 text-gray-600">•</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <Link href={featured.slug ? `/subtitles/${featured.slug}` : `/subtitles/${featured.id}`}>
                      <button className="btn-white">
                        <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" /> 
                        <span>Download</span>
                      </button>
                    </Link>
                    <Link href={featured.type === 'series' ? `/series/${encodeURIComponent(featured.movieTitle)}` : (featured.slug ? `/subtitles/${featured.slug}` : `/subtitles/${featured.id}`)}>
                      <button className="btn-secondary bg-gray-500/30 border-0 hover:bg-gray-500/50">
                        <Info className="w-5 h-5 md:w-6 md:h-6" /> 
                        <span>More Info</span>
                      </button>
                    </Link>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="ml-auto w-7 h-7 md:w-12 md:h-12 rounded-full border border-gray-500 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Volume2 className={`w-3.5 h-3.5 md:w-6 md:h-6 ${isMuted ? 'opacity-50' : 'opacity-100'}`} />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Content Rows */}
          <div className="mt-4 md:-mt-32 relative z-30 pb-20">
            <div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="home-top" /></div>
            {renderTop10()}
            <div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="home-row-1" /></div>
            {renderRow("Latest Releases", latestReleases)}
            <div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="home-row-2" /></div>
            {renderRow("Trending Now", trendingNow)}
            <div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="home-row-3" /></div>
            {renderRow("Action Movies", actionMovies)}
            <div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="home-row-4" /></div>
            {renderRow("TV Series", tvSeries)}
            <div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="home-bottom" /></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* WhatsApp Notification Banner */}
      <AnimatePresence>
        {showWaBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <div className="bg-[#1b1b1b] border border-gray-800 shadow-lg rounded-2xl overflow-hidden relative max-w-md w-full">
              <button 
                onClick={dismissWaBanner}
                className="absolute top-3 right-3 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </div>
                
                <h3 className="font-bold text-white text-xl md:text-2xl mb-3">LAKSUB WhatsApp Channel</h3>
                
                <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
                  වෙබ් අඩවියේ නවතම යාවත්කාලීන කිරීම් සහ අලුතින් එකතු වෙන උපසිරැසි ගැන දැනගැනීමට අපගේ WhatsApp නාලිකාව සමඟ එකතු වෙන්න.
                </p>
                
                <a 
                  href="https://whatsapp.com/channel/0029Vb8hNti1HspwksOPol1p" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 px-8 rounded-xl text-base w-full transition-colors"
                  onClick={dismissWaBanner}
                >
                  Join Channel Now
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
