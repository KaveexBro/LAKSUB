import React from 'react';
import { Tv } from 'lucide-react';

interface SeriesStackCardProps {
  title: string;
  imageUrl: string;
  season?: number;
  episode?: number;
  year?: number;
  rating?: number;
  proOnly?: boolean;
}

export const SeriesStackCard: React.FC<SeriesStackCardProps> = ({
  title,
  imageUrl,
  season,
  episode,
  year,
  rating,
  proOnly
}) => {
  return (
    <div className="relative group w-40 md:w-56 aspect-[2/3] cursor-pointer snap-start">
      {/* Layer 3 (Back) */}
      <div className="absolute inset-0 bg-gray-800 rounded-md transform transition-all duration-300 origin-bottom scale-90 opacity-40 group-hover:-translate-y-6 group-hover:rotate-[-4deg] group-hover:opacity-60 shadow-lg" />
      
      {/* Layer 2 (Middle) */}
      <div className="absolute inset-0 bg-gray-700 rounded-md transform transition-all duration-300 origin-bottom scale-95 opacity-60 group-hover:-translate-y-3 group-hover:rotate-[2deg] group-hover:opacity-80 shadow-lg" />
      
      {/* Layer 1 (Front/Main) */}
      <div className="absolute inset-0 bg-gray-900 rounded-md overflow-hidden transform transition-all duration-300 z-10 shadow-2xl border border-gray-800 group-hover:border-gray-600 group-hover:translate-y-0 group-hover:scale-110 group-hover:z-50">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium border border-white/10 z-20">
          <Tv className="w-3 h-3" />
          <span>Series</span>
        </div>

        {proOnly && (
          <div className="absolute top-2 right-2 bg-netflix-red text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider z-20 shadow-lg">
            Pro Only
          </div>
        )}
        
        {/* Episode Badge */}
        {season !== undefined && episode !== undefined && (
          <div className="absolute bottom-16 right-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg z-20 transform transition-transform duration-300 group-hover:-translate-y-1">
            S{season.toString().padStart(2, '0')} E{episode.toString().padStart(2, '0')}
          </div>
        )}
        
        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-20 transform transition-transform duration-300 group-hover:-translate-y-1">
          <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-1 line-clamp-2 drop-shadow-md">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-300 mt-1">
            <span className="text-green-500 font-bold">{rating && rating > 0 ? rating.toFixed(1) : 'New'}</span>
            {year && <span>{year}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
