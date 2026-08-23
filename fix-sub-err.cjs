const fs = require('fs');
let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

content = content.replace(/flex flex-wrap items-center gap-3 md:gap-6 flex flex-wrap items-center gap-3 md:gap-4 text-sm font-medium mb-5 text-gray-400/g, 
  'flex flex-wrap items-center gap-3 md:gap-4 text-sm font-medium mb-5 text-gray-400');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);
