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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setUploadError('');
    try {
      const authRes = await fetch('/api/imagekit/auth');
      if (!authRes.ok) {
        throw new Error('Could not fetch ImageKit upload credentials. Ensure ImageKit env variables are configured.');
      }
      const authData = await authRes.json();
      const { token, expire, signature, publicKey } = authData;

      if (!publicKey) {
        throw new Error('ImageKit public key is not configured on the server. Please check your .env file.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `profile_${user.uid}_${Date.now()}.${file.name.split('.').pop()}`);
      formData.append('publicKey', publicKey);
      formData.append('signature', signature);
      formData.append('token', token);
      formData.append('expire', expire.toString());

      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload failed: ${errText || response.statusText}`);
      }

      const uploadResult = await response.json();
      setPhotoURL(uploadResult.url);
      setSuccessMessage('Photo uploaded successfully to ImageKit!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('ImageKit upload error:', err);
      setUploadError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

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
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-16 pt-8">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden bg-[#121212] border border-white/10">
                <img 
                  src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName)}&background=random`} 
                  alt={userData.displayName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <button 
                onClick={() => setActiveTab('settings')}
                className="absolute bottom-2 right-2 bg-white text-black p-3 rounded-full shadow-xl hover:scale-105 transition-transform"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 w-full md:pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{userData.displayName}</h1>
                <div className="flex items-center gap-2">
                  {userData.role === 'admin' && (
                    <span className="bg-netflix-red text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                  {userData.role === 'creator' && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Creator
                    </span>
                  )}
                  {(userData.totalUploads || 0) > 0 && <CreatorBadge uploadCount={userData.totalUploads || 0} />}
                </div>
              </div>
              <p className="text-gray-400 font-medium mb-4">{userData.email}</p>
              {userData.bio && (
                <p className="text-gray-300 font-medium mb-8 leading-relaxed max-w-2xl">
                  {userData.bio}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 md:gap-8">
                {userData.proExpiry && new Date(userData.proExpiry) > new Date() && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-yellow-500/80 font-bold tracking-widest uppercase mb-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Pro Expiry
                    </span>
                    <span className="text-xl font-bold text-yellow-500">
                      {userData.proExpiry ? new Date(userData.proExpiry).toLocaleDateString() : ''}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Uploads</span>
                  <span className="text-xl font-bold">{userData.totalUploads || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Downloads</span>
                  <span className="text-xl font-bold">
                    {userData.totalDownloads || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Balance</span>
                  <span className="text-xl font-bold text-green-500">${typeof userData.walletBalance === 'number' ? userData.walletBalance.toFixed(2) : '0.00'}</span>
                </div>

                <div className="md:ml-auto mt-4 md:mt-0">
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto scrollbar-hide pb-px">
          <button 
            onClick={() => setActiveTab('uploads')}
            className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'uploads' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Uploads</span>
            {activeTab === 'uploads' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'history' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><History className="w-4 h-4" /> History</span>
            {activeTab === 'history' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
          </button>
          <button 
            onClick={() => setActiveTab('watchlist')}
            className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'watchlist' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" /> Watchlist</span>
            {activeTab === 'watchlist' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
          </button>
          <button 
            onClick={() => setActiveTab('watched')}
            className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'watched' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Watched</span>
            {activeTab === 'watched' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors relative ${activeTab === 'settings' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
          >
            <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</span>
            {activeTab === 'settings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />}
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
                              <h3 className="font-bold text-lg uppercase tracking-tighter leading-none">{sub.movieTitle}</h3>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {sub.type === 'series' ? `S${sub.season} E${sub.episode}` : sub.releaseYear}
                              </p>
                            </div>
                            <div className={`absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-bold tracking-wide ${sub.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}>
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
                  className="flex flex-col"
                >
                  {history.length > 0 ? (
                    history.map((record, index) => (
                      <Link key={record.id} href={`/subtitles/${record.subtitleId}`}>
                        <div className={`group flex items-center justify-between py-5 -mx-4 px-4 transition-colors hover:bg-white/[0.02] cursor-pointer ${index !== history.length - 1 ? 'border-b border-white/5' : ''}`}>
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-[#141414] rounded-lg border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                              <Download className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-white transition-colors text-gray-200">{record.subtitleTitle}</h3>
                              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {record.downloadedAt ? new Date(record.downloadedAt).toLocaleDateString() : ''} 
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {record.isProDownload && (
                              <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-white/10">PRO</span>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-24 bg-[#141414]/50 rounded-2xl border border-white/5">
                      <History className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium text-lg">Your download history is empty.</p>
                      <Link href="/explore">
                        <button className="mt-6 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-gray-200 transition-colors">Explore Subtitles</button>
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
                      <h2 className="text-xl font-bold tracking-wide mb-4 flex items-center gap-2">
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
                    <h2 className="text-xl font-bold tracking-wide mb-4 flex items-center gap-2">
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
                                  <h3 className="font-bold text-lg uppercase tracking-tighter leading-none">{sub.movieTitle}</h3>
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
                              <h3 className="font-bold text-lg uppercase tracking-tighter leading-none">{sub.movieTitle}</h3>
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
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-medium tracking-tight mb-1">Account Settings</h2>
                      <p className="text-sm text-gray-500 mb-8">Update your personal information and profile appearance.</p>
                    </div>

                    {successMessage && (
                      <div className="bg-white/5 border border-white/10 text-white p-4 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> {successMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Display Name</label>
                        <input 
                          type="text" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-medium text-lg"
                          placeholder="Your Name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Custom Photo URL</label>
                        <input 
                          type="url" 
                          value={photoURL}
                          onChange={(e) => setPhotoURL(e.target.value)}
                          className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-medium text-lg"
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Upload Photo</label>
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#141414] border border-white/10 flex-shrink-0 flex items-center justify-center">
                          {photoURL ? (
                            <img src={photoURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                        <div 
                          className={`flex-1 w-full border border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/30 bg-transparent'}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => document.getElementById('profile-file-input')?.click()}
                        >
                          <input 
                            id="profile-file-input"
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }}
                          />
                          <Upload className={`w-5 h-5 mb-2 ${uploading ? 'text-white animate-bounce' : 'text-gray-500'}`} />
                          <p className="text-sm font-medium text-gray-300 text-center">
                            {uploading ? 'Uploading...' : 'Drag & drop photo, or click to browse'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Supports PNG, JPG, JPEG, GIF up to 5MB</p>
                        </div>
                      </div>
                      
                      {uploadError && (
                        <div className="text-xs text-red-400 mt-2">
                          {uploadError}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">Bio</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-transparent border-b border-white/20 px-0 py-3 text-white focus:outline-none focus:border-white transition-colors font-medium text-lg h-24 resize-none"
                        placeholder="Tell us about yourself..."
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-600 text-right">{bio.length}/200</p>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit"
                        disabled={updating}
                        className="bg-white text-black px-8 py-3 rounded-full font-bold tracking-wide hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
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
