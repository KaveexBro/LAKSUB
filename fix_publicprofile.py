with open('src/pages/PublicProfile.tsx', 'r') as f:
    content = f.read()

import_statement = "import { AdZone } from '../components/AdZone';"
if import_statement not in content:
    content = content.replace(
        "import { getTMDBImageUrl } from '../services/tmdbService';",
        "import { getTMDBImageUrl } from '../services/tmdbService';\n" + import_statement
    )

content = content.replace(
    "        {/* User Info Header */}",
    "        <div className=\"mb-8\">\n          <AdZone zoneName=\"public-profile-top\" />\n        </div>\n        {/* User Info Header */}"
)

content = content.replace(
    "      </div>\n    </div>",
    "      </div>\n      <div className=\"max-w-7xl mx-auto px-4 mt-8 pb-12\">\n        <AdZone zoneName=\"public-profile-bottom\" />\n      </div>\n    </div>"
)

with open('src/pages/PublicProfile.tsx', 'w') as f:
    f.write(content)
