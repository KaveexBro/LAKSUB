import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, 'downloads'));
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.subtitleId) {
      console.log('Missing subtitleId in download:', doc.id);
    }
  }
  console.log("Done");
  process.exit(0);
}
check().catch(console.error);
