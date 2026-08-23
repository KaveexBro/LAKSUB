import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, deleteDoc, getDoc, writeBatch, increment } from 'firebase/firestore';
import { Subtitle, Withdrawal, VideoDownloadOption } from '../types';
import { Plus, DollarSign, Upload, AlertCircle, CheckCircle2, Edit, Trash2, Download, Search, Film, Tv, ShieldCheck, X } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { EditSubtitleModal } from '../components/EditSubtitleModal';
import { searchTMDB, getTMDBImageUrl, TMDBMovie } from '../services/tmdbService';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { generateSlug, generateUniqueSlug } from '../utils/slugify';

import { CreatorWallet } from '../components/CreatorWallet';
import { Helmet } from 'react-helmet-async';

export const CreatorDashboard: React.FC = () => {
  const { settings } = useSiteSettings();
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'wallet' | 'subtitles'>('subtitles');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingSubtitle, setEditingSubtitle] = useState<Subtitle | null>(null);
  const [subtitleToDelete, setSubtitleToDelete] = useState<string | null>(null);
  
  // Upload Form State
  const [type, setType] = useState<'movie' | 'series'>('movie');
  const [movieTitle, setMovieTitle] = useState('');
  const [season, setSeason] = useState<number | ''>('');
  const [episode, setEpisode] = useState<number | ''>('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [language, setLanguage] = useState('Sinhala');
  const [genres, setGenres] = useState<string[]>(['Action']);
  const [genreInput, setGenreInput] = useState('');
  const [description, setDescription] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [watchOnlineLink, setWatchOnlineLink] = useState('');
  const [videoOptions, setVideoOptions] = useState<VideoDownloadOption[]>([]);

  const addVideoOption = () => {
    setVideoOptions([...videoOptions, {
      id: Date.now().toString() + Math.random().toString(),
      type: 'raw',
      resolution: '720p',
      sourceName: 'Telegram',
      url: ''
    }]);
  };

  const removeVideoOption = (id: string) => {
    setVideoOptions(videoOptions.filter(o => o.id !== id));
  };

  const updateVideoOption = (id: string, field: keyof VideoDownloadOption, value: string) => {
    setVideoOptions(videoOptions.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const [isProOnly, setIsProOnly] = useState(false);
  const [proOnlyUntil, setProOnlyUntil] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  // TMDB State
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TMDBMovie[]>([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [posterPath, setPosterPath] = useState('');
  const [backdropPath, setBackdropPath] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [parentalRating, setParentalRating] = useState('G');
  const [parentalDescription, setParentalDescription] = useState('');

  // Parents Guide State
  const [pgSexSeverity, setPgSexSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>('None');
  const [pgSexDescription, setPgSexDescription] = useState('');
  const [pgViolenceSeverity, setPgViolenceSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>('None');
  const [pgViolenceDescription, setPgViolenceDescription] = useState('');
  const [pgProfanitySeverity, setPgProfanitySeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>('None');
  const [pgProfanityDescription, setPgProfanityDescription] = useState('');
  const [pgAlcoholSeverity, setPgAlcoholSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>('None');
  const [pgAlcoholDescription, setPgAlcoholDescription] = useState('');
  const [pgFrighteningSeverity, setPgFrighteningSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>('None');
  const [pgFrighteningDescription, setPgFrighteningDescription] = useState('');

  useEffect(() => {
    if (type === 'movie') {
      setParentalRating('G');
    } else {
      setParentalRating('TV-G');
    }
  }, [type]);

  useEffect(() => {
    if (!user || (userData?.role !== 'creator' && userData?.role !== 'admin')) return;

    const fetchData = async () => {
      try {
        const subsQuery = query(collection(db, 'subtitles'), where('authorUid', '==', user.uid), orderBy('createdAt', 'desc'));
        const subsSnap = await getDocs(subsQuery);
        const fetchedSubtitles = subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
        setSubtitles(fetchedSubtitles);

        // Sync totalUploads and totalDownloads if it's out of sync
        const approvedCount = fetchedSubtitles.filter(s => s.status === 'approved').length;
        const calculatedDownloads = fetchedSubtitles.reduce((sum, sub) => sum + (sub.downloadCount || 0), 0);
        if (userData && ((userData.totalUploads || 0) !== approvedCount || (userData.totalDownloads || 0) !== calculatedDownloads)) {
          await updateDoc(doc(db, 'users', user.uid), {
            totalUploads: approvedCount,
            totalDownloads: calculatedDownloads
          });
        }

      } catch (err) {
        console.error("Error fetching creator data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userData]);

  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery.trim()) return;
    setSearchingTmdb(true);
    const results = await searchTMDB(tmdbSearchQuery, type === 'movie' ? 'movie' : 'tv');
    setTmdbResults(results);
    setSearchingTmdb(false);
  };

  const selectTmdbMovie = async (movie: TMDBMovie) => {
    setMovieTitle(movie.title || movie.name || '');
    const dateStr = movie.release_date || movie.first_air_date;
    if (dateStr) {
      setReleaseYear(new Date(dateStr).getFullYear());
    }
    setSelectedTmdbId(movie.id);
    setPosterPath(movie.poster_path);
    setBackdropPath(movie.backdrop_path);
    setTmdbResults([]);
    setTmdbSearchQuery('');

    // Fetch details to get genres
    try {
      const { getTMDBDetails } = await import('../services/tmdbService');
      const details = await getTMDBDetails(movie.id, type === 'movie' ? 'movie' : 'tv');
      if (details && details.genres) {
        setGenres(details.genres.map((g: any) => g.name));
      }
    } catch (err) {
      console.error("Error fetching TMDB genres:", err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    
    setUploading(true);
    setError('');
    setUploadSuccess(false);

    try {
      let proOnlyUntilVal = null;
      if (isProOnly && proOnlyUntil) {
        proOnlyUntilVal = new Date(proOnlyUntil).toISOString();
      }

      let baseSlug = generateSlug(movieTitle, releaseYear);
      if (type === 'series') {
        // Insert season and episode before '-sinhala-subtitles'
        const suffix = '-sinhala-subtitles';
        if (baseSlug.endsWith(suffix)) {
          baseSlug = baseSlug.slice(0, -suffix.length);
          if (season !== '') baseSlug += `-s${season}`;
          if (episode !== '') baseSlug += `-e${episode}`;
          baseSlug += suffix;
        }
      }
      
      const uniqueSlug = await generateUniqueSlug(baseSlug);

      const newSub: any = {
        type,
        slug: uniqueSlug,
        movieTitle,
        releaseYear,
        language,
        genres,
        description,
        downloadLink,
        authorUid: user.uid,
        authorName: userData.displayName || 'Anonymous',
        averageRating: 0,
        ratingCount: 0,
        downloadCount: 0,
        status: userData.role === 'admin' ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
        isAdult,
        parentalRating,
        parentalDescription,
        parentsGuide: {
          sex: { severity: pgSexSeverity, description: pgSexDescription },
          violence: { severity: pgViolenceSeverity, description: pgViolenceDescription },
          profanity: { severity: pgProfanitySeverity, description: pgProfanityDescription },
          alcohol: { severity: pgAlcoholSeverity, description: pgAlcoholDescription },
          frightening: { severity: pgFrighteningSeverity, description: pgFrighteningDescription },
        },
      };

      if (telegramLink) newSub.telegramLink = telegramLink;
      if (watchOnlineLink) newSub.watchOnlineLink = watchOnlineLink;
      
      const validVideoOptions = videoOptions.filter(o => o.url.trim() !== '' && o.sourceName.trim() !== '');
      if (validVideoOptions.length > 0) {
        newSub.videoOptions = validVideoOptions;
      }

      if (userData.photoURL) newSub.authorPhoto = userData.photoURL;
      if (selectedTmdbId) newSub.tmdbId = selectedTmdbId;
      if (posterPath) newSub.posterPath = posterPath;
      if (backdropPath) newSub.backdropPath = backdropPath;

      if (type === 'series') {
        if (season !== '') newSub.season = season;
        if (episode !== '') newSub.episode = episode;
      }

      if (proOnlyUntilVal) {
        newSub.proOnlyUntil = proOnlyUntilVal;
      }

      let docRef;
      try {
        const batch = writeBatch(db);
        docRef = doc(collection(db, 'subtitles'));
        batch.set(docRef, newSub);
        
        if (newSub.status === 'approved') {
          batch.update(doc(db, 'users', user.uid), {
            totalUploads: increment(1)
          });
        }
        
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'subtitles');
        return; // Should not reach here as handleFirestoreError throws
      }

      setSubtitles([{ id: docRef.id, ...newSub } as Subtitle, ...subtitles]);
      setUploadSuccess(true);
      
      // Reset form
      setMovieTitle('');
      setSeason('');
      setEpisode('');
      setGenres(['Action']);
      setDescription('');
      setDownloadLink('');
      setTelegramLink('');
      setWatchOnlineLink('');
      setIsProOnly(false);
      setProOnlyUntil('');
      setIsAdult(false);
      setParentalRating('G');
      setParentalDescription('');
      setPgSexSeverity('None');
      setPgSexDescription('');
      setPgViolenceSeverity('None');
      setPgViolenceDescription('');
      setPgProfanitySeverity('None');
      setPgProfanityDescription('');
      setPgAlcoholSeverity('None');
      setPgAlcoholDescription('');
      setPgFrighteningSeverity('None');
      setPgFrighteningDescription('');
      setSelectedTmdbId(null);
      setPosterPath('');
      setBackdropPath('');
      setVideoOptions([]);
    } catch (err: any) {
      console.error("Upload error:", err);
      try {
        const parsedError = JSON.parse(err.message);
        setError(`Upload failed: ${parsedError.error}`);
      } catch {
        setError("Failed to upload subtitle. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSubtitle = async (subtitleId: string) => {
    setSubtitleToDelete(subtitleId);
  };

  const confirmDelete = async () => {
    if (!subtitleToDelete) return;
    try {
      const sub = subtitles.find(s => s.id === subtitleToDelete);
      const batch = writeBatch(db);
      batch.delete(doc(db, 'subtitles', subtitleToDelete));
      
      if (sub && sub.status === 'approved' && user) {
        batch.update(doc(db, 'users', user.uid), {
          totalUploads: increment(-1)
        });
      }
      
      await batch.commit();
      setSubtitles(subs => subs.filter(s => s.id !== subtitleToDelete));
    } catch (err) {
      console.error("Error deleting subtitle:", err);
    } finally {
      setSubtitleToDelete(null);
    }
  };

  const handleSubtitleUpdate = (updatedSubtitle: Subtitle) => {
    setSubtitles(subs => subs.map(s => s.id === updatedSubtitle.id ? updatedSubtitle : s));
  };

  if (loading) return <div className="min-h-screen bg-netflix-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div></div>;

  if (userData?.role !== 'creator' && userData?.role !== 'admin') {
    return <div className="min-h-screen bg-netflix-bg text-white flex items-center justify-center">Access Denied. You must be a creator or admin.</div>;
  }

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-12 px-4 md:px-12">
      <Helmet>
        <title>Creator Dashboard - LAKSUB</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <img src={settings.logoUrl || "/logo.png"} alt="LAKSUB" className="h-8 w-auto" referrerPolicy="no-referrer" />
          Creator Dashboard
        </h1>
        
        <div className="flex gap-2 md:gap-4 mb-8 border-b border-gray-800 pb-4 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('subtitles')}
            className={`px-4 py-2 font-medium rounded-md transition-colors ${activeTab === 'subtitles' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            My Subtitles
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Upload New
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 font-medium rounded-md transition-colors ${activeTab === 'wallet' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Wallet & Earnings
          </button>
        </div>

        {activeTab === 'subtitles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subtitles.length === 0 ? (
              <p className="text-gray-500 col-span-full">You haven't uploaded any subtitles yet.</p>
            ) : (
              subtitles.map(sub => (
                <div key={sub.id} className="bg-netflix-surface p-4 rounded-lg border border-gray-800 flex flex-col">
                  <h3 className="font-bold text-lg mb-1 truncate">{sub.movieTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <span className="text-green-500 font-bold">{sub.averageRating.toFixed(1)} ★</span>
                    <span>({sub.ratingCount} ratings)</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {sub.downloadCount || 0}</span>
                    <span>•</span>
                    <span>{sub.releaseYear}</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      {sub.proOnlyUntil && new Date(sub.proOnlyUntil) > new Date() ? (
                        <span className="text-netflix-red font-bold text-xs uppercase">Pro Only</span>
                      ) : (
                        <span className="text-gray-400 text-xs uppercase">Public</span>
                      )}
                      <button 
                        onClick={() => setEditingSubtitle(sub)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {userData?.role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteSubtitle(sub.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-netflix-surface p-6 md:p-8 rounded-lg border border-gray-800 max-w-3xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Upload className="w-6 h-6" /> Upload Subtitle</h2>
            
            {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md mb-6 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>}
            {uploadSuccess && <div className="bg-green-900/50 border border-green-500 text-green-200 p-3 rounded-md mb-6 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Subtitle uploaded successfully!</div>}

            <form onSubmit={handleUpload} className="space-y-6">
              {/* TMDB Search Section */}
              <div className="bg-black/30 p-4 rounded-lg border border-gray-800 mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Search on TMDb (Auto-fill metadata)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      value={tmdbSearchQuery}
                      onChange={e => setTmdbSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleTmdbSearch())}
                      className="w-full bg-black border border-gray-700 rounded-md pl-10 pr-4 py-2 text-white focus:border-white focus:outline-none" 
                      placeholder={`Search ${type === 'movie' ? 'movie' : 'TV show'}...`}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleTmdbSearch}
                    disabled={searchingTmdb}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {searchingTmdb ? '...' : 'Search'}
                  </button>
                </div>

                {tmdbResults.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 hide-scrollbar">
                    {tmdbResults.map(movie => (
                      <div 
                        key={movie.id} 
                        onClick={() => selectTmdbMovie(movie)}
                        className="flex gap-3 bg-gray-900/50 p-2 rounded-md border border-gray-800 cursor-pointer hover:border-netflix-red transition-colors group"
                      >
                        <img 
                          src={getTMDBImageUrl(movie.poster_path)} 
                          alt={movie.title || movie.name} 
                          className="w-12 h-18 object-cover rounded"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-netflix-red transition-colors">{movie.title || movie.name}</p>
                          <p className="text-xs text-gray-500">{(movie.release_date || movie.first_air_date || '').split('-')[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTmdbId && (
                  <div className="mt-4 flex items-center gap-3 bg-green-900/20 p-3 rounded-md border border-green-500/30">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-400">Linked to TMDb: {movieTitle}</p>
                      <p className="text-xs text-gray-500">Metadata will be auto-filled and high-quality posters will be used.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedTmdbId(null);
                        setPosterPath('');
                        setBackdropPath('');
                      }}
                      className="text-xs text-gray-400 underline hover:text-white"
                    >
                      Unlink
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <select value={type} onChange={e => setType(e.target.value as 'movie' | 'series')} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none">
                    <option value="movie">Movie</option>
                    <option value="series">TV Series</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Movie / TV Show Title</label>
                  <input type="text" required value={movieTitle} onChange={e => setMovieTitle(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="e.g. Inception" />
                  {movieTitle && (
                    <p className="text-xs text-gray-500 mt-2">
                      Link Preview: <span className="text-gray-400">laksub.lk/subtitles/{(() => {
                        let preview = generateSlug(movieTitle, releaseYear);
                        if (type === 'series') {
                          const suffix = '-sinhala-subtitles';
                          if (preview.endsWith(suffix)) {
                            preview = preview.slice(0, -suffix.length);
                            if (season !== '') preview += `-s${season}`;
                            if (episode !== '') preview += `-e${episode}`;
                            preview += suffix;
                          }
                        }
                        return preview;
                      })()}</span>
                    </p>
                  )}
                </div>
                
                {type === 'series' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Season</label>
                      <input type="number" min="1" required value={season} onChange={e => setSeason(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Episode</label>
                      <input type="number" min="1" required value={episode} onChange={e => setEpisode(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="e.g. 1" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Release Year</label>
                  <input type="number" required value={releaseYear} onChange={e => setReleaseYear(e.target.value === '' ? 2024 : parseInt(e.target.value))} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none">
                    <option value="Sinhala">Sinhala</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">TMDb ID (Optional)</label>
                  <input 
                    type="number" 
                    value={selectedTmdbId || ''} 
                    onChange={e => setSelectedTmdbId(e.target.value === '' ? null : parseInt(e.target.value))} 
                    className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" 
                    placeholder="e.g. 27205"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Genres</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {genres.map(g => (
                      <span key={g} className="bg-netflix-red/20 text-netflix-red px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        {g}
                        <button type="button" onClick={() => setGenres(genres.filter(x => x !== g))} className="hover:text-white">&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={genreInput} 
                      onChange={e => setGenreInput(e.target.value)} 
                      onKeyDown={e => {
                        if (e.key === 'Enter' && genreInput.trim()) {
                          e.preventDefault();
                          if (!genres.includes(genreInput.trim())) {
                            setGenres([...genres, genreInput.trim()]);
                          }
                          setGenreInput('');
                        }
                      }}
                      className="flex-1 bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" 
                      placeholder="Add genre (press Enter)" 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (genreInput.trim() && !genres.includes(genreInput.trim())) {
                          setGenres([...genres, genreInput.trim()]);
                          setGenreInput('');
                        }
                      }}
                      className="bg-gray-800 px-3 rounded-md hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Download Link (Google Drive, Mega, etc.)</label>
                <input type="text" required value={downloadLink} onChange={e => setDownloadLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="https://..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telegram Movie/Series Link (Optional)</label>
                <input type="text" value={telegramLink} onChange={e => setTelegramLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="https://t.me/..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Watch Online Link (Optional)</label>
                <input type="text" value={watchOnlineLink} onChange={e => setWatchOnlineLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="https://..." />
              </div>

              <div className="bg-black/20 p-4 rounded-lg border border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Video Download Links (Optional)</h3>
                  <button type="button" onClick={addVideoOption} className="btn-secondary text-xs px-3 py-1">
                    + Add Link
                  </button>
                </div>
                
                {videoOptions.length === 0 && (
                  <p className="text-sm text-gray-500">No video download links added.</p>
                )}
                
                <div className="space-y-4">
                  {videoOptions.map((option, index) => (
                    <div key={option.id} className="p-4 bg-black/40 rounded-lg border border-gray-800 space-y-3 relative">
                      <button 
                        type="button" 
                        onClick={() => removeVideoOption(option.id)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pr-8">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                          <select 
                            value={option.type} 
                            onChange={(e) => updateVideoOption(option.id, 'type', e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-md px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                          >
                            <option value="raw">Raw</option>
                            <option value="hardcoded">Hardcoded</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Resolution</label>
                          <select 
                            value={option.resolution} 
                            onChange={(e) => updateVideoOption(option.id, 'resolution', e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-md px-2 py-2 text-sm text-white focus:border-white focus:outline-none"
                          >
                            <option value="480p">480p</option>
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Source Name</label>
                          <input 
                            type="text" 
                            value={option.sourceName} 
                            onChange={(e) => updateVideoOption(option.id, 'sourceName', e.target.value)}
                            placeholder="e.g. Telegram, Pixeldrain"
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Video Format (Optional)</label>
                          <input 
                            type="text" 
                            value={option.videoType || ''} 
                            onChange={(e) => updateVideoOption(option.id, 'videoType', e.target.value)}
                            placeholder="e.g. WEBRip, BluRay"
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">File Size (Optional)</label>
                          <input 
                            type="text" 
                            value={option.videoSize || ''} 
                            onChange={(e) => updateVideoOption(option.id, 'videoSize', e.target.value)}
                            placeholder="e.g. 1.5 GB"
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Extra Details (Optional)</label>
                          <input 
                            type="text" 
                            value={option.additionalDetails || ''} 
                            onChange={(e) => updateVideoOption(option.id, 'additionalDetails', e.target.value)}
                            placeholder="e.g. 10-bit, x265"
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">URL</label>
                        <input 
                          type="text" 
                          value={option.url} 
                          onChange={(e) => updateVideoOption(option.id, 'url', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description (Rich Text)</label>
                <div className="bg-white text-black rounded-md overflow-hidden">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} className="h-48 mb-12" />
                </div>
              </div>

              <div className="space-y-4 bg-black/30 p-4 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isProOnly" 
                    checked={isProOnly} 
                    onChange={e => setIsProOnly(e.target.checked)}
                    className="w-5 h-5 rounded bg-black border-gray-700 text-netflix-red focus:ring-netflix-red"
                  />
                  <label htmlFor="isProOnly" className="text-sm font-medium text-gray-300">
                    Pro-Only Early Access
                    <span className="block text-xs text-gray-500 font-normal">Lock out Free Tier users temporarily to drive Pro conversions.</span>
                  </label>
                </div>

                {isProOnly && (
                  <div className="ml-8 pt-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Expiry Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required={isProOnly}
                      value={proOnlyUntil} 
                      onChange={e => setProOnlyUntil(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1 italic">After this date, the subtitle will become available to everyone.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-black/30 p-4 rounded-lg border border-gray-800">
                <input 
                  type="checkbox" 
                  id="isAdult" 
                  checked={isAdult} 
                  onChange={e => setIsAdult(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border-gray-700 text-netflix-red focus:ring-netflix-red"
                />
                <label htmlFor="isAdult" className="text-sm font-medium text-gray-300">
                  Adult Content (18+)
                  <span className="block text-xs text-gray-500 font-normal">Mark this if the movie/series contains mature or adult content.</span>
                </label>
              </div>

              <div className="bg-black/30 p-4 rounded-lg border border-gray-800 space-y-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-netflix-red" /> Parents Guide
                </h3>

                {/* General Content Rating */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">General Content Rating</label>
                    <select 
                      value={parentalRating} 
                      onChange={e => setParentalRating(e.target.value)} 
                      className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none text-sm"
                    >
                      {type === 'movie' ? (
                        <>
                          <option value="G">G - General Audiences</option>
                          <option value="PG">PG - Parental Guidance Suggested</option>
                          <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                          <option value="R">R - Restricted</option>
                          <option value="NC-17">NC-17 - Adults Only</option>
                        </>
                      ) : (
                        <>
                          <option value="TV-Y">TV-Y - All Children</option>
                          <option value="TV-Y7">TV-Y7 - Directed to Older Children</option>
                          <option value="TV-G">TV-G - General Audience</option>
                          <option value="TV-PG">TV-PG - Parental Guidance Suggested</option>
                          <option value="TV-14">TV-14 - Parents Strongly Cautioned</option>
                          <option value="TV-MA">TV-MA - Mature Audience Only</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">General Summary</label>
                    <input 
                      type="text" 
                      value={parentalDescription} 
                      onChange={e => setParentalDescription(e.target.value)} 
                      className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none text-sm" 
                      placeholder="e.g. Mild violence, language" 
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Detailed Categories</h4>
                  {[
                    { label: 'Sex & Nudity', state: pgSexSeverity, setState: setPgSexSeverity, desc: pgSexDescription, setDesc: setPgSexDescription },
                    { label: 'Violence & Gore', state: pgViolenceSeverity, setState: setPgViolenceSeverity, desc: pgViolenceDescription, setDesc: setPgViolenceDescription },
                    { label: 'Profanity', state: pgProfanitySeverity, setState: setPgProfanitySeverity, desc: pgProfanityDescription, setDesc: setPgProfanityDescription },
                    { label: 'Alcohol, Drugs & Smoking', state: pgAlcoholSeverity, setState: setPgAlcoholSeverity, desc: pgAlcoholDescription, setDesc: setPgAlcoholDescription },
                    { label: 'Frightening & Intense Scenes', state: pgFrighteningSeverity, setState: setPgFrighteningSeverity, desc: pgFrighteningDescription, setDesc: setPgFrighteningDescription },
                  ].map((cat) => (
                    <div key={cat.label} className="space-y-3 pb-4 border-b border-gray-800 last:border-0">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-1/3">
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{cat.label}</label>
                          <select 
                            value={cat.state} 
                            onChange={e => cat.setState(e.target.value as any)} 
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white focus:border-white focus:outline-none text-sm"
                          >
                            <option value="None">None</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Brief Description</label>
                          <input 
                            type="text" 
                            value={cat.desc} 
                            onChange={e => cat.setDesc(e.target.value)} 
                            className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-white focus:border-white focus:outline-none text-sm" 
                            placeholder={`Details about ${cat.label.toLowerCase()}...`} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={uploading} className="w-full bg-netflix-red text-white py-3 rounded-md font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {uploading ? 'Uploading...' : <><Plus className="w-5 h-5" /> Publish Subtitle</>}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'wallet' && userData && (
          <CreatorWallet 
            userData={{
              ...userData,
              totalDownloads: userData.totalDownloads
            }} 
            onUpdate={() => {}} 
          />
        )}
      </div>

      {editingSubtitle && (
        <EditSubtitleModal 
          subtitle={editingSubtitle} 
          onClose={() => setEditingSubtitle(null)} 
          onUpdate={handleSubtitleUpdate} 
        />
      )}

      {subtitleToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-netflix-surface border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this subtitle? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setSubtitleToDelete(null)}
                className="px-4 py-2 rounded-md font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
