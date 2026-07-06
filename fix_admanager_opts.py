import re
with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

new_opts = """                <option value="global-header">Global - Header</option>
                <option value="global-footer">Global - Footer</option>
                <option value="video-downloads-top">Video Downloads - Top</option>
                <option value="video-downloads-middle">Video Downloads - Middle</option>
                <option value="video-downloads-bottom">Video Downloads - Bottom</option>
                <option value="public-profile-top">Public Profile - Top</option>
                <option value="public-profile-bottom">Public Profile - Bottom</option>"""

content = re.sub(r'<option value="global-sidebar">Global - Sidebar</option>\s*<option value="global-footer">Global - Footer</option>', new_opts, content)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
