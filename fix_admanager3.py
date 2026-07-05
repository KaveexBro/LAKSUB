with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

content = content.replace('\\    ', '    ')
content = content.replace('{\\  ', '{')
content = content.replace('\\  });  });', '  });')

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
