const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const targetDownloads = `    match /downloads/{downloadId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated() && 
                     downloadId == request.auth.uid + '_' + request.resource.data.subtitleId &&
                    isValidDownload(request.resource.data);
      allow update: if false;
      allow delete: if isAdmin();
    }`;

const replacementDownloads = `    match /downloads/{downloadId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated() && 
                     downloadId == request.auth.uid + '_' + request.resource.data.subtitleId &&
                    isValidDownload(request.resource.data) &&
                    // Batch consistency check: ensure creator's totalDownloads is incremented
                    getAfter(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.totalDownloads == get(/databases/$(database)/documents/users/$(request.resource.data.creatorId)).data.totalDownloads + 1 &&
                    // Batch consistency check: ensure subtitle's downloadCount is incremented
                    getAfter(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.downloadCount == get(/databases/$(database)/documents/subtitles/$(request.resource.data.subtitleId)).data.downloadCount + 1;
      allow update: if false;
      allow delete: if isAdmin();
    }`;

if (rules.includes(targetDownloads)) {
    rules = rules.replace(targetDownloads, replacementDownloads);
    fs.writeFileSync('firestore.rules', rules);
    console.log("Successfully updated downloads rule!");
} else {
    console.log("Could not find the downloads rule block");
}
