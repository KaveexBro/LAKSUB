const fs = require('fs');
let file = fs.readFileSync('src/pages/CreatorDashboard.tsx', 'utf8');
if (!file.includes('import { SiteLogo }')) {
  file = file.replace(
    "import { Link, useLocation } from 'wouter';",
    "import { Link, useLocation } from 'wouter';\nimport { SiteLogo } from '../components/SiteLogo';"
  );
  fs.writeFileSync('src/pages/CreatorDashboard.tsx', file);
  console.log('Fixed SiteLogo import');
}
