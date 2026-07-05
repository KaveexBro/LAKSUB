/**
 * SEO Helper Functions
 * 
 * This utility provides helper functions for generating SEO-optimized
 * meta tags, structured data, and keywords for subtitle pages.
 */

import { Subtitle } from '../types';

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonicalUrl: string;
  structuredData: any;
}

/**
 * Generate SEO data for a subtitle detail page
 */
export function generateSubtitleSEO(
  subtitle: Subtitle,
  fullTitle: string,
  posterUrl: string,
  baseUrl: string = 'https://laksub.com'
): SEOData {
  const baseUrlPath = subtitle.type === 'series' ? 'tv-series' : 'movies';
  const canonicalUrl = `${baseUrl}/${baseUrlPath}/${subtitle.slug || subtitle.id}`;
  
  // Generate keyword-rich title
  const title = `${fullTitle} Sinhala Subtitles | ${subtitle.movieTitle || fullTitle} Sinhala Sub | LAKSUB`;
  
  // Generate keyword-rich description
  const description = `Download high-quality Sinhala subtitles (Sinhala sub) for ${fullTitle} (${subtitle.releaseYear || 'Latest'}). ${
    subtitle.type === 'movie' 
      ? 'Premium English movie Sinhala sub with perfect sync.'
      : 'All seasons and episodes available with perfect sync.'
  } Join Sri Lanka's largest Sinhala subtitle community - LAKSUB.`;

  // Generate comprehensive keywords
  const keywords = [
    `${fullTitle} Sinhala subtitles`,
    `${subtitle.movieTitle || fullTitle} Sinhala sub`,
    `${fullTitle} Sinhala subtitle`,
    `download ${subtitle.movieTitle || fullTitle} Sinhala subtitles`,
    'Sinhala subtitles',
    'Sinhala sub',
    subtitle.type === 'movie' ? 'English movie Sinhala subtitles' : 'TV series Sinhala subtitles',
    subtitle.type === 'movie' ? 'movie subtitle download' : 'TV series subtitle download',
    'Sinhala subtitle website',
    'LakSub',
    'Sri Lanka subtitles',
    ...(subtitle.genres || []).map(g => `${g} Sinhala subtitles`)
  ];

  // Generate structured data
  const structuredData: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': subtitle.type === 'movie' ? 'Movie' : 'TVEpisode',
    'name': fullTitle,
    'datePublished': subtitle.releaseYear?.toString(),
    'image': posterUrl,
    'description': description,
    'url': canonicalUrl,
    'inLanguage': 'si',
    'isAccessibleForFree': true,
    'author': {
      '@type': 'Organization',
      'name': 'LakSub',
      'url': baseUrl
    }
  };

  // Add rating if available
  if (subtitle.averageRating && subtitle.ratingCount > 0) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': subtitle.averageRating.toFixed(1),
      'ratingCount': subtitle.ratingCount,
      'bestRating': '5',
      'worstRating': '1'
    };
  }

  return {
    title,
    description,
    keywords,
    ogImage: posterUrl,
    canonicalUrl,
    structuredData
  };
}

/**
 * Generate SEO data for series group pages
 */
export function generateSeriesSEO(
  seriesTitle: string,
  episodeCount: number,
  baseUrl: string = 'https://laksub.com'
): SEOData {
  const canonicalUrl = `${baseUrl}/series/${encodeURIComponent(seriesTitle)}`;
  
  const title = `${seriesTitle} Sinhala Subtitles Download | LakSub`;
  const description = `Download high-quality Sinhala subtitles for all ${episodeCount} episodes of ${seriesTitle}. Perfect sync, latest seasons available. Join Sri Lanka's largest Sinhala subtitle community - LakSub.`;
  
  const keywords = [
    `${seriesTitle} Sinhala subtitles`,
    `${seriesTitle} Sinhala sub`,
    'TV series Sinhala subtitles',
    'Netflix Sinhala subtitles',
    'download Sinhala sub',
    'Sinhala subtitle website',
    'LakSub'
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    'name': seriesTitle,
    'description': description,
    'url': canonicalUrl,
    'inLanguage': 'si',
    'isAccessibleForFree': true,
    'numberOfEpisodes': episodeCount,
    'author': {
      '@type': 'Organization',
      'name': 'LakSub',
      'url': baseUrl
    }
  };

  return {
    title,
    description,
    keywords,
    ogImage: `${baseUrl}/logo.png`,
    canonicalUrl,
    structuredData
  };
}

/**
 * Generate SEO data for listing pages (movies, series, explore)
 */
export function generateListingSEO(
  pageType: 'movies' | 'series' | 'explore',
  baseUrl: string = 'https://laksub.com'
): SEOData {
  const titles = {
    movies: 'Sinhala Subtitles for Movies | LakSub',
    series: 'Sinhala Subtitles for TV Series | LakSub',
    explore: 'Explore Sinhala Subtitles | LakSub'
  };

  const descriptions = {
    movies: 'Browse and download high-quality Sinhala subtitles for Hollywood movies, latest releases, and classics. Perfect sync for all movies. Join LakSub - Sri Lanka\'s premium subtitle community.',
    series: 'Browse and download high-quality Sinhala subtitles for Netflix, HBO, and popular TV series. All seasons and episodes available with perfect sync. Join LakSub - Sri Lanka\'s premium subtitle community.',
    explore: 'Explore thousands of high-quality Sinhala subtitles for movies and TV series. Download Sinhala sub for all your favorite content. Join LakSub - Sri Lanka\'s largest subtitle community.'
  };

  const keywordSets = {
    movies: [
      'Sinhala subtitles for movies',
      'English movie Sinhala subtitles',
      'download movie Sinhala sub',
      'Hollywood movie Sinhala subtitles',
      'latest movie subtitles',
      'Sinhala subtitle website'
    ],
    series: [
      'Sinhala subtitles for TV series',
      'Netflix Sinhala subtitles',
      'TV series Sinhala sub',
      'download series Sinhala subtitles',
      'Korean drama Sinhala subtitles',
      'anime Sinhala subtitles'
    ],
    explore: [
      'Sinhala subtitles',
      'download Sinhala sub',
      'Sinhala subtitle website',
      'movie subtitles',
      'TV series subtitles',
      'LakSub'
    ]
  };

  const canonicalUrl = `${baseUrl}/${pageType === 'explore' ? 'explore' : pageType}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': titles[pageType],
    'description': descriptions[pageType],
    'url': canonicalUrl,
    'inLanguage': 'si',
    'author': {
      '@type': 'Organization',
      'name': 'LakSub',
      'url': baseUrl
    }
  };

  return {
    title: titles[pageType],
    description: descriptions[pageType],
    keywords: keywordSets[pageType],
    ogImage: `${baseUrl}/logo.png`,
    canonicalUrl,
    structuredData
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

/**
 * Generate FAQPage structured data for common questions
 */
export function generateFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'How do I download Sinhala subtitles from LakSub?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Simply search for your movie or TV series, click on the subtitle you want, and click the download button. You can download subtitles for free or upgrade to Pro for unlimited downloads.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Are the Sinhala subtitles on LakSub accurate?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'All subtitles on LakSub are created by our community of professional translators and are verified for accuracy before publication.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I request Sinhala subtitles for a specific movie?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes! You can submit a subtitle request in our Request section, and our creators will work on it as soon as possible.'
        }
      },
      {
        '@type': 'Question',
        'name': 'What formats do your Sinhala subtitles support?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Our subtitles are available in SRT format, which is compatible with most video players including VLC, MPC, and online players.'
        }
      }
    ]
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(baseUrl: string = 'https://laksub.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'LakSub',
    'url': baseUrl,
    'logo': `${baseUrl}/logo.png`,
    'description': 'Sri Lanka\'s largest Sinhala subtitle community. Download high-quality Sinhala subtitles for movies and TV series.',
    'sameAs': [
      'https://www.facebook.com/laksubofficial',
      'https://twitter.com/laksub'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Customer Support',
      'url': `${baseUrl}/contact`
    }
  };
}
