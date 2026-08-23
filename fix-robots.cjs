const fs = require('fs');

let serverFile = fs.readFileSync('server.ts', 'utf8');

const explicitRobots = `
  // Explicit route for robots.txt to ensure crawlers can always reach it
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(\`User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Disallow: /private/
Disallow: /user/

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /

Sitemap: https://www.laksub.com/sitemap.xml
\`);
  });
`;

if (!serverFile.includes('app.get(\'/robots.txt\'')) {
  serverFile = serverFile.replace(
    "const PORT = process.env.PORT || 3000;",
    "const PORT = process.env.PORT || 3000;\n" + explicitRobots
  );
  fs.writeFileSync('server.ts', serverFile);
  console.log('Added robots.txt route');
} else {
  console.log('robots.txt route already exists');
}
