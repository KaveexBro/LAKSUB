import re

for filename in ['src/pages/Profile.tsx', 'src/pages/PublicProfile.tsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    content = content.replace('className="max-w-7xl mx-auto px-4 mt-8 pb-12"', 'className="max-w-7xl mx-auto px-4 md:px-12 mt-8 pb-12"')
    
    with open(filename, 'w') as f:
        f.write(content)

