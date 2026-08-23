import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'Movie' | 'TVSeries' | 'WebSite';
  structuredData?: Record<string, any>;
  releaseYear?: number;
}

export function SEOHead({
  title = 'LakSub - The Largest Sinhala Subtitle Collection',
  description = 'Download high-quality Sinhala subtitles for movies and TV series. Join Sri Lanka\'s largest subtitle community at LakSub.',
  keywords = 'Sinhala subtitles, Sinhala sub, download Sinhala subtitles, movie subtitles, tv series subtitles, LakSub',
  image,
  url = 'https://www.laksub.com',
  type = 'WebSite',
  structuredData,
  releaseYear,
}: SEOHeadProps) {
  const { settings } = useSiteSettings();
  const finalImage = image || settings.logoUrl || 'https://www.laksub.com/logo.png';
  
  // Default structured data if none provided
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LakSub",
    "url": "https://www.laksub.com"
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {settings.faviconUrl && <link rel="icon" href={settings.faviconUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={finalImage} />
      
      {/* Dynamic Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
}
