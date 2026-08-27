import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserData } from '../types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, photoURL: string, bio: string) => Promise<void>;
  verifyAge: () => Promise<void>;
  isPro: boolean;
  isAdFree: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (!currentUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      
      unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          const today = new Date().toISOString().split('T')[0];
          
          // Robust reset logic: if the day has changed, reset the count in Firestore
          if (data.lastDownloadResetDate !== today) {
            try {
              await updateDoc(userRef, {
                dailyDownloadCount: 0,
                lastDownloadResetDate: today
              });
              // The next snapshot will trigger with updated data
              return;
            } catch (err) {
              console.error("Error resetting daily downloads:", err);
            }
          }
          
          setUserData(data);
        } else {
          // Create new user document
          const today = new Date().toISOString().split('T')[0];
          const newUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || '',
            role: 'user',
            proExpiry: null,
            walletBalance: 0,
            dailyDownloadCount: 0,
            lastDownloadResetDate: today,
            totalUploads: 0,
            totalDownloads: 0,
            isEligibleForMonetization: false,
            monetizationStatus: 'locked',
          };
          try {
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          } catch (err) {
            console.error("Error creating user data:", err);
          }
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const updateActivity = async () => {
      try {
        await updateDoc(userRef, {
          lastActiveAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error updating last active time:", err);
      }
    };
    
    updateActivity();
    
    const interval = setInterval(updateActivity, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateProfile = async (displayName: string, photoURL: string, bio: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        bio
      });

      const updates: { ref: any; data: any }[] = [];

      // Update denormalized data in subtitles
      const subtitlesQuery = query(collection(db, 'subtitles'), where('authorUid', '==', user.uid));
      const subtitlesSnap = await getDocs(subtitlesQuery);
      subtitlesSnap.docs.forEach((subDoc) => {
        updates.push({
          ref: subDoc.ref,
          data: {
            authorName: displayName,
            authorPhoto: photoURL
          }
        });
      });

      // Update denormalized data in ratings
      const ratingsQuery = query(collection(db, 'ratings'), where('userId', '==', user.uid));
      const ratingsSnap = await getDocs(ratingsQuery);
      ratingsSnap.docs.forEach((ratingDoc) => {
        updates.push({
          ref: ratingDoc.ref,
          data: {
            userName: displayName,
            userPhoto: photoURL
          }
        });
      });

      // Update denormalized data in applications
      const applicationsQuery = query(collection(db, 'applications'), where('userId', '==', user.uid));
      const applicationsSnap = await getDocs(applicationsQuery);
      applicationsSnap.docs.forEach((appDoc) => {
        updates.push({
          ref: appDoc.ref,
          data: { userName: displayName }
        });
      });

      // Update denormalized data in withdrawals
      const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', user.uid));
      const withdrawalsSnap = await getDocs(withdrawalsQuery);
      withdrawalsSnap.docs.forEach((withDoc) => {
        updates.push({
          ref: withDoc.ref,
          data: { userName: displayName }
        });
      });

      // Update denormalized data in reports
      const reportsQuery = query(collection(db, 'reports'), where('userId', '==', user.uid));
      const reportsSnap = await getDocs(reportsQuery);
      reportsSnap.docs.forEach((reportDoc) => {
        updates.push({
          ref: reportDoc.ref,
          data: { userName: displayName }
        });
      });

      // Update denormalized data in subtitle_requests
      const requestsQuery = query(collection(db, 'subtitle_requests'), where('userId', '==', user.uid));
      const requestsSnap = await getDocs(requestsQuery);
      requestsSnap.docs.forEach((reqDoc) => {
        updates.push({
          ref: reqDoc.ref,
          data: { userName: displayName }
        });
      });

      // Update denormalized data in comments
      const commentsQuery = query(collection(db, 'comments'), where('userId', '==', user.uid));
      const commentsSnap = await getDocs(commentsQuery);
      commentsSnap.docs.forEach((commentDoc) => {
        updates.push({
          ref: commentDoc.ref,
          data: {
            userName: displayName,
            userPhoto: photoURL
          }
        });
      });

      // Commit updates in chunks of 400 to safely avoid the 500 limit
      const chunkSize = 400;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        const chunkBatch = writeBatch(db);
        chunk.forEach(({ ref, data }) => {
          chunkBatch.update(ref, data);
        });
        await chunkBatch.commit();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const verifyAge = async () => {
    try {
      localStorage.setItem('laksub_adult_verified', 'true');
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isAdultVerified: true
        });
      }
    } catch (error) {
      console.error("Error verifying age:", error);
      // We do not throw the error here, so the UI can proceed gracefully
    }
  };

  const isPro = userData?.proExpiry ? new Date(userData.proExpiry) > new Date() : false;
  const isAdFree = isPro;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      signIn, 
      signOut: signOutUser, 
      logout: signOutUser,
      updateProfile,
      verifyAge,
      isPro,
      isAdFree
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
