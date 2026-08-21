const fs = require('fs');

let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

// 1. Clean up typography (Main Title)
content = content.replace(/text-4xl md:text-7xl font-black mb-4 drop-shadow-2xl uppercase tracking-tighter leading-none/g, 
  'text-4xl md:text-6xl font-bold mb-2 drop-shadow-lg tracking-tight leading-tight');

// 2. Clean up stats/tags typography (reduce uppercase/widest)
content = content.replace(/text-xs md:text-sm font-black mb-8 text-gray-400 uppercase tracking-widest/g, 
  'flex flex-wrap items-center gap-3 md:gap-4 text-sm font-medium mb-8 text-gray-400');

// 3. Clean up the Download Card styling
content = content.replace(/bg-\[#121212\] p-8 rounded-xl border border-gray-800 shadow-xl relative isolate transform-gpu w-full/g, 
  'bg-white/5 backdrop-blur-2xl p-6 lg:p-8 rounded-3xl border border-white/5 shadow-2xl relative isolate w-full');

// 4. Clean up poster styles
content = content.replace(/aspect-\[2\/3\] rounded-xl overflow-hidden shadow-2xl relative border border-white\/10 group/g, 
  'aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl relative border border-white/5 group ring-1 ring-white/10');

// 5. Buttons and badges
content = content.replace(/text-\[10px\] font-black uppercase tracking-widest/g, 
  'text-xs font-semibold tracking-wide text-gray-400');

// 6. Section Titles (Synopsis, Comments, etc.)
content = content.replace(/text-2xl font-black uppercase tracking-tighter mb-4/g, 
  'text-2xl font-bold tracking-tight mb-4 text-white/90');

content = content.replace(/text-2xl font-black uppercase tracking-tighter mb-6/g, 
  'text-2xl font-bold tracking-tight mb-6 text-white/90');

// 7. General descriptions
content = content.replace(/text-gray-300 font-medium leading-relaxed font-sinhala-text text-responsive-body/g, 
  'text-gray-300/90 leading-loose font-sinhala-text text-lg');

// 8. TMDB Stats Card
content = content.replace(/bg-white\/5 backdrop-blur-xl p-6 rounded-xl border border-white\/10 shadow-2xl/g, 
  'bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-lg');

// 9. Comment blocks
content = content.replace(/bg-\[#121212\] border border-gray-800 rounded-xl p-6/g, 
  'bg-white/5 border border-white/5 rounded-2xl p-5');

// 10. Comment form
content = content.replace(/bg-black\/40 border border-white\/10 rounded-xl px-4 py-3/g, 
  'bg-black/20 border border-white/10 rounded-2xl px-4 py-3');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);
console.log('UI updated for SubtitleDetails.tsx');
