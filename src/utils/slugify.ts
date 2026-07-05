import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const generateSlug = (title: string, year?: string | number): string => {
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen

  if (year) {
    slug += `-${year}`;
  }
  
  slug += '-sinhala-subtitles';
  return slug;
};

export const generateUniqueSlug = async (baseSlug: string, collectionName: string = 'subtitles'): Promise<string> => {
  let uniqueSlug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const q = query(collection(db, collectionName), where('slug', '==', uniqueSlug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      isUnique = true;
    } else {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return uniqueSlug;
};
