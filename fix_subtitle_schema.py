with open('src/pages/SubtitleDetails.tsx', 'r') as f:
    content = f.read()

bad_helmet = """      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={keywordsList} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={posterUrl || undefined} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content={subtitle.type === 'movie' ? 'video.movie' : 'video.episode'} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={posterUrl || undefined} />
      </Helmet>
      <SchemaInjector schemaData={structuredData} type="video" />
      <SchemaInjector schemaData={breadcrumbData} type="breadcrumb" />"""

good_helmet = """      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={keywordsList} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={posterUrl || undefined} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content={subtitle.type === 'movie' ? 'video.movie' : 'video.episode'} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={posterUrl || undefined} />

        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>"""

content = content.replace(bad_helmet, good_helmet)

with open('src/pages/SubtitleDetails.tsx', 'w') as f:
    f.write(content)
