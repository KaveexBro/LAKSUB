import React, { useState } from 'react';
import { Subtitle } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { X, Save, Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { searchTMDB, getTMDBImageUrl, TMDBMovie } from '../services/tmdbService';
import { getDirectDownloadLink, isGoogleDriveLink } from '../utils/googleDrive';
import { DriveUploader } from '../components/DriveUploader';

interface EditSubtitleModalProps {
  subtitle: Subtitle;
  onClose: () => void;
  onUpdate: (updatedSubtitle: Subtitle) => void;
}

import { generateSlug, generateUniqueSlug } from '../utils/slugify';

export const EditSubtitleModal: React.FC<EditSubtitleModalProps> = ({ subtitle, onClose, onUpdate }) => {
  const [type, setType] = useState<'movie' | 'series'>(subtitle.type || 'movie');
  const [movieTitle, setMovieTitle] = useState(subtitle.movieTitle);
  const [season, setSeason] = useState<number | ''>(subtitle.season || '');
  const [episode, setEpisode] = useState<number | ''>(subtitle.episode || '');
  const [releaseYear, setReleaseYear] = useState(subtitle.releaseYear);
  const [language, setLanguage] = useState(subtitle.language);
  const [genres, setGenres] = useState<string[]>(subtitle.genres || []);
  const [genreInput, setGenreInput] = useState('');
  const [description, setDescription] = useState(subtitle.description);
  const [downloadLink, setDownloadLink] = useState(subtitle.downloadLink);
  const [telegramLink, setTelegramLink] = useState(subtitle.telegramLink || '');
  const [watchOnlineLink, setWatchOnlineLink] = useState(subtitle.watchOnlineLink || '');
  const [tmdbId, setTmdbId] = useState<number | ''>(subtitle.tmdbId || '');
  const [posterPath, setPosterPath] = useState(subtitle.posterPath || '');
  const [backdropPath, setBackdropPath] = useState(subtitle.backdropPath || '');
  const [isAdult, setIsAdult] = useState(subtitle.isAdult || false);
  const [parentalRating, setParentalRating] = useState(subtitle.parentalRating || 'G');
  const [parentalDescription, setParentalDescription] = useState(subtitle.parentalDescription || '');

  // Parents Guide State
  const [pgSexSeverity, setPgSexSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>(subtitle.parentsGuide?.sex?.severity || 'None');
  const [pgSexDescription, setPgSexDescription] = useState(subtitle.parentsGuide?.sex?.description || '');
  const [pgViolenceSeverity, setPgViolenceSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>(subtitle.parentsGuide?.violence?.severity || 'None');
  const [pgViolenceDescription, setPgViolenceDescription] = useState(subtitle.parentsGuide?.violence?.description || '');
  const [pgProfanitySeverity, setPgProfanitySeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>(subtitle.parentsGuide?.profanity?.severity || 'None');
  const [pgProfanityDescription, setPgProfanityDescription] = useState(subtitle.parentsGuide?.profanity?.description || '');
  const [pgAlcoholSeverity, setPgAlcoholSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>(subtitle.parentsGuide?.alcohol?.severity || 'None');
  const [pgAlcoholDescription, setPgAlcoholDescription] = useState(subtitle.parentsGuide?.alcohol?.description || '');
  const [pgFrighteningSeverity, setPgFrighteningSeverity] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>(subtitle.parentsGuide?.frightening?.severity || 'None');
  const [pgFrighteningDescription, setPgFrighteningDescription] = useState(subtitle.parentsGuide?.frightening?.description || '');
  
  // TMDb Search state
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TMDBMovie[]>([]);
  const [searchingTmdb, setSearchingTmdb] = useState(false);
  
  const [isProOnly, setIsProOnly] = useState(!!subtitle.proOnlyUntil && new Date(subtitle.proOnlyUntil) > new Date());
  const [proOnlyUntil, setProOnlyUntil] = useState(subtitle.proOnlyUntil ? new Date(subtitle.proOnlyUntil).toISOString().slice(0, 16) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery.trim()) return;
    setSearchingTmdb(true);
    const results = await searchTMDB(tmdbSearchQuery, type === 'series' ? 'tv' : 'movie');
    setTmdbResults(results);
    setSearchingTmdb(false);
  };

  const selectTmdbMovie = (movie: TMDBMovie) => {
    setTmdbId(movie.id);
    setMovieTitle(movie.title || movie.name || '');
    setReleaseYear(parseInt((movie.release_date || movie.first_air_date || '2024').split('-')[0]));
    setPosterPath(movie.poster_path);
    setBackdropPath(movie.backdrop_path);
    setTmdbResults([]);
    setTmdbSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let proOnlyUntilVal: any = subtitle.proOnlyUntil;
      
      if (isProOnly && proOnlyUntil) {
        proOnlyUntilVal = new Date(proOnlyUntil).toISOString();
      } else if (!isProOnly) {
        proOnlyUntilVal = deleteField();
      }

      let baseSlug = generateSlug(movieTitle, releaseYear);
      if (type === 'series') {
        const suffix = '-sinhala-subtitles';
        if (baseSlug.endsWith(suffix)) {
          baseSlug = baseSlug.slice(0, -suffix.length);
          if (season) baseSlug += `-s${season.toString().padStart(2, '0')}`;
          if (episode) baseSlug += `-e${episode.toString().padStart(2, '0')}`;
          baseSlug += suffix;
        }
      }

      let uniqueSlug = subtitle.slug;
      // Only generate a new slug if the base slug has changed (meaning title, season, episode, or language changed)
      // or if the subtitle doesn't have a slug yet.
      if (!uniqueSlug || !uniqueSlug.startsWith(baseSlug)) {
        uniqueSlug = await generateUniqueSlug(baseSlug);
      }

      const updates: any = {
        type,
        slug: uniqueSlug,
        movieTitle,
        releaseYear,
        language,
        genres,
        description,
        downloadLink,
        telegramLink: telegramLink === '' ? deleteField() : telegramLink,
        watchOnlineLink: watchOnlineLink === '' ? deleteField() : watchOnlineLink,
        tmdbId: tmdbId === '' ? deleteField() : tmdbId,
        posterPath: posterPath === '' ? deleteField() : posterPath,
        backdropPath: backdropPath === '' ? deleteField() : backdropPath,
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

      if (proOnlyUntilVal !== undefined) {
        updates.proOnlyUntil = proOnlyUntilVal;
      }

      if (type === 'series') {
        updates.season = season === '' ? deleteField() : season;
        updates.episode = episode === '' ? deleteField() : episode;
      } else {
        updates.season = deleteField();
        updates.episode = deleteField();
      }

      await updateDoc(doc(db, 'subtitles', subtitle.id), updates);
      
      const updatedSubtitle = { ...subtitle, ...updates };
      
      // Clean up the local object to match the deleted fields
      if (!isProOnly) delete updatedSubtitle.proOnlyUntil;
      if (tmdbId === '') delete updatedSubtitle.tmdbId;
      if (posterPath === '') delete updatedSubtitle.posterPath;
      if (backdropPath === '') delete updatedSubtitle.backdropPath;

      if (type !== 'series') {
        delete updatedSubtitle.season;
        delete updatedSubtitle.episode;
      } else {
        if (season === '') delete updatedSubtitle.season;
        if (episode === '') delete updatedSubtitle.episode;
      }
      
      onUpdate(updatedSubtitle as Subtitle);
      onClose();
    } catch (err) {
      console.error("Error updating subtitle:", err);
      setError("Failed to update subtitle. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-netflix-surface border border-gray-800 rounded-lg w-full max-w-3xl my-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Edit Subtitle</h2>
          
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TMDB Search Section */}
            <div className="bg-black/30 p-4 rounded-lg border border-gray-800 mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Search on TMDb (Update metadata)</label>
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

              {tmdbId && (
                <div className="mt-4 flex items-center gap-3 bg-green-900/20 p-3 rounded-md border border-green-500/30">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-400">Linked to TMDb ID: {tmdbId}</p>
                    <p className="text-xs text-gray-500">Metadata will be updated and high-quality posters will be used.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setTmdbId('');
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
                <input type="text" required value={movieTitle} onChange={e => setMovieTitle(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" />
              </div>
              
              {type === 'series' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Season</label>
                    <input type="number" min="1" required value={season} onChange={e => setSeason(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Episode</label>
                    <input type="number" min="1" required value={episode} onChange={e => setEpisode(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" />
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
              <label className="block text-sm font-medium text-gray-400 mb-1">Download Link</label>
              <div className="flex gap-2">
                <input type="url" required value={downloadLink} onChange={e => setDownloadLink(e.target.value)} className="flex-1 bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" />
                <button 
                  type="button"
                  onClick={() => {
                    const modal = document.getElementById('edit-drive-uploader-modal');
                    if (modal) modal.classList.remove('hidden');
                  }}
                  className="bg-green-600/20 text-green-500 border border-green-500/50 px-4 py-2 rounded-md hover:bg-green-600/30 transition-colors flex items-center gap-2"
                >
                  Auto-Upload
                </button>
              </div>
              {downloadLink && isGoogleDriveLink(downloadLink) && (
                <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Google Drive link detected. It will be automatically converted to a direct download link for users.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Telegram Movie/Series Link (Optional)</label>
              <input type="url" value={telegramLink} onChange={e => setTelegramLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="https://t.me/..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Watch Online Link (Optional)</label>
              <input type="url" value={watchOnlineLink} onChange={e => setWatchOnlineLink(e.target.value)} className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none" placeholder="https://..." />
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
                  id="edit-isProOnly" 
                  checked={isProOnly} 
                  onChange={e => setIsProOnly(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border-gray-700 text-netflix-red focus:ring-netflix-red"
                />
                <label htmlFor="edit-isProOnly" className="text-sm font-medium text-gray-300">
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
                id="edit-isAdult" 
                checked={isAdult} 
                onChange={e => setIsAdult(e.target.checked)}
                className="w-5 h-5 rounded bg-black border-gray-700 text-netflix-red focus:ring-netflix-red"
              />
              <label htmlFor="edit-isAdult" className="text-sm font-medium text-gray-300">
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

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 rounded-md font-bold text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-netflix-red text-white px-8 py-2 rounded-md font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        {/* Drive Uploader Modal */}
        <div id="edit-drive-uploader-modal" className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 hidden">
          <div className="relative w-full max-w-2xl">
            <button 
              onClick={() => {
                const modal = document.getElementById('edit-drive-uploader-modal');
                if (modal) modal.classList.add('hidden');
              }}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white"
            >
              Close
            </button>
            <DriveUploader onUploadSuccess={(link) => {
              setDownloadLink(link);
              const modal = document.getElementById('edit-drive-uploader-modal');
              if (modal) modal.classList.add('hidden');
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};
