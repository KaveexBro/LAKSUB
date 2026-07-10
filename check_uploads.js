import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-1e8cd04c-3326-4b18-88c9-f52e3a9d3db1");

async function check() {
  const usersSnap = await getDoc(doc(db, 'users', '5CisYt1lXNf97XvYf12eH55sY863')); // UID for Kaveesh if I had it. Let's just fetch all.
}
