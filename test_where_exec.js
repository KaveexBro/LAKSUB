import { query, collection, where, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const q = query(collection(db, 'subtitles'), where('__name__', '==', '123'));
    const snap = await getDocs(q);
    console.log("Success executing");
  } catch (err) {
    console.error("Error executing:", err.message);
  }
  process.exit(0);
}
test();
