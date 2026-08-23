const fs = require('fs');

let content = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

// 1. Description Spacing
content = content.replace(/text-lg md:text-xl text-gray-200 font-sinhala-text leading-relaxed/g, 
  'text-base md:text-lg text-gray-300 font-sinhala-text leading-relaxed');
content = content.replace(/text-gray-300 leading-loose text-lg italic/g, 
  'text-gray-400 leading-relaxed text-base italic');
content = content.replace(/text-lg md:text-xl/g, 'text-base md:text-lg');

// 2. Subtitler's Avatar & Name
content = content.replace(/w-14 h-14 rounded-full bg-gray-700/g, 'w-10 h-10 rounded-full bg-gray-700');
content = content.replace(/w-14 h-14 md:w-16 md:h-16 rounded-2xl/g, 'w-10 h-10 md:w-12 md:h-12 rounded-xl');
content = content.replace(/<p className="font-bold text-white text-lg group-hover/g, '<p className="font-bold text-white text-base group-hover');

// 3. Episode List
content = content.replace(/p-3 md:p-4/g, 'p-2 md:p-3');
content = content.replace(/text-base md:text-lg font-bold text-white group-hover:text-netflix-red/g, 'text-sm md:text-base font-bold text-white group-hover:text-netflix-red');
content = content.replace(/px-6 py-2\.5 rounded-lg font-bold text-xs/g, 'px-4 py-2 rounded-lg font-bold text-[10px]');
content = content.replace(/bg-netflix-red\/20 text-netflix-red px-2 py-1/g, 'bg-netflix-red/20 text-netflix-red px-1.5 py-0.5');

// 4. Excessively large headings
content = content.replace(/text-5xl md:text-7xl font-bold mb-4/g, 'text-4xl md:text-6xl font-bold mb-3');
content = content.replace(/text-3xl font-bold tracking-tight/g, 'text-2xl font-bold tracking-tight');

fs.writeFileSync('src/pages/SeriesDetails.tsx', content);

console.log('Fixed SeriesDetails UI');
