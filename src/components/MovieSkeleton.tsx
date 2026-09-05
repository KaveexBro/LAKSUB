import React from 'react';
import { motion } from 'motion/react';

export const MovieSkeleton: React.FC = () => {
  // Array to map through for multiple skeleton cards
  const skeletonCards = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="w-full min-h-screen bg-netflix-bg p-4 md:p-8 pt-24">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="h-10 bg-white/5 rounded-lg w-48 md:w-64 animate-pulse"></div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="h-10 bg-white/5 rounded-lg w-full md:w-32 animate-pulse"></div>
          <div className="h-10 bg-white/5 rounded-lg w-full md:w-32 animate-pulse"></div>
          <div className="h-10 bg-white/5 rounded-lg w-full md:w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {skeletonCards.map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex flex-col gap-2"
          >
            {/* Poster aspect ratio skeleton */}
            <div className="w-full aspect-[2/3] bg-[#181818] rounded-xl border border-white/5 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            
            {/* Title skeleton */}
            <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse mt-2"></div>
            
            {/* Subtitle/Metadata skeleton */}
            <div className="flex justify-between items-center mt-1">
              <div className="h-3 bg-white/5 rounded w-1/3 animate-pulse"></div>
              <div className="h-3 bg-white/5 rounded w-1/4 animate-pulse"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
