import fs from 'fs';

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Replace new Date().toLocaleDateString() with safe format
content = content.replace(/new Date\(userData\.proExpiry\)\.toLocaleDateString\(\)/g, "userData.proExpiry ? new Date(userData.proExpiry).toLocaleDateString() : ''");
content = content.replace(/new Date\(record\.downloadedAt\)\.toLocaleDateString\(\)/g, "record.downloadedAt ? new Date(record.downloadedAt).toLocaleDateString() : ''");
content = content.replace(/new Date\(record\.downloadedAt\)\.toLocaleTimeString\(\)/g, "record.downloadedAt ? new Date(record.downloadedAt).toLocaleTimeString() : ''");

fs.writeFileSync('src/pages/Profile.tsx', content);
console.log("Made Profile.tsx ultra-safe!");
