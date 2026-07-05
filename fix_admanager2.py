import re

with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

# fix the other instances of zone: 'home-top' (without 'zones: [...]' which I might have duplicated)
content = re.sub(r"zone: 'home-top',\n    zones: \['home-top'\],", r"zones: ['home-top'],", content)
content = re.sub(r"zone: 'home-top',", r"zones: ['home-top'],", content)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
