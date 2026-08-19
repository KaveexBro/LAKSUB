import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    
    // Parse query params safely
    let urlObj;
    try {
      urlObj = new URL(req.url, `${protocol}://${host}`);
    } catch (e) {
      // Fallback if req.url is just a path
      urlObj = new URL(`https://example.com${req.url}`);
    }
    
    let type = req.query?.type || urlObj.searchParams.get('type');
    let slug = req.query?.slug || urlObj.searchParams.get('slug');
    let id = req.query?.id || urlObj.searchParams.get('id');

    // Fallback extraction from pathname if query params are missing (Vercel rewrite issue)
    if (!type || (!slug && !id)) {
      // Vercel exposes the original requested path in the 'x-invoke-path' header. 
      // If missing, use req.url.
      const originalPath = req.headers['x-invoke-path'] || urlObj.pathname;
      const pathParts = originalPath.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        const route = pathParts[0];
        const pathIdentifier = pathParts.slice(1).join('/'); // support slugs with slashes if any

        if (route === 'subtitles' || route === 'movies' || route === 'tv-series') {
          type = 'subtitle';
          slug = pathIdentifier;
        } else if (route === 'series') {
          type = 'series';
          slug = pathIdentifier;
        } else if (route === 'subtitle') {
          type = 'subtitle-id';
          id = pathIdentifier;
        }
      }
    }

    // Fetch the base index.html
    const baseUrl = `${protocol}://${host}`;
    let html = '';
    try {
      const htmlResponse = await fetch(`${baseUrl}/index.html`);
      if (htmlResponse.ok) {
        html = await htmlResponse.text();
      } else {
        throw new Error('Failed to fetch index.html');
      }
    } catch (e) {
      // Fallback: Read locally (depends on Vercel deployment structure)
      try {
        html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
      } catch (localErr) {
        html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
      }
    }

    let isSeriesRoute = type === 'series';
    let isId = type === 'subtitle-id';
    let identifier = isId ? id : slug;

    const injectTag = (tag) => {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${tag}\n</head>`);
      }
    };

    if (!identifier) {
      let pathname = urlObj.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      const canonicalUrl = `${protocol}://${host}${pathname === '/' ? '' : pathname}`;
      
      // Remove any existing canonical tags to prevent duplicates
      html = html.replace(/<link rel="canonical"[^>]+>/g, '');
      html = html.replace(/<link rel="alternate"[^>]+hreflang[^>]+>/g, '');

      injectTag(`<link rel="canonical" href="${canonicalUrl}" />`);
      injectTag(`<link rel="alternate" hreflang="si" href="${canonicalUrl}" />`);
      injectTag(`<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`);
      injectTag(`<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    const projectId = firebaseConfig.projectId;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    let apiUrl = '';
    let fetchOptions = {};

    if (isId) {
      apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/subtitles/${identifier}`;
      fetchOptions = { method: 'GET' };
    } else {
      apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
      
      let filters = [];
      filters.push({
        fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "approved" } }
      });

      if (!isSeriesRoute) {
        filters.push({
          fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: identifier } }
        });
      } else {
        filters.push({
          fieldFilter: { field: { fieldPath: "movieTitle" }, op: "EQUAL", value: { stringValue: decodeURIComponent(identifier) } }
        });
        filters.push({
          fieldFilter: { field: { fieldPath: "type" }, op: "EQUAL", value: { stringValue: "series" } }
        });
      }

      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "subtitles" }],
            where: { compositeFilter: { op: "AND", filters: filters } },
            limit: 1
          }
        })
      };
    }

    const firestoreResponse = await fetch(apiUrl, fetchOptions);
    if (!firestoreResponse.ok) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    const data = await firestoreResponse.json();
    let docData = null;
    if (isId) {
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
        
      const encodedIdentifier = encodeURIComponent(decodeURIComponent(identifier));
      const originalPath = isSeriesRoute ? `/series/${encodedIdentifier}` : `/subtitles/${encodedIdentifier}`;
        
      const url = `https://laksub.com${originalPath}`;

      const structuredData = {
        "@context": "https://schema.org",
        "@type": isSeriesRoute ? "TVSeries" : (subtitleType === 'series' ? "TVSeries" : "Movie"),
        "name": isSeriesRoute ? movieTitle : fullTitle,
        "description": seoDescription,
        "url": url,
        "image": posterUrl,
        "inLanguage": "si",
        "isAccessibleForFree": true,
        "author": { "@type": "Organization", "name": "LakSub", "url": "https://laksub.com" }
      };
      
      if (!isSeriesRoute && releaseYear) {
         structuredData["dateCreated"] = releaseYear.toString();
      }

      // Inject SEO
      html = html.replace(/<title>.*?<\/title>/, `<title data-rh="true">${seoTitle}</title>`);
      html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta data-rh="true" name="description" content="${seoDescription}" />`);
      html = html.replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta data-rh="true" name="keywords" content="${keywords}" />`);
      
      // Remove existing og: tags to avoid duplicates
      html = html.replace(/<meta property="og:[^>]+>/g, '');
      html = html.replace(/<meta property="twitter:[^>]+>/g, '');
      html = html.replace(/<link rel="canonical"[^>]+>/g, '');
      html = html.replace(/<link rel="alternate"[^>]+hreflang[^>]+>/g, '');

      injectTag(`<link data-rh="true" rel="canonical" href="${url}" />`);
      injectTag(`<link data-rh="true" rel="alternate" hreflang="si" href="${url}" />`);
      injectTag(`<link data-rh="true" rel="alternate" hreflang="en" href="${url}" />`);
      injectTag(`<link data-rh="true" rel="alternate" hreflang="x-default" href="${url}" />`);

      injectTag(`<meta data-rh="true" property="og:title" content="${seoTitle}" />`);
      injectTag(`<meta data-rh="true" property="og:description" content="${seoDescription}" />`);
      injectTag(`<meta data-rh="true" property="og:url" content="${url}" />`);
      injectTag(`<meta data-rh="true" property="og:image" content="${posterUrl}" />`);
      injectTag(`<meta data-rh="true" property="og:type" content="website" />`);
      
      injectTag(`<meta data-rh="true" name="twitter:card" content="summary_large_image" />`);
      injectTag(`<meta data-rh="true" name="twitter:title" content="${seoTitle}" />`);
      injectTag(`<meta data-rh="true" name="twitter:description" content="${seoDescription}" />`);
      injectTag(`<meta data-rh="true" name="twitter:image" content="${posterUrl}" />`);
      
      injectTag(`<script data-rh="true" type="application/ld+json">${JSON.stringify(structuredData)}</script>`);
      
      // We do not need a visual static HTML injection since the screenshot issue was actually
      // caused by the rewrite rule returning the standard index.html (which just has default title/desc)
      // Googlebot parses Open Graph and structured data and renders the page normally.
      // However, to ensure something shows up in the screenshot while it loads:
      const loadingStateHtml = `
        <div id="seo-static-loading" style="position: absolute; top: 0; left: 0; width: 100%; height: 100vh; background-color: #141414; z-index: -100; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <img src="${posterUrl}" alt="${fullTitle}" style="width: 200px; border-radius: 8px; margin-bottom: 20px; opacity: 0.5;" />
          <h1 style="color: white; font-family: sans-serif;">${seoTitle}</h1>
        </div>
      `;
      html = html.replace('<div id="root"></div>', `<div id="root"></div>${loadingStateHtml}`);
    }

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating SEO page');
  }
}
