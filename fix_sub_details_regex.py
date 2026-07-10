import re

with open('src/pages/SubtitleDetails.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"(\s*// Increment totalDownloads.*?)(\s*await batch\.commit\(\);\s*}\s*} catch \(err\) {\s*console\.error\(\"Error tracking download:\", err\);\s*}\s*}\s*)// Increment download count for the subtitle\s*try {\s*if \(subtitle\) {\s*await updateDoc\(doc\(db, 'subtitles', subtitle\.id\), {\s*downloadCount: increment\(1\)\s*}\);\s*}\s*} catch \(err\) {\s*console\.error\(\"Error updating subtitle download count:\", err\);\s*}", re.DOTALL)

def replacer(match):
    return match.group(1) + "\n          // Increment download count for the subtitle itself\n          const subtitleRef = doc(db, 'subtitles', subtitle.id);\n          batch.update(subtitleRef, {\n            downloadCount: increment(1)\n          });\n" + match.group(2)

new_content = pattern.sub(replacer, content)

if content != new_content:
    with open('src/pages/SubtitleDetails.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Target not found")
