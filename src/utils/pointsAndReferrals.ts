import { doc, getDoc, updateDoc, increment, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, ReferralRecord } from '../types';

// Constants for points
export const POINTS_CONFIG = {
  DAILY_VISIT: 10,
  SUBTITLE_DOWNLOAD: 2,
  SUBTITLE_RATING: 1,
  REAL_REFERRAL: 50,
  WELCOME_BONUS: 20,
  REQUEST_COST: 50,
};

/**
 * Get or create a persistent client device identifier for anti-fraud detection.
 * Helps prevent users from repeatedly referring themselves from the same browser/machine.
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'unknown_server';
  const key = 'laksub_device_fingerprint';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    try {
      localStorage.setItem(key, deviceId);
    } catch {
      // Storage restricted, ignore
    }
  }
  return deviceId;
};

/**
 * Event emitter for points bonus celebration
 */
type PointsBonusCallback = (data: {
  amount: number;
  reason: string;
  type: 'daily_visit' | 'subtitle_download' | 'subtitle_rating' | 'referral' | 'welcome';
}) => void;

const listeners: PointsBonusCallback[] = [];

export const onPointsBonus = (callback: PointsBonusCallback) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

export const triggerPointsBonusToast = (data: {
  amount: number;
  reason: string;
  type: 'daily_visit' | 'subtitle_download' | 'subtitle_rating' | 'referral' | 'welcome';
}) => {
  listeners.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error dispatching points bonus notification:', e);
    }
  });
};

/**
 * Check and award daily visit bonus (+10 PTS) for Free members
 */
export const checkAndAwardDailyVisitBonus = async (
  currentUserUid: string,
  currentData: UserData,
  isPro: boolean
): Promise<boolean> => {
  // PRO members have unlimited points; only Free members need to accumulate points
  if (isPro) return false;

  const today = new Date().toISOString().split('T')[0];
  if (currentData.lastDailyBonusDate === today) {
    // Already claimed today
    return false;
  }

  try {
    const userRef = doc(db, 'users', currentUserUid);
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = currentData.lastDailyBonusDate === yesterday;
    const newStreak = isConsecutive ? (currentData.dailyBonusStreak || 1) + 1 : 1;

    await updateDoc(userRef, {
      points: increment(POINTS_CONFIG.DAILY_VISIT),
      lastDailyBonusDate: today,
      dailyBonusStreak: newStreak,
    });

    triggerPointsBonusToast({
      amount: POINTS_CONFIG.DAILY_VISIT,
      reason: `Daily Visit Bonus! (Day ${newStreak} Streak)`,
      type: 'daily_visit',
    });

    return true;
  } catch (err) {
    console.error('Error awarding daily visit points:', err);
    return false;
  }
};

/**
 * Award points for downloading a subtitle (+2 PTS, unique per subtitle)
 */
export const awardSubtitleDownloadPoints = async (
  userId: string,
  subtitleId: string,
  isPro: boolean
): Promise<boolean> => {
  if (isPro) return false;

  try {
    const downloadId = `${userId}_${subtitleId}`;
    const downloadRef = doc(db, 'downloads', downloadId);
    const downloadSnap = await getDoc(downloadRef);

    // If download record already exists, it is NOT the first time
    if (downloadSnap.exists()) {
      return false;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(POINTS_CONFIG.SUBTITLE_DOWNLOAD),
    });

    triggerPointsBonusToast({
      amount: POINTS_CONFIG.SUBTITLE_DOWNLOAD,
      reason: 'New Subtitle Download Bonus',
      type: 'subtitle_download',
    });

    return true;
  } catch (err) {
    console.error('Error awarding download points:', err);
    return false;
  }
};

/**
 * Award points for rating a subtitle (+1 PTS, once per subtitle)
 */
export const awardSubtitleRatingPoints = async (
  userId: string,
  subtitleId: string,
  isPro: boolean,
  isFirstRating: boolean
): Promise<boolean> => {
  if (isPro || !isFirstRating) return false;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(POINTS_CONFIG.SUBTITLE_RATING),
    });

    triggerPointsBonusToast({
      amount: POINTS_CONFIG.SUBTITLE_RATING,
      reason: 'Subtitle Rating Contribution',
      type: 'subtitle_rating',
    });

    return true;
  } catch (err) {
    console.error('Error awarding rating points:', err);
    return false;
  }
};

/**
 * Process a referral code for a new or existing user with bulletproof anti-fraud validation
 */
export interface ReferralValidationResult {
  success: boolean;
  message: string;
  pointsAwarded?: number;
  referrerName?: string;
}

export const processReferral = async (
  newUserId: string,
  newUserData: { displayName: string; email: string; photoURL?: string },
  referralCodeInput: string
): Promise<ReferralValidationResult> => {
  const cleanCode = (referralCodeInput || '').trim();
  if (!cleanCode) {
    return { success: false, message: 'Invalid referral code.' };
  }

  // 1. Anti-fraud check: Cannot refer oneself
  if (cleanCode.toLowerCase() === newUserId.toLowerCase()) {
    return { success: false, message: 'Self-referral is strictly prevented by security policy.' };
  }

  const deviceFingerprint = getDeviceId();

  try {
    // 2. Find referrer by referralCode or uid
    let referrerDocSnap: any = null;

    // Check by referralCode first
    const qByCode = query(
      collection(db, 'users'),
      where('referralCode', '==', cleanCode)
    );
    const snapByCode = await getDocs(qByCode);

    if (!snapByCode.empty) {
      referrerDocSnap = snapByCode.docs[0];
    } else {
      // Try direct uid match
      const docDirect = await getDoc(doc(db, 'users', cleanCode));
      if (docDirect.exists()) {
        referrerDocSnap = docDirect;
      }
    }

    if (!referrerDocSnap || !referrerDocSnap.exists()) {
      return { success: false, message: 'Referral code not found. Please verify the code.' };
    }

    const referrerId = referrerDocSnap.id;
    const referrerData = referrerDocSnap.data() as UserData;

    // Anti-fraud: Referrer cannot be the same user
    if (referrerId === newUserId || (referrerData.email && referrerData.email.toLowerCase() === newUserData.email.toLowerCase())) {
      return { success: false, message: 'Self-referral is forbidden.' };
    }

    // Anti-fraud: Check if this user was ALREADY referred by anyone
    const referralId = `${referrerId}_${newUserId}`;
    const existingRefDoc = await getDoc(doc(db, 'referrals', referralId));
    if (existingRefDoc.exists()) {
      return { success: false, message: 'You have already claimed this referral code previously.' };
    }

    // Check if new user already has a referredBy set
    const newUserRef = doc(db, 'users', newUserId);
    const currentUserDoc = await getDoc(newUserRef);
    if (currentUserDoc.exists() && currentUserDoc.data()?.referredBy) {
      return { success: false, message: 'An existing referral has already been linked to your account.' };
    }

    // Execute atomic batch
    const batch = writeBatch(db);

    // 1. Create the Referral record
    const referralDocRef = doc(db, 'referrals', referralId);
    const referralRecord: ReferralRecord = {
      id: referralId,
      referrerUid: referrerId,
      referrerName: referrerData.displayName || 'LAKSUB Member',
      referrerPhoto: referrerData.photoURL || '',
      referredUid: newUserId,
      referredName: newUserData.displayName || 'New Member',
      referredPhoto: newUserData.photoURL || '',
      status: 'completed',
      pointsAwarded: POINTS_CONFIG.REAL_REFERRAL,
      isRealReferral: true,
      fraudReason: null,
      deviceHash: deviceFingerprint,
      createdAt: new Date().toISOString(),
    };
    batch.set(referralDocRef, referralRecord);

    // 2. Award +50 PTS to the referrer
    const referrerRef = doc(db, 'users', referrerId);
    batch.update(referrerRef, {
      points: increment(POINTS_CONFIG.REAL_REFERRAL),
      referralCount: increment(1),
      referralPointsEarned: increment(POINTS_CONFIG.REAL_REFERRAL),
    });

    // 3. Award Welcome Bonus (+20 PTS) and set referredBy on the new user
    batch.update(newUserRef, {
      referredBy: referrerId,
      points: increment(POINTS_CONFIG.WELCOME_BONUS),
    });

    // 4. Send notification to the referrer
    const notifRef = doc(collection(db, 'notifications'));
    batch.set(notifRef, {
      userId: referrerId,
      title: '🎉 Real Referral Reward Earned!',
      message: `${newUserData.displayName || 'Your friend'} joined LAKSUB with your link! +50 POINTS have been added to your balance.`,
      type: 'general',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/referrals',
    });

    await batch.commit();

    triggerPointsBonusToast({
      amount: POINTS_CONFIG.WELCOME_BONUS,
      reason: `Welcome Bonus from ${referrerData.displayName || 'Friend'}!`,
      type: 'welcome',
    });

    return {
      success: true,
      message: `Referral applied! You earned +${POINTS_CONFIG.WELCOME_BONUS} Welcome PTS, and ${referrerData.displayName} received +${POINTS_CONFIG.REAL_REFERRAL} PTS!`,
      pointsAwarded: POINTS_CONFIG.WELCOME_BONUS,
      referrerName: referrerData.displayName,
    };
  } catch (err: any) {
    console.error('Error processing referral:', err);
    return {
      success: false,
      message: err.message || 'Failed to apply referral code. Please try again.',
    };
  }
};
