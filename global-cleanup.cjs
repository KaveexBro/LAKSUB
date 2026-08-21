const fs = require('fs');
const path = require('path');

function replaceAllInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/font-black uppercase tracking-tighter/g, 'font-bold tracking-tight');
  content = content.replace(/font-black uppercase tracking-widest/g, 'font-bold tracking-wide');
  content = content.replace(/font-black uppercase tracking-tight/g, 'font-bold tracking-tight');
  content = content.replace(/font-black uppercase/g, 'font-bold');
  content = content.replace(/font-black/g, 'font-bold');

  fs.writeFileSync(filePath, content);
}

const dir = 'src/pages/';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    replaceAllInFile(path.join(dir, file));
  }
});

replaceAllInFile('src/components/SubtitleCard.tsx'); // if exists
replaceAllInFile('src/components/Navbar.tsx');
replaceAllInFile('src/components/Footer.tsx');
replaceAllInFile('src/components/SeriesStackCard.tsx');

console.log('Global cleanup completed.');
