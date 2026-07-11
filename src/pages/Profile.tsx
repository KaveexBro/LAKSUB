import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Subtitle, DownloadRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  History, 
  Upload, 
  LogOut, 
  Camera, 
  CheckCircle2, 
  Download, 
  Star, 
  ChevronRight,
  Clock,
  ShieldCheck,
  Crown,
  Bookmark,
  CheckCircle,
  Film
} from 'lucide-react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';
import { CreatorBadge } from '../components/CreatorBadge';

export const Profile: React.FC = () => {
  const { user, userData, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'uploads' | 'history' | 'watchlist' | 'watched' | 'settings'>('uploads');
  const [uploads, setUploads] = useState<Subtitle[]>([]);
  const [history, setHistory] = useState<DownloadRecord[]>([]);
  const [watchlist, setWatchlist] = useState<Subtitle[]>([]);
  const [watched, setWatched] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || '');
      setBio(userData.bio || '');
    }
  }, [userData]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch User's Uploads
        const uploadsQuery = query(
          collection(db, 'subtitles'),
          where('authorUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const uploadsSnap = await getDocs(uploadsQuery);
        const uploadsData = uploadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        setUploads(uploadsData);

        const calculatedDownloads = uploadsData.reduce((sum, sub) => sum + (sub.downloadCount || 0), 0);
        const approvedCount = uploadsData.filter(s => s.status === 'approved').length;
        
        // Sync totalUploads and totalDownloads if mismatched
        if (userData && ((userData.totalUploads || 0) !== approvedCount || (userData.totalDownloads || 0) !== calculatedDownloads)) {
           try {
             await updateDoc(doc(db, 'users', user.uid), {
               totalUploads: approvedCount,
               totalDownloads: calculatedDownloads
             });
             // Update local state to reflect the change immediately
             userData.totalUploads = approvedCount;
             userData.totalDownloads = calculatedDownloads;
           } catch (e) {
             console.error("Error syncing stats:", e);
           }
        }

        // Fetch Download History
        const historyQuery = query(
          collection(db, 'downloads'),
          where('userId', '==', user.uid),
          orderBy('downloadedAt', 'desc'),
          limit(20)
        );
        const historySnap = await getDocs(historyQuery);
        const historyData = await Promise.all(historySnap.docs.map(async (d) => {
          const data = d.data();
          // Fetch subtitle title for the history record
          const subDoc = await getDocs(query(collection(db, 'subtitles'), where('__name__', '==', data.subtitleId)));
          const subTitle = subDoc.docs[0]?.data()?.movieTitle || 'Unknown Subtitle';
          return { id: d.id, ...data, subtitleTitle: subTitle } as DownloadRecord;
        }));
        setHistory(historyData);

        // Fetch Watchlist
        if (userData?.watchlist && userData.watchlist.length > 0) {
          const watchlistQuery = query(
            collection(db, 'subtitles'),
            where('__name__', 'in', userData.watchlist.slice(0, 10))
          );
          const watchlistSnap = await getDocs(watchlistQuery);
          setWatchlist(watchlistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));
        }

        // Fetch Watched
        if (userData?.watched && userData.watched.length > 0) {
          const watchedQuery = query(
            collection(db, 'subtitles'),
            where('__name__', 'in', userData.watched.slice(0, 10))
          );
          const watchedSnap = await getDocs(watchedQuery);
          setWatched(watchedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUpdating(true);
    setSuccessMessage('');
    try {
      await updateProfile(displayName, photoURL, bio);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (!user || !userData) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
          <Link href="/">
            <button className="bg-netflix-red text-white px-6 py-2 rounded font-bold">Go Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-12 px-4 md:px-12">
      <Helmet>
        <title>{userData.displayName} - Profile - LAKSUB</title>
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-netflix-red shadow-[0_0_30px_rgba(229,9,20,0.3)]">
              <img 
                src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=random`} 
                alt={userData.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={() => setActiveTab('settings')}
              className="absolute bottom-2 right-2 bg-netflix-red p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{userData.displayName}</h1>
              {userData.role === 'admin' && (
                <span className="bg-netflix-red text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest self-start md:self-center flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
              {userData.role === 'creator' && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest self-start md:self-center flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Creator
                </span>
              )}
              {(userData.totalUploads || 0) > 0 && <CreatorBadge uploadCount={userData.totalUploads || 0} />}
            </div>
            <p className="text-gray-400 font-medium mb-2">{userData.email}</p>
            {userData.bio && (
              <p className="text-gray-300 font-medium mb-6 italic max-w-xl line-clamp-2">"{userData.bio}"</p>
            )}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              {userData.proExpiry && new Date(userData.proExpiry) > new Date() && (
                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 px-4 py-2 rounded-xl border border-yellow-500/30">
                  <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Pro Expiry
                  </p>
                  <p className="text-xl font-black font-mono text-yellow-500">
                    {userData.proExpiry ? new Date(userData.proExpiry).toLocaleDateString() : ''}
                  </p>
                </div>
              )}
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Uploads</p>
                <p className="text-xl font-black font-mono">{userData.totalUploads || 0}</p>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Downloads</p>
                <p className="text-xl font-black font-mono">
                  {userData.totalDownloads || 0}
                </p>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Balance</p>
                <p className="text-xl font-black font-mono text-green-500">${typeof userData.walletBalance === 'number' ? userData.walletBalance.toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('uploads')}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'uploads' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Uploads</span>
            {activeTab === 'uploads' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-red" />}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2"><History className="w-4 h-4" /> History</span>
            {activeTab === 'history' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-red" />}
          </button>
          <button 
            onClick={() => setActiveTab('watchlist')}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'watchlist' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" /> Watchlist</span>
            {activeTab === 'watchlist' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-red" />}
          </button>
          <button 
            onClick={() => setActiveTab('watched')}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'watched' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Watched</span>
            {activeTab === 'watched' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-red" />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'settings' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</span>
            {activeTab === 'settings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-red" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'uploads' && (
                <motion.div 
                  key="uploads"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {uploads.length > 0 ? (
                    uploads.map((sub) => (
                      <Link key={sub.id} href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
                        <div className="group bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-netflix-red/50 transition-all cursor-pointer">
                          <div className="aspect-video relative overflow-hidden">
                            <img 
                              src={sub.backdropPath ? `https://image.tmdb.org/t/p/w500${sub.backdropPath}` : `https://picsum.photos/seed/${sub.id}/500/300`} 
                              alt={sub.movieTitle}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                              <h3 className="font-black text-lg uppercase tracking-tighter leading-none">{sub.movieTitle}</h3>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {sub.type === 'series' ? `S${sub.season} E${sub.episode}` : sub.releaseYear}
                              </p>
                            </div>
                            <div className={`absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${sub.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                              {sub.status}
                            </div>
                          </div>
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                <Download className="w-3 h-3 text-netflix-red" /> {sub.downloadCount || 0}
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                <Star className="w-3 h-3 text-yellow-500" /> {sub.averageRating.toFixed(1)}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-netflix-red transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                      <Upload className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">You haven't uploaded any subtitles yet.</p>
                      {userData.role !== 'user' && (
                        <Link href="/dashboard">
                          <button className="mt-4 bg-netflix-red text-white px-6 py-2 rounded font-bold">Upload Now</button>
                        </Link>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {history.length > 0 ? (
                    history.map((record) => (
                      <Link key={record.id} href={`/subtitles/${record.subtitleId}`}>
                        <div className="group bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-netflix-red/10 rounded-xl flex items-center justify-center border border-netflix-red/20">
                              <Download className="w-6 h-6 text-netflix-red" />
                            </div>
                            <div>
                              <h3 className="font-black text-lg uppercase tracking-tighter group-hover:text-netflix-red transition-colors">{record.subtitleTitle}</h3>
                              <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {record.downloadedAt ? new Date(record.downloadedAt).toLocaleDateString() : ''} at {record.downloadedAt ? new Date(record.downloadedAt).toLocaleTimeString() : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {record.isProDownload && (
                              <span className="bg-netflix-red text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">PRO</span>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-netflix-red transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                      <History className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">Your download history is empty.</p>
                      <Link href="/explore">
                        <button className="mt-4 bg-netflix-red text-white px-6 py-2 rounded font-bold">Explore Subtitles</button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'watchlist' && (
                <motion.div 
                  key="watchlist"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Series Watchlist */}
                  {userData.seriesWatchlist && userData.seriesWatchlist.length > 0 && (
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Film className="w-5 h-5 text-netflix-red" /> Series Watchlist
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {userData.seriesWatchlist.map((title) => (
                          <Link key={title} href={`/series/${encodeURIComponent(title)}`}>
                            <div className="bg-white/5 rounded-xl border border-white/5 p-4 hover:border-netflix-red transition-all cursor-pointer text-center">
                              <h3 className="font-bold text-sm uppercase tracking-tight line-clamp-2">{title}</h3>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subtitle Watchlist */}
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-netflix-red" /> Subtitle Watchlist
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {watchlist.length > 0 ? (
                        watchlist.map((sub) => (
                          <Link key={sub.id} href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
                            <div className="group bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-netflix-red/50 transition-all cursor-pointer">
                              <div className="aspect-video relative overflow-hidden">
                                <img 
                                  src={sub.backdropPath ? `https://image.tmdb.org/t/p/w500${sub.backdropPath}` : `https://picsum.photos/seed/${sub.id}/500/300`} 
                                  alt={sub.movieTitle}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4">
                                  <h3 className="font-black text-lg uppercase tracking-tighter leading-none">{sub.movieTitle}</h3>
                                  <p className="text-xs text-gray-400 mt-1 font-mono">
                                    {sub.type === 'series' ? `S${sub.season} E${sub.episode}` : sub.releaseYear}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                          <Bookmark className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-500 font-bold">Your watchlist is empty.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'watched' && (
                <motion.div 
                  key="watched"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {watched.length > 0 ? (
                    watched.map((sub) => (
                      <Link key={sub.id} href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
                        <div className="group bg-white/5 rounded-2xl border border-white/5 overflow-hidden hover:border-netflix-red/50 transition-all cursor-pointer">
                          <div className="aspect-video relative overflow-hidden">
                            <img 
                              src={sub.backdropPath ? `https://image.tmdb.org/t/p/w500${sub.backdropPath}` : `https://picsum.photos/seed/${sub.id}/500/300`} 
                              alt={sub.movieTitle}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                              <h3 className="font-black text-lg uppercase tracking-tighter leading-none">{sub.movieTitle}</h3>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {sub.type === 'series' ? `S${sub.season} E${sub.episode}` : sub.releaseYear}
                              </p>
                            </div>
                            <div className="absolute top-4 right-4 bg-green-500 p-1 rounded-full shadow-lg">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                      <CheckCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold">You haven't marked any subtitles as watched yet.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  <form onSubmit={handleUpdateProfile} className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-netflix-red" /> Account Settings
                    </h2>

                    {successMessage && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl flex items-center gap-3 animate-bounce">
                        <CheckCircle2 className="w-5 h-5" /> {successMessage}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Display Name</label>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium"
                        placeholder="Your Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Profile Photo URL</label>
                      <input 
                        type="url" 
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bio</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red transition-colors font-medium h-32 resize-none"
                        placeholder="Tell us about yourself..."
                        maxLength={200}
                      />
                      <p className="text-[10px] text-gray-600 text-right font-black uppercase tracking-widest">{bio.length}/200</p>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={updating}
                        className="w-full bg-netflix-red text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                      >
                        {updating ? 'Updating...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 pb-12">
        <AdZone zoneName="profile-bottom" />
      </div>
    </div>
  );
};
