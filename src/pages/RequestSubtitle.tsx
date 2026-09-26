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

  // Mode: 'list' (default - browse & upvote) vs 'form' (submit new request)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [initialSearchTerm, setInitialSearchTerm] = useState('');

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

  // Handler when user wants to request from the list (e.g. empty search or button click)
  const handleOpenRequestForm = (suggestedTitle?: string) => {
    if (suggestedTitle && suggestedTitle.trim()) {
      setInitialSearchTerm(suggestedTitle.trim());
      setTitle(suggestedTitle.trim());
    } else {
      setInitialSearchTerm('');
    }
    setErrorMessage(null);
    setViewMode('form');
    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setInitialSearchTerm('');
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
        `Insufficient point balance. You have ${currentPoints} PTS, but need at least ${REQUIRED_FREE_POINTS} PTS to request subtitles. Upgrade to Pro for unlimited requests or claim bonus points.`
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

      if (existingDocSnap) {
        // DUPLICATE DETECTED: Check if current user already upvoted
        const existingData = existingDocSnap.data();
        const upvotedByList: string[] = existingData.upvoted_by || [];

        if (upvotedByList.includes(user.uid)) {
          setErrorMessage(
            `"${existingData.title}" has already been requested and upvoted by you! It is currently ranked on the Upvote Board.`
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
          `Already on the list! "${existingData.title}" was already requested. We added your upvote to accelerate its translation! ${
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
          `Request successfully submitted! "${title.trim()}" is now published on the Upvote Board for the community to vote on. ${
            !isPro ? `(${REQUIRED_FREE_POINTS} PTS deducted)` : '(Pro priority queue)'
          }`
        );
      }

      // Reset form and return to list
      handleClearMedia();
      setAdditionalInfo('');
      setBoardRefreshTrigger((prev) => prev + 1);
      setViewMode('list');

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
        <title>Subtitle Requests & Upvotes - LAKSUB</title>
        <meta
          name="description"
          content="Upvote requested subtitles or request new movies and TV shows for Sinhala subtitle translations."
        />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 md:px-12 space-y-8">
        {/* Header Hero */}
        <div>
          <div className="flex items-center gap-2 text-netflix-red font-bold uppercase tracking-widest text-xs mb-2">
            <TrendingUp className="w-4 h-4" />
            Community Subtitle Upvoting & Requests
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Subtitle <span className="text-netflix-red">Requests & Upvotes</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
            Browse requested titles below and upvote subtitles you want translated. Can't find what you are looking for? Submit a new subtitle request!
          </p>
        </div>

        {/* Global Success Banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-emerald-400 text-sm font-bold bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-xl"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Mode Switcher / Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/60 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-netflix-red text-white shadow-lg shadow-red-900/30'
                  : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame className="w-4 h-4" />
              Requested Subtitles List
            </button>

            <button
              type="button"
              onClick={() => handleOpenRequestForm()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'form'
                  ? 'bg-netflix-red text-white shadow-lg shadow-red-900/30'
                  : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-4 h-4" />
              Submit New Request
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-1 text-xs text-zinc-400">
            <span>Balance:</span>
            <strong className="text-white font-mono">{isPro ? 'PRO (Unlimited)' : `${currentPoints} PTS`}</strong>
          </div>
        </div>

        {/* Dynamic Content View */}
        {viewMode === 'form' ? (
          /* Request Form View */
          <div className="space-y-6">
            <TierPointBadge requiredPoints={REQUIRED_FREE_POINTS} />

            <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-netflix-red/10 border border-netflix-red/20 flex items-center justify-center text-netflix-red">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Submit New Subtitle Request</h2>
                    <p className="text-xs text-zinc-400">
                      Search TMDb to automatically verify metadata and add to the upvoting leaderboard.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ← Back to List
                </button>
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
                    initialSearchTerm={initialSearchTerm}
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

                {/* Submit and Cancel Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="sm:w-1/3 bg-white/5 hover:bg-white/10 text-zinc-300 py-4 rounded-2xl font-bold uppercase tracking-wider transition-colors text-sm border border-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (!isPro && currentPoints < REQUIRED_FREE_POINTS)}
                    className="sm:w-2/3 bg-netflix-red text-white py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl flex items-center justify-center gap-3 group text-sm cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                        {isPro
                          ? 'Publish Request (Pro • 0 Points)'
                          : `Publish Request (${REQUIRED_FREE_POINTS} Points)`}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Subtitle Upvoting List View (Primary view) */
          <div className="space-y-8">
            <TrendingRequestsBoard
              refreshTrigger={boardRefreshTrigger}
              onRequestNewClick={handleOpenRequestForm}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default RequestSubtitle;
