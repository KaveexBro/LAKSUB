with open('src/pages/Profile.tsx', 'r') as f:
    content = f.read()

import_statement = "import { AdZone } from '../components/AdZone';"
if import_statement not in content:
    content = content.replace(
        "import { Helmet } from 'react-helmet-async';",
        "import { Helmet } from 'react-helmet-async';\n" + import_statement
    )

content = content.replace(
    "        {/* Profile Content */}",
    "        <div className=\"mb-8\">\n          <AdZone zoneName=\"profile-top\" />\n        </div>\n        {/* Profile Content */}"
)

content = content.replace(
    "        </div>\n      </div>\n    </div>",
    "        </div>\n      </div>\n      <div className=\"max-w-7xl mx-auto px-4 mt-8 pb-12\">\n        <AdZone zoneName=\"profile-bottom\" />\n      </div>\n    </div>"
)

with open('src/pages/Profile.tsx', 'w') as f:
    f.write(content)
