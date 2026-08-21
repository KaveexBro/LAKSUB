const fs = require('fs');
let content = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

// 1. Clean up typography (Main Title)
content = content.replace(/text-4xl md:text-7xl font-black mb-4 drop-shadow-2xl uppercase tracking-tighter leading-none/g, 
  'text-4xl md:text-6xl font-bold mb-2 drop-shadow-lg tracking-tight leading-tight');

// 2. Clean up stats/tags typography
content = content.replace(/text-xs md:text-sm font-black mb-8 text-gray-400 uppercase tracking-widest/g, 
  'flex flex-wrap items-center gap-3 md:gap-4 text-sm font-medium mb-8 text-gray-400');

// 3. Clean up the Season Card styling (assuming it has similar structure)
content = content.replace(/bg-\[#121212\] p-8 rounded-xl border border-gray-800 shadow-xl relative isolate transform-gpu w-full/g, 
  'bg-white/5 backdrop-blur-2xl p-6 lg:p-8 rounded-3xl border border-white/5 shadow-2xl relative isolate w-full');

content = content.replace(/bg-white\/5 backdrop-blur-xl border border-white\/10 rounded-2xl p-4 md:p-6/g,
  'bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-5 md:p-8 shadow-xl');

// 4. Clean up poster styles
content = content.replace(/aspect-\[2\/3\] rounded-xl overflow-hidden shadow-2xl relative border border-white\/10 group/g, 
  'aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl relative border border-white/5 group ring-1 ring-white/10');

// 5. Badges
content = content.replace(/text-\[10px\] font-black uppercase tracking-widest/g, 
  'text-xs font-semibold tracking-wide text-gray-400');

// 6. Section Titles
content = content.replace(/text-2xl font-black uppercase tracking-tighter mb-4/g, 
  'text-2xl font-bold tracking-tight mb-4 text-white/90');
content = content.replace(/text-2xl md:text-3xl font-black uppercase tracking-tighter mb-6/g, 
  'text-2xl md:text-3xl font-bold tracking-tight mb-6 text-white/90');

// 7. General descriptions
content = content.replace(/text-gray-300 font-medium leading-relaxed font-sinhala-text text-responsive-body/g, 
  'text-gray-300/90 leading-loose font-sinhala-text text-lg');

// 8. TMDB Stats Card
content = content.replace(/bg-white\/5 backdrop-blur-xl p-6 rounded-xl border border-white\/10 shadow-2xl/g, 
  'bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-lg');

fs.writeFileSync('src/pages/SeriesDetails.tsx', content);
console.log('UI updated for SeriesDetails.tsx');
