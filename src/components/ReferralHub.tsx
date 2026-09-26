import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  ShieldCheck,
  Coins,
  Crown,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  Calendar,
  AlertCircle,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ReferralRecord } from '../types';
import { processReferral, POINTS_CONFIG } from '../utils/pointsAndReferrals';

interface ReferralHubProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const ReferralHub: React.FC<ReferralHubProps> = ({
  isOpen = true,
  onClose,
  isModal = false,
}) => {
  const { user, userData, isPro, signIn } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Manual code input
  const [manualCode, setManualCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeFeedback, setCodeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User's personal referral code (either stored or fallback to short UID)
  const myReferralCode = userData?.referralCode || (user ? user.uid.slice(0, 8).toUpperCase() : '');
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${myReferralCode}`
    : `https://laksub.com/?ref=${myReferralCode}`;

  useEffect(() => {
    if (!user) return;
    setLoadingReferrals(true);

    const refQuery = query(
      collection(db, 'referrals'),
      where('referrerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      refQuery,
      (snapshot) => {
        const records: ReferralRecord[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as ReferralRecord),
          id: docSnap.id,
        }));
        // Sort descending by creation date
        records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReferrals(records);
        setLoadingReferrals(false);
      },
      (err) => {
        console.error('Error fetching referrals:', err);
        setLoadingReferrals(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCopyLink = () => {
    if (!user) {
      signIn();
      return;
    }
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signIn();
      return;
    }
    if (!manualCode.trim()) return;

    setSubmittingCode(true);
    setCodeFeedback(null);

    const result = await processReferral(
      user.uid,
      {
        displayName: userData?.displayName || user.displayName || 'Member',
        email: userData?.email || user.email || '',
        photoURL: userData?.photoURL || user.photoURL || '',
      },
      manualCode.trim()
    );

    setSubmittingCode(false);
    if (result.success) {
      setCodeFeedback({ type: 'success', text: result.message });
      setManualCode('');
    } else {
      setCodeFeedback({ type: 'error', text: result.message });
    }
  };

  const shareText = `🎬 Join me on LAKSUB - the best Sinhala Subtitle community! Use my link to get +${POINTS_CONFIG.WELCOME_BONUS} bonus points:`;

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + referralUrl)}`, '_blank');
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const totalPointsEarned = referrals.length * POINTS_CONFIG.REAL_REFERRAL;

  const content = (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
      {/* Background radial glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-red-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Referral & Points System
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                +50 PTS Per Referral
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Earn +50 points for every real friend you invite. PRO members enjoy unlimited points!
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Point Earning Breakdown Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 relative z-10">
        <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase">Daily Visit</span>
          </div>
          <p className="text-lg font-black text-emerald-400">+{POINTS_CONFIG.DAILY_VISIT} PTS</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Visit the site every day</p>
        </div>

        <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase">Subtitle Download</span>
          </div>
          <p className="text-lg font-black text-cyan-400">+{POINTS_CONFIG.SUBTITLE_DOWNLOAD} PTS</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Per unique subtitle</p>
        </div>

        <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase">Subtitle Rating</span>
          </div>
          <p className="text-lg font-black text-amber-400">+{POINTS_CONFIG.SUBTITLE_RATING} PTS</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Rate any subtitle</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-950/60 to-black border border-cyan-500/40 p-3.5 rounded-2xl shadow-inner">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-cyan-300" />
            <span className="text-[11px] font-bold text-cyan-300 uppercase">Real Referral</span>
          </div>
          <p className="text-lg font-black text-cyan-300">+{POINTS_CONFIG.REAL_REFERRAL} PTS</p>
          <p className="text-[10px] text-cyan-400/70 mt-0.5">Verified friend signup</p>
        </div>
      </div>

      {/* Referral Link & Sharing Box */}
      <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-5 mb-6 relative z-10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            Your Unique Referral Link
          </h3>
          <span className="text-[11px] font-semibold text-zinc-400">
            Referral Code: <span className="font-mono text-cyan-300 font-bold">{myReferralCode || 'SIGN IN'}</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="w-full bg-black/70 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-zinc-300 truncate select-all">
            {user ? referralUrl : 'Please sign in to generate your personalized referral link'}
          </div>

          <button
            onClick={handleCopyLink}
            disabled={!user}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all flex-shrink-0 shadow-lg ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-black active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Link
              </>
            )}
          </button>
        </div>

        {/* Quick Social Share Buttons */}
        {user && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-medium text-zinc-400 mr-2">Share directly:</span>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>

            <button
              onClick={handleShareTelegram}
              className="px-3 py-1.5 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Telegram
            </button>

            <button
              onClick={handleShareTwitter}
              className="px-3 py-1.5 rounded-lg bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> X / Twitter
            </button>
          </div>
        )}
      </div>

      {/* Anti-Fraud Security Guarantee Notice */}
      <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3 relative z-10">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-emerald-300">Strict Anti-Fraud Guarantee</p>
          <p className="text-zinc-300 mt-0.5 leading-relaxed">
            POINTS are strictly awarded to <strong>authentic, real referrals</strong>. Our system prevents fraudulent self-referrals, duplicated browser fingerprints, and bot accounts. Only genuine members joining through your invite earn +50 PTS.
          </p>
        </div>
      </div>

      {/* Referrals Stats & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left Column: Stats & Manual input */}
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Your Referral Performance
            </h4>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-xs text-zinc-300">Total Friends Invited</span>
              <span className="text-sm font-extrabold text-white">{referrals.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-xs text-zinc-300">Verified Real Referrals</span>
              <span className="text-sm font-extrabold text-emerald-400">{referrals.length}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-zinc-300">Total Points Earned</span>
              <span className="text-base font-black text-cyan-400">+{totalPointsEarned} PTS</span>
            </div>
          </div>

          {/* Have a friend's code? Enter here */}
          {!userData?.referredBy && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Were you referred by a friend?
              </h4>
              <p className="text-[11px] text-zinc-400 mb-3">
                Enter your friend's referral code to receive <strong className="text-emerald-400">+{POINTS_CONFIG.WELCOME_BONUS} Welcome Points</strong>!
              </p>

              <form onSubmit={handleManualCodeSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter friend's code (e.g. ABC123)"
                    disabled={submittingCode}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingCode || !manualCode.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black text-xs font-bold px-3 py-2 rounded-xl transition-all flex-shrink-0"
                  >
                    {submittingCode ? 'Applying...' : 'Apply'}
                  </button>
                </div>

                {codeFeedback && (
                  <div
                    className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
                      codeFeedback.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {codeFeedback.type === 'success' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{codeFeedback.text}</span>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Right Column: List of Referred Friends */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Referred Friends List ({referrals.length})
            </h4>
            <span className="text-[10px] text-zinc-500">Live Status</span>
          </div>

          {loadingReferrals ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 text-xs">
              Loading referrals...
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-300">No referrals yet</p>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Share your invite link above. When a friend joins, they will appear here and you will receive +50 PTS instantly!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-300">
                      {ref.referredPhoto ? (
                        <img
                          src={ref.referredPhoto}
                          alt={ref.referredName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        ref.referredName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-none">
                        {ref.referredName}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Joined {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Real Referral
                    </span>
                    <span className="text-xs font-black text-cyan-400">
                      +{ref.pointsAwarded} PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl my-8"
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return content;
};
