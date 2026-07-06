import re
with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'<AdZone zoneName="(home-[^"]+)" />', r'<div className="w-full px-4 md:px-12 mx-auto"><AdZone zoneName="\1" /></div>', content)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
