import React from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const Breadcrumbs: React.FC = () => {
  const [location] = useLocation();

  // Don't show breadcrumbs on home page
  if (location === '/') return null;

  const pathnames = location.split('/').filter((x) => x);

  // Format a path segment into a readable string
  const formatPathSegment = (segment: string) => {
    // Handle specific route names
    if (segment === 'tv-series') return 'TV Series';
    if (segment === 'top-subtitlers') return 'Top Subtitlers';
    if (segment === 'dashboard') return 'Dashboard';
    
    // Capitalize first letter and replace dashes with spaces
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://laksub.com/"
      },
      ...pathnames.map((path, index) => {
        const url = `https://laksub.com/${pathnames.slice(0, index + 1).join('/')}`;
        return {
          "@type": "ListItem",
          "position": index + 2,
          "name": formatPathSegment(path),
          "item": url
        };
      })
    ]
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="w-full max-w-7xl mx-auto px-4 md:px-12 pt-24 pb-2 relative z-40">
        <ol className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </Link>
          </li>
          
          {pathnames.map((segment, index) => {
            const isLast = index === pathnames.length - 1;
            const href = `/${pathnames.slice(0, index + 1).join('/')}`;
            
            return (
              <li key={segment} className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-1 flex-shrink-0 text-gray-600" />
                {isLast ? (
                  <span className="text-gray-200 font-medium truncate max-w-[150px] sm:max-w-[300px]" aria-current="page">
                    {formatPathSegment(segment)}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-white transition-colors truncate max-w-[100px] sm:max-w-[200px]">
                    {formatPathSegment(segment)}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
