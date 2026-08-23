const fs = require('fs');

let content = fs.readFileSync('src/components/CreatorBadge.tsx', 'utf8');

content = content.replace(/px-3 py-1 rounded border flex items-center gap-1.5 text-\[10px\] font-black uppercase tracking-widest/g, 
  'px-2 py-0.5 rounded border flex items-center gap-1 text-[8px] md:text-[9px] font-bold tracking-wide');
content = content.replace(/w-3.5 h-3.5/g, 'w-3 h-3');

fs.writeFileSync('src/components/CreatorBadge.tsx', content);

console.log('Fixed CreatorBadge UI');
