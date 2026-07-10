import re

with open('firestore.rules', 'r') as f:
    content = f.read()

content = content.replace(
    'getAfter(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.totalDownloads == get(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.totalDownloads + 1',
    'getAfter(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.get("totalDownloads", 0) == get(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.get("totalDownloads", 0) + 1'
)

content = content.replace(
    'getAfter(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.downloadCount == get(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.downloadCount + 1',
    'getAfter(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.get("downloadCount", 0) == get(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.get("downloadCount", 0) + 1'
)

with open('firestore.rules', 'w') as f:
    f.write(content)
print("Updated!")
