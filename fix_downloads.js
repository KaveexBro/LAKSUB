import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixDownloads() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const subtitlesSnap = await getDocs(collection(db, 'subtitles'));
  
  const subsByAuthor = {};
  subtitlesSnap.forEach(doc => {
    const sub = doc.data();
    if (!subsByAuthor[sub.authorUid]) {
      subsByAuthor[sub.authorUid] = 0;
    }
    subsByAuthor[sub.authorUid] += (sub.downloadCount || 0);
  });
  
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const realTotal = subsByAuthor[uid] || 0;
    
    if (userDoc.data().totalDownloads !== realTotal) {
      console.log(`Updating user ${uid} from ${userDoc.data().totalDownloads} to ${realTotal}`);
      await updateDoc(doc(db, 'users', uid), {
        totalDownloads: realTotal
      });
    }
  }
  
  console.log("Done");
  process.exit(0);
}

fixDownloads().catch(console.error);
