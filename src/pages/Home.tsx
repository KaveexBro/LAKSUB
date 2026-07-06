import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'wouter';
import { Play, Info, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subtitle } from '../types';
import { getTMDBImageUrl } from '../services/tmdbService';
import TMDBLanguageBadge from '../components/TMDBLanguageBadge';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';

export const Home: React.FC = () => {
  const [featured, setFeatured] = useState<Subtitle | null>(null);
  const [latestReleases, setLatestReleases] = useState<Subtitle[]>([]);
  const [trendingNow, setTrendingNow] = useState<Subtitle[]>([]);
  const [top10, setTop10] = useState<Subtitle[]>([]);
  const [actionMovies, setActionMovies] = useState<Subtitle[]>([]);
  const [tvSeries, setTvSeries] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch latest
        const latestQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'), 
          limit(15)
        );
        const latestSnap = await getDocs(latestQuery);
        const latestSubs = latestSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        
        if (latestSubs.length > 0) {
          // Pick a random one from the latest 5 for featured to keep it fresh
          const featuredIndex = Math.floor(Math.random() * Math.min(5, latestSubs.length));
          setFeatured(latestSubs[featuredIndex]);
          setLatestReleases(latestSubs.filter((_, i) => i !== featuredIndex));
        }

        // Fetch top 10 (most downloaded)
        const top10Query = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('downloadCount', 'desc'), 
          limit(10)
        );
        const top10Snap = await getDocs(top10Query);
        setTop10(top10Snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));

        // Fetch trending (highest rated)
        const trendingQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          orderBy('averageRating', 'desc'), 
          limit(12)
        );
        const trendingSnap = await getDocs(trendingQuery);
        setTrendingNow(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));

        // Fetch Action movies
        const actionQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          where('genres', 'array-contains', 'Action'), 
          limit(12)
        );
        const actionSnap = await getDocs(actionQuery);
        setActionMovies(actionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));

        // Fetch TV Series
        const seriesQuery = query(
          collection(db, 'subtitles'), 
          where('status', '==', 'approved'),
          where('type', '==', 'series'), 
          limit(12)
        );
        const seriesSnap = await getDocs(seriesQuery);
        setTvSeries(seriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));

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
          <img 
            src="/logo.png" 
            alt="LAKSUB"
            className="h-12 w-auto object-contain" 
          />
        </motion.div>
      </div>
    );
  }

  const renderTop10 = () => {
    if (top10.length === 0) return null;
    return (
      <section className="mb-12 relative z-30">
        <h2 className="text-xl md:text-2xl font-black mb-4 text-white px-4 md:px-12 flex items-center gap-2 uppercase tracking-tighter">
          Top 10 in Sri Lanka Today
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-4 md:px-12 hide-scrollbar snap-x">
          {top10.map((sub, index) => (
            <Link key={sub.id} href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
              <motion.div 
                whileHover={{ scale: 1.05, zIndex: 50 }}
                className="flex-none w-64 md:w-80 h-40 md:h-48 relative group cursor-pointer snap-start flex items-end"
              >
                <div className="absolute left-0 bottom-0 text-[120px] md:text-[200px] font-black leading-[0.7] text-black stroke-white stroke-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] z-10 select-none opacity-80 group-hover:opacity-100 transition-opacity"
                     style={{ WebkitTextStroke: '3px rgba(255,255,255,0.6)', color: 'transparent' }}>
                  {index + 1}
                </div>
                <div className="ml-20 md:ml-28 w-full h-full rounded-md overflow-hidden border border-white/10 shadow-2xl relative">
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
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  const renderRow = (title: string, subtitles: Subtitle[]) => {
    if (subtitles.length === 0) return null;

    const groupedContent: (Subtitle & { isGroup?: boolean })[] = [];
    const seriesTitles = new Set();

    subtitles.forEach(sub => {
      if (sub.type === 'series') {
        if (!seriesTitles.has(sub.movieTitle)) {
          seriesTitles.add(sub.movieTitle);
          groupedContent.push({ ...sub, isGroup: true });
        }
      } else {
        groupedContent.push(sub);
      }
    });

    return (
      <section className="mb-12 relative z-30">
        <h2 className="text-xl md:text-2xl font-black mb-4 text-white px-4 md:px-12 uppercase tracking-tighter">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-4 md:px-12 hide-scrollbar snap-x">
          {groupedContent.map((sub) => (
            <Link 
              key={sub.id} 
              href={sub.isGroup ? `/series/${encodeURIComponent(sub.movieTitle)}` : (sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`)}
            >
              <motion.div 
                whileHover={{ scale: 1.1, zIndex: 50 }}
                transition={{ duration: 0.3 }}
                className="flex-none w-36 md:w-52 aspect-[2/3] relative group cursor-pointer snap-start rounded-md overflow-hidden shadow-lg border border-gray-800/50"
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
                {sub.proOnlyUntil && new Date(sub.proOnlyUntil) > new Date() && (
                  <div className="absolute top-2 right-2 bg-netflix-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-lg z-20">
                    PRO
                  </div>
                )}
              </motion.div>
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
        <link rel="canonical" href="https://laksub.com/" />
        
        <meta property="og:title" content="Sinhala Subtitles & Sinhala Sub | LAKSUB" />
        <meta property="og:description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
        <meta property="og:url" content="https://laksub.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://laksub.com/logo.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sinhala Subtitles & Sinhala Sub | LAKSUB" />
        <meta name="twitter:description" content="Download the best high-quality Sinhala subtitles (Sinhala sub) for English movies, TV series, Netflix originals, Korean dramas, and Anime at LAKSUB." />
        <meta name="twitter:image" content="https://laksub.com/logo.png" />
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
                    <img src="/logo.png" alt="LAKSUB" className="h-6 md:h-8 w-auto drop-shadow-md" referrerPolicy="no-referrer" />
                    <span className="text-[10px] md:text-sm font-black tracking-[0.2em] text-white/90 uppercase drop-shadow-md">Original</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-8xl font-black mb-3 md:mb-6 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] uppercase tracking-tighter leading-[0.85] text-white">
                    {featured.movieTitle}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-8">
                    {top10.some(t => t.id === featured.id) && (
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                        <div className="bg-netflix-red text-white p-0.5 md:p-1 rounded-sm">
                          <div className="text-[6px] md:text-[8px] font-black leading-none uppercase">Top</div>
                          <div className="text-xs md:text-sm font-black leading-none">10</div>
                        </div>
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-tighter">#1 in Sri Lanka Today</span>
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
                      <button className="btn-white text-xs md:text-sm pl-4 pr-5 py-2.5 md:py-3 rounded-[4px] md:rounded-md mt-0">
                        <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" /> 
                        <span>Download</span>
                      </button>
                    </Link>
                    <Link href={featured.type === 'series' ? `/series/${encodeURIComponent(featured.movieTitle)}` : (featured.slug ? `/subtitles/${featured.slug}` : `/subtitles/${featured.id}`)}>
                      <button className="btn-secondary text-xs md:text-sm pl-4 pr-5 py-2.5 md:py-3 rounded-[4px] md:rounded-md mt-0 bg-gray-500/30 font-bold border-0 hover:bg-gray-500/50">
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
    </main>
  );
};
