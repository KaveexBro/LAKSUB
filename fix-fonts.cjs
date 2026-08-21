const fs = require('fs');

let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

// Replace aggressive headings
content = content.replace(/font-black uppercase tracking-tighter/g, 'font-bold tracking-tight');
content = content.replace(/font-black uppercase tracking-widest/g, 'font-bold tracking-wide text-xs');
content = content.replace(/font-black text-white/g, 'font-bold text-white');
content = content.replace(/uppercase tracking-widest/g, 'tracking-wide font-semibold text-xs');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);

let seriesContent = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

seriesContent = seriesContent.replace(/font-black uppercase tracking-tighter/g, 'font-bold tracking-tight');
seriesContent = seriesContent.replace(/font-black uppercase tracking-widest/g, 'font-bold tracking-wide text-xs');
seriesContent = seriesContent.replace(/font-black text-white/g, 'font-bold text-white');
seriesContent = seriesContent.replace(/uppercase tracking-widest/g, 'tracking-wide font-semibold text-xs');

fs.writeFileSync('src/pages/SeriesDetails.tsx', seriesContent);

console.log('Fixed fonts globally in both files');
