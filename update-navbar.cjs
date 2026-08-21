const fs = require('fs');
let navContent = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

navContent = navContent.replace(/text-sm font-black uppercase tracking-widest/g, 'text-sm font-semibold tracking-wide');
navContent = navContent.replace(/text-\[10px\] font-black uppercase tracking-widest/g, 'text-[10px] font-semibold tracking-wide');
navContent = navContent.replace(/text-\[8px\] md:text-\[10px\] font-black text-white\/40 uppercase tracking-\[0\.3em\]/g, 'text-[8px] md:text-[10px] font-medium text-white/40 tracking-[0.2em]');

fs.writeFileSync('src/components/Navbar.tsx', navContent);
console.log('Cleaned Navbar');
