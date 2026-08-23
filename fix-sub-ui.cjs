const fs = require('fs');

let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

// 1. Description Spacing
content = content.replace(/text-lg md:text-xl text-gray-200 font-sinhala-text leading-relaxed/g, 
  'text-base md:text-lg text-gray-300 font-sinhala-text leading-relaxed');
content = content.replace(/text-gray-300 leading-loose text-lg italic/g, 
  'text-gray-400 leading-relaxed text-base italic');
content = content.replace(/text-lg md:text-xl/g, 'text-base md:text-lg');

// 2. Subtitler's Avatar & Name
content = content.replace(/w-14 h-14 rounded-full bg-gray-700/g, 'w-10 h-10 rounded-full bg-gray-700');
content = content.replace(/<p className="font-bold text-white text-lg group-hover/g, '<p className="font-bold text-white text-base group-hover');

// 3. Excessively large headings
content = content.replace(/text-4xl md:text-6xl font-bold mb-2/g, 'text-3xl md:text-5xl font-bold mb-2');
content = content.replace(/text-2xl md:text-4xl text-gray-500/g, 'text-xl md:text-3xl text-gray-500');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);

console.log('Fixed SubtitleDetails UI');
