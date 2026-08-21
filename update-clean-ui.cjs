const fs = require('fs');

function cleanClasses(content) {
  // Remove extreme shadows
  content = content.replace(/shadow-2xl/g, 'shadow-xl');
  
  // Make borders softer
  content = content.replace(/border-white\/10/g, 'border-white/5');
  content = content.replace(/border-gray-800/g, 'border-white/5');
  
  // Make cards flat and clean
  content = content.replace(/bg-white\/5 backdrop-blur-2xl/g, 'bg-[#181818]');
  content = content.replace(/bg-white\/5 backdrop-blur-md/g, 'bg-[#181818]');
  content = content.replace(/bg-white\/5 backdrop-blur-xl/g, 'bg-[#181818]');
  content = content.replace(/bg-netflix-surface/g, 'bg-[#181818]');
  content = content.replace(/bg-\[#272727\]/g, 'bg-[#181818]'); // description area
  
  // More padding for cards
  content = content.replace(/p-6 rounded-2xl/g, 'p-8 rounded-3xl');
  content = content.replace(/p-5 rounded-2xl/g, 'p-6 rounded-2xl');
  
  // Clean up rounded items
  content = content.replace(/rounded-xl/g, 'rounded-2xl');
  
  // Tag pills
  content = content.replace(/px-3 py-1.5 rounded-full border border-yellow-500\/20/g, 
    'px-4 py-1.5 rounded-full bg-[#181818] border border-yellow-500/20');
  content = content.replace(/px-3 py-1.5 rounded-full border border-gray-500\/20/g, 
    'px-4 py-1.5 rounded-full bg-[#181818] border border-white/10');
    
  return content;
}

let subContent = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');
subContent = cleanClasses(subContent);
fs.writeFileSync('src/pages/SubtitleDetails.tsx', subContent);

let seriesContent = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');
seriesContent = cleanClasses(seriesContent);
fs.writeFileSync('src/pages/SeriesDetails.tsx', seriesContent);

console.log('Applied ultra-clean UI updates');
