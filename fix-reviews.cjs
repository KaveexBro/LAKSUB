const fs = require('fs');

let content = fs.readFileSync('src/pages/SubtitleDetails.tsx', 'utf8');

// Reviewer Avatar & Name
content = content.replace(/w-10 h-10 rounded-full bg-gray-700/g, 'w-8 h-8 rounded-full bg-gray-700');
content = content.replace(/<p className="font-bold text-sm/g, '<p className="font-semibold text-sm');

fs.writeFileSync('src/pages/SubtitleDetails.tsx', content);

console.log('Fixed reviewer avatars');
