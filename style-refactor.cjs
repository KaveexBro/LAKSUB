const fs = require('fs');

// 1. Refactor index.css
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/--spacing-layout-sm: 2rem;/g, '--spacing-layout-sm: 1.5rem;');
css = css.replace(/--spacing-layout-md: 4rem;/g, '--spacing-layout-md: 2.5rem;');
css = css.replace(/--spacing-layout-lg: 6rem;/g, '--spacing-layout-lg: 4rem;');
css = css.replace(/text-3xl md:text-4xl lg:text-5xl/g, 'text-2xl md:text-3xl lg:text-4xl');
css = css.replace(/text-2xl md:text-3xl lg:text-4xl/g, 'text-xl md:text-2xl lg:text-3xl');
css = css.replace(/text-base md:text-lg lg:text-xl/g, 'text-base md:text-lg lg:text-lg');
fs.writeFileSync('src/index.css', css);

// 2. Refactor SubtitleDetails.tsx
let sub = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');
// Description & Metadata Spacing
sub = sub.replace(/gap-6 lg:gap-8/g, 'gap-4 lg:gap-6');
sub = sub.replace(/flex flex-col gap-6/g, 'flex flex-col gap-4');
sub = sub.replace(/mb-5 text-gray-400/g, 'mb-3 text-gray-400');
sub = sub.replace(/mt-10/g, 'mt-8');
sub = sub.replace(/mb-5 flex items-center/g, 'mb-4 flex items-center');
sub = sub.replace(/p-5 lg:p-6/g, 'p-4 lg:p-5');
// Subtitler Profile Scale Down
sub = sub.replace(/gap-6 mb-5 items-start/g, 'gap-4 mb-3 items-start');
sub = sub.replace(/w-9 h-9/g, 'w-7 h-7');
sub = sub.replace(/font-semibold text-white text-sm/g, 'font-semibold text-white text-xs');
sub = sub.replace(/text-\[10px\] text-gray-500 font-medium tracking-wide uppercase/g, 'text-[9px] text-gray-500 font-medium tracking-wide uppercase');
sub = sub.replace(/text-xl md:text-3xl text-gray-500/g, 'text-lg md:text-xl text-gray-500');
fs.writeFileSync('src/pages/SubtitleDetails.tsx', sub);

// 3. Refactor SeriesDetails.tsx
let series = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');
series = series.replace(/gap-6 lg:gap-8/g, 'gap-4 lg:gap-6');
series = series.replace(/flex flex-col gap-6/g, 'flex flex-col gap-4');
series = series.replace(/mb-5/g, 'mb-3');
series = series.replace(/p-5 lg:p-6/g, 'p-4 lg:p-5');
// Subtitler Profile Scale Down
series = series.replace(/w-9 h-9/g, 'w-7 h-7');
series = series.replace(/font-semibold text-white text-sm/g, 'font-semibold text-white text-xs');
series = series.replace(/text-\[10px\] text-gray-500 font-medium tracking-wide uppercase/g, 'text-[9px] text-gray-500 font-medium tracking-wide uppercase');
// Episode list
series = series.replace(/gap-4 p-2/g, 'gap-3 py-2 px-3');
series = series.replace(/bg-white\/5 hover:bg-white\/10 rounded-xl border border-white\/5 hover:border-white\/10/g, 'hover:bg-white/5 border-b border-white/5 last:border-0 rounded-none');
series = series.replace(/font-semibold text-gray-200/g, 'font-medium text-gray-300');
fs.writeFileSync('src/pages/SeriesDetails.tsx', series);

// 4. Update Creator Badge to be smaller
let badge = fs.readFileSync('src/components/CreatorBadge.tsx', 'utf8');
badge = badge.replace(/text-\[8px\] md:text-\[9px\] font-bold tracking-wide/g, 'text-[7px] md:text-[8px] font-semibold tracking-wider');
badge = badge.replace(/w-3 h-3/g, 'w-2.5 h-2.5');
badge = badge.replace(/px-2 py-0\.5/g, 'px-1.5 py-0.5');
fs.writeFileSync('src/components/CreatorBadge.tsx', badge);

console.log('Refactor completed');
