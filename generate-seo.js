import fs from 'fs';
import path from 'path';

async function generatePrerender() {
  try {
    const projectId = "gen-lang-client-0744080809";
    const databaseId = "ai-studio-1e8cd04c-3326-4b18-88c9-f52e3a9d3db1";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "subtitles" }],
          where: {
            fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "approved" } }
          }
        }
      })
    });

    if (!response.ok) throw new Error('Firestore fetch failed');
    
    const results = await response.json();
    
    const templatePath = path.join(process.cwd(), 'dist', 'index.html');
    const baseHtml = fs.readFileSync(templatePath, 'utf8');

    // Helper to inject SEO tags
    const injectSEO = (html, seoData) => {
      let modified = html;
      modified = modified.replace(/<title>.*?<\/title>/, `<title>${seoData.title}</title>`);
      modified = modified.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${seoData.description}" />`);
      modified = modified.replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${seoData.keywords}" />`);
      
      // Open Graph
      if (modified.includes('<meta property="og:title"')) {
         modified = modified.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${seoData.title}" />`);
      } else {
         modified = modified.replace('</head>', `<meta property="og:title" content="${seoData.title}" />\n</head>`);
      }
      
      if (modified.includes('<meta property="og:description"')) {
         modified = modified.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${seoData.description}" />`);
      } else {
         modified = modified.replace('</head>', `<meta property="og:description" content="${seoData.description}" />\n</head>`);
      }
      
      if (modified.includes('<meta property="og:url"')) {
         modified = modified.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${seoData.url}" />`);
      } else {
         modified = modified.replace('</head>', `<meta property="og:url" content="${seoData.url}" />\n</head>`);
      }
      
      if (seoData.image) {
          if (modified.includes('<meta property="og:image"')) {
             modified = modified.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${seoData.image}" />`);
          } else {
             modified = modified.replace('</head>', `<meta property="og:image" content="${seoData.image}" />\n</head>`);
          }
          if (modified.includes('<meta name="twitter:image"')) {
             modified = modified.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${seoData.image}" />`);
          } else {
             modified = modified.replace('</head>', `<meta name="twitter:image" content="${seoData.image}" />\n</head>`);
          }
      }
      
      if (seoData.structuredData) {
          modified = modified.replace('</head>', `<script type="application/ld+json">${JSON.stringify(seoData.structuredData)}</script>\n</head>`);
      }
      
      // Inject static content for Googlebot and initial load
      if (seoData.staticContent) {
          modified = modified.replace('<div id="root"></div>', `<div id="root">${seoData.staticContent}</div>`);
      }
      
      return modified;
    };

    const seriesTitles = new Map(); // Keep track of series for series pages

    for (const item of results) {
      if (!item.document?.fields) continue;
      
      const docData = item.document.fields;
      const slug = docData.slug?.stringValue || item.document.name.split('/').pop();
      const subtitleType = docData.type?.stringValue || 'movie';
      const movieTitle = docData.movieTitle?.stringValue || '';
      const releaseYear = docData.releaseYear?.integerValue || '';
      
      let fullTitle = movieTitle;
      if (subtitleType === 'series' && docData.season && docData.episode) {
        fullTitle = `${movieTitle} S${docData.season?.integerValue?.toString().padStart(2, '0')}E${docData.episode?.integerValue?.toString().padStart(2, '0')}`;
      }

      if (subtitleType === 'series' && movieTitle) {
        if (!seriesTitles.has(movieTitle)) {
           seriesTitles.set(movieTitle, docData);
        }
      }

      const seoTitle = `${fullTitle} Sinhala Subtitles | ${movieTitle} Sinhala Sub | LAKSUB`;
      
      let plainDesc = (docData.description?.stringValue || '').replace(/<[^>]*>?/gm, '').substring(0, 160);
      if (!plainDesc) plainDesc = `Download high-quality Sinhala subtitles for ${fullTitle} (${releaseYear}). Latest ${subtitleType === 'movie' ? 'movie' : 'TV series'} Sinhala sub available at LakSub.`;
      
      const seoDescription = `Download high-quality Sinhala subtitles (Sinhala sub) for ${fullTitle} (${releaseYear}). ${plainDesc}`;
      const keywords = `${fullTitle} Sinhala Subtitles, ${movieTitle} Sinhala Sub, ${fullTitle} Sinhala Subtitle, download ${movieTitle} Sinhala Subtitles, Sinhala subtitles, Sinhala sub, LAKSUB`;
      
      const posterUrl = docData.posterPath?.stringValue ? `https://image.tmdb.org/t/p/w500${docData.posterPath.stringValue}` : 'https://laksub.com/logo.png';
      const url = `https://laksub.com/subtitles/${slug}`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": fullTitle,
        "description": seoDescription,
        "url": url,
        "image": posterUrl,
        "inLanguage": "si",
        "isAccessibleForFree": true,
        "dateCreated": releaseYear ? releaseYear.toString() : undefined,
        "author": { "@type": "Organization", "name": "LakSub", "url": "https://laksub.com" }
      };

      const fullDescription = docData.description?.stringValue || '';
      const staticContent = `
        <div style="background-color: #141414; color: #ffffff; min-height: 100vh; font-family: sans-serif; padding: 2rem;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px; max-width: 400px;">
              <img src="${posterUrl}" alt="${fullTitle}" style="width: 100%; border-radius: 0.5rem; display: block;" />
            </div>
            <div style="flex: 2; min-width: 300px;">
              <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; margin-top: 0;">${fullTitle} Sinhala Subtitles</h1>
              <p style="font-size: 1.125rem; color: #9ca3af; margin-bottom: 2rem;">${seoDescription}</p>
              <div style="color: #d1d5db; line-height: 1.6;">
                ${fullDescription}
              </div>
            </div>
          </div>
        </div>
      `;

      const seoData = { title: seoTitle, description: seoDescription, keywords, image: posterUrl, url, structuredData, staticContent };
      
      const finalHtml = injectSEO(baseHtml, seoData);
      
      // Write to dist/subtitles/slug/index.html
      const dir = path.join(process.cwd(), 'dist', 'subtitles', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), finalHtml);
    }

    // Generate Series pages
    for (const [movieTitle, docData] of seriesTitles.entries()) {
      const seoTitle = `${movieTitle} Sinhala Subtitles | ${movieTitle} Sinhala Sub | LAKSUB`;
      const seoDescription = `Download high-quality Sinhala subtitles (Sinhala sub) for ${movieTitle}. Latest seasons and episodes available. Join Sri Lanka's largest subtitle community.`;
      const keywords = `${movieTitle} Sinhala subtitles, ${movieTitle} Sinhala sub, ${movieTitle} Sinhala subtitle, download ${movieTitle} Sinhala sub, tv series subtitles, Sinhala sub, LAKSUB`;
      const posterUrl = docData.posterPath?.stringValue ? `https://image.tmdb.org/t/p/w500${docData.posterPath.stringValue}` : 'https://laksub.com/logo.png';
      const url = `https://laksub.com/series/${encodeURIComponent(movieTitle)}`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": movieTitle,
        "description": seoDescription,
        "url": url,
        "image": posterUrl,
        "inLanguage": "si",
        "isAccessibleForFree": true,
        "author": { "@type": "Organization", "name": "LakSub", "url": "https://laksub.com" }
      };

      const staticContent = `
        <div style="background-color: #141414; color: #ffffff; min-height: 100vh; font-family: sans-serif; padding: 2rem;">
          <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px; max-width: 400px;">
              <img src="${posterUrl}" alt="${movieTitle}" style="width: 100%; border-radius: 0.5rem; display: block;" />
            </div>
            <div style="flex: 2; min-width: 300px;">
              <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; margin-top: 0;">${movieTitle} Sinhala Subtitles</h1>
              <p style="font-size: 1.125rem; color: #9ca3af; margin-bottom: 2rem;">${seoDescription}</p>
            </div>
          </div>
        </div>
      `;

      const seoData = { title: seoTitle, description: seoDescription, keywords, image: posterUrl, url, structuredData, staticContent };
      const finalHtml = injectSEO(baseHtml, seoData);
      
      const dir = path.join(process.cwd(), 'dist', 'series', movieTitle);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), finalHtml);
    }

    console.log('Successfully generated static SEO HTML pages.');
  } catch (error) {
    console.error('Error generating prerendered SEO pages:', error);
    process.exit(1);
  }
}

generatePrerender();
