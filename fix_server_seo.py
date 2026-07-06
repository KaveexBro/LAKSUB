import re
with open('server.ts', 'r') as f:
    content = f.read()

# Replace the injection logic for seoData
bad_injection = """      // Inject image safely (some tags might not exist in index.html, so we append them before </head> if needed, or simply replace)
      if (seoData.image) {
          if (html.includes('<meta property="og:image"')) {
             html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${seoData.image}" />`);
          } else {
             html = html.replace('</head>', `<meta property="og:image" content="${seoData.image}" />\\n</head>`);
          }
          if (html.includes('<meta property="twitter:image"')) {
             html = html.replace(/<meta property="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${seoData.image}" />`);
          } else {
             html = html.replace('</head>', `<meta name="twitter:image" content="${seoData.image}" />\\n</head>`);
          }
      }"""

good_injection = """      // Inject image safely (some tags might not exist in index.html, so we append them before </head> if needed, or simply replace)
      if (seoData.image) {
          if (html.includes('<meta property="og:image"')) {
             html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${seoData.image}" />`);
          } else {
             html = html.replace('</head>', `<meta property="og:image" content="${seoData.image}" />\\n</head>`);
          }
          if (html.includes('<meta property="twitter:image"')) {
             html = html.replace(/<meta property="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${seoData.image}" />`);
          } else {
             html = html.replace('</head>', `<meta name="twitter:image" content="${seoData.image}" />\\n</head>`);
          }
      }
      
      // Inject Structured Data (Movie or TVSeries)
      if (seoData.structuredData) {
          html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(seoData.structuredData)}</script>\\n</head>`);
      }"""

content = content.replace(bad_injection, good_injection)

# Now, we also need to add structuredData to seoData inside server.ts
bad_seo_data = """          seoData = {
            title: seoTitle,
            description: seoDescription,
            keywords: keywords,
            image: posterUrl,
            url: url
          };"""

good_seo_data = """          
          const structuredData = {
            "@context": "https://schema.org",
            "@type": isSeriesRoute ? "TVSeries" : "Movie",
            "name": isSeriesRoute ? movieTitle : fullTitle,
            "description": seoDescription,
            "url": url,
            "image": posterUrl,
            "inLanguage": "si",
            "isAccessibleForFree": true,
            "author": {
              "@type": "Organization",
              "name": "LakSub",
              "url": "https://laksub.com"
            }
          };
          
          if (!isSeriesRoute && releaseYear) {
             structuredData["dateCreated"] = releaseYear.toString();
          }

          seoData = {
            title: seoTitle,
            description: seoDescription,
            keywords: keywords,
            image: posterUrl,
            url: url,
            structuredData: structuredData
          };"""

content = content.replace(bad_seo_data, good_seo_data)

with open('server.ts', 'w') as f:
    f.write(content)
