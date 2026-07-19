import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "subtitles" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "status" },
              op: "EQUAL",
              value: { stringValue: "approved" }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Firestore REST API: ' + response.statusText);
    }

    const results = await response.json();
    const currentDate = new Date().toISOString().split('T')[0];
    
    let urls = `  <url>
    <loc>https://laksub.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://laksub.com/explore</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://laksub.com/movies</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://laksub.com/series</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://laksub.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://laksub.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://laksub.com/request</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://laksub.com/apply</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://laksub.com/upgrade</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://laksub.com/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://laksub.com/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://laksub.com/dmca</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;

    const seriesTitles = new Set();

    for (const item of results) {
      if (!item.document) continue;
      
      const fields = item.document.fields;
      if (!fields) continue;

      const slug = fields.slug?.stringValue || item.document.name.split('/').pop();
      const type = fields.type?.stringValue || 'movie';
      const baseUrlPath = 'subtitles';
      
      if (type === 'series' && fields.movieTitle?.stringValue) {
        seriesTitles.add(fields.movieTitle.stringValue);
      }
      
      let lastmod = '';
      const updatedAt = fields.updatedAt?.timestampValue || fields.createdAt?.timestampValue;
      if (updatedAt) {
        const date = new Date(updatedAt);
        if (!isNaN(date.getTime())) {
          lastmod = `\n    <lastmod>${date.toISOString().split('.')[0] + 'Z'}</lastmod>`;
        }
      }
      
      urls += `
  <url>
    <loc>https://laksub.com/${baseUrlPath}/${slug}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
    
    for (const series of seriesTitles) {
      urls += `
  <url>
    <loc>https://laksub.com/series/${encodeURIComponent(series)}</loc>
    <lastmod>${currentDate}T00:00:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error serving dynamic sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}
