import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import prerender from '@prerenderer/rollup-plugin';
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer';

// Helper function to fetch routes from Firestore (reusing sitemap logic)
async function fetchDynamicRoutes() {
  const routes = ['/', '/explore', '/movies', '/series'];
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
    const seriesTitles = new Set();
    
    for (const item of results) {
      if (!item.document?.fields) continue;
      const slug = item.document.fields.slug?.stringValue || item.document.name.split('/').pop();
      const type = item.document.fields.type?.stringValue || 'movie';
      
      if (type === 'series' && item.document.fields.movieTitle?.stringValue) {
        seriesTitles.add(item.document.fields.movieTitle.stringValue);
      }
      
      if (slug) routes.push(`/subtitles/${slug}`);
    }

    for (const series of seriesTitles) {
      routes.push(`/series/${encodeURIComponent(series)}`);
    }
  } catch (error) {
    console.error('Failed to fetch dynamic routes for prerendering:', error);
  }
  return routes;
}

export default defineConfig(async () => {
  const dynamicRoutes = await fetchDynamicRoutes();

  return {
    plugins: [
      react(),
      tailwindcss(),
      prerender({
        routes: dynamicRoutes,
        renderer: new PuppeteerRenderer({
          // Wait enough time for your React app to fetch Firebase data and render
          renderAfterTime: 5000,
          maxConcurrentRoutes: 4 // Prevents Vercel build from running out of memory
        }),
      })
    ]
  };
});
