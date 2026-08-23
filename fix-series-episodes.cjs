const fs = require('fs');

let content = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

// Episode List Container
content = content.replace(/gap-4 p-2 md:p-3/g, 'gap-3 p-2');
content = content.replace(/rounded-2xl border border-white\/5 hover:border-white\/20/g, 'rounded-xl border border-white/5 hover:border-white/10');
content = content.replace(/px-4 py-2 rounded-lg font-bold text-\[10px\]/g, 'px-3 py-1.5 rounded-lg font-semibold text-[10px]');
content = content.replace(/bg-netflix-red\/20 text-netflix-red px-1\.5 py-0\.5 rounded border border-netflix-red\/30/g, 'bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10');
content = content.replace(/text-sm md:text-base font-bold text-white/g, 'text-sm font-semibold text-gray-200');

fs.writeFileSync('src/pages/SeriesDetails.tsx', content);

console.log('Fixed SeriesDetails episode list UI');
