with open('src/pages/SeriesDetails.tsx', 'r') as f:
    content = f.read()

bad_helmet = """  const slugLink = encodeURIComponent(title);
  const canonicalUrl = `https://laksub.com/series/${slugLink}`;

  return (
    <article className="min-h-screen bg-netflix-bg text-white pb-20">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${title} Sinhala subtitles, ${title} Sinhala sub, ${title} Sinhala subtitle, download ${title} Sinhala sub, tv series subtitles, Sinhala sub, LAKSUB`} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="video.tv_show" />
        <meta property="og:image" content={backdropUrl || undefined} />
      </Helmet>"""

good_helmet = """  const slugLink = encodeURIComponent(title);
  const canonicalUrl = `https://laksub.com/series/${slugLink}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": title,
    "description": seoDescription,
    "url": canonicalUrl,
    "image": backdropUrl,
    "inLanguage": "si",
    "isAccessibleForFree": true,
    "numberOfEpisodes": subtitles.length,
    "author": {
      "@type": "Organization",
      "name": "LakSub",
      "url": "https://laksub.com"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://laksub.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "TV Series",
        "item": "https://laksub.com/series"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <article className="min-h-screen bg-netflix-bg text-white pb-20">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`${title} Sinhala subtitles, ${title} Sinhala sub, ${title} Sinhala subtitle, download ${title} Sinhala sub, tv series subtitles, Sinhala sub, LAKSUB`} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="video.tv_show" />
        <meta property="og:image" content={backdropUrl || undefined} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>"""

content = content.replace(bad_helmet, good_helmet)

with open('src/pages/SeriesDetails.tsx', 'w') as f:
    f.write(content)
