import React from 'react';
import { Award } from 'lucide-react';

interface CreatorBadgeProps {
  uploadCount: number;
}

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({ uploadCount }) => {
  if (uploadCount <= 0) return null;

  let rankName = 'Bronze';
  let colors = 'bg-gradient-to-r from-orange-400/20 to-orange-600/20 text-orange-500 border-orange-500/30';
  let IconColor = 'text-orange-500';

  if (uploadCount >= 100) {
    rankName = 'Diamond';
    colors = 'bg-gradient-to-r from-cyan-400/20 to-blue-600/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]';
    IconColor = 'text-cyan-400';
  } else if (uploadCount >= 50) {
    rankName = 'Platinum';
    colors = 'bg-gradient-to-r from-indigo-400/20 to-purple-600/20 text-indigo-400 border-indigo-500/40 shadow-[0_0_15px_rgba(129,140,248,0.4)]';
    IconColor = 'text-indigo-400';
  } else if (uploadCount >= 30) {
    rankName = 'Gold';
    colors = 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-all duration-1000 ease-in-out hover:shadow-[0_0_25px_rgba(250,204,21,0.7)]';
    IconColor = 'text-yellow-400 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]';
  } else if (uploadCount >= 10) {
    rankName = 'Silver';
    colors = 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 text-gray-300 border-gray-400/30';
    IconColor = 'text-gray-300';
  }

  return (
    <span className={`px-2 py-0.5 rounded border flex items-center gap-1 text-[8px] md:text-[9px] font-bold tracking-wide transform-gpu backface-hidden ${colors}`}>
      <Award className={`w-3 h-3 ${IconColor}`} />
      <span>{rankName}</span>
    </span>
  );
};
