import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import ImageKit from 'imagekit';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

async function startServer() {
  const app = express();
  
  app.set('trust proxy', true);

  app.get('/api/imagekit/auth', (req, res) => {
    try {
      const result = imagekit.getAuthenticationParameters();
      res.json({
        ...result,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY || ''
      });
    } catch (error) {
      console.error('Error generating ImageKit auth parameters:', error);
      res.status(500).json({ error: 'Failed to generate auth parameters' });
    }
  });

  const PORT = process.env.PORT || 3000;

  // Enforce www.laksub.com for SEO
  app.use((req, res, next) => {
    if (req.hostname === 'laksub.com') {
      return res.redirect(301, 'https://www.laksub.com' + req.originalUrl);
    }
    next();
  });

  app.get('/sitemap.xml', async (req, res, next) => {
    try {
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
    <loc>https://www.laksub.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/explore</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/movies</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/series</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/request</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/apply</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/upgrade</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.laksub.com/dmca</loc>
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
    <loc>https://www.laksub.com/${baseUrlPath}/${encodeURIComponent(slug)}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
      
      for (const series of seriesTitles) {
        urls += `
  <url>
    <loc>https://www.laksub.com/series/${encodeURIComponent(series)}</loc>
    <lastmod>${currentDate}T00:00:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

      res.status(200).set({ 'Content-Type': 'application/xml' }).send(sitemap);
    } catch (error) {
      console.error('Error generating dynamic sitemap:', error);
      next(); // Fallback if error occurs
    }
  });

  // Set up dynamic SEO injection route
  app.get(['/movies/:slug', '/tv-series/:slug', '/series/:slug', '/subtitles/:slug', '/subtitle/:id'], async (req, res, next) => {
    try {
      const { slug, id } = req.params;
      const isSeriesRoute = req.path.startsWith('/series/');
      const identifier = slug || id;
      
      if (!identifier) {
        return next();
      }

      let seoData = null;

      // We use the Firestore REST API to fetch data so we don't have to deal with Node.js client SDK quirks
      const projectId = firebaseConfig.projectId;
      const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
      
      let apiUrl = '';
      let fetchOptions = {};

      if (id && !slug) {
        // Fetch by document ID
        apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/subtitles/${id}`;
        fetchOptions = { method: 'GET' };
      } else {
        // Query by slug
        apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
        
        let filters = [];
        
        // Match status=approved
        filters.push({
          fieldFilter: {
            field: { fieldPath: "status" },
            op: "EQUAL",
            value: { stringValue: "approved" }
          }
        });

        // Match slug
        if (!isSeriesRoute) {
          filters.push({
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: slug }
            }
          });
        } else {
           // For /series/:slug we match movieTitle = slug (decoded)
           filters.push({
            fieldFilter: {
              field: { fieldPath: "movieTitle" },
              op: "EQUAL",
              value: { stringValue: decodeURIComponent(slug) }
            }
          });
          // And type=series
          filters.push({
            fieldFilter: {
              field: { fieldPath: "type" },
              op: "EQUAL",
              value: { stringValue: "series" }
            }
          });
        }

        fetchOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: "subtitles" }],
              where: {
                compositeFilter: {
                  op: "AND",
                  filters: filters
                }
              },
              limit: 1
            }
          })
        };
      }

      const response = await fetch(apiUrl, fetchOptions);
      if (response.ok) {
        const data = await response.json();
        
        let docData = null;
        if (id && !slug) {
          docData = data.fields;
        } else if (data && data.length > 0 && data[0].document) {
          docData = data[0].document.fields;
        }

        if (docData) {
          // Extract fields safely
          const movieTitle = docData.movieTitle?.stringValue || '';
          const subtitleType = docData.type?.stringValue || 'movie';
          const releaseYear = docData.releaseYear?.integerValue || '';
          let fullTitle = movieTitle;
          
          if (!isSeriesRoute && subtitleType === 'series' && docData.season && docData.episode) {
            fullTitle = `${movieTitle} S${docData.season.integerValue.toString().padStart(2, '0')}E${docData.episode.integerValue.toString().padStart(2, '0')}`;
          }

          const seoTitle = isSeriesRoute 
            ? `${movieTitle} Sinhala Subtitles | ${movieTitle} Sinhala Sub | LAKSUB`
            : `${fullTitle} Sinhala Subtitles | ${movieTitle} Sinhala Sub | LAKSUB`;
          
          let plainDesc = (docData.description?.stringValue || '').replace(/<[^>]*>?/gm, '').substring(0, 160);
          if (!plainDesc) {
            plainDesc = `Download high-quality Sinhala subtitles for ${fullTitle} (${releaseYear}). Latest ${subtitleType === 'movie' ? 'movie' : 'TV series'} Sinhala sub available at LakSub.`;
          }
          
          const seoDescription = isSeriesRoute
            ? `Download high-quality Sinhala subtitles (Sinhala sub) for ${movieTitle}. Latest seasons and episodes available. Join Sri Lanka's largest subtitle community.`
            : `Download high-quality Sinhala subtitles (Sinhala sub) for ${fullTitle} (${releaseYear}). ${plainDesc}`;

          const keywords = isSeriesRoute
            ? `${movieTitle} Sinhala subtitles, ${movieTitle} Sinhala sub, ${movieTitle} Sinhala subtitle, download ${movieTitle} Sinhala sub, tv series subtitles, Sinhala sub, LAKSUB`
            : `${fullTitle} Sinhala Subtitles, ${movieTitle} Sinhala Sub, ${fullTitle} Sinhala Subtitle, download ${movieTitle} Sinhala Subtitles, Sinhala subtitles, Sinhala sub, LAKSUB`;
          
          const posterUrl = docData.posterPath?.stringValue 
            ? `https://image.tmdb.org/t/p/w500${docData.posterPath.stringValue}`
            : 'https://www.laksub.com/logo.png';
            
          const encodedSlug = encodeURIComponent(decodeURIComponent(slug || id || ''));
          const originalPath = isSeriesRoute ? `/series/${encodedSlug}` : `/subtitles/${encodedSlug}`;
            
          const url = `https://www.laksub.com${originalPath}`;

          
          const structuredData = {
            "@context": "https://schema.org",
            "@type": isSeriesRoute ? "TVSeries" : "Movie",
            "name": isSeriesRoute ? movieTitle : fullTitle,
            "description": seoDescription,
            "url": url,
            "image": posterUrl,
            "inLanguage": "si",
            "isAccessibleForFree": true,
            "author": {
              "@type": "Organization",
              "name": "LakSub",
              "url": "https://www.laksub.com"
            }
          };
          
          if (!isSeriesRoute && releaseYear) {
             structuredData["dateCreated"] = releaseYear.toString();
          }

          seoData = {
            title: seoTitle,
            description: seoDescription,
            keywords: keywords,
            image: posterUrl,
            url: url,
            structuredData: structuredData
          };
        }
      }

      // If we couldn't fetch SEO data, just continue to standard SPA fallback
      if (!seoData) {
        return next();
      }

      // Read the index.html from dist (production).
      const templatePath = path.join(process.cwd(), 'dist', 'index.html');
      if (!fs.existsSync(templatePath)) {
        // If no dist build exists, we are in pure dev mode without a build, fallback to Vite middleware
        return next();
      }
      
      let html = fs.readFileSync(templatePath, 'utf8');

      // Inject SEO
      html = html.replace(/<title>.*?<\/title>/, `<title>${seoData.title}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${seoData.description}" />`);
      html = html.replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${seoData.keywords}" />`);
      
      // Remove any existing ones just in case (though we removed from base HTML, good practice)
      html = html.replace(/<link rel="canonical"[^>]+>/g, '');
      html = html.replace(/<link rel="alternate"[^>]+hreflang[^>]+>/g, '');

      const headInject = `
        <link rel="canonical" href="${seoData.url}" />
        <link rel="alternate" hreflang="si" href="${seoData.url}" />
        <link rel="alternate" hreflang="en" href="${seoData.url}" />
        <link rel="alternate" hreflang="x-default" href="${seoData.url}" />
      `;
      html = html.replace('</head>', `${headInject}</head>`);
      
      html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${seoData.title}" />`);
      html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${seoData.description}" />`);
      html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${seoData.url}" />`);
      
      // Inject image safely (some tags might not exist in index.html, so we append them before </head> if needed, or simply replace)
      if (seoData.image) {
          if (html.includes('<meta property="og:image"')) {
             html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${seoData.image}" />`);
          } else {
             html = html.replace('</head>', `<meta property="og:image" content="${seoData.image}" />\n</head>`);
          }
          if (html.includes('<meta property="twitter:image"')) {
             html = html.replace(/<meta property="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${seoData.image}" />`);
          } else {
             html = html.replace('</head>', `<meta name="twitter:image" content="${seoData.image}" />\n</head>`);
          }
      }
      
      // Inject Structured Data (Movie or TVSeries)
      if (seoData.structuredData) {
          html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(seoData.structuredData)}</script>\n</head>`);
      }
      
      res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      
    } catch (error) {
      console.error('Error serving dynamic SEO route:', error);
      next(); // fallback to standard index.html if something breaks
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from 'dist'
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath)); // Removed index: false so prerendered folders are served properly
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
