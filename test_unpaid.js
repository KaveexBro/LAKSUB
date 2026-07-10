import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-1e8cd04c-3326-4b18-88c9-f52e3a9d3db1");

async function check() {
  const downloadsSnap = await getDocs(collection(db, 'downloads'));
  
  const creatorUnpaid = {};
  const creatorTotal = {};
  
  downloadsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (!creatorTotal[data.creatorId]) creatorTotal[data.creatorId] = 0;
    if (!creatorUnpaid[data.creatorId]) creatorUnpaid[data.creatorId] = 0;
    
    creatorTotal[data.creatorId]++;
    if (data.adPaidStatus === 'unpaid') {
      creatorUnpaid[data.creatorId]++;
    }
  });
  
  console.log("Kaveesh Gimhan (id usually matches):");
  for (const creator of Object.keys(creatorTotal)) {
     if (creatorTotal[creator] === 11) {
        console.log(`Creator ID: ${creator}, total_in_downloads_collection: ${creatorTotal[creator]}, unpaid: ${creatorUnpaid[creator]}`);
     }
  }
  
  process.exit(0);
}
check();
