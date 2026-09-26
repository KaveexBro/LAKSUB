import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  limit,
} from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Crown,
  Film,
  Tv,
  Coins,
  Sparkles,
  Flame,
  Check,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { SubtitleRequest } from '../types';
import { TMDBLiveSearch } from '../components/request/TMDBLiveSearch';
import { TierPointBadge } from '../components/request/TierPointBadge';
import { TrendingRequestsBoard } from '../components/request/TrendingRequestsBoard';
import { PointManager } from '../services/PointManager';

export const RequestSubtitle: React.FC = () => {
  const { user, userData, isPro, signIn } = useAuth();

  // Selected media from TMDb
  const [selectedMedia, setSelectedMedia] = useState<{
    id: number;
    title: string;
    type: 'movie' | 'tv' | 'series';
    year: number | null;
    posterPath: string | null;
    overview: string;
  } | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'movie' | 'series'>('movie');
  const [year, setYear] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [boardRefreshTrigger, setBoardRefreshTrigger] = useState(0);

  const REQUIRED_FREE_POINTS = 50;
  const currentPoints = userData?.points ?? 100;

  // Sync selected media with form fields
  const handleSelectMedia = (media: {
    id: number;
    title: string;
    type: 'movie' | 'tv' | 'series';
    year: number | null;
    posterPath: string | null;
    overview: string;
  }) => {
    setSelectedMedia(media);
    setTitle(media.title);
    setType(media.type === 'tv' ? 'series' : 'movie');
    setYear(media.year ? media.year.toString() : '');
    setErrorMessage(null);
  };

  const handleClearMedia = () => {
    setSelectedMedia(null);
    setTitle('');
    setYear('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      signIn();
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter or select a movie or TV show title.');
      return;
    }

    // 1. Tier-based Point Verification
    if (!isPro && currentPoints < REQUIRED_FREE_POINTS) {
      setErrorMessage(
        `Insufficient point balance. You have ${currentPoints} PTS, but need at least ${REQUIRED_FREE_POINTS} PTS to request subtitles. Upgrade to Pro for unlimited requests or claim bonus points above.`
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const tmdbId = selectedMedia?.id || null;
      let existingDocSnap = null;

      // 2. Duplicate Prevention via TMDb ID (or matching title/type if no TMDb ID)
      if (tmdbId) {
        const q = query(
          collection(db, 'requests'),
          where('tmdbId', '==', tmdbId),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingDocSnap = snap.docs[0];
        }
      }

      const userRef = doc(db, 'users', user.uid);

      if (existingDocSnap) {
        // DUPLICATE DETECTED: Check if current user already upvoted
        const existingData = existingDocSnap.data();
        const upvotedByList: string[] = existingData.upvoted_by || [];

        if (upvotedByList.includes(user.uid)) {
          setErrorMessage(
            `"${existingData.title}" has already been requested and upvoted by you! It is currently ranked on the Trending Board.`
          );
          setLoading(false);
          return;
        }

        // User hasn't upvoted yet: Deduct points (if Free) and append upvote via PointManager
        if (!isPro) {
          await PointManager.deductPointsForRequest(
            user.uid,
            isPro,
            REQUIRED_FREE_POINTS,
            existingData.title
          );
        }

        const requestDocRef = doc(db, 'requests', existingDocSnap.id);
        await updateDoc(requestDocRef, {
          upvotes: increment(1),
          upvoted_by: arrayUnion(user.uid),
          updatedAt: new Date().toISOString(),
        });

        setSuccessMessage(
          `Duplicate detected! "${existingData.title}" was already on the board. We automatically added your upvote to boost its priority! ${
            !isPro ? `(${REQUIRED_FREE_POINTS} PTS deducted)` : ''
          }`
        );
      } else {
        // NEW REQUEST ENTRY
        if (!isPro) {
          await PointManager.deductPointsForRequest(
            user.uid,
            isPro,
            REQUIRED_FREE_POINTS,
            title.trim()
          );
        }

        await addDoc(collection(db, 'requests'), {
          tmdbId: tmdbId,
          title: title.trim(),
          type: type,
          year: year ? parseInt(year) : null,
          poster_path: selectedMedia?.posterPath || null,
          overview: selectedMedia?.overview || '',
          additionalInfo: additionalInfo.trim(),
          userId: user.uid,
          userName: userData?.displayName || user.displayName || 'Anonymous',
          userPhoto: userData?.photoURL || user.photoURL || null,
          isPro: isPro,
          status: 'pending',
          upvotes: 1,
          upvoted_by: [user.uid],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setSuccessMessage(
          `Request successfully submitted and published to the Trending Board! ${
            !isPro ? `(${REQUIRED_FREE_POINTS} PTS deducted)` : '(Pro priority queue)'
          }`
        );
      }

      // Reset form
      handleClearMedia();
      setAdditionalInfo('');
      setBoardRefreshTrigger((prev) => prev + 1);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 7000);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setErrorMessage('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-24">
      <Helmet>
        <title>Subtitle Request System & Trending Board - LAKSUB</title>
        <meta
          name="description"
          content="Request subtitles with live TMDb search, upvote community requests, and track subtitle translation progress in real time."
        />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 md:px-12 space-y-12">
        {/* Header Hero */}
        <div>
          <div className="flex items-center gap-2 text-netflix-red font-bold uppercase tracking-widest text-xs mb-2">
            <TrendingUp className="w-4 h-4" />
            Advanced Subtitle Request System
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Request <span className="text-netflix-red">Subtitles</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl leading-relaxed font-medium">
            Search movie or TV titles directly from TMDb, submit requests using your points or Pro membership, and upvote existing requests to accelerate translation.
          </p>
        </div>

        {/* Tier-based Point Badge & Status Card */}
        <TierPointBadge requiredPoints={REQUIRED_FREE_POINTS} />

        {/* Request Form Section */}
        <div className="bg-zinc-950/70 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-netflix-red/10 border border-netflix-red/20 flex items-center justify-center text-netflix-red">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Submit New Request</h2>
                <p className="text-xs text-zinc-400">
                  Search TMDb to automatically verify and pull poster and details.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
              <span>Cost:</span>
              <strong className={isPro ? 'text-emerald-400' : 'text-cyan-400'}>
                {isPro ? '0 Points (PRO)' : '50 Points (FREE)'}
              </strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. TMDb Live Search Input Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>1. TMDb Live Search & Selection</span>
                <span className="text-[10px] text-zinc-500 font-normal lowercase">
                  (auto-fetches poster, year, & metadata)
                </span>
              </label>

              <TMDBLiveSearch
                onSelect={handleSelectMedia}
                selectedMedia={selectedMedia}
                onClear={handleClearMedia}
                disabled={loading}
              />
            </div>

            {/* Manual details / Confirmation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inception"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Content Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('movie')}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-xs uppercase tracking-wider ${
                      type === 'movie'
                        ? 'bg-netflix-red border-netflix-red text-white shadow-lg shadow-red-900/30'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Film className="w-4 h-4" /> Movie
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('series')}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-xs uppercase tracking-wider ${
                      type === 'series'
                        ? 'bg-netflix-red border-netflix-red text-white shadow-lg shadow-red-900/30'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <Tv className="w-4 h-4" /> TV Series
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Release Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium text-sm"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                  Target Language / Version
                </label>
                <input
                  type="text"
                  defaultValue="Sinhala (WEB-DL / Bluray)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-zinc-300 focus:outline-none focus:border-netflix-red transition-colors font-medium text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                Additional Notes / Specific Requests (Optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Specific season/episode, release group (e.g. YTS, RARBG, AMZN), or notes for the subtitler..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium h-24 resize-none text-sm"
                disabled={loading}
              />
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-emerald-400 text-xs font-bold bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isPro && currentPoints < REQUIRED_FREE_POINTS)}
              className="w-full bg-netflix-red text-white py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl flex items-center justify-center gap-3 group text-sm cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                  {isPro
                    ? 'Submit Request (Pro Member • 0 Points)'
                    : `Submit Request (${REQUIRED_FREE_POINTS} Points Deducted)`}
                </>
              )}
            </button>
          </form>
        </div>

        {/* 3 & 4. Trending Requests Board & Live Progress Tracker */}
        <TrendingRequestsBoard refreshTrigger={boardRefreshTrigger} />
      </div>
    </div>
  );
};
export default RequestSubtitle;
