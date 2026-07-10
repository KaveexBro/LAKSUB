import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Look for service account key in the workspace
const serviceAccountPath = './service-account-key.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.log("No service account key found, skipping");
  process.exit(0);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const usersSnap = await db.collection('users').get();
  const subsSnap = await db.collection('subtitles').get();
  
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
