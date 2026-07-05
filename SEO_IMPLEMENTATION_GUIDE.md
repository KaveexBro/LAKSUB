# SEO Implementation Guide for LAKSUB

## Overview

This guide documents the SEO improvements made to the LAKSUB website to improve rankings for keywords like "Hoppers Sinhala Sub" and "Sinhala Subtitle".

## Changes Made

### 1. Enhanced Prerendering Pipeline

**File**: `prerender-seo.js`

A new prerendering script has been created that:

- Fetches the top 100 most downloaded subtitles from Firestore at build time
- Generates an enhanced sitemap with keyword-based priorities
- Creates a separate keyword-specific sitemap for better crawl efficiency
- Generates an optimized robots.txt file with search engine-specific rules

**Integration**: Updated `package.json` build script to use `prerender-seo.js` instead of the old `generate-sitemap.js`.

### 2. SEO Helper Utilities

**File**: `src/utils/seoHelpers.ts`

New utility functions for generating SEO-optimized content:

- `generateSubtitleSEO()`: Creates keyword-rich meta tags and structured data for subtitle detail pages
- `generateSeriesSEO()`: Optimizes series group pages with comprehensive keywords
- `generateListingSEO()`: Generates SEO data for listing pages (movies, series, explore)
- `generateBreadcrumbSchema()`: Creates breadcrumb structured data
- `generateFAQSchema()`: Generates FAQ structured data for common questions
- `generateOrganizationSchema()`: Creates organization-level structured data

### 3. Enhanced Index.html

**File**: `index.html`

Improvements include:

- Added "Hoppers Sinhala Sub" to keywords for better targeting
- Enhanced meta descriptions with more specific keyword mentions
- Added language alternates (Sinhala and English)
- Improved Open Graph tags with image dimensions
- Added comprehensive FAQ structured data
- Added organization and website search structured data
- Added DNS prefetch hints for faster external resource loading

### 4. Optimized Robots.txt

**File**: `public/robots.txt`

Enhancements:

- Specific rules for different search engines (Googlebot, Bingbot, Slurp)
- Optimized crawl delays and request rates
- Clear disallow rules for admin and API endpoints
- References to both main sitemap and keyword-specific sitemap
- Better crawl efficiency for search engines

### 5. Enhanced Vercel Configuration

**File**: `vercel.json`

Improvements:

- Added security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Specific content-type headers for XML sitemaps
- Optimized cache control for different file types
- Better handling of robots.txt and sitemap files

## How to Use

### Building the Project

```bash
npm run build
```

This will:
1. Run `prerender-seo.js` to generate enhanced sitemaps and robots.txt
2. Run `vite build` to build the React application
3. Deploy to Vercel with all SEO optimizations

### Monitoring SEO Performance

1. **Google Search Console**: Monitor indexing and search performance at https://search.google.com/search-console
2. **Check Sitemaps**: Verify sitemaps are being generated correctly
   - Main sitemap: `https://laksub.com/sitemap.xml`
   - Keyword sitemap: `https://laksub.com/sitemap-keywords.xml`

3. **Monitor Rankings**: Use tools like SEMrush, Ahrefs, or Google Search Console to track rankings for target keywords

### Integrating SEO Helpers in Components

To use the new SEO helper functions in React components:

```typescript
import { generateSubtitleSEO } from '../utils/seoHelpers';

// In your component
const seoData = generateSubtitleSEO(subtitle, fullTitle, posterUrl);

// Use in Helmet
<Helmet>
  <title>{seoData.title}</title>
  <meta name="description" content={seoData.description} />
  <meta name="keywords" content={seoData.keywords.join(', ')} />
  <link rel="canonical" href={seoData.canonicalUrl} />
  <script type="application/ld+json">
    {JSON.stringify(seoData.structuredData)}
  </script>
</Helmet>
```

## Expected Results

After deploying these changes, you should see:

1. **Improved Indexing**: More pages indexed in Google Search Console within 2-4 weeks
2. **Better Rankings**: Improved rankings for target keywords like "Hoppers Sinhala Sub" within 4-8 weeks
3. **Increased Traffic**: Higher organic search traffic from target keywords
4. **Better CTR**: Improved click-through rates due to better meta descriptions
5. **Faster Crawling**: Search engines will crawl your site more efficiently

## Next Steps for Further Optimization

### Priority 1: Implement Dynamic Meta Tags (High Impact)

Update `SubtitleDetails.tsx` and `SeriesDetails.tsx` to use the new `seoHelpers.ts` functions:

```typescript
const seoData = generateSubtitleSEO(subtitle, fullTitle, posterUrl);

<Helmet>
  <title>{seoData.title}</title>
  <meta name="description" content={seoData.description} />
  <meta name="keywords" content={seoData.keywords.join(', ')} />
  {/* ... rest of tags */}
</Helmet>
```

### Priority 2: Add Internal Linking Strategy

- Link related subtitles in detail pages
- Create keyword-rich anchor text for internal links
- Build topic clusters around popular keywords

### Priority 3: Optimize Page Load Speed

- Implement lazy loading for images
- Optimize Firestore queries
- Reduce JavaScript bundle size
- Use service worker for better caching

### Priority 4: Create Keyword-Rich Landing Pages

- Create dedicated pages for popular keywords
- Add category pages for different subtitle types
- Create comparison pages for popular titles

### Priority 5: Implement Server-Side Rendering (Long-term)

Consider migrating to Next.js or implementing Vite SSR for:
- Better initial page load times
- Server-rendered meta tags
- Static site generation for popular pages
- Improved Core Web Vitals

## Troubleshooting

### Sitemaps Not Generating

If sitemaps are not generating:
1. Check that Firestore credentials are correct in `prerender-seo.js`
2. Verify that the Firestore database ID matches in both `generate-sitemap.js` and `prerender-seo.js`
3. Check build logs for errors

### Pages Not Indexing

If pages are not being indexed:
1. Submit sitemap to Google Search Console
2. Request indexing for specific URLs
3. Check for robots.txt or meta robots restrictions
4. Verify that pages are not marked as noindex

### Ranking Issues

If rankings are not improving:
1. Check keyword difficulty and search volume
2. Analyze competitor content and backlinks
3. Ensure content quality and relevance
4. Build high-quality backlinks
5. Improve page load speed and Core Web Vitals

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Vercel SEO Best Practices](https://vercel.com/docs/concepts/analytics/web-vitals)
- [Schema.org Documentation](https://schema.org/)
- [React Helmet Documentation](https://github.com/nfl/react-helmet)
- [Sitemap Protocol](https://www.sitemaps.org/)

## Support

For questions or issues with these SEO improvements, please refer to the audit findings in `SEO_AUDIT_FINDINGS.md`.

## Verification of Prerender in Vercel
To verify your prerendering script runs properly in Vercel during the build process:
1. Go to your Vercel Project Dashboard -> **Deployments**.
2. Click on the most recent deployment.
3. Open the **Build Logs**.
4. Search for the output statements from `prerender-seo.js` (e.g., `Fetching subtitles from Firestore...`, `✓ Sitemap generated`).
5. Ensure the script completes without errors. 
To monitor your indexing status, log into **Google Search Console**. Submit the URLs of the generated sitemaps (`/sitemap.xml` and `/sitemap-keywords.xml`) under the **Sitemaps** section and monitor the **Pages** report.


## Server-Side Pagination Implementation Example

Currently, LAKSUB retrieves all approved records for client-side filtering which doesn't scale well. Use Firestore's limit and startAfter for server-side pagination.

### 1. Update `Explore.tsx` Example
```typescript
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const ExploreSubtitles = () => {
  const [subtitles, setSubtitles] = useState([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  
  const pageSize = 12;

  // Initial Fetch
  const fetchSubtitles = async () => {
    setLoading(true);
    const q = query(
      collection(db, 'subtitles'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    const snapshot = await getDocs(q);
    
    // Save last visible document for next query
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    setLastDoc(lastVisible);
    
    setSubtitles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  // Load More Function
  const fetchNextPage = async () => {
    if (!lastDoc) return;
    setLoading(true);

    const nextQuery = query(
      collection(db, 'subtitles'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
    
    const snapshot = await getDocs(nextQuery);
    
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    setLastDoc(lastVisible);
    
    setSubtitles(prev => [...prev, ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubtitles();
  }, []);

  return (
    <div>
      {/* Map Subtitles */}
      {subtitles.map(sub => <SubtitleCard key={sub.id} {...sub} />)}
      
      {/* Load More Button */}
      {lastDoc && !loading && (
        <button onClick={fetchNextPage}>Load More</button>
      )}
    </div>
  );
}
```
**Note:** To support advanced filtering (like genre + types + ordering), ensure you create the corresponding **Composite Indexes** in your Firebase console. To do so natively, click on the error link provided in the Javascript console when the query fails because of a missing index, and Firebase will automatically build it.
