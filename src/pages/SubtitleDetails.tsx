import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { doc, getDoc, updateDoc, increment, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Subtitle, Rating } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Star, Clock, AlertCircle, Crown, Users, Calendar, Film, Play, Info, ThumbsUp, MessageSquare, Share2, Flag, CheckCircle2, ArrowRight, ChevronRight, Heart, Award, ShieldCheck, Zap, X, ArrowLeft, Copy, Send, Bookmark, CheckCircle, Video } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet-async';
import { getTMDBDetails, getTMDBImageUrl, getTMDBEpisodeDetails } from '../services/tmdbService';
import TMDBLanguageBadge from '../components/TMDBLanguageBadge';
import { AdZone } from '../components/AdZone';
import { VastPlayer } from '../components/VastPlayer';
import { CreatorBadge } from '../components/CreatorBadge';
import { SchemaInjector } from '../components/SchemaInjector';
import { SubtitleComments } from '../components/SubtitleComments';

export const SubtitleDetails: React.FC<{ params?: { id?: string, slug?: string } }> = ({ params }) => {
  const [matchId, paramsId] = useRoute<{ id: string }>('/subtitle/:id');
  const [matchSlug, paramsSlug] = useRoute<{ slug: string }>('/subtitles/:slug');
  const [matchMovies, paramsMovies] = useRoute<{ slug: string }>('/movies/:slug');
  const [matchTvSeries, paramsTvSeries] = useRoute<{ slug: string }>('/tv-series/:slug');
  
  const id = params?.id || paramsId?.id;
  const slug = params?.slug || paramsSlug?.slug || paramsMovies?.slug || paramsTvSeries?.slug;
  const identifier = id || slug;

  const { user, userData, isPro, signIn, verifyAge } = useAuth();
  
  const [subtitle, setSubtitle] = useState<Subtitle | null>(null);
  const [tmdbData, setTmdbData] = useState<any>(null);
  const [episodeData, setEpisodeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(15);
  const [canDownload, setCanDownload] = useState(false);
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);
  const [telegramCountdown, setTelegramCountdown] = useState<number | null>(null);
  const [canDownloadTelegram, setCanDownloadTelegram] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [error, setError] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'broken_link' | 'inappropriate' | 'wrong_content' | 'other'>('broken_link');
  const [reportMessage, setReportMessage] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [verifyingAge, setVerifyingAge] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showWatchOnlineModal, setShowWatchOnlineModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isSeriesWatchlisted, setIsSeriesWatchlisted] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [startTimer, setStartTimer] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [tipIndex, setTipIndex] = useState(0);
  const [smartlinkEnabled, setSmartlinkEnabled] = useState(true);
  const [vastVideoEnabled, setVastVideoEnabled] = useState(true);
  const [showVastPlayer, setShowVastPlayer] = useState(false);
  const [authorUploadCount, setAuthorUploadCount] = useState<number>(0);

  useEffect(() => {
    const fetchGlobalAds = async () => {
      try {
        const adDoc = await getDoc(doc(db, 'settings', 'global_ads'));
        if (adDoc.exists()) {
          setSmartlinkEnabled(adDoc.data().smartlink !== false);
          setVastVideoEnabled(adDoc.data().vastVideo !== false);
        }
      } catch (err) {
        console.error("Failed to fetch global ad settings", err);
      }
    };
    fetchGlobalAds();
  }, []);

  const LAKSUB_TIPS = [
    "LAKSUB is the largest Sinhala subtitle community in the world.",
    "Pro members get instant downloads without any waiting time.",
    "You can request subtitles for any movie or TV series in the Request section.",
    "Our creators work hard to provide high-quality translations for you.",
    "Sharing LAKSUB with your friends helps the community grow!",
    "You can earn money by becoming a LAKSUB creator.",
    "Check out the 'Top 10' section to see what's trending today.",
    "Don't forget to rate the subtitles to help other users.",
  ];

  const PREPARING_STEPS = [
    "Connecting to secure server...",
    "Scanning for malware...",
    "Optimizing download speed...",
    "Verifying file integrity...",
    "Generating secure link...",
  ];

  useEffect(() => {
    if (userData && subtitle) {
      setIsWatchlisted(userData.watchlist?.includes(subtitle.id) || false);
      setIsWatched(userData.watched?.includes(subtitle.id) || false);
      setIsSeriesWatchlisted(userData.seriesWatchlist?.includes(subtitle.movieTitle) || false);
    }
  }, [userData, subtitle]);

  const toggleWatchlist = async () => {
    if (!user || !userData || !subtitle) {
      signIn();
      return;
    }

    const newWatchlist = isWatchlisted
      ? (userData.watchlist || []).filter(id => id !== subtitle.id)
      : [...(userData.watchlist || []), subtitle.id];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        watchlist: newWatchlist
      });
    } catch (err) {
      console.error("Error updating watchlist:", err);
    }
  };

  const toggleWatched = async () => {
    if (!user || !userData || !subtitle) {
      signIn();
      return;
    }

    const newWatched = isWatched
      ? (userData.watched || []).filter(id => id !== subtitle.id)
      : [...(userData.watched || []), subtitle.id];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        watched: newWatched
      });
    } catch (err) {
      console.error("Error updating watched list:", err);
    }
  };

  const toggleSeriesWatchlist = async () => {
    if (!user || !userData || !subtitle) {
      signIn();
      return;
    }

    const newSeriesWatchlist = isSeriesWatchlisted
      ? (userData.seriesWatchlist || []).filter(title => title !== subtitle.movieTitle)
      : [...(userData.seriesWatchlist || []), subtitle.movieTitle];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        seriesWatchlist: newSeriesWatchlist
      });
    } catch (err) {
      console.error("Error updating series watchlist:", err);
    }
  };

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      setError("Invalid subtitle link.");
      return;
    }
    
    const fetchSubtitle = async () => {
      try {
        let subData: Subtitle | null = null;

        if (slug) {
          const q = query(collection(db, 'subtitles'), where('slug', '==', slug));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            subData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Subtitle;
          }
        } else if (id) {
          const docRef = doc(db, 'subtitles', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            subData = { id: docSnap.id, ...docSnap.data() } as Subtitle;
          }
        }
        
        if (subData) {
          // Fetch monetization setting
          const monetizationDoc = await getDoc(doc(db, 'settings', 'monetization'));
          const isMonetizationEnabled = monetizationDoc.exists() ? monetizationDoc.data().enabled : false;
          setMonetizationEnabled(isMonetizationEnabled);
          
          // If monetization is disabled, allow instant download
          if (!isMonetizationEnabled) {
            setCanDownload(true);
            setCountdown(0);
          }

          // If subtitle is pending, only allow admin or author to see it
          if (subData.status === 'pending') {
            const isAdmin = userData?.role === 'admin';
            const isAuthor = user?.uid === subData.authorUid;
            
            if (!isAdmin && !isAuthor) {
              setError("This subtitle is pending approval.");
              setLoading(false);
              return;
            }
          }

          setSubtitle(subData);

          // Fetch Author's Upload Count
          if (subData.authorUid) {
            try {
              const authorDoc = await getDoc(doc(db, 'users', subData.authorUid));
              if (authorDoc.exists()) {
                setAuthorUploadCount(authorDoc.data().totalUploads || 0);
              }
            } catch (err) {
              console.error("Error fetching author data:", err);
            }
          }

          // If adult content and user not verified, show age modal
          if (subData.isAdult && !userData?.isAdultVerified) {
            setIsAgeModalOpen(true);
          }

          // Fetch TMDB data if available
          if (subData.tmdbId) {
            try {
              const tmdb = await getTMDBDetails(subData.tmdbId, subData.type === 'series' ? 'tv' : 'movie');
              setTmdbData(tmdb);

              // If it's an episode, fetch episode specific details
              if (subData.type === 'series' && subData.season && subData.episode) {
                const epData = await getTMDBEpisodeDetails(subData.tmdbId, subData.season, subData.episode);
                setEpisodeData(epData);
              }
            } catch (tmdbErr) {
              console.error("Error fetching TMDB details:", tmdbErr);
              // Don't fail the whole page if TMDB fails
            }
          }
          
          if (user) {
            const q = query(collection(db, 'ratings'), where('userId', '==', user.uid), where('subtitleId', '==', subData.id));
            const ratingSnap = await getDocs(q);
            if (!ratingSnap.empty) {
              const existingRating = ratingSnap.docs[0].data() as Rating;
              setUserRating(existingRating.rating);
              setCommentInput(existingRating.comment || '');
            }
          }

          // Fetch all ratings for this subtitle
          const ratingsQuery = query(collection(db, 'ratings'), where('subtitleId', '==', subData.id));
          const ratingsSnap = await getDocs(ratingsQuery);
          const ratingsList = ratingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
          setRatings(ratingsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else {
          setError("Subtitle not found.");
        }
      } catch (err) {
        console.error("Error fetching subtitle:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubtitle();
  }, [identifier, user, userData?.role]);

  const autoTriggered = React.useRef(false);

  useEffect(() => {
    if (!startTimer || isPro || canDownload || !subtitle) return;
    
    setIsPreparing(true);
    autoTriggered.current = false;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % LAKSUB_TIPS.length);
    }, 4000);
    
    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [startTimer, isPro, canDownload, subtitle]);

  // Handle countdown finishing
  useEffect(() => {
    if (countdown === 0 && startTimer && !canDownload) {
      setCanDownload(true);
      setIsPreparing(false);
      setStartTimer(false);
    }
  }, [countdown, startTimer, canDownload]);

  // Automatically trigger download logic once countdown finishes
  useEffect(() => {
    if (canDownload && !isPro && !isPreparing && !downloading && !autoTriggered.current) {
      autoTriggered.current = true;
      handleDownload();
    }
  }, [canDownload, isPro, isPreparing, downloading]);

  // Removed Monetag Vignette script to reduce popup spam
  // (User requested: "Popup ads and smart link ads are displayed too often")

  useEffect(() => {
    if (!showAdModal) return;
    
    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAdModal]);

  const handleTelegramDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user || !userData) {
      e.preventDefault();
      signIn();
      return;
    }

    if (!subtitle?.telegramLink) return;

    if (isPro) {
      return; // Let the default anchor behavior work
    }

    // Free user logic
    if (canDownloadTelegram) {
      return; // Let the default anchor behavior work
    }

    // Start 5-second countdown
    setTelegramCountdown(5);
    const timer = setInterval(() => {
      setTelegramCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setCanDownloadTelegram(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDownload = async () => {
    if (!user || !userData) {
      signIn();
      return;
    }

    if (subtitle?.proOnlyUntil && new Date(subtitle.proOnlyUntil) > new Date() && !isPro) {
      setError("This subtitle is currently exclusive to Pro members.");
      return;
    }

    if (!isPro && !canDownload) {
      if (vastVideoEnabled) {
        setShowAdModal(true);
        setAdCountdown(5); // fallback if not vast
      } else {
        setStartTimer(true);
      }
      return;
    }

    if (!isPro) {
      const today = new Date().toISOString().split('T')[0];
      let newCount = userData.dailyDownloadCount;
      
      if (userData.lastDownloadResetDate !== today) {
        newCount = 0;
      }
      
      if (newCount >= 10) {
        setError("You have reached your daily download limit of 10. Upgrade to Pro for unlimited downloads.");
        return;
      }
      
      try {
        setDownloading(true);
        await updateDoc(doc(db, 'users', user.uid), {
          dailyDownloadCount: newCount + 1,
          lastDownloadResetDate: today
        });
      } catch (err) {
        console.error("Error updating download count:", err);
        setDownloading(false);
        return;
      }
    }

    // Logic to track download for monetization and eligibility
    if (subtitle?.authorUid) {
      try {
        const downloadId = `${user.uid}_${subtitle.id}`;
        const downloadRef = doc(db, 'downloads', downloadId);
        const downloadSnap = await getDoc(downloadRef);
        
        // Only count if this is the first time this user is downloading this subtitle
        if (!downloadSnap.exists()) {
          const batch = writeBatch(db);
          
          // Record the download
          batch.set(downloadRef, {
            userId: user.uid,
            subtitleId: subtitle.id,
            creatorId: subtitle.authorUid,
            downloadedAt: new Date().toISOString(),
            isProDownload: isPro, // Track if it was a Pro user for Revenue Pool
            adPaidStatus: 'unpaid',
            proPaidStatus: 'unpaid'
          });
          
          // Increment totalDownloads for the creator (for eligibility)
          const creatorRef = doc(db, 'users', subtitle.authorUid);
          batch.update(creatorRef, {
            totalDownloads: increment(1)
          });
          
          await batch.commit();
        }
      } catch (err) {
        console.error("Error tracking download:", err);
      }
    }

    // Increment download count for the subtitle
    try {
      if (subtitle) {
        await updateDoc(doc(db, 'subtitles', subtitle.id), {
          downloadCount: increment(1)
        });
      }
    } catch (err) {
      console.error("Error updating subtitle download count:", err);
    }

    setDownloading(false);
    if (!isPro && subtitle?.downloadLink && smartlinkEnabled) {
      // Open the smartlink in a new tab for monetization
      window.open('https://www.effectivecpmnetwork.com/auymixv5?key=8420b1fc07ee9c8e8df17949358221b7', '_blank');
      // Trigger the file download in the current window to not block popup constraints
      window.location.href = subtitle.downloadLink;
    } else {
      window.open(subtitle?.downloadLink, '_blank');
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      signIn();
      return;
    }
    setSelectedRating(rating);
    setShowCommentInput(true);
  };

  const submitRating = async () => {
    if (!user || selectedRating === 0 || !subtitle) return;
    
    setIsRatingLoading(true);
    try {
      const ratingId = `${user.uid}_${subtitle.id}`;
      const ratingRef = doc(db, 'ratings', ratingId);
      
      const ratingData: Omit<Rating, 'id'> = {
        userId: user.uid,
        userName: userData?.displayName || 'Anonymous',
        userPhoto: userData?.photoURL || '',
        subtitleId: subtitle.id,
        rating: selectedRating,
        comment: commentInput,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(ratingRef, ratingData);
      
      setUserRating(selectedRating);
      
      // Update subtitle average rating
      const isNewRating = userRating === 0;
      const newCount = isNewRating ? subtitle.ratingCount + 1 : subtitle.ratingCount;
      const newTotal = (subtitle.averageRating * subtitle.ratingCount) - userRating + selectedRating;
      const newAverage = newTotal / newCount;
      
      await updateDoc(doc(db, 'subtitles', subtitle.id), {
        averageRating: newAverage,
        ratingCount: newCount
      });
      
      // Notify the creator
      if (subtitle.authorUid && subtitle.authorUid !== user.uid) {
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          userId: subtitle.authorUid,
          title: 'New Rating Received',
          message: `${userData?.displayName || 'A user'} rated your subtitle "${subtitle.movieTitle}" ${selectedRating} stars.`,
          type: 'rating',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/subtitles/${subtitle.id}`
        });
      }

      setSubtitle({ ...subtitle, averageRating: newAverage, ratingCount: newCount });

      // Refresh ratings list
      const ratingsQuery = query(collection(db, 'ratings'), where('subtitleId', '==', subtitle.id));
      const ratingsSnap = await getDocs(ratingsQuery);
      const ratingsList = ratingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
      setRatings(ratingsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      setShowCommentInput(false);
    } catch (err) {
      console.error("Error rating:", err);
    } finally {
      setIsRatingLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subtitle) {
      signIn();
      return;
    }

    setReporting(true);
    try {
      const reportRef = doc(collection(db, 'reports'));
      await setDoc(reportRef, {
        userId: user.uid,
        userName: userData?.displayName || 'Anonymous',
        subtitleId: subtitle.id,
        subtitleTitle: subtitle.movieTitle,
        reason: reportReason,
        message: reportMessage,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
        setReportMessage('');
      }, 2000);
    } catch (err) {
      console.error("Error reporting subtitle:", err);
    } finally {
      setReporting(false);
    }
  };

  const handleVerifyAge = async () => {
    setVerifyingAge(true);
    try {
      await verifyAge();
      setIsAgeModalOpen(false);
    } catch (err) {
      console.error("Error verifying age:", err);
    } finally {
      setVerifyingAge(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${fullTitle} Subtitles - LAKSUB`,
      text: `Check out these Sinhala subtitles for ${fullTitle} on LAKSUB!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Error sharing:", err);
          setIsShareModalOpen(true);
        }
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-netflix-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div></div>;
  if (!subtitle) return <div className="min-h-screen bg-netflix-bg text-white flex items-center justify-center">Subtitle not found</div>;

  const isProOnly = subtitle.proOnlyUntil && new Date(subtitle.proOnlyUntil) > new Date();
  const posterUrl = subtitle.posterPath 
    ? getTMDBImageUrl(subtitle.posterPath) 
    : `https://picsum.photos/seed/${(subtitle.movieTitle || '').replace(/\s+/g, '')}/600/900`;
  
  const backdropUrl = subtitle.backdropPath 
    ? getTMDBImageUrl(subtitle.backdropPath, 'original') 
    : `https://picsum.photos/seed/${(subtitle.movieTitle || '').replace(/\s+/g, '')}/1920/1080`;

  const fullTitle = subtitle.type === 'series' && subtitle.season && subtitle.episode 
    ? `${subtitle.movieTitle} S${subtitle.season.toString().padStart(2, '0')}E${subtitle.episode.toString().padStart(2, '0')}`
    : subtitle.movieTitle;

  const seoTitle = `${fullTitle} Sinhala Subtitles | ${subtitle.movieTitle} Sinhala Sub | LAKSUB`;
  const plainTextDescription = (subtitle.description || '').replace(/<[^>]*>?/gm, '').substring(0, 160) || `Download high-quality Sinhala subtitles for ${fullTitle} (${subtitle.releaseYear}). Latest ${subtitle.type === 'movie' ? 'movie' : 'TV series'} Sinhala sub available at LakSub.`;
  const seoDescription = `Download high-quality Sinhala subtitles for ${fullTitle} (${subtitle.releaseYear}). ${plainTextDescription}`;
  const keywordsList = `${fullTitle} Sinhala Subtitles, ${subtitle.movieTitle} Sinhala Sub, ${fullTitle} Sinhala Subtitle, download ${subtitle.movieTitle} Sinhala Subtitles, Sinhala subtitles, Sinhala sub, LAKSUB`;
  
  const canonicalUrl = `https://laksub.com/subtitles/${subtitle.slug || subtitle.id}`;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": subtitle.type === 'movie' ? 'Movie' : 'TVEpisode',
    "name": fullTitle,
    "dateCreated": subtitle.releaseYear?.toString(),
    "image": posterUrl,
    "description": seoDescription,
    "url": canonicalUrl,
    "inLanguage": "si",
    "genre": tmdbData?.genres?.map((g: any) => g.name).join(', ') || ''
  };

  if (subtitle.averageRating && subtitle.ratingCount > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": subtitle.averageRating.toFixed(1),
      "ratingCount": subtitle.ratingCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  if (tmdbData?.credits?.cast && tmdbData.credits.cast.length > 0) {
    structuredData.actor = tmdbData.credits.cast.slice(0, 5).map((actor: any) => ({
      "@type": "Person",
      "name": actor.name
    }));
  }

  if (tmdbData?.credits?.crew) {
    const director = tmdbData.credits.crew.find((c: any) => c.job === 'Director');
    if (director) {
      structuredData.director = {
        "@type": "Person",
        "name": director.name
      };
    }
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://laksub.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": subtitle.type === 'movie' ? "Movies" : "TV Series",
        "item": `https://laksub.com/${subtitle.type === 'movie' ? 'movies' : 'series'}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": fullTitle,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <article className="min-h-screen bg-netflix-bg text-white pb-12">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={keywordsList} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={posterUrl || undefined} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content={subtitle.type === 'movie' ? 'video.movie' : 'video.episode'} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={posterUrl || undefined} />
      </Helmet>

      <SchemaInjector schemaData={structuredData} type="video" />
      <SchemaInjector schemaData={breadcrumbData} type="breadcrumb" />

      {/* Hero Backdrop */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute top-28 left-4 md:left-12 z-40">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all group transform-gpu backface-hidden"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Back</span>
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-bg via-netflix-bg/40 to-transparent z-10" />
        <img 
          src={backdropUrl || undefined} 
          alt={subtitle.movieTitle}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
          fetchPriority="high"
        />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 md:px-12 -mt-40 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          
            {/* Poster */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl relative border border-white/10 group"
              >
                <img 
                  src={posterUrl || undefined} 
                  alt={subtitle.movieTitle}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {isProOnly && (
                  <div className="absolute top-4 right-4 bg-netflix-red text-white text-[10px] font-black px-3 py-1.5 rounded-sm uppercase tracking-widest shadow-lg z-10">
                    Pro Only
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">Official Poster</p>
                </div>
              </motion.div>

              {/* Episode Thumbnail - Only for series */}
              {subtitle.type === 'series' && episodeData?.still_path && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 aspect-video rounded-xl overflow-hidden shadow-2xl relative border border-white/10 group"
                >
                  <img 
                    src={getTMDBImageUrl(episodeData.still_path) || undefined} 
                    alt={episodeData.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black text-white border border-white/10 shadow-lg transform-gpu backface-hidden">
                    EP {subtitle.episode?.toString().padStart(2, '0')}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Episode Thumbnail</p>
                  </div>
                </motion.div>
              )}

            {/* TMDB Stats - Only for movies */}
            {subtitle.type === 'movie' && tmdbData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 space-y-4 bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-2xl transform-gpu backface-hidden"
              >
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> TMDB Rating</span>
                  <span className="text-white font-mono text-sm">{tmdbData.vote_average?.toFixed(1)} / 10</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4 text-netflix-red" /> Released</span>
                  <span className="text-white font-mono text-sm">{tmdbData.release_date || tmdbData.first_air_date}</span>
                </div>
                {tmdbData.runtime && (
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Runtime</span>
                    <span className="text-white font-mono text-sm">{tmdbData.runtime} min</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-7xl font-black mb-4 drop-shadow-2xl uppercase tracking-tighter leading-none">
                {subtitle.movieTitle}
                {subtitle.type === 'series' && subtitle.season && subtitle.episode && (
                  <span className="block text-2xl md:text-4xl text-gray-500 mt-2 font-mono">
                    S{subtitle.season.toString().padStart(2, '0')}E{subtitle.episode.toString().padStart(2, '0')}
                  </span>
                )}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm font-black mb-8 text-gray-400 uppercase tracking-widest">
                {subtitle.averageRating > 0 ? (
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(subtitle.averageRating) ? 'fill-yellow-500' : 'text-yellow-500/30'} ${star - subtitle.averageRating > 0 && star - subtitle.averageRating < 1 ? 'opacity-50 fill-yellow-500' : ''}`}
                      />
                    ))}
                    <span className="ml-1.5 font-bold">{subtitle.averageRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 bg-gray-500/10 px-3 py-1.5 rounded-full border border-gray-500/20 font-bold">
                    NOT RATED YET
                  </span>
                )}
                <span className="text-gray-600">|</span>
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-netflix-red" />
                  <span className="font-mono">{subtitle.downloadCount || 0}</span>
                </span>
                <span className="text-gray-600">|</span>
                <span>{subtitle.releaseYear}</span>
                <span className="text-gray-600">|</span>
                <span className="bg-white/10 px-2 py-1 rounded text-white">{subtitle.type || 'movie'}</span>
                <span className="text-gray-600">|</span>
                <span className="text-white">{subtitle.language} Subtitle</span>
                <span className="text-gray-600">|</span>
                <TMDBLanguageBadge tmdbId={subtitle.tmdbId} type={subtitle.type} className="bg-white/10 px-2 py-1 rounded text-white" />
                {tmdbData?.genres && tmdbData.genres.length > 0 && (
                  <>
                    <span className="text-gray-600">|</span>
                    <div className="flex flex-wrap gap-2">
                      {tmdbData.genres.map((genre: any) => (
                        <span key={genre.id} className="text-white/60 hover:text-white transition-colors cursor-default">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {subtitle.isAdult && (
                  <>
                    <span className="text-gray-600">|</span>
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-black">18+ ADULT</span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Storyline */}
            {((subtitle.type === 'movie' && tmdbData?.overview) || (subtitle.type === 'series' && episodeData?.overview)) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-100">
                  <Film className="w-5 h-5 text-netflix-red" /> Storyline
                </h2>
                <p className="text-gray-300 leading-loose text-lg italic">
                  "{subtitle.type === 'movie' ? tmdbData.overview : episodeData.overview}"
                </p>
              </div>
            )}

            {/* Parents Guide */}
            {(subtitle.parentalRating || subtitle.parentsGuide) && (
              <div className="mb-8 bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 transform-gpu backface-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-100">
                    <ShieldCheck className="w-5 h-5 text-netflix-red" /> Parents Guide
                  </h2>
                  {subtitle.parentalRating && (
                    <span className="bg-netflix-red text-white px-3 py-1 rounded font-black text-sm">
                      {subtitle.parentalRating}
                    </span>
                  )}
                </div>

                {subtitle.parentalDescription && (
                  <p className="text-gray-400 text-sm italic mb-6 border-b border-white/10 pb-4">
                    {subtitle.parentalDescription}
                  </p>
                )}

                {subtitle.parentsGuide && (
                  <div className="space-y-4">
                    {[
                      { label: 'Sex & Nudity', data: subtitle.parentsGuide.sex },
                      { label: 'Violence & Gore', data: subtitle.parentsGuide.violence },
                      { label: 'Profanity', data: subtitle.parentsGuide.profanity },
                      { label: 'Alcohol, Drugs & Smoking', data: subtitle.parentsGuide.alcohol },
                      { label: 'Frightening & Intense Scenes', data: subtitle.parentsGuide.frightening },
                    ].map((cat) => (
                      <div key={cat.label} className="group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <div className={`w-1.5 h-6 rounded-full ${
                                cat.data.severity === 'Severe' ? 'bg-red-600' :
                                cat.data.severity === 'Moderate' ? 'bg-orange-500' :
                                cat.data.severity === 'Mild' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <span className="font-bold text-gray-200">{cat.label}:</span>
                              <span className={`text-sm font-bold ${
                                cat.data.severity === 'Severe' ? 'text-red-500' :
                                cat.data.severity === 'Moderate' ? 'text-orange-400' :
                                cat.data.severity === 'Mild' ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                                {cat.data.severity}
                              </span>
                            </div>
                            {cat.data.description && (
                              <p className="text-xs text-gray-400 ml-4.5 leading-relaxed">
                                {cat.data.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <AdZone zoneName="subtitle-details-top" />

            <div className="mb-10">
              <div 
                className={`relative bg-[#272727] transition-colors rounded-xl p-4 md:p-6 text-gray-200 font-sinhala-text leading-relaxed overflow-hidden text-lg md:text-xl ${!isDescExpanded ? 'max-h-48' : ''}`}
              >
                {(() => {
                  const html = subtitle.description || 'No description available.';
                  const cleanHtml = DOMPurify.sanitize(html.replace(/&nbsp;|\u00A0/g, ' '));
                  
                  if (!isDescExpanded) {
                    return (
                      <div 
                        className="prose prose-invert max-w-none w-full break-words prose-p:mb-4 last:prose-p:mb-0 prose-a:text-blue-400 hover:prose-a:underline [&_a]:break-all text-lg md:text-xl text-gray-200 font-sinhala-text leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cleanHtml }} 
                      />
                    );
                  }

                  const paragraphs = cleanHtml.split('</p>');
                  
                  if (paragraphs.length <= 2) {
                    return (
                      <div 
                        className="prose prose-invert max-w-none w-full break-words prose-p:mb-4 last:prose-p:mb-0 prose-a:text-blue-400 hover:prose-a:underline [&_a]:break-all text-lg md:text-xl text-gray-200 font-sinhala-text leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cleanHtml }} 
                      />
                    );
                  }

                  const chunks = [];
                  let currentChunk = '';
                  
                  for (let i = 0; i < paragraphs.length; i++) {
                    currentChunk += paragraphs[i] + (i < paragraphs.length - 1 ? '</p>' : '');
                    
                    if ((i + 1) % 2 === 0 || i === paragraphs.length - 1) {
                      if (currentChunk.trim()) {
                        chunks.push(currentChunk);
                      }
                      currentChunk = '';
                    }
                  }

                  return (
                    <div className="flex flex-col gap-4">
                      {chunks.map((chunk, index) => (
                        <React.Fragment key={index}>
                          <div 
                            className="prose prose-invert max-w-none w-full break-words prose-p:mb-4 last:prose-p:mb-0 prose-a:text-blue-400 hover:prose-a:underline [&_a]:break-all text-lg md:text-xl text-gray-200 font-sinhala-text leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: chunk }} 
                          />
                          {index < chunks.length - 1 && index < 3 && (
                            <div className="my-2">
                              <AdZone zoneName={`subtitle-details-content-${index + 1}`} />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}
                
                {!isDescExpanded ? (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#272727] via-[#272727]/90 to-transparent flex items-end p-4 md:p-6 rounded-b-xl cursor-pointer"
                    onClick={() => setIsDescExpanded(true)}
                  >
                    <span className="text-white font-bold text-sm hover:underline">Show more</span>
                  </div>
                ) : (
                  <div 
                    className="mt-6 pt-4 border-t border-white/10 cursor-pointer"
                    onClick={() => setIsDescExpanded(false)}
                  >
                    <span className="text-white font-bold text-sm hover:underline">Show less</span>
                  </div>
                )}
              </div>
            </div>
            
            <AdZone zoneName="subtitle-details-middle" />

            {/* Cast Section - Only for movies */}
            {subtitle.type === 'movie' && tmdbData?.credits?.cast && tmdbData.credits.cast.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100">
                  <Users className="w-5 h-5 text-netflix-red" /> Top Cast
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                  {tmdbData.credits.cast.slice(0, 10).map((person: any) => (
                    <div key={person.id} className="flex-none w-24 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-2 border-2 border-gray-800 transform-gpu backface-hidden">
                        <img 
                          src={person.profile_path ? getTMDBImageUrl(person.profile_path) || undefined : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`} 
                          alt={person.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <p className="text-xs font-bold line-clamp-1">{person.name}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer Section - Only for movies */}
            {subtitle.type === 'movie' && tmdbData?.videos?.results && tmdbData.videos.results.length > 0 && (
              <div className="mb-10">
                {(() => {
                  const trailer = tmdbData.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || 
                                 tmdbData.videos.results.find((v: any) => v.site === 'YouTube');
                  
                  if (!trailer) return null;

                  return (
                    <>
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100">
                        <Play className="w-5 h-5 text-netflix-red" /> Official Trailer
                      </h2>
                      <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
                        <iframe
                          src={`https://www.youtube.com/embed/${trailer.key}`}
                          title="Movie Trailer"
                          className="w-full h-full"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="bg-[#121212] p-8 rounded-xl border border-gray-800 shadow-xl relative isolate transform-gpu w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <Link href={`/user/${subtitle.authorUid}`}>
                  <div className="flex items-center gap-4 cursor-pointer group">
                    <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-netflix-red transition-transform group-hover:scale-110 transform-gpu backface-hidden">
                      {subtitle.authorPhoto ? (
                        <img src={subtitle.authorPhoto || undefined} alt={subtitle.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                          {(subtitle.authorName || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Translated by</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-lg group-hover:text-netflix-red transition-colors">{subtitle.authorName}</p>
                        {authorUploadCount > 0 && <CreatorBadge uploadCount={authorUploadCount} />}
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex flex-col items-end">
                  <p className="text-sm text-gray-400 mb-2">Rate this subtitle</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-7 h-7 cursor-pointer transition-all hover:scale-110 ${star <= (showCommentInput ? selectedRating : userRating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600 hover:text-yellow-500'}`}
                        onClick={() => handleRate(star)}
                      />
                    ))}
                  </div>
                  
                  <AnimatePresence>
                    {showCommentInput && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full mt-4 space-y-3"
                      >
                        <textarea
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment (optional)..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium h-24 resize-none text-sm"
                        />
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => setShowCommentInput(false)}
                            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={submitRating}
                            disabled={isRatingLoading}
                            className="bg-netflix-red text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                          >
                            {isRatingLoading ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col items-end mt-1">
                    <span className="text-xs text-gray-500">{subtitle.ratingCount} community ratings</span>
                    <span className="text-xs text-netflix-red font-bold mt-1 flex items-center gap-1">
                      <Download className="w-3 h-3" /> {subtitle.downloadCount || 0} Total Downloads
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md mb-6 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                  <p>{error}</p>
                </div>
              )}

              <AdZone zoneName="subtitle-details" />

              <div className="flex flex-col sm:flex-row flex-wrap gap-6 items-center relative z-10">
                {!user ? (
                  <button onClick={signIn} className="btn-primary w-full sm:w-auto">
                    Sign in to Download
                  </button>
                ) : isProOnly && !isPro ? (
                  <div className="flex flex-col gap-4 w-full sm:w-auto">
                    <Link href="/upgrade" className="btn w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg hover:from-yellow-400 hover:to-yellow-500 hover:shadow-xl hover:-translate-y-0.5">
                      <Crown className="w-5 h-5" /> Upgrade to Pro
                    </Link>
                    <p className="text-xs text-gray-500 font-bold text-center sm:text-left">
                      Available for Free users on: {new Date(subtitle.proOnlyUntil!).toLocaleString()}
                    </p>
                  </div>
                ) : isPro || canDownload || (!isPreparing && !startTimer) ? (
                  <div className="flex flex-col w-full sm:w-auto gap-4 mt-6">
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
                      <button 
                        onClick={handleDownload} 
                        disabled={downloading}
                        className="btn-primary w-full sm:w-auto"
                      >
                        <Download className="w-5 h-5" /> {downloading ? 'Preparing...' : 'Download Subtitle'}
                      </button>
                      {subtitle.watchOnlineLink && (
                        <button 
                          onClick={() => setShowWatchOnlineModal(true)}
                          className="btn-white w-full sm:w-auto"
                        >
                          <Play className="w-5 h-5" /> Watch Online
                        </button>
                      )}
                    </div>
                    {(subtitle.videoLinks?.raw?.p480 || subtitle.videoLinks?.raw?.p720 || subtitle.videoLinks?.raw?.p1080 || subtitle.videoLinks?.hardcoded?.p480 || subtitle.videoLinks?.hardcoded?.p720 || subtitle.videoLinks?.hardcoded?.p1080) && (
                      <Link href={subtitle.slug ? `/subtitles/${subtitle.slug}/video` : `/subtitle/${subtitle.id}/video`}>
                        <button className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 font-bold bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border-0 py-3 rounded-lg shadow-lg">
                          <Video className="w-5 h-5" /> Download Video
                        </button>
                      </Link>
                    )}
                  </div>
                ) : isPreparing ? (
                  <div className="w-full max-w-2xl mx-auto aspect-video rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden bg-black">
                    <VastPlayer 
                      vastUrl="https://scrawnyslice.com/d.mLFsz/d/GhNpvAZZGeUJ/RetmA9buuZhUbl/k/PuT/c/xNMUDsESx/N/D/UltoNXzdE-wOMZTxE/0/OiQN"
                      onFinished={() => setCountdown(0)}
                      onSkip={() => setCountdown(0)}
                    />
                  </div>
                ) : (
                  <button disabled className="btn-secondary w-full sm:w-auto">
                    <Clock className="w-5 h-5" /> Wait {countdown}s
                  </button>
                )}

                <button 
                  onClick={handleShare}
                  className="btn-secondary w-full sm:w-auto"
                >
                  <Share2 className="w-5 h-5" /> Share
                </button>

                {subtitle.telegramLink && (
                  <a
                    id="telegram-download"
                    href={canDownloadTelegram || isPro ? subtitle.telegramLink : "#telegram-download"}
                    target={canDownloadTelegram || isPro ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!canDownloadTelegram && !isPro) {
                        // Let the event bubble so Monetag can intercept it
                        handleTelegramDownload(e);
                      } else {
                        handleTelegramDownload(e);
                      }
                    }}
                    style={{ pointerEvents: telegramCountdown !== null && telegramCountdown > 0 ? 'none' : 'auto' }}
                    className={`btn w-full sm:w-auto bg-[#0088cc] text-white shadow-lg border border-[#0088cc] hover:bg-[#0077b3] hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden ${telegramCountdown !== null && telegramCountdown > 0 ? 'opacity-50' : ''}`}
                  >
                    {isPro && (
                      <span className="absolute top-1 right-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-tighter shadow-md">
                        <Crown className="w-2 h-2" /> Pro
                      </span>
                    )}
                    <Send className="w-5 h-5" /> 
                    {telegramCountdown !== null && telegramCountdown > 0 
                      ? `Wait ${telegramCountdown}s...` 
                      : canDownloadTelegram || isPro 
                        ? 'Open Telegram Link' 
                        : 'Download Movie/Series'}
                  </a>
                )}
              </div>

              <div className="flex flex-col w-full">
                {user && subtitle && (
                  <div className="flex flex-wrap gap-4 mt-8 w-full border-t border-white/5 pt-8">
                    <button 
                      onClick={toggleWatchlist}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-widest transition-all border ${
                        isWatchlisted 
                          ? 'bg-netflix-red text-white border-netflix-red' 
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
                      {isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>

                    <button 
                      onClick={toggleWatched}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-widest transition-all border ${
                        isWatched 
                          ? 'bg-green-600 text-white border-green-600' 
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 ${isWatched ? 'fill-current' : ''}`} />
                      {isWatched ? 'Watched' : 'Mark as Watched'}
                    </button>

                    {subtitle.type === 'series' && (
                      <button 
                        onClick={toggleSeriesWatchlist}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-widest transition-all border ${
                          isSeriesWatchlisted 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Film className={`w-5 h-5 ${isSeriesWatchlisted ? 'fill-current' : ''}`} />
                        {isSeriesWatchlisted ? 'Series in Watchlist' : 'Watchlist Series'}
                      </button>
                    )}
                  </div>
                )}
                
                {!isPro && user && monetizationEnabled && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-4 text-center sm:text-left leading-relaxed">
                    <p className="mb-1">Free users: 15s wait • 10 downloads/day</p>
                    <Link href="/upgrade" className="text-netflix-red hover:underline">Upgrade to Pro for instant access</Link>
                  </div>
                )}

                <div className="mt-8 flex justify-center sm:justify-start">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-2 text-gray-500 hover:text-netflix-red transition-colors text-xs font-black uppercase tracking-widest group"
                  >
                    <Flag className="w-4 h-4 group-hover:animate-bounce" /> Report this subtitle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-netflix-red" /> Community Reviews
          </h2>
          
          {ratings.length === 0 ? (
            <div className="bg-netflix-surface p-12 rounded-3xl border border-white/5 text-center">
              <p className="text-gray-500 font-medium">No reviews yet. Be the first to rate this subtitle!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ratings.map((rating) => (
                <motion.div 
                  key={rating.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-netflix-surface p-6 rounded-2xl border border-white/5 shadow-xl transform-gpu backface-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Link href={`/user/${rating.userId}`}>
                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/10 transition-transform group-hover:scale-110 transform-gpu backface-hidden">
                          {rating.userPhoto ? (
                            <img src={rating.userPhoto} alt={rating.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                              {(rating.userName || 'A').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-netflix-red transition-colors">{rating.userName}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(rating.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3 h-3 ${s <= rating.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-gray-300 text-sm leading-relaxed italic">
                      "{rating.comment}"
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Discussion Section */}
        {subtitle && <SubtitleComments subtitleId={subtitle.id} uploaderId={subtitle.authorUid} subtitleTitle={subtitle.movieTitle} />}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsReportModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-netflix-surface border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              {reportSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Report Submitted</h3>
                  <p className="text-gray-400 font-medium">Thank you for helping us keep LAKSUB safe. Our team will review your report shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <Flag className="w-6 h-6 text-netflix-red" /> Report Subtitle
                    </h3>
                    <button onClick={() => setIsReportModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleReport} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Reason for reporting</label>
                      <select 
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium appearance-none"
                        required
                      >
                        <option value="broken_link">Broken Download Link</option>
                        <option value="inappropriate">Inappropriate Content</option>
                        <option value="wrong_content">Wrong Subtitle for Movie/Series</option>
                        <option value="other">Other Issue</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Additional Details</label>
                      <textarea 
                        value={reportMessage}
                        onChange={(e) => setReportMessage(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium h-32 resize-none"
                        placeholder="Please provide more details about the problem..."
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={reporting}
                        className="btn-primary w-full"
                      >
                        {reporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsShareModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-netflix-surface border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Share2 className="w-6 h-6 text-netflix-red" /> Share Subtitle
                </h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-400 truncate font-mono">{window.location.href}</p>
                  <button 
                    onClick={handleCopyLink}
                    className="flex-shrink-0 bg-netflix-red text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    {copySuccess ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copySuccess ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 p-4 rounded-xl transition-all group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center bg-[#1877F2] rounded-sm text-white font-bold text-[10px]">f</div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Facebook</span>
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out these Sinhala subtitles for ${fullTitle} on LAKSUB!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 p-4 rounded-xl transition-all group"
                  >
                    <div className="w-5 h-5 flex items-center justify-center bg-[#1DA1F2] rounded-sm text-white font-bold text-[10px]">𝕏</div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Twitter</span>
                  </a>
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out these Sinhala subtitles for ${fullTitle} on LAKSUB! ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 p-4 rounded-xl transition-all group"
                  >
                    <MessageSquare className="w-5 h-5 text-[#25D366]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                  </a>
                  <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out these Sinhala subtitles for ${fullTitle} on LAKSUB!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 p-4 rounded-xl transition-all group"
                  >
                    <Send className="w-5 h-5 text-[#0088cc]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Telegram</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Age Verification Modal */}
      <AnimatePresence>
        {isAgeModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-netflix-surface border border-white/10 rounded-3xl p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/30">
                <ShieldCheck className="w-10 h-10 text-red-600" />
              </div>
              
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Mature Content</h3>
              <p className="text-gray-400 font-medium mb-8 leading-relaxed">
                This subtitle is for a movie or TV series that contains mature or adult content. You must be 18 years or older to view this content.
              </p>

              <div className="space-y-4">
                <button 
                  onClick={handleVerifyAge}
                  disabled={verifyingAge}
                  className="btn-primary w-full"
                >
                  {verifyingAge ? 'Verifying...' : 'I am 18 or older'}
                </button>
                <Link href="/home" className="block w-full text-gray-500 hover:text-white py-2 font-bold transition-colors">
                  Go back to Home
                </Link>
              </div>
              
              <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-widest font-black">
                By clicking "I am 18 or older", you confirm that you are of legal age to view mature content.
              </p>
            </motion.div>
          </div>
        )}



        {showAdModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-[100dvh] bg-black flex flex-col justify-center"
            >
              {!vastVideoEnabled && (
                <div className="absolute top-4 right-4 z-50">
                  <div className="flex items-center gap-4 bg-black/50 p-4 rounded-xl backdrop-blur-md transform-gpu backface-hidden">
                    <span className="text-sm font-bold text-gray-400">
                      {adCountdown > 0 ? `You can skip in ${adCountdown}s` : 'You can skip now'}
                    </span>
                    <button
                      onClick={() => {
                        setShowAdModal(false);
                        setStartTimer(true);
                      }}
                      disabled={adCountdown > 0}
                      className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm transition-all ${
                        adCountdown > 0 
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                          : 'bg-white text-black hover:scale-105 active:scale-95'
                      }`}
                    >
                      Skip Ad
                    </button>
                  </div>
                </div>
              )}
              
              <div className="w-full h-full bg-black flex items-center justify-center relative">
                {vastVideoEnabled ? (
                  <VastPlayer 
                    vastUrl="https://scrawnyslice.com/d.mLFsz/d/GhNpvAZZGeUJ/RetmA9buuZhUbl/k/PuT/c/xNMUDsESx/N/D/UltoNXzdE-wOMZTxE/0/OiQN"
                    onFinished={() => {
                        setShowAdModal(false);
                        setStartTimer(true);
                    }}
                    onSkip={() => {
                        setShowAdModal(false);
                        setStartTimer(true);
                    }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AdZone zoneName="download-popup" />
                    </div>
                    {/* Fallback content if AdZone is empty or loading */}
                    <div className="text-center p-8 z-[-1] mt-16 max-w-2xl mx-auto bg-netflix-surface border border-white/10 rounded-3xl">
                      <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4 opacity-50" />
                      <h4 className="text-2xl font-black uppercase tracking-tighter text-white/50 mb-2">Upgrade to Pro</h4>
                      <p className="text-gray-500 font-medium">Get instant downloads without ads or waiting times.</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Watch Online Modal */}
        {showWatchOnlineModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setShowWatchOnlineModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-netflix-surface border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white font-sinhala-text">කරුණාකර කියවන්න!</h3>
                <button onClick={() => setShowWatchOnlineModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-gray-300 font-medium leading-relaxed font-sinhala-text text-left text-lg">
                  මෙම 'Watch Online' සේවාව තෙවන පාර්ශවීය වෙබ් අඩවියක් මගින් ක්‍රියාත්මක වේ. එහි පළවන අධික දැන්වීම් (Ads) පාලනය කිරීමට අපට හැකියාවක් නොමැති බව කරුණාවෙන් සලකන්න.
                </p>
                <p className="text-gray-300 font-medium leading-relaxed font-sinhala-text text-left text-lg">
                  සුමට අත්දැකීමක් සඳහා Ad-blocker එකක් හෝ Brave Shield සක්‍රීය කර ගන්න. ඔබ ඉදිරියට යාමට සූදානම්ද?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <a 
                  href={subtitle?.watchOnlineLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowWatchOnlineModal(false)}
                  className="btn-primary w-full font-sinhala-text text-lg"
                >
                  ඉදිරියට යන්න
                </a>
                <button 
                  onClick={() => setShowWatchOnlineModal(false)}
                  className="btn-secondary w-full text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pb-10">
        <AdZone zoneName="subtitle-details-bottom" />
      </div>
    </article>
  );
};
