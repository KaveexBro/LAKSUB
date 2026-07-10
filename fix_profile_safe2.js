import fs from 'fs';

let content = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Replace walletBalance with safe formatting
content = content.replace(/userData\.walletBalance\?\.toFixed\(2\) \|\| '0\.00'/g, "typeof userData.walletBalance === 'number' ? userData.walletBalance.toFixed(2) : '0.00'");

fs.writeFileSync('src/pages/Profile.tsx', content);
console.log("Made Profile.tsx wallet safe!");
