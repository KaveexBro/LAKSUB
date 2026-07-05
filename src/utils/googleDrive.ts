export const extractGoogleDriveId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const parsedUrl = new URL(url);
    
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    if (parsedUrl.pathname.includes('/file/d/')) {
      const parts = parsedUrl.pathname.split('/');
      const dIndex = parts.indexOf('d');
      if (dIndex !== -1 && parts.length > dIndex + 1) {
        return parts[dIndex + 1];
      }
    }
    
    // Format 2: https://drive.google.com/open?id=FILE_ID
    if (parsedUrl.searchParams.has('id')) {
      return parsedUrl.searchParams.get('id');
    }
    
    // Format 3: https://drive.google.com/uc?id=FILE_ID
    if (parsedUrl.pathname.includes('/uc') && parsedUrl.searchParams.has('id')) {
      return parsedUrl.searchParams.get('id');
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

export const getDirectDownloadLink = (url: string): string => {
  if (!url) return '';
  const fileId = extractGoogleDriveId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url; // Return original if not a GDrive link or parsing fails
};

export const isGoogleDriveLink = (url: string): boolean => {
  if (!url) return false;
  return url.includes('drive.google.com');
};
