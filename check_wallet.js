import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const userRef = doc(db, 'users', 's1a0Lg3M5zOMQ48q87zYyZJ4eE33'); // We don't know the UID, let's just fetch one user
  const snap = await getDocs(collection(db, 'users'));
  let foundString = false;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (typeof data.walletBalance === 'string') {
      console.log('Found user with string walletBalance:', doc.id, data.walletBalance);
      foundString = true;
    }
  }
  if (!foundString) console.log("No string walletBalance found.");
  process.exit(0);
}
check();
