const fs = require('fs');

function fixLeading(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/leading-relaxed/g, 'leading-normal');
  fs.writeFileSync(file, content);
}

fixLeading('src/pages/SubtitleDetails.tsx');
fixLeading('src/pages/SeriesDetails.tsx');

console.log('Fixed line heights');
