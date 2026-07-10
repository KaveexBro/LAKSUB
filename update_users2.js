import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-1e8cd04c-3326-4b18-88c9-f52e3a9d3db1");

async function fix() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const subsSnap = await getDocs(collection(db, 'subtitles'));
  
  const creatorSubs = {};
  subsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (!creatorSubs[data.authorUid]) creatorSubs[data.authorUid] = 0;
    creatorSubs[data.authorUid] += (data.downloadCount || 0);
  });
  
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const actualSum = creatorSubs[userDoc.id] || 0;
    
    if (data.totalDownloads !== actualSum) {
      console.log(`Updating ${data.displayName} from ${data.totalDownloads} to ${actualSum}`);
      try {
        await updateDoc(doc(db, 'users', userDoc.id), { totalDownloads: actualSum });
      } catch (e) {
        console.log("Error:", e.message);
      }
    }
  }

  process.exit(0);
}
fix();
