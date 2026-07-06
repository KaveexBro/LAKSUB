import re
with open('src/components/AdManager.tsx', 'r') as f:
    content = f.read()

new_opts = """                <option value="public-profile-bottom">Public Profile - Bottom</option>
                <option value="profile-top">Profile - Top</option>
                <option value="profile-bottom">Profile - Bottom</option>"""

content = re.sub(r'<option value="public-profile-bottom">Public Profile - Bottom</option>', new_opts, content)

with open('src/components/AdManager.tsx', 'w') as f:
    f.write(content)
