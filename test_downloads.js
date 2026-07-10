import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    console.log(`User ${data.displayName} (${doc.id}):`);
    console.log(`  userData.totalDownloads = ${data.totalDownloads}`);
    console.log(`  sum of subtitle.downloadCount = ${creatorSubs[doc.id] || 0}`);
  });

  process.exit(0);
}
check();
