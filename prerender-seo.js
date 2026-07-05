/**
 * SEO Prerendering Script
 * 
 * This script prerendered popular subtitle pages to static HTML for better SEO.
 * It generates an index sitemap (like baiscope/cineru) with image tags.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchSubtitles() {
  try {
    const projectId = "gen-lang-client-0744080809";
    const databaseId = "ai-studio-1e8cd04c-3326-4b18-88c9-f52e3a9d3db1";
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
          },
          orderBy: [
            {
              field: { fieldPath: "downloadCount" },
              direction: "DESCENDING"
            }
          ],
          limit: 1000 // Increase limit for sitemap indexing
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Firestore REST API: ' + response.statusText);
    }

    const results = await response.json();
    const subtitles = [];
    
    for (const item of results) {
      if (!item.document) continue;
      
      const fields = item.document.fields;
      if (!fields) continue;

      subtitles.push({
        id: item.document.name.split('/').pop(),
        slug: fields.slug?.stringValue,
        type: fields.type?.stringValue || 'movie',
        movieTitle: fields.movieTitle?.stringValue,
        releaseYear: fields.releaseYear?.integerValue,
        description: fields.description?.stringValue,
        posterPath: fields.posterPath?.stringValue,
        downloadCount: fields.downloadCount?.integerValue || 0,
        tmdbId: fields.tmdbId?.stringValue,
        season: fields.season?.integerValue,
        episode: fields.episode?.integerValue
      });
    }

    return subtitles;
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return [];
  }
}

function generateSitemapIndex() {
  const currentDate = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://laksub.com/page-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://laksub.com/movie-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://laksub.com/series-sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;
}

function generatePageSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  const pages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/explore', priority: '0.9', changefreq: 'daily' },
    { url: '/explore?type=movie', priority: '0.8', changefreq: 'daily' },
    { url: '/explore?type=series', priority: '0.8', changefreq: 'daily' },
    { url: '/movies', priority: '0.9', changefreq: 'daily' },
    { url: '/series', priority: '0.9', changefreq: 'daily' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact', priority: '0.5', changefreq: 'monthly' },
    { url: '/request', priority: '0.6', changefreq: 'weekly' },
    { url: '/apply', priority: '0.5', changefreq: 'monthly' },
    { url: '/upgrade', priority: '0.6', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/dmca', priority: '0.3', changefreq: 'yearly' },
  ];

  let urls = pages.map(p => `
  <url>
    <loc>https://laksub.com${p.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateContentSitemap(subtitles, type) {
  const currentDate = new Date().toISOString().split('T')[0];
  let urls = '';
  const seriesTitles = new Set();
  
  for (const subtitle of subtitles) {
    if (!subtitle.slug || subtitle.type !== type) continue;
    
    const baseUrlPath = type === 'series' ? 'tv-series' : 'movies';
    const priority = subtitle.downloadCount > 1000 ? 0.9 : subtitle.downloadCount > 500 ? 0.8 : 0.7;

    let imageTag = '';
    if (subtitle.posterPath) {
      const imgUrl = `https://image.tmdb.org/t/p/w500${subtitle.posterPath}`;
      imageTag = `\n    <image:image>\n      <image:loc>${imgUrl}</image:loc>\n      <image:title><![CDATA[${subtitle.movieTitle} Sinhala Subtitles]]></image:title>\n    </image:image>`;
    }

    urls += `
  <url>
    <loc>https://laksub.com/${baseUrlPath}/${subtitle.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority.toFixed(1)}</priority>${imageTag}
  </url>`;

    if (type === 'series' && subtitle.movieTitle) {
      seriesTitles.add(subtitle.movieTitle);
    }
  }

  // Add series base pages
  if (type === 'series') {
    for (const series of seriesTitles) {
      urls += `
  <url>
    <loc>https://laksub.com/series/${encodeURIComponent(series)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

function generateRobotsFile() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Crawl-delay: 1

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://laksub.com/sitemap.xml
`;
}

// Generate static HTML for a subtitle
function injectHtmlSeo(templateHtml, seoData) {
  let html = templateHtml;
  
  html = html.replace(/<title>.*?<\/title>/, `<title>${seoData.title}</title>`);
  
  html = html.replace(/<meta name="description" content="([^"]*)" \/>/, `<meta name="description" content="${seoData.description}" />`);
  html = html.replace(/<meta name="keywords" content="([^"]*)" \/>/, `<meta name="keywords" content="${seoData.keywords}" />`);
  
  html = html.replace(/<meta property="og:title" content="([^"]*)" \/>/, `<meta property="og:title" content="${seoData.title}" />`);
  html = html.replace(/<meta property="og:description" content="([^"]*)" \/>/, `<meta property="og:description" content="${seoData.description}" />`);
  html = html.replace(/<meta property="og:url" content="([^"]*)" \/>/, `<meta property="og:url" content="${seoData.url}" />`);
  
  if (seoData.image) {
      html = html.replace(/<meta property="og:image" content="([^"]*)" \/>/, `<meta property="og:image" content="${seoData.image}" />`);
      html = html.replace(/<meta property="twitter:image" content="([^"]*)" \/>/, `<meta property="twitter:image" content="${seoData.image}" />`);
  }
  
  html = html.replace(/<meta property="twitter:title" content="([^"]*)" \/>/, `<meta property="twitter:title" content="${seoData.title}" />`);
  html = html.replace(/<meta property="twitter:description" content="([^"]*)" \/>/, `<meta property="twitter:description" content="${seoData.description}" />`);
  html = html.replace(/<link rel="canonical" href="([^"]*)" \/>/, `<link rel="canonical" href="${seoData.url}" />`);

  return html;
}

// Create directories recursively if they don't exist
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

async function generate() {
  try {
    const distPath = path.join(__dirname, 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    
    if (!fs.existsSync(indexHtmlPath)) {
        console.error('Error: dist/index.html not found. Make sure "vite build" runs BEFORE this script.');
        process.exit(1);
    }
    
    const templateHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    console.log('Fetching subtitles from Firestore...');
    const subtitles = await fetchSubtitles();
    console.log(`Found ${subtitles.length} approved subtitles`);

    // Prerender individual subtitle pages
    console.log('Generating static HTML files for SEO...');
    let generatedHtmlCount = 0;
    const seriesTitles = new Set();
    const seriesData = {};

    for (const subtitle of subtitles) {
      if (!subtitle.slug) continue;
      
      const baseUrlPath = subtitle.type === 'series' ? 'tv-series' : 'movies';
      const url = `https://laksub.com/${baseUrlPath}/${subtitle.slug}`;
      
      const fullTitle = subtitle.type === 'series' && subtitle.season && subtitle.episode 
        ? `${subtitle.movieTitle} S${subtitle.season.toString().padStart(2, '0')}E${subtitle.episode.toString().padStart(2, '0')}`
        : subtitle.movieTitle;
        
      const title = `${fullTitle} Sinhala Subtitles | ${subtitle.movieTitle} Sinhala Sub | LAKSUB`;
      // Clean plain description for SEO
      const plainTextDescription = (subtitle.description || '').replace(/<[^>]*>?/gm, '').substring(0, 160) || `Download high-quality Sinhala subtitles for ${fullTitle} (${subtitle.releaseYear}). Latest ${subtitle.type === 'movie' ? 'movie' : 'TV series'} Sinhala sub available at LakSub.`;
      const description = `Download high-quality Sinhala subtitles (Sinhala sub) for ${fullTitle} (${subtitle.releaseYear}). ${plainTextDescription}`;
      const keywords = `${fullTitle} Sinhala Subtitles, ${subtitle.movieTitle} Sinhala Sub, ${fullTitle} Sinhala Subtitle, download ${subtitle.movieTitle} Sinhala Subtitles, Sinhala subtitles, Sinhala sub, LAKSUB`;
      
      const image = subtitle.posterPath ? `https://image.tmdb.org/t/p/w500${subtitle.posterPath}` : 'https://laksub.com/logo.png';
      
      const seoData = { title, description, keywords, url, image };
      const outHtml = injectHtmlSeo(templateHtml, seoData);
      
      const outPath = path.join(distPath, baseUrlPath, `${subtitle.slug}.html`);
      ensureDirectoryExists(outPath);
      fs.writeFileSync(outPath, outHtml);
      
      // Legacy output for /subtitles/:slug links heavily used in frontend
      const legacyPath = path.join(distPath, 'subtitles', `${subtitle.slug}.html`);
      ensureDirectoryExists(legacyPath);
      fs.writeFileSync(legacyPath, outHtml);
      
      generatedHtmlCount += 2;

      // Collect series for group pages
      if (subtitle.type === 'series' && subtitle.movieTitle) {
          seriesTitles.add(subtitle.movieTitle);
          if (!seriesData[subtitle.movieTitle] && subtitle.posterPath) {
              seriesData[subtitle.movieTitle] = subtitle.posterPath;
          }
      }
    }
    
    // Generate Series group pages HTML
    for (const series of seriesTitles) {
        const slugLink = encodeURIComponent(series);
        const url = `https://laksub.com/series/${slugLink}`;
        
        const title = `${series} Sinhala Subtitles | ${series} Sinhala Sub | LAKSUB`;
        const description = `Download high-quality Sinhala subtitles (Sinhala sub) for ${series}. Latest seasons and episodes available. Join Sri Lanka's largest subtitle community.`;
        const keywords = `${series} Sinhala subtitles, ${series} Sinhala sub, ${series} Sinhala subtitle, download ${series} Sinhala sub, tv series subtitles, Sinhala sub, LAKSUB`;
        
        const pPath = seriesData[series];
        const image = pPath ? `https://image.tmdb.org/t/p/w500${pPath}` : 'https://laksub.com/logo.png';
        const seoData = { title, description, keywords, url, image };
        
        const outHtml = injectHtmlSeo(templateHtml, seoData);
        
        const outPath = path.join(distPath, 'series', `${series}.html`);
        ensureDirectoryExists(outPath);
        fs.writeFileSync(outPath, outHtml);
        generatedHtmlCount++;
    }

    console.log(`✓ Generated ${generatedHtmlCount} static HTML pages for crawlers!`);

    // Generate Index Sitemap
    console.log('Generating sitemap index...');
    const sitemapIndex = generateSitemapIndex();
    fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemapIndex);
    console.log('✓ Sitemap index generated: dist/sitemap.xml');

    // Generate Page Sitemap
    const pageSitemap = generatePageSitemap();
    fs.writeFileSync(path.join(distPath, 'page-sitemap.xml'), pageSitemap);
    console.log('✓ Page sitemap generated: dist/page-sitemap.xml');

    // Generate Movie Sitemap
    const movieSitemap = generateContentSitemap(subtitles, 'movie');
    fs.writeFileSync(path.join(distPath, 'movie-sitemap.xml'), movieSitemap);
    console.log('✓ Movie sitemap generated: dist/movie-sitemap.xml');

    // Generate Series Sitemap
    const seriesSitemap = generateContentSitemap(subtitles, 'series');
    fs.writeFileSync(path.join(distPath, 'series-sitemap.xml'), seriesSitemap);
    console.log('✓ Series sitemap generated: dist/series-sitemap.xml');

    // Generate enhanced robots.txt
    console.log('Generating enhanced robots.txt...');
    const robots = generateRobotsFile();
    fs.writeFileSync(path.join(distPath, 'robots.txt'), robots);
    console.log('✓ Robots.txt generated: dist/robots.txt');

    console.log('\n✓ All SEO files generated successfully!');
  } catch (error) {
    console.error('Error generating SEO files:', error);
    process.exit(1);
  }
}

generate();

