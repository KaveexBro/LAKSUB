const fs = require('fs');

function cleanHome(content) {
  content = content.replace(/font-black uppercase tracking-tighter/g, 'font-bold tracking-tight');
  content = content.replace(/font-black uppercase tracking-widest/g, 'font-bold tracking-wide text-xs');
  content = content.replace(/text-xl md:text-2xl font-black/g, 'text-2xl md:text-3xl font-bold');
  content = content.replace(/border border-gray-800\/50/g, 'border border-white/5');
  content = content.replace(/rounded-md/g, 'rounded-2xl');
  content = content.replace(/shadow-lg/g, 'shadow-md');
  content = content.replace(/shadow-2xl/g, 'shadow-lg');
  return content;
}

let homeContent = fs.readFileSync('src/pages/Home.tsx', 'utf8');
homeContent = cleanHome(homeContent);
fs.writeFileSync('src/pages/Home.tsx', homeContent);

let exploreContent = fs.readFileSync('src/pages/Explore.tsx', 'utf8');
exploreContent = cleanHome(exploreContent);
fs.writeFileSync('src/pages/Explore.tsx', exploreContent);

console.log('Cleaned Home & Explore');
