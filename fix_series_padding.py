import re
with open('src/pages/SeriesDetails.tsx', 'r') as f:
    content = f.read()

content = content.replace('<div className="px-4 pb-4">\n        <AdZone zoneName="series-details-top" />\n      </div>', '<div className="w-full px-4 md:px-12 mx-auto pb-4">\n        <AdZone zoneName="series-details-top" />\n      </div>')

content = content.replace('<AdZone zoneName="series-details" />', '<div className="w-full px-4 md:px-6 mx-auto"><AdZone zoneName="series-details" /></div>')

with open('src/pages/SeriesDetails.tsx', 'w') as f:
    f.write(content)
