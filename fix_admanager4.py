with open('src/components/AdManager.tsx', 'r') as f:
    lines = f.readlines()

out = []
for line in lines:
    line = line.replace('{\\    campaignName', '{\n    campaignName')
    line = line.replace('\\    ', '    ')
    line = line.replace('\\  });  });', '  });')
    out.append(line)

with open('src/components/AdManager.tsx', 'w') as f:
    f.writelines(out)
