const fs = require('fs');

let series = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');

series = series.replace(/gap-3 p-2/g, 'gap-3 py-2 px-3');

fs.writeFileSync('src/pages/SeriesDetails.tsx', series);

console.log('Fixed episode list row padding');
