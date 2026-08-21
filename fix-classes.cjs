const fs = require('fs');
let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

// Fix conflicting text colors
content = content.replace(/text-white text-xs font-semibold tracking-wide text-gray-400/g, 
  'text-xs font-semibold tracking-wide text-white');

content = content.replace(/text-xs font-semibold tracking-wide text-gray-400 text-gray-500/g, 
  'text-xs font-semibold tracking-wide text-gray-500');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);

let seriesContent = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

seriesContent = seriesContent.replace(/text-white text-xs font-semibold tracking-wide text-gray-400/g, 
  'text-xs font-semibold tracking-wide text-white');

seriesContent = seriesContent.replace(/text-xs font-semibold tracking-wide text-gray-400 text-gray-500/g, 
  'text-xs font-semibold tracking-wide text-gray-500');

fs.writeFileSync('src/pages/SeriesDetails.tsx', seriesContent);

console.log('Fixed class conflicts');
