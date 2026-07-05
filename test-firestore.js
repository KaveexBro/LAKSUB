import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    console.log("Testing connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Connection successful!");
    process.exit(0);
  } catch (e) {
    console.error("Connection failed:", e);
    process.exit(1);
  }
}
test();
