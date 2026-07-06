import re
with open('src/pages/SubtitleDetails.tsx', 'r') as f:
    content = f.read()

content = content.replace('<AdZone zoneName="subtitle-details-top" />', '<div className="w-full mx-auto"><AdZone zoneName="subtitle-details-top" /></div>')
content = content.replace('<AdZone zoneName="subtitle-details-middle" />', '<div className="w-full mx-auto"><AdZone zoneName="subtitle-details-middle" /></div>')
content = content.replace('<AdZone zoneName="subtitle-details" />', '<div className="w-full mx-auto"><AdZone zoneName="subtitle-details" /></div>')

with open('src/pages/SubtitleDetails.tsx', 'w') as f:
    f.write(content)
