const fs = require('fs');

function tightenSubtitleDetails(content) {
  content = content.replace(/h-\[60vh\]/g, 'h-[45vh]');
  content = content.replace(/-mt-40/g, '-mt-24');
  content = content.replace(/gap-8 xl:gap-12/g, 'gap-6 lg:gap-8');
  content = content.replace(/flex flex-col gap-8/g, 'flex flex-col gap-6');
  content = content.replace(/p-6 lg:p-8 rounded-3xl/g, 'p-5 lg:p-6 rounded-2xl');
  content = content.replace(/mt-16/g, 'mt-10');
  content = content.replace(/p-8 rounded-3xl/g, 'p-6 rounded-2xl');
  content = content.replace(/p-12 rounded-3xl/g, 'p-8 rounded-2xl');
  content = content.replace(/mb-8/g, 'mb-5'); // tightens headings and some containers
  return content;
}

function tightenSeriesDetails(content) {
  content = content.replace(/min-h-\[70vh\] md:h-\[80vh\]/g, 'min-h-[50vh] md:h-[60vh]');
  content = content.replace(/mt-4 md:-mt-16/g, 'mt-0 md:-mt-10');
  content = content.replace(/p-8 rounded-3xl/g, 'p-6 rounded-2xl');
  content = content.replace(/p-8/g, 'p-6 lg:p-8');
  content = content.replace(/rounded-3xl/g, 'rounded-2xl');
  content = content.replace(/pt-24/g, 'pt-16');
  content = content.replace(/mb-8/g, 'mb-5');
  content = content.replace(/gap-8/g, 'gap-6');
  return content;
}

let subContent = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');
subContent = tightenSubtitleDetails(subContent);
fs.writeFileSync('src/pages/SubtitleDetails.tsx', subContent);

let seriesContent = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');
seriesContent = tightenSeriesDetails(seriesContent);
fs.writeFileSync('src/pages/SeriesDetails.tsx', seriesContent);

console.log('Applied tighter layout constraints');
