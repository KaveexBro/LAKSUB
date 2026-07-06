with open('src/pages/SubtitleDetails.tsx', 'r') as f:
    content = f.read()

import re

# Remove SchemaInjector lines
content = re.sub(r'\s*<SchemaInjector schemaData={structuredData} type="video" />\s*<SchemaInjector schemaData={breadcrumbData} type="breadcrumb" />', '', content)

# Inject scripts into Helmet
helmet_end = '      </Helmet>'
script_inject = """
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      </Helmet>"""

content = content.replace(helmet_end, script_inject, 1)

with open('src/pages/SubtitleDetails.tsx', 'w') as f:
    f.write(content)
