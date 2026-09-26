import React, { useState, useEffect, useRef } from 'react';
import { Search, Film, Tv, Calendar, Star, X, Check, Loader2 } from 'lucide-react';
import { searchTMDBMulti, getTMDBImageUrl, TMDBMovie } from '../../services/tmdbService';

interface TMDBLiveSearchProps {
  onSelect: (media: {
    id: number;
    title: string;
    type: 'movie' | 'tv' | 'series';
    year: number | null;
    posterPath: string | null;
    overview: string;
  }) => void;
  selectedMedia: {
    id: number;
    title: string;
    type: 'movie' | 'tv' | 'series';
    year: number | null;
    posterPath: string | null;
  } | null;
  onClear: () => void;
  disabled?: boolean;
  initialSearchTerm?: string;
}

export const TMDBLiveSearch: React.FC<TMDBLiveSearchProps> = ({
  onSelect,
  selectedMedia,
  onClear,
  disabled = false,
  initialSearchTerm = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync initialSearchTerm if changed
  useEffect(() => {
    if (initialSearchTerm && !selectedMedia) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm, selectedMedia]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic (350ms debounce)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rawResults = await searchTMDBMulti(searchTerm.trim());
        setResults(rawResults);
        setIsOpen(true);
      } catch (err) {
        console.error('TMDb Live Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredResults = results.filter((item) => {
    if (filterType === 'all') return true;
    return item.media_type === filterType;
  });

  const handleSelectMedia = (item: TMDBMovie) => {
    const rawTitle = item.title || item.name || 'Untitled';
    const dateStr = item.release_date || item.first_air_date;
    const year = dateStr ? new Date(dateStr).getFullYear() : null;
    const type: 'movie' | 'tv' | 'series' = item.media_type === 'tv' ? 'series' : 'movie';

    onSelect({
      id: item.id,
      title: rawTitle,
      type,
      year: isNaN(year as number) ? null : year,
      posterPath: item.poster_path || null,
      overview: item.overview || '',
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* If media is already selected, show selected preview card with change button */}
      {selectedMedia ? (
        <div className="bg-black/50 border border-netflix-red/30 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
              {selectedMedia.posterPath ? (
                <img
                  src={getTMDBImageUrl(selectedMedia.posterPath, 'w500')}
                  alt={selectedMedia.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Film className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-netflix-red/20 text-netflix-red border border-netflix-red/30 flex items-center gap-1">
                  {selectedMedia.type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                  {selectedMedia.type === 'movie' ? 'Movie' : 'TV Series'}
                </span>
                {selectedMedia.year && (
                  <span className="text-xs text-zinc-400 font-semibold">{selectedMedia.year}</span>
                )}
                <span className="text-[10px] text-zinc-500 font-mono">TMDb #{selectedMedia.id}</span>
              </div>
              <h3 className="font-bold text-white text-base md:text-lg line-clamp-1">
                {selectedMedia.title}
              </h3>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> TMDb title selected & verified
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <X className="w-4 h-4" /> Change
          </button>
        </div>
      ) : (
        <div>
          {/* Live Search Input Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-netflix-red" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              disabled={disabled}
              placeholder="Search movie or TV series on TMDb (e.g. Inception, Stranger Things)..."
              className="w-full bg-black/40 border border-white/10 focus:border-netflix-red rounded-xl pl-12 pr-10 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-colors text-sm font-medium"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                  setIsOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Live Search Dropdown */}
          {isOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Type filter toggles */}
              <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  TMDb Live Results ({filteredResults.length})
                </span>
                <div className="flex gap-1">
                  {(['all', 'movie', 'tv'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                        filterType === t
                          ? 'bg-netflix-red text-white'
                          : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results list */}
              <div className="overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                {loading && results.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-netflix-red" />
                    Searching TMDb database...
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No movies or TV shows found matching "{searchTerm}".
                  </div>
                ) : (
                  filteredResults.map((item) => {
                    const title = item.title || item.name || 'Untitled';
                    const dateStr = item.release_date || item.first_air_date;
                    const year = dateStr ? new Date(dateStr).getFullYear() : null;
                    const isTv = item.media_type === 'tv';

                    return (
                      <button
                        key={`${item.media_type}-${item.id}`}
                        type="button"
                        onClick={() => handleSelectMedia(item)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3.5 group cursor-pointer"
                      >
                        {/* Poster Thumbnail */}
                        <div className="w-12 h-16 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 group-hover:border-netflix-red/50 transition-colors">
                          {item.poster_path ? (
                            <img
                              src={getTMDBImageUrl(item.poster_path, 'w500')}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              {isTv ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                            </div>
                          )}
                        </div>

                        {/* Title, Year, Type, Vote */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                isTv
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-netflix-red/20 text-netflix-red border border-netflix-red/30'
                              }`}
                            >
                              {isTv ? 'TV Series' : 'Movie'}
                            </span>
                            {year && (
                              <span className="text-zinc-400 text-xs font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                {year}
                              </span>
                            )}
                            {item.vote_average > 0 && (
                              <span className="text-amber-400 text-xs font-semibold flex items-center gap-0.5 ml-auto">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {item.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-white text-sm truncate group-hover:text-netflix-red transition-colors">
                            {title}
                          </h4>

                          {item.overview && (
                            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                              {item.overview}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
