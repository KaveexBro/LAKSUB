import fs from 'fs';
import path from 'path';

let firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  // If config file is missing, try to parse from ENV or use safe defaults
  console.warn("firebase-applet-config.json not found, falling back to environment variables or defaults if available.");
}

export default async function handler(req, res) {
  try {
    const urlPath = req.url.split('?')[0]; 
    const segments = urlPath.split('/').filter(Boolean);
    const type = segments[0]; 
    let identifier = segments[1];

    if (!identifier) {
      return fallback(res);
    }

    let isSeriesRoute = type === 'series';
    
    // Use env vars or config
    const projectId = firebaseConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0744080809';
    const databaseId = firebaseConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_DATABASE_ID || '(default)';
    
    let apiUrl = '';
    let fetchOptions = {};

    let slug = '';
    let id = '';

    if (type === 'subtitle' && identifier) {
      id = identifier;
    } else {
      slug = identifier;
    }

    if (id) {
      apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/subtitles/${id}`;
      fetchOptions = { method: 'GET' };
    } else {
      apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
      
      let filters = [];
      filters.push({
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "approved" }
        }
      });

      if (!isSeriesRoute) {
        filters.push({
          fieldFilter: {
            field: { fieldPath: "slug" },
            op: "EQUAL",
            value: { stringValue: slug }
          }
        });
      } else {
         filters.push({
          fieldFilter: {
            field: { fieldPath: "movieTitle" },
            op: "EQUAL",
            value: { stringValue: decodeURIComponent(slug) }
          }
        });
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

    let seoData = null;
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
          : 'https://laksub.com/logo.png';
          
        const url = `https://laksub.com${req.url}`;

        seoData = {
          title: seoTitle,
          description: seoDescription,
          keywords: keywords,
          image: posterUrl,
          url: url
        };
      }
    }

    if (!seoData) {
      return fallback(res);
    }

    // Determine the template path based on environment
    const isVercel = process.env.VERCEL || process.env.NOW_REGION;
    let templatePath = path.join(process.cwd(), 'dist', 'index.html');
    
    // In some serverless cases, we might need a direct fallback if dist/index.html doesn't exist
    if (!fs.existsSync(templatePath)) {
        // Ultimate fallback if no file exists
        return res.status(200)
                  .setHeader('Content-Type', 'text/html')
                  .setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')
                  .send(`<!DOCTYPE html><html lang="si"><head><title>${seoData.title}</title><meta name="description" content="${seoData.description}"/><meta http-equiv="refresh" content="0; url=/"></head><body>Loading...</body></html>`);
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    html = html.replace(/<title>.*?<\/title>/, `<title>${seoData.title}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${seoData.description}" />`);
    html = html.replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${seoData.keywords}" />`);
    html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${seoData.title}" />`);
    html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${seoData.description}" />`);
    html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${seoData.url}" />`);
    
    // Inject correct canonical URL
    if (html.includes('<link rel="canonical"')) {
        html = html.replace(/<link rel="canonical" href="[^"]*" ?\/>/, `<link rel="canonical" href="${seoData.url}" />`);
    } else {
        html = html.replace('</head>', `<link rel="canonical" href="${seoData.url}" />\n</head>`);
    }
    
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
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(html);
    
  } catch (error) {
    console.error('Error in SEO function:', error);
    return fallback(res);
  }
};

function fallback(res) {
  try {
    let templatePath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(templatePath)) {
      const html = fs.readFileSync(templatePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60'); 
      return res.status(200).send(html);
    }
    
    // If we can't find the bundled index.html, fall back to a basic HTML response that redirects to home.
    return res.status(200)
              .setHeader('Content-Type', 'text/html')
              .setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')
              .send(`<!DOCTYPE html><html lang="si"><head><meta http-equiv="refresh" content="0; url=/"></head><body>Loading...</body></html>`);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
}
