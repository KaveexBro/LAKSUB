import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Clock, CheckCircle2, AlertCircle, Crown, Film, Tv, History, Search } from 'lucide-react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { SubtitleRequest } from '../types';

export const RequestSubtitle: React.FC = () => {
  const { user, userData, isPro, signIn } = useAuth();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'movie' | 'series'>('movie');
  const [year, setYear] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [myRequests, setMyRequests] = useState<SubtitleRequest[]>([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    } else {
      setFetchingRequests(false);
    }
  }, [user]);

  const fetchMyRequests = async () => {
    try {
      const q = query(
        collection(db, 'requests'),
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      setMyRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubtitleRequest)));
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setFetchingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signIn();
      return;
    }

    if (!isPro) {
      setError("Only Pro members can request subtitles. Upgrade to unlock this feature!");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        userName: userData?.displayName || 'Anonymous',
        isPro: true,
        title,
        type,
        year: year ? parseInt(year) : null,
        additionalInfo,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setTitle('');
      setYear('');
      setAdditionalInfo('');
      fetchMyRequests();
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500 bg-yellow-500/10';
      case 'in_progress': return 'text-blue-500 bg-blue-500/10';
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'rejected': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-20">
      <Helmet>
        <title>Request Subtitles - LAKSUB</title>
        <meta name="description" content="Pro members can request subtitles for any movie or TV series. We prioritize and provide them quickly." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 md:px-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Request Form */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-netflix-red" />
                <span className="text-netflix-red font-black uppercase tracking-widest text-xs">Pro Exclusive Feature</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">
                Request <span className="text-netflix-red">Subtitles</span>
              </h1>
              <p className="text-gray-400 text-lg mb-10 font-medium leading-relaxed max-w-xl">
                Can't find what you're looking for? As a Pro member, you can request any movie or TV series, and our team will provide the subtitles quickly.
              </p>

              {!isPro && user && (
                <div className="bg-netflix-red/10 border border-netflix-red/20 p-6 rounded-2xl mb-10 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-netflix-red flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-netflix-red mb-1">Upgrade Required</h3>
                    <p className="text-gray-300 text-sm mb-4">Subtitle requests are exclusive to Pro members. Upgrade now to get priority access.</p>
                    <Link href="/upgrade">
                      <button className="bg-netflix-red text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all">
                        Upgrade to Pro
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 bg-netflix-surface/30 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Content Title</label>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Dark Knight"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium"
                      required
                      disabled={!isPro || loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Content Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setType('movie')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-sm ${type === 'movie' ? 'bg-netflix-red border-netflix-red text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20'}`}
                        disabled={!isPro || loading}
                      >
                        <Film className="w-4 h-4" /> Movie
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('series')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold text-sm ${type === 'series' ? 'bg-netflix-red border-netflix-red text-white' : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/20'}`}
                        disabled={!isPro || loading}
                      >
                        <Tv className="w-4 h-4" /> TV Series
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Release Year (Optional)</label>
                    <input 
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 2008"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium"
                      disabled={!isPro || loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Language / Version</label>
                    <input 
                      type="text"
                      placeholder="e.g. Sinhala (WEB-DL)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium"
                      disabled={!isPro || loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Additional Information</label>
                  <textarea 
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Any specific version or details you'd like to mention..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium h-32 resize-none"
                    disabled={!isPro || loading}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <AnimatePresence>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 p-4 rounded-xl border border-green-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Request submitted successfully! We'll notify you soon.
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit"
                  disabled={!isPro || loading}
                  className="w-full bg-netflix-red text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* My Requests Sidebar */}
          <div className="w-full lg:w-80">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-netflix-surface/50 backdrop-blur-xl rounded-3xl border border-white/5 p-8"
            >
              <h2 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" /> My Requests
              </h2>

              <div className="space-y-4">
                {fetchingRequests ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-netflix-red border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No requests yet</p>
                  </div>
                ) : (
                  myRequests.map((req) => (
                    <div key={req.id} className={`bg-black/20 p-4 rounded-xl border group hover:border-white/10 transition-colors ${req.isPro ? 'border-netflix-red/20' : 'border-white/5'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1">{req.title}</h3>
                          {req.isPro && (
                            <span className="flex items-center gap-0.5 text-[7px] font-black text-netflix-red uppercase tracking-tighter mt-0.5">
                              <Crown className="w-2 h-2" /> Priority Request
                            </span>
                          )}
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${getStatusColor(req.status)}`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <span className="uppercase">{req.type}</span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {user && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                    Pro requests are typically processed within 24-48 hours.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};
