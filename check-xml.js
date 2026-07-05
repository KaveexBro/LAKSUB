const fs = require('fs');
const xml = fs.readFileSync('public/sitemap_live.xml', 'utf8');
console.log('XML length:', xml.length);
console.log('Starts with:', xml.substring(0, 20));
