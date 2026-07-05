import re
with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

# Just clean up the mess
content = re.sub(r'\\    ', '\n    ', content)
content = re.sub(r'{\\', '{\n', content)
content = re.sub(r'\\  \}\);  \}\);', '\n  });', content)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
