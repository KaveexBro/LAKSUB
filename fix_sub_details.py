import sys

with open('src/pages/SubtitleDetails.tsx', 'r') as f:
    content = f.read()

target = """          // Increment totalDownloads for the creator (for eligibility and profile stats)
          const creatorRef = doc(db, 'users', subtitle.authorUid);
          batch.update(creatorRef, {
            totalDownloads: increment(1)
          });
          
          await batch.commit();
        }
      } catch (err) {
        console.error("Error tracking download:", err);
      }
    }
    // Increment download count for the subtitle
    try {
      if (subtitle) {
        await updateDoc(doc(db, 'subtitles', subtitle.id), {
          downloadCount: increment(1)
        });
      }
    } catch (err) {
      console.error("Error updating subtitle download count:", err);
    }
    setDownloading(false);
    if (!isPro && subtitle?.downloadLink && smartlinkEnabled) {"""

replacement = """          // Increment totalDownloads for the creator (for eligibility and profile stats)
          const creatorRef = doc(db, 'users', subtitle.authorUid);
          batch.update(creatorRef, {
            totalDownloads: increment(1)
          });
          
          // Increment download count for the subtitle itself
          const subtitleRef = doc(db, 'subtitles', subtitle.id);
          batch.update(subtitleRef, {
            downloadCount: increment(1)
          });
          
          await batch.commit();
        }
      } catch (err) {
        console.error("Error tracking download:", err);
      }
    }
    setDownloading(false);
    if (!isPro && subtitle?.downloadLink && smartlinkEnabled) {"""

if target in content:
    with open('src/pages/SubtitleDetails.tsx', 'w') as f:
        f.write(content.replace(target, replacement))
    print("Replaced successfully")
else:
    print("Target not found")
