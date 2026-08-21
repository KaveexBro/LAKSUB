const fs = require('fs');

let content = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

// Series title
content = content.replace(/text-4xl md:text-8xl font-black mb-4 md:mb-6 drop-shadow-2xl tracking-tighter uppercase leading-\[0.9\]/g,
  'text-5xl md:text-7xl font-bold mb-4 md:mb-6 drop-shadow-lg tracking-tight leading-tight');

// Stats row
content = content.replace(/flex flex-wrap items-center gap-3 md:gap-6 text-\[10px\] md:text-sm font-bold mb-6 md:mb-8 text-gray-200/g,
  'flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm font-medium mb-6 md:mb-8 text-gray-300');

// Back button
content = content.replace(/text-\[10px\] md:text-xs font-black uppercase tracking-widest/g,
  'text-xs font-semibold tracking-wide');

content = content.replace(/bg-netflix-red\/20 text-netflix-red px-3 py-1 rounded-md border border-netflix-red\/30 uppercase tracking-widest text-\[10px\]/g,
  'bg-netflix-red/10 text-netflix-red px-3 py-1 rounded-lg border border-netflix-red/20 font-semibold tracking-wide text-xs');

content = content.replace(/bg-white\/10 text-white px-3 py-1 rounded-md uppercase tracking-widest text-\[10px\]/g,
  'bg-white/10 text-white px-3 py-1 rounded-lg font-semibold tracking-wide text-xs');

content = content.replace(/bg-white\/10 px-3 py-1 rounded-md/g,
  'bg-white/10 px-3 py-1 rounded-lg font-semibold text-xs');

// Episode selection header
content = content.replace(/text-3xl font-black uppercase tracking-tighter/g,
  'text-3xl font-bold tracking-tight');

content = content.replace(/text-2xl font-black uppercase tracking-tighter/g,
  'text-2xl font-bold tracking-tight');

content = content.replace(/text-4xl font-black uppercase tracking-tighter text-white/g,
  'text-4xl font-bold tracking-tight text-white');

fs.writeFileSync('src/pages/SeriesDetails.tsx', content);
console.log('Fixed SeriesDetails hero');
