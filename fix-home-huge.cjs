const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(/text-\[120px\] md:text-\[200px\]/g, 'text-[80px] md:text-[140px]');
content = content.replace(/text-4xl md:text-8xl font-bold mb-3 md:mb-6/g, 'text-4xl md:text-6xl font-bold mb-3');

fs.writeFileSync('src/pages/Home.tsx', content);
