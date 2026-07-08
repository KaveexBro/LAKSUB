import re
import os

# Fix index.html
if os.path.exists('index.html'):
    with open('index.html', 'r') as f:
        content = f.read()
    
    script_regex = re.compile(r'<script>\s*\(function\(\)\s*\{\s*var host = window\.location\.hostname;.*?\}\)\(\);\s*</script>', re.DOTALL)
    content = script_regex.sub('', content)
    
    with open('index.html', 'w') as f:
        f.write(content)

# Fix server.ts
if os.path.exists('server.ts'):
    with open('server.ts', 'r') as f:
        content = f.read()
    
    middleware_regex = re.compile(r'// Redirect www to non-www and other domains to preferred domain\s*app\.use\(\(req, res, next\) => \{.*?\n    next\(\);\n  \}\);', re.DOTALL)
    content = middleware_regex.sub('', content)
    
    with open('server.ts', 'w') as f:
        f.write(content)

# Remove vercel.json
if os.path.exists('vercel.json'):
    os.remove('vercel.json')
