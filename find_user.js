import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-1e8cd04c-3326-4b18-88c9-f52e3a9d3db1");

async function check() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const subsSnap = await getDocs(collection(db, 'subtitles'));
  
  const creatorSubs = {};
  subsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (!creatorSubs[data.authorUid]) creatorSubs[data.authorUid] = 0;
    creatorSubs[data.authorUid] += (data.downloadCount || 0);
  });
  
  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.totalDownloads === 11 || creatorSubs[doc.id] === 5 || creatorSubs[doc.id] === 11 || data.totalDownloads === 5) {
       console.log(`User ${data.displayName}: totalDownloads=${data.totalDownloads}, sumOfSubtitles=${creatorSubs[doc.id] || 0}`);
    }
  });

  process.exit(0);
}
check();
