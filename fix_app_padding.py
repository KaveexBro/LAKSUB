import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('className="max-w-7xl mx-auto px-4 w-full pt-24 pb-4"', 'className="max-w-7xl mx-auto px-4 md:px-12 w-full pt-24 pb-4"')
content = content.replace('className="max-w-7xl mx-auto px-4 w-full"', 'className="max-w-7xl mx-auto px-4 md:px-12 w-full"')

with open('src/App.tsx', 'w') as f:
    f.write(content)
