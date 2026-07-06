with open('src/pages/VideoDownloads.tsx', 'r') as f:
    content = f.read()

# Add import
import_statement = "import { AdZone } from '../components/AdZone';"
if import_statement not in content:
    content = content.replace(
        "import { Helmet } from 'react-helmet-async';",
        "import { Helmet } from 'react-helmet-async';\n" + import_statement
    )

content = content.replace(
    "<h1 className=\"text-3xl md:text-4xl font-bold mb-4\">Download Video</h1>",
    "<AdZone zoneName=\"video-downloads-top\" />\n              <h1 className=\"text-3xl md:text-4xl font-bold mb-4\">Download Video</h1>"
)

content = content.replace(
    "                {hardcodedLinks.length > 0 && (",
    "                <AdZone zoneName=\"video-downloads-middle\" />\n                {hardcodedLinks.length > 0 && ("
)

content = content.replace(
    "          </motion.div>",
    "          </motion.div>\n          <div className=\"mt-8\">\n            <AdZone zoneName=\"video-downloads-bottom\" />\n          </div>"
)

with open('src/pages/VideoDownloads.tsx', 'w') as f:
    f.write(content)
