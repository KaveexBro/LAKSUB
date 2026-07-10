import re

with open('firestore.rules', 'r') as f:
    content = f.read()

pattern = re.compile(r"(match /downloads/\{downloadId\} \{[\s\S]*?isValidDownload\(request\.resource\.data\);)(\s*allow update: if false;)", re.MULTILINE)

replacement = r"""\1
                    && getAfter(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.totalDownloads == get(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.totalDownloads + 1
                    && getAfter(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.downloadCount == get(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.downloadCount + 1;\2"""

new_content = pattern.sub(replacement, content)

if content != new_content:
    with open('firestore.rules', 'w') as f:
        f.write(new_content)
    print("Replaced downloads rule successfully")
else:
    print("Target not found for downloads rule")
