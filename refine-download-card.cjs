const fs = require('fs');

let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

// Subtitler info
content = content.replace(/gap-4 cursor-pointer group/g, 'gap-3 cursor-pointer group');
content = content.replace(/w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-netflix-red/g, 'w-9 h-9 rounded-full bg-gray-700 overflow-hidden border border-white/10 group-hover:border-netflix-red');
content = content.replace(/text-sm text-gray-400/g, 'text-[10px] text-gray-500 font-medium tracking-wide uppercase');
content = content.replace(/font-bold text-white text-base/g, 'font-semibold text-white text-sm');

// Star rating
content = content.replace(/text-sm text-gray-400 mb-2/g, 'text-[10px] text-gray-500 font-medium tracking-wide uppercase mb-1.5');
content = content.replace(/w-7 h-7 cursor-pointer transition-all/g, 'w-5 h-5 cursor-pointer transition-all');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);

let seriesContent = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

// Subtitler info (in Series Details, there might be avatars for top subtitlers or just identical blocks)
seriesContent = seriesContent.replace(/gap-4 cursor-pointer group/g, 'gap-3 cursor-pointer group');
seriesContent = seriesContent.replace(/w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-netflix-red/g, 'w-9 h-9 rounded-full bg-gray-700 overflow-hidden border border-white/10 group-hover:border-netflix-red');
seriesContent = seriesContent.replace(/text-sm text-gray-400/g, 'text-[10px] text-gray-500 font-medium tracking-wide uppercase');
seriesContent = seriesContent.replace(/font-bold text-white text-base/g, 'font-semibold text-white text-sm');

// Star rating
seriesContent = seriesContent.replace(/text-sm text-gray-400 mb-2/g, 'text-[10px] text-gray-500 font-medium tracking-wide uppercase mb-1.5');
seriesContent = seriesContent.replace(/w-7 h-7 cursor-pointer transition-all/g, 'w-5 h-5 cursor-pointer transition-all');

fs.writeFileSync('src/pages/SeriesDetails.tsx', seriesContent);

console.log('Refined download card and subtitler profile');
