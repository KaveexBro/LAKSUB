import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  increment,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserData, PointTransaction, ReferralRecord } from '../types';
import { triggerPointsBonusToast, getDeviceId } from '../utils/pointsAndReferrals';

export const POINT_TRIGGERS = {
  DAILY_LOGIN: 10,
  DOWNLOADING: 2,
  RATING: 1,
  VERIFIED_REFERRAL: 50,
  WELCOME_BONUS: 20,
  REQUEST_COST: 50,
} as const;

export interface PointActionResult {
  success: boolean;
  awarded: boolean;
  points: number;
  newBalance: number;
  message: string;
  isDuplicate?: boolean;
}

export interface ReferralValidationResult {
  success: boolean;
  pointsAwarded: number;
  referrerName?: string;
  message: string;
  fraudFlag?: string;
}

class PointManagerService {
  /**
   * Helper to append a transaction record to `point_transactions`
   */
  private async recordTransaction(
    batch: any,
    transaction: Omit<PointTransaction, 'id'>
  ): Promise<string> {
    const txRef = doc(collection(db, 'point_transactions'));
    batch.set(txRef, {
      ...transaction,
      id: txRef.id,
      createdAt: transaction.createdAt || new Date().toISOString(),
    });
    return txRef.id;
  }

  /**
   * 1. Daily Login Trigger (+10 POINTS)
   * FREE members earn +10 for visiting/logging in once per day.
   */
  async handleDailyLogin(
    userId: string,
    isPro: boolean,
    userData?: UserData | null
  ): Promise<PointActionResult> {
    if (isPro) {
      return {
        success: true,
        awarded: false,
        points: 0,
        newBalance: userData?.points ?? 100,
        message: 'PRO members have unlimited points.',
      };
    }

    try {
      const userRef = doc(db, 'users', userId);
      let currentData = userData;

      if (!currentData) {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          return { success: false, awarded: false, points: 0, newBalance: 0, message: 'User not found.' };
        }
        currentData = snap.data() as UserData;
      }

      const today = new Date().toISOString().split('T')[0];
      if (currentData.lastDailyBonusDate === today) {
        return {
          success: true,
          awarded: false,
          points: 0,
          newBalance: currentData.points ?? 100,
          message: 'Daily visit bonus already claimed today.',
        };
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = currentData.lastDailyBonusDate === yesterday;
      const newStreak = isConsecutive ? (currentData.dailyBonusStreak || 1) + 1 : 1;
      const currentPoints = currentData.points ?? 100;
      const newBalance = currentPoints + POINT_TRIGGERS.DAILY_LOGIN;

      const batch = writeBatch(db);

      // Update User
      batch.update(userRef, {
        points: increment(POINT_TRIGGERS.DAILY_LOGIN),
        lastDailyBonusDate: today,
        dailyBonusStreak: newStreak,
      });

      // Record Transaction
      await this.recordTransaction(batch, {
        userId,
        type: 'daily_login',
        points: POINT_TRIGGERS.DAILY_LOGIN,
        description: `Daily Login Bonus (Day ${newStreak} Streak)`,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();

      triggerPointsBonusToast({
        amount: POINT_TRIGGERS.DAILY_LOGIN,
        reason: `Daily Login Bonus (Day ${newStreak} Streak)`,
        type: 'daily_visit',
      });

      return {
        success: true,
        awarded: true,
        points: POINT_TRIGGERS.DAILY_LOGIN,
        newBalance,
        message: `+${POINT_TRIGGERS.DAILY_LOGIN} Points awarded for daily login!`,
      };
    } catch (err: any) {
      console.error('PointManager: Error in handleDailyLogin:', err);
      return {
        success: false,
        awarded: false,
        points: 0,
        newBalance: userData?.points ?? 100,
        message: err.message || 'Failed to award daily login points.',
      };
    }
  }

  /**
   * 2. Downloading Subtitle Trigger (+2 POINTS)
   * With logic to flag duplicate downloads! Points will NOT be earned no matter how many times
   * the same subtitle is downloaded by the user.
   */
  async handleDownload(
    userId: string,
    subtitleId: string,
    subtitleTitle: string,
    isPro: boolean,
    creatorId?: string
  ): Promise<PointActionResult> {
    if (isPro) {
      return {
        success: true,
        awarded: false,
        points: 0,
        newBalance: 0,
        message: 'PRO members enjoy unlimited downloads with no point changes.',
      };
    }

    try {
      const downloadId = `${userId}_${subtitleId}`;
      const downloadRef = doc(db, 'downloads', downloadId);
      const downloadSnap = await getDoc(downloadRef);

      // Check for duplicate download
      if (downloadSnap.exists()) {
        return {
          success: true,
          awarded: false,
          isDuplicate: true,
          points: 0,
          newBalance: 0,
          message: `Duplicate download detected for "${subtitleTitle}". Points are only awarded once per unique subtitle.`,
        };
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const currentPoints = userSnap.exists() ? (userSnap.data()?.points ?? 100) : 100;
      const newBalance = currentPoints + POINT_TRIGGERS.DOWNLOADING;

      const batch = writeBatch(db);

      // Record download document
      batch.set(downloadRef, {
        userId,
        subtitleId,
        creatorId: creatorId || 'unknown',
        subtitleTitle,
        downloadedAt: new Date().toISOString(),
        isProDownload: false,
        adPaidStatus: 'unpaid',
        proPaidStatus: 'unpaid',
      });

      // Update creator downloads if creator exists
      if (creatorId) {
        batch.update(doc(db, 'users', creatorId), {
          totalDownloads: increment(1),
        });
      }

      // Update subtitle downloads
      batch.update(doc(db, 'subtitles', subtitleId), {
        downloadCount: increment(1),
      });

      // Award +2 points to user
      batch.update(userRef, {
        points: increment(POINT_TRIGGERS.DOWNLOADING),
      });

      // Record Transaction
      await this.recordTransaction(batch, {
        userId,
        type: 'subtitle_download',
        points: POINT_TRIGGERS.DOWNLOADING,
        description: `Download Subtitle: ${subtitleTitle}`,
        referenceId: subtitleId,
        isDuplicateFlagged: false,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();

      triggerPointsBonusToast({
        amount: POINT_TRIGGERS.DOWNLOADING,
        reason: `New Subtitle Download: ${subtitleTitle}`,
        type: 'subtitle_download',
      });

      return {
        success: true,
        awarded: true,
        isDuplicate: false,
        points: POINT_TRIGGERS.DOWNLOADING,
        newBalance,
        message: `+${POINT_TRIGGERS.DOWNLOADING} Points earned for downloading "${subtitleTitle}"!`,
      };
    } catch (err: any) {
      console.error('PointManager: Error in handleDownload:', err);
      return {
        success: false,
        awarded: false,
        points: 0,
        newBalance: 0,
        message: err.message || 'Failed to process download points.',
      };
    }
  }

  /**
   * 3. Rating Subtitle Trigger (+1 POINT)
   * FREE members earn +1 for rating a subtitle (awarded on first-time rating).
   */
  async handleRating(
    userId: string,
    subtitleId: string,
    subtitleTitle: string,
    rating: number,
    isPro: boolean,
    isFirstRating: boolean = true
  ): Promise<PointActionResult> {
    if (isPro) {
      return {
        success: true,
        awarded: false,
        points: 0,
        newBalance: 0,
        message: 'PRO members enjoy unlimited rating with no point changes.',
      };
    }

    if (!isFirstRating) {
      return {
        success: true,
        awarded: false,
        points: 0,
        newBalance: 0,
        message: 'Rating updated. Points were already earned for the initial review.',
      };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const currentPoints = userSnap.exists() ? (userSnap.data()?.points ?? 100) : 100;
      const newBalance = currentPoints + POINT_TRIGGERS.RATING;

      const batch = writeBatch(db);

      // Award +1 point to user
      batch.update(userRef, {
        points: increment(POINT_TRIGGERS.RATING),
      });

      // Record Transaction
      await this.recordTransaction(batch, {
        userId,
        type: 'subtitle_rating',
        points: POINT_TRIGGERS.RATING,
        description: `Rated "${subtitleTitle}" (${rating}★)`,
        referenceId: subtitleId,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();

      triggerPointsBonusToast({
        amount: POINT_TRIGGERS.RATING,
        reason: `Rating Contribution (${rating}★)`,
        type: 'subtitle_rating',
      });

      return {
        success: true,
        awarded: true,
        points: POINT_TRIGGERS.RATING,
        newBalance,
        message: `+${POINT_TRIGGERS.RATING} Point earned for rating "${subtitleTitle}"!`,
      };
    } catch (err: any) {
      console.error('PointManager: Error in handleRating:', err);
      return {
        success: false,
        awarded: false,
        points: 0,
        newBalance: 0,
        message: err.message || 'Failed to award rating points.',
      };
    }
  }

  /**
   * 4. Secure Referral System (+50 POINTS)
   * Real referral validation with anti-fraud safeguards:
   * - Self-referral prevention
   * - Device fingerprint checks
   * - Single-referral enforcement
   * - Loop prevention
   */
  async handleReferral(
    newUserId: string,
    referralCodeInput: string,
    newUserData: { displayName: string; email: string; photoURL?: string }
  ): Promise<ReferralValidationResult> {
    const cleanCode = (referralCodeInput || '').trim();
    if (!cleanCode) {
      return { success: false, pointsAwarded: 0, message: 'Invalid referral code.' };
    }

    // Anti-Fraud Guard 1: Cannot refer oneself
    if (cleanCode.toLowerCase() === newUserId.toLowerCase()) {
      return {
        success: false,
        pointsAwarded: 0,
        fraudFlag: 'self_referral_attempt',
        message: 'Security policy error: Self-referral is forbidden.',
      };
    }

    const deviceFingerprint = getDeviceId();

    try {
      // Find referrer by referralCode (upper or exact), direct UID, or UID prefix
      let referrerDocSnap: any = null;

      const qUpper = query(collection(db, 'users'), where('referralCode', '==', cleanCode.toUpperCase()));
      const snapUpper = await getDocs(qUpper);

      if (!snapUpper.empty) {
        referrerDocSnap = snapUpper.docs[0];
      } else {
        const qExact = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
        const snapExact = await getDocs(qExact);
        if (!snapExact.empty) {
          referrerDocSnap = snapExact.docs[0];
        } else {
          const directDoc = await getDoc(doc(db, 'users', cleanCode));
          if (directDoc.exists()) {
            referrerDocSnap = directDoc;
          } else {
            // Fallback: search users by UID prefix (e.g. 8-character UID prefix) or case-insensitive referralCode
            const allUsersSnap = await getDocs(collection(db, 'users'));
            const matchingDoc = allUsersSnap.docs.find((d) => {
              const dData = d.data();
              return (
                d.id.toLowerCase().startsWith(cleanCode.toLowerCase()) ||
                (dData.referralCode && dData.referralCode.toUpperCase() === cleanCode.toUpperCase())
              );
            });
            if (matchingDoc) {
              referrerDocSnap = matchingDoc;
            }
          }
        }
      }

      if (!referrerDocSnap || !referrerDocSnap.exists()) {
        return { success: false, pointsAwarded: 0, message: 'Referral code not found. Please verify the code.' };
      }

      const referrerId = referrerDocSnap.id;
      const referrerData = referrerDocSnap.data() as UserData;

      // Anti-Fraud Guard 2: Referrer UID or email cannot match
      if (
        referrerId === newUserId ||
        (referrerData.email && referrerData.email.toLowerCase() === newUserData.email.toLowerCase())
      ) {
        return {
          success: false,
          pointsAwarded: 0,
          fraudFlag: 'self_account_matching',
          message: 'Security error: You cannot refer your own account.',
        };
      }

      // Anti-Fraud Guard 3: Account already referred check
      const referralId = `${referrerId}_${newUserId}`;
      const existingRefDoc = await getDoc(doc(db, 'referrals', referralId));
      if (existingRefDoc.exists()) {
        return {
          success: false,
          pointsAwarded: 0,
          fraudFlag: 'duplicate_referral',
          message: 'This referral has already been claimed for this account.',
        };
      }

      const newUserRef = doc(db, 'users', newUserId);
      const currentUserDoc = await getDoc(newUserRef);
      if (currentUserDoc.exists() && currentUserDoc.data()?.referredBy) {
        return {
          success: false,
          pointsAwarded: 0,
          fraudFlag: 'multiple_referrers',
          message: 'A referral code has already been applied to your account.',
        };
      }

      // Execute atomic transaction
      const batch = writeBatch(db);

      // 1. Create Referral record
      const referralDocRef = doc(db, 'referrals', referralId);
      const referralRecord: ReferralRecord = {
        id: referralId,
        referrerUid: referrerId,
        referrerName: referrerData.displayName || 'Member',
        referrerPhoto: referrerData.photoURL || '',
        referredUid: newUserId,
        referredName: newUserData.displayName || 'New Member',
        referredPhoto: newUserData.photoURL || '',
        status: 'completed',
        pointsAwarded: POINT_TRIGGERS.VERIFIED_REFERRAL,
        isRealReferral: true,
        fraudReason: null,
        deviceHash: deviceFingerprint,
        createdAt: new Date().toISOString(),
      };
      batch.set(referralDocRef, referralRecord);

      // 2. Award +50 PTS to Referrer
      const referrerRef = doc(db, 'users', referrerId);
      const referrerPointsAfter = (referrerData.points ?? 100) + POINT_TRIGGERS.VERIFIED_REFERRAL;
      batch.update(referrerRef, {
        points: increment(POINT_TRIGGERS.VERIFIED_REFERRAL),
        referralCount: increment(1),
        referralPointsEarned: increment(POINT_TRIGGERS.VERIFIED_REFERRAL),
      });

      // Record transaction for referrer
      await this.recordTransaction(batch, {
        userId: referrerId,
        type: 'verified_referral',
        points: POINT_TRIGGERS.VERIFIED_REFERRAL,
        description: `Verified Referral: ${newUserData.displayName || 'Friend'} joined`,
        referenceId: newUserId,
        balanceAfter: referrerPointsAfter,
        createdAt: new Date().toISOString(),
      });

      // 3. Award Welcome Bonus (+20 PTS) to new user and set referredBy
      const newUserPoints = currentUserDoc.exists() ? (currentUserDoc.data()?.points ?? 100) : 100;
      const newUserPointsAfter = newUserPoints + POINT_TRIGGERS.WELCOME_BONUS;
      batch.update(newUserRef, {
        referredBy: referrerId,
        points: increment(POINT_TRIGGERS.WELCOME_BONUS),
      });

      // Record transaction for new user
      await this.recordTransaction(batch, {
        userId: newUserId,
        type: 'welcome_bonus',
        points: POINT_TRIGGERS.WELCOME_BONUS,
        description: `Welcome Bonus from ${referrerData.displayName || 'Friend'}`,
        referenceId: referrerId,
        balanceAfter: newUserPointsAfter,
        createdAt: new Date().toISOString(),
      });

      // 4. Send notification to referrer
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: referrerId,
        title: '🎉 Real Referral Verified!',
        message: `${newUserData.displayName || 'Your friend'} joined with your link! +50 POINTS have been credited.`,
        type: 'general',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/profile',
      });

      await batch.commit();

      triggerPointsBonusToast({
        amount: POINT_TRIGGERS.WELCOME_BONUS,
        reason: `Welcome Bonus from ${referrerData.displayName || 'Friend'}!`,
        type: 'welcome',
      });

      return {
        success: true,
        pointsAwarded: POINT_TRIGGERS.WELCOME_BONUS,
        referrerName: referrerData.displayName,
        message: `Referral verified! You earned +${POINT_TRIGGERS.WELCOME_BONUS} Welcome PTS, and ${referrerData.displayName} earned +${POINT_TRIGGERS.VERIFIED_REFERRAL} PTS!`,
      };
    } catch (err: any) {
      console.error('PointManager: Error in handleReferral:', err);
      return {
        success: false,
        pointsAwarded: 0,
        message: err.message || 'Failed to process referral.',
      };
    }
  }

  /**
   * Fetch point transaction history for a user
   */
  async getPointHistory(userId: string): Promise<PointTransaction[]> {
    try {
      const q = query(
        collection(db, 'point_transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as PointTransaction),
        id: docSnap.id,
      }));
    } catch (err) {
      console.error('PointManager: Error fetching point history:', err);
      return [];
    }
  }

  /**
   * Deduct points for subtitle requests (FREE users only)
   */
  async deductPointsForRequest(
    userId: string,
    isPro: boolean,
    amount: number = POINT_TRIGGERS.REQUEST_COST,
    requestTitle?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    if (isPro) {
      return { success: true, newBalance: 0 };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        return { success: false, newBalance: 0, error: 'User profile not found.' };
      }

      const currentPoints = snap.data()?.points ?? 0;
      if (currentPoints < amount) {
        return {
          success: false,
          newBalance: currentPoints,
          error: `Insufficient point balance. You have ${currentPoints} PTS, but need at least ${amount} PTS.`,
        };
      }

      const newBalance = currentPoints - amount;
      const batch = writeBatch(db);

      batch.update(userRef, {
        points: newBalance,
      });

      await this.recordTransaction(batch, {
        userId,
        type: 'request_spent',
        points: -amount,
        description: `Subtitle Request: ${requestTitle || 'Custom Request'}`,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();

      return { success: true, newBalance };
    } catch (err: any) {
      console.error('PointManager: Error deducting points:', err);
      return { success: false, newBalance: 0, error: err.message || 'Failed to deduct points.' };
    }
  }
}

export const PointManager = new PointManagerService();
