const fs = require('fs');

let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

content = content.replace(/btn-secondary w-full flex items-center justify-center gap-2 font-bold bg-\[#1a1a1a\] hover:bg-\[#2a2a2a\] text-white border-0 py-3 rounded-lg shadow-lg/g,
  'btn-secondary w-full flex items-center justify-center gap-2 font-bold bg-white/5 hover:bg-white/10 text-white border border-white/5 py-3 rounded-xl shadow-sm transition-all');

// 11. Clean up "Wait X s" button
content = content.replace(/<button disabled className="btn-secondary w-full sm:w-auto lg:w-full">/g,
  '<button disabled className="btn-secondary w-full sm:w-auto lg:w-full opacity-70">');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);
console.log('Fixed buttons');
