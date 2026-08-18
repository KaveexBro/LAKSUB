import fs from 'fs';

async function test() {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
  const slug = 'rick-and-morty-2013-s01-e01-sinhala-subtitles';

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: "subtitles" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "approved" }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slug }
              }
            }
          ]
        }
      },
      limit: 1
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  let docData = null;
  if (data && data.length > 0 && data[0].document) {
    docData = data[0].document.fields;
  }
  
  if (!docData) {
     console.log("Failed to get docData. Data is:", data);
  } else {
     console.log("Success! title:", docData.movieTitle.stringValue);
  }
}
test();
