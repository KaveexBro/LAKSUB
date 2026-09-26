import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  increment,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SubtitleRequest } from '../../types';
import { getTMDBImageUrl } from '../../services/tmdbService';
import { LiveProgressTracker } from './LiveProgressTracker';
import {
  Flame,
  ThumbsUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Languages,
  Film,
  Tv,
  Crown,
  Share2,
  User as UserIcon,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'wouter';

interface TrendingRequestsBoardProps {
  onSelectForForm?: (request: SubtitleRequest) => void;
  refreshTrigger?: number;
}

export const TrendingRequestsBoard: React.FC<TrendingRequestsBoardProps> = ({
  onSelectForForm,
  refreshTrigger = 0,
}) => {
  const { user, userData, signIn } = useAuth();
  const [requests, setRequests] = useState<SubtitleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'translating' | 'completed' | 'all' | 'mine'>('trending');
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});
  const [adminUpdatingId, setAdminUpdatingId] = useState<string | null>(null);

  const isAdmin = userData?.role === 'admin';

  // Real-time listener for requests
  useEffect(() => {
    setLoading(true);
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('upvotes', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: SubtitleRequest[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            tmdbId: data.tmdbId ?? null,
            userId: data.userId || '',
            userName: data.userName || 'Anonymous',
            userPhoto: data.userPhoto || null,
            isPro: data.isPro || false,
            title: data.title || '',
            type: data.type || 'movie',
            year: data.year ?? null,
            poster_path: data.poster_path || null,
            overview: data.overview || '',
            additionalInfo: data.additionalInfo || '',
            status: data.status || 'pending',
            upvotes: data.upvotes ?? (data.upvoted_by?.length || 1),
            upvoted_by: data.upvoted_by || (data.userId ? [data.userId] : []),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          } as SubtitleRequest;
        });
        setRequests(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching trending requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [refreshTrigger]);

  // Handle upvoting
  const handleUpvote = async (req: SubtitleRequest) => {
    if (!user) {
      signIn();
      return;
    }

    const hasUpvoted = req.upvoted_by?.includes(user.uid);
    if (hasUpvoted) {
      // User has already upvoted
      return;
    }

    setUpvotingIds((prev) => ({ ...prev, [req.id]: true }));

    // Optimistic UI update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              upvotes: (r.upvotes || 0) + 1,
              upvoted_by: [...(r.upvoted_by || []), user.uid],
            }
          : r
      )
    );

    try {
      const requestRef = doc(db, 'requests', req.id);
      await updateDoc(requestRef, {
        upvotes: increment(1),
        upvoted_by: arrayUnion(user.uid),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error upvoting request:', err);
      // Revert optimistic update on error
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                upvotes: Math.max(1, (r.upvotes || 1) - 1),
                upvoted_by: (r.upvoted_by || []).filter((id) => id !== user.uid),
              }
            : r
        )
      );
    } finally {
      setUpvotingIds((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  // Handle admin status update
  const handleAdminStatusChange = async (
    requestId: string,
    newStatus: 'pending' | 'translating' | 'completed'
  ) => {
    if (!isAdmin) return;
    setAdminUpdatingId(requestId);
    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      // Optimistic state
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Error updating status by admin:', err);
    } finally {
      setAdminUpdatingId(null);
    }
  };

  // Filtered requests based on active tab & search term
  const filteredRequests = requests.filter((req) => {
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = req.title.toLowerCase().includes(term);
      const matchYear = req.year ? req.year.toString().includes(term) : false;
      if (!matchTitle && !matchYear) return false;
    }

    // Tab filter
    if (activeTab === 'translating') {
      return req.status === 'translating' || req.status === 'in_progress';
    }
    if (activeTab === 'completed') {
      return req.status === 'completed';
    }
    if (activeTab === 'mine') {
      return user ? req.userId === user.uid || req.upvoted_by?.includes(user.uid) : false;
    }
    return true; // 'trending' or 'all'
  });

  return (
    <div className="w-full space-y-6">
      {/* Board Header & Controls */}
      <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-netflix-red font-bold text-xs uppercase tracking-widest mb-1">
              <Flame className="w-4 h-4 fill-netflix-red" />
              Community Subtitle Leaderboard
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Trending Subtitle Requests
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm mt-1">
              Upvote your favorite movies and series. Requests with the highest votes get priority translation!
            </p>
          </div>

          {/* Search within requests */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter requested titles..."
              className="w-full bg-black/40 border border-white/10 focus:border-netflix-red rounded-xl pl-10 pr-4 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'trending'
                ? 'bg-netflix-red text-white shadow-lg shadow-red-900/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Most Upvoted ({requests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('translating')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'translating'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            Translating Now (
            {requests.filter((r) => r.status === 'translating' || r.status === 'in_progress').length}
            )
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed ({requests.filter((r) => r.status === 'completed').length})
          </button>

          {user && (
            <button
              type="button"
              onClick={() => setActiveTab('mine')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto ${
                activeTab === 'mine'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              My Requests / Upvoted
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-zinc-950/50 border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-netflix-red mb-3" />
          <p className="text-zinc-400 text-sm font-medium">Loading trending subtitle requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-zinc-950/50 border border-white/5 rounded-3xl p-16 text-center">
          <Film className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No requests found</h3>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto">
            {searchTerm
              ? `No requests match "${searchTerm}". Try a different search or submit a new request!`
              : 'Be the first to submit a request and kick off the voting!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredRequests.map((req, idx) => {
              const hasUpvoted = user ? req.upvoted_by?.includes(user.uid) : false;
              const isUpvoting = upvotingIds[req.id];
              const rank = idx + 1;

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                  className={`bg-zinc-900/70 hover:bg-zinc-900 border rounded-3xl p-4 md:p-6 transition-all backdrop-blur-xl relative overflow-hidden group shadow-lg ${
                    hasUpvoted
                      ? 'border-netflix-red/30 shadow-red-950/10'
                      : rank === 1
                      ? 'border-amber-500/40 shadow-amber-950/20'
                      : rank === 2
                      ? 'border-zinc-400/40'
                      : rank === 3
                      ? 'border-amber-700/40'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Media Info & Poster */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Rank indicator */}
                      <div
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 border mt-1 shadow-md ${
                          rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/30'
                            : rank === 2
                            ? 'bg-zinc-300/20 text-zinc-200 border-zinc-400/40'
                            : rank === 3
                            ? 'bg-amber-700/20 text-amber-500 border-amber-700/40'
                            : 'bg-black/40 text-zinc-500 border-white/5'
                        }`}
                      >
                        #{rank}
                      </div>

                      {/* Poster Thumbnail */}
                      <div className="w-16 h-24 md:w-20 md:h-28 bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-lg relative group/poster">
                        {req.poster_path ? (
                          <img
                            src={getTMDBImageUrl(req.poster_path, 'w500')}
                            alt={req.title}
                            className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            {req.type === 'series' || req.type === 'tv' ? (
                              <Tv className="w-6 h-6" />
                            ) : (
                              <Film className="w-6 h-6" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              req.type === 'series' || req.type === 'tv'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-netflix-red/20 text-netflix-red border border-netflix-red/30'
                            }`}
                          >
                            {req.type === 'series' || req.type === 'tv' ? 'TV Series' : 'Movie'}
                          </span>

                          {req.year && (
                            <span className="text-xs text-zinc-400 font-semibold">{req.year}</span>
                          )}

                          {req.isPro && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Pro Requested
                            </span>
                          )}

                          {req.tmdbId && (
                            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
                              TMDb #{req.tmdbId}
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-white text-base md:text-xl tracking-tight leading-snug line-clamp-1 group-hover:text-netflix-red transition-colors">
                          {req.title}
                        </h3>

                        {req.overview && (
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed hidden sm:block">
                            {req.overview}
                          </p>
                        )}

                        {req.additionalInfo && (
                          <p className="text-[11px] text-zinc-500 italic mt-1 line-clamp-1">
                            Note: "{req.additionalInfo}"
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                          <span>
                            Requested by <strong className="text-zinc-300">{req.userName}</strong>
                          </span>
                          <span>•</span>
                          <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Upvote Button & Action Controls */}
                    <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-3 flex-shrink-0 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                      {/* Upvote Button */}
                      <button
                        type="button"
                        onClick={() => handleUpvote(req)}
                        disabled={hasUpvoted || isUpvoting}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl active:scale-95 ${
                          hasUpvoted
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
                            : 'bg-netflix-red hover:bg-red-700 text-white border border-netflix-red hover:shadow-red-900/40 cursor-pointer'
                        }`}
                      >
                        {isUpvoting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ThumbsUp
                            className={`w-4 h-4 ${hasUpvoted ? 'fill-emerald-400' : ''}`}
                          />
                        )}
                        <span>{req.upvotes || 1}</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {hasUpvoted ? 'Upvoted' : 'Upvote'}
                        </span>
                      </button>

                      {/* If completed, show link to search on platform */}
                      {req.status === 'completed' && (
                        <Link href={`/explore?q=${encodeURIComponent(req.title)}`}>
                          <button
                            type="button"
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> View Subtitle
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Live Progress Tracker Roadmap Attached to each card */}
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <LiveProgressTracker
                      status={req.status}
                      requestId={req.id}
                      isAdmin={isAdmin}
                      onStatusChange={
                        isAdmin ? (newStatus) => handleAdminStatusChange(req.id, newStatus) : undefined
                      }
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
