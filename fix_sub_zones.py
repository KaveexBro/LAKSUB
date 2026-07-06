with open('src/pages/SubtitleDetails.tsx', 'r') as f:
    content = f.read()

content = content.replace("index < 3 &&", "index < 4 &&")

with open('src/pages/SubtitleDetails.tsx', 'w') as f:
    f.write(content)
