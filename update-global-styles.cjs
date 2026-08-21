const fs = require('fs');

let cssContent = fs.readFileSync('src/index.css', 'utf8');

// Modernize buttons (flat, rounder, clean hover)
cssContent = cssContent.replace(/\.btn \{\n  @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none;\n\}/g,
  '.btn {\n  @apply inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none;\n}');

cssContent = cssContent.replace(/\.btn-primary \{\n  @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none bg-netflix-red text-white shadow-lg hover:bg-netflix-red-dark hover:shadow-xl hover:-translate-y-0.5 border border-transparent;\n\}/g,
  '.btn-primary {\n  @apply inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none bg-netflix-red text-white hover:bg-netflix-red-dark border border-transparent;\n}');

cssContent = cssContent.replace(/\.btn-secondary \{\n  @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none bg-white\/10 text-white shadow-lg hover:bg-white\/20 hover:shadow-xl hover:-translate-y-0.5 border border-white\/10;\n\}/g,
  '.btn-secondary {\n  @apply inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none bg-white/5 text-white hover:bg-white/10 border border-white/10;\n}');

cssContent = cssContent.replace(/\.btn-white \{\n  @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none bg-white text-black shadow-lg hover:bg-gray-200 hover:shadow-xl hover:-translate-y-0.5 border border-transparent;\n\}/g,
  '.btn-white {\n  @apply inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none bg-white text-black hover:bg-gray-100 border border-transparent;\n}');

// Simplify shadow utility on buttons
cssContent = cssContent.replace(/button\.bg-netflix-red \{\n  @apply shadow-\[0_4px_14px_0_rgba\(229,9,20,0\.39\)\] hover:shadow-\[0_6px_20px_rgba\(229,9,20,0\.23\)\] hover:bg-netflix-red-dark hover:-translate-y-0\.5 active:translate-y-0 transition-all duration-300;\n\}/g,
  'button.bg-netflix-red {\n  @apply hover:bg-netflix-red-dark transition-all duration-300;\n}');

// Form inputs - remove heavy inner shadow and thick rounded-xl to clean it up to rounded-lg
cssContent = cssContent.replace(/@apply bg-\[#121212\] border border-white\/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-netflix-red focus:ring-1 focus:ring-netflix-red transition-all shadow-inner w-full font-medium;/g,
  '@apply bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors w-full font-normal;');

fs.writeFileSync('src/index.css', cssContent);
console.log('Updated index.css');
