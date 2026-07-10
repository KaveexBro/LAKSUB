import { query, collection, where, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try {
  const q = query(collection(db, 'subtitles'), where('__name__', '==', '123'));
  console.log("Success");
} catch (err) {
  console.error("Error:", err.message);
}
