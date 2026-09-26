import React, { useState, useEffect } from 'react';
import {
  Coins,
  Crown,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  History,
  Calendar,
  Download,
  Star,
  Users,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Filter,
  ArrowDownLeft,
  Share2,
  Gift,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { PointManager, POINT_TRIGGERS } from '../services/PointManager';
import { PointTransaction } from '../types';

interface PointsWalletProps {
  onRefresh?: () => void;
}

export const PointsWallet: React.FC<PointsWalletProps> = ({ onRefresh }) => {
  const { user, userData, isPro, signIn } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Referral code redemption state
  const [referralInput, setReferralInput] = useState('');
  const [redeemingReferral, setRedeemingReferral] = useState(false);
  const [referralFeedback, setReferralFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const currentPoints = userData?.points ?? 100;
  const today = new Date().toISOString().split('T')[0];
  const isDailyClaimed = userData?.lastDailyBonusDate === today;

  // Referral URL & code
  const myCode = userData?.referralCode || (user ? user.uid.slice(0, 8).toUpperCase() : '');
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${myCode}`
    : `https://laksub.com/?ref=${myCode}`;

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const history = await PointManager.getPointHistory(user.uid);
      setTransactions(history);
    } catch (err) {
      console.error('Error fetching point history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleManualDailyCheckin = async () => {
    if (!user) {
      signIn();
      return;
    }
    setClaimingDaily(true);
    try {
      await PointManager.handleDailyLogin(user.uid, isPro, userData);
      await fetchHistory();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error in manual checkin:', err);
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleApplyReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signIn();
      return;
    }
    const clean = referralInput.trim();
    if (!clean) return;

    setRedeemingReferral(true);
    setReferralFeedback(null);

    try {
      const result = await PointManager.handleReferral(
        user.uid,
        clean,
        {
          displayName: userData?.displayName || user.displayName || 'Member',
          email: userData?.email || user.email || '',
          photoURL: userData?.photoURL || user.photoURL || '',
        }
      );

      if (result.success) {
        setReferralFeedback({
          type: 'success',
          message: result.message,
        });
        setReferralInput('');
        await fetchHistory();
        if (onRefresh) onRefresh();
      } else {
        setReferralFeedback({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setReferralFeedback({
        type: 'error',
        message: err.message || 'Failed to apply referral code.',
      });
    } finally {
      setRedeemingReferral(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'earned') return tx.points > 0;
    if (filterType === 'spent') return tx.points < 0;
    return true;
  });

  const totalEarned = transactions
    .filter((tx) => tx.points > 0)
    .reduce((sum, tx) => sum + tx.points, 0);

  const totalSpent = transactions
    .filter((tx) => tx.points < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.points), 0);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'daily_login':
      case 'daily_visit':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'subtitle_download':
        return <Download className="w-4 h-4 text-cyan-400" />;
      case 'subtitle_rating':
        return <Star className="w-4 h-4 text-amber-400" />;
      case 'verified_referral':
      case 'referral_bonus':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'welcome_bonus':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'request_spent':
        return <ArrowDownLeft className="w-4 h-4 text-red-400" />;
      default:
        return <Coins className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8 text-white">
      {/* 1. Header Wallet & Tier Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1">
                  Points Wallet Balance
                </span>
                <div className="flex items-baseline gap-3">
                  {isPro ? (
                    <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent flex items-center gap-2">
                      <Sparkles className="w-8 h-8 text-amber-400 inline" /> UNLIMITED
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl md:text-5xl font-black text-cyan-400">
                        {currentPoints}
                      </span>
                      <span className="text-base font-bold text-zinc-400 uppercase tracking-widest">
                        PTS
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* TIER BADGE */}
              <div className="flex flex-col items-end">
                <div
                  className={`px-3.5 py-1.5 rounded-full border shadow-lg flex items-center gap-1.5 ${
                    isPro
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-800/80 border-cyan-500/30 text-cyan-300'
                  }`}
                >
                  {isPro ? (
                    <>
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider">PRO Member</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black uppercase tracking-wider">FREE Member</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {isPro ? 'Priority Requests • 0 PTS Deducted' : '50 PTS per Subtitle Request'}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-400 block font-medium">Lifetime Earned</span>
                <span className="text-base font-bold text-emerald-400">
                  {isPro ? '∞ Unlimited' : `+${totalEarned} PTS`}
                </span>
              </div>

              <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-400 block font-medium">Spent on Requests</span>
                <span className="text-base font-bold text-zinc-300">
                  {isPro ? '0 PTS (Free)' : `-${totalSpent} PTS`}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-black/40 border border-white/5 p-3 rounded-2xl">
                <span className="text-[10px] text-zinc-400 block font-medium">Daily Streak</span>
                <span className="text-base font-bold text-amber-400">
                  {userData?.dailyBonusStreak ? `${userData.dailyBonusStreak} Days 🔥` : '1 Day'}
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isDailyClaimed && !isPro && (
                <button
                  onClick={handleManualDailyCheckin}
                  disabled={claimingDaily}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{claimingDaily ? 'Claiming...' : 'Claim Today (+10 PTS)'}</span>
                </button>
              )}

              {isDailyClaimed && !isPro && (
                <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daily Bonus Claimed for Today</span>
                </div>
              )}

              <Link href="/request">
                <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                  <span>Request Subtitle</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Link>

              {!isPro && (
                <Link href="/upgrade">
                  <button className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5 ml-auto cursor-pointer">
                    <Crown className="w-3.5 h-3.5" />
                    Upgrade to Pro
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tier Comparison & Upgrade Card */}
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-white text-base">Membership Tier Status</h3>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className={`p-3 rounded-2xl border space-y-1.5 ${!isPro ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-200">FREE Tier</span>
                  <span className={!isPro ? 'text-cyan-400' : 'text-zinc-500'}>
                    {!isPro ? '● Current Tier' : 'Inactive'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Earn points via Daily visits (+10), unique Downloads (+2), Ratings (+1), and Real Referrals (+50).
                </p>
              </div>

              <div className={`p-3 rounded-2xl border space-y-1.5 ${isPro ? 'bg-amber-500/15 border-amber-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-300">PRO Tier</span>
                  <span className={isPro ? 'text-amber-400 font-mono' : 'text-zinc-500 font-mono'}>
                    {isPro ? '● ACTIVE' : 'UNLIMITED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Unlimited priority subtitle requests with 0 points deducted, direct high-speed downloads, and zero advertisements.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-black/60 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
              Your Referral Code
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-black text-cyan-300 tracking-wider">
                {myCode || '...'}
              </span>
              <button
                onClick={handleCopy}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ways to Earn Points Row */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Ways for FREE Members to Earn Points
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Way 1 */}
          <div className="bg-zinc-900/80 border border-white/10 hover:border-emerald-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  +{POINT_TRIGGERS.DAILY_LOGIN} PTS
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Daily Login Bonus</h4>
              <p className="text-xs text-zinc-400 mb-3">
                Visit and log into LAKSUB once every 24 hours to automatically collect your check-in points.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 pt-2 border-t border-white/5">
              {isDailyClaimed ? '✓ Claimed for today' : '• Ready to claim'}
            </div>
          </div>

          {/* Way 2 */}
          <div className="bg-zinc-900/80 border border-white/10 hover:border-cyan-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  +{POINT_TRIGGERS.DOWNLOADING} PTS
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Subtitle Downloads</h4>
              <p className="text-xs text-zinc-400 mb-3">
                Earn +2 points for each unique subtitle downloaded. Duplicate downloads of the same subtitle are flagged.
              </p>
            </div>
            <Link href="/explore">
              <span className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer pt-2 border-t border-white/5">
                Explore Subtitles <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Way 3 */}
          <div className="bg-zinc-900/80 border border-white/10 hover:border-amber-500/40 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Star className="w-5 h-5" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  +{POINT_TRIGGERS.RATING} PTS
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Rate Subtitles</h4>
              <p className="text-xs text-zinc-400 mb-3">
                Leave a rating and review on any subtitle to support creators and earn +1 point on your initial review.
              </p>
            </div>
            <Link href="/explore">
              <span className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer pt-2 border-t border-white/5">
                Browse & Rate <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Way 4 */}
          <div className="bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-black border border-cyan-500/30 hover:border-cyan-400 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  +{POINT_TRIGGERS.VERIFIED_REFERRAL} PTS
                </span>
              </div>
              <h4 className="font-bold text-sm text-cyan-300 mb-1">Verified Referrals</h4>
              <p className="text-xs text-zinc-400 mb-3">
                Invite friends with your link. Verified authentic accounts grant you +50 PTS and your friend +20 Welcome PTS.
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer pt-2 border-t border-white/5"
            >
              {copiedLink ? 'Link Copied!' : 'Copy Invite Link'} <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Integrated Referral Center (Invite Friends & Redeem Code) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Invite Link Card */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Invite Friends & Earn Points</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Share your invite link with movie and TV show lovers. Each real member who joins gives you{' '}
              <strong className="text-cyan-300">+{POINT_TRIGGERS.VERIFIED_REFERRAL} PTS</strong> and gets{' '}
              <strong className="text-emerald-400">+{POINT_TRIGGERS.WELCOME_BONUS} Welcome PTS</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Your Personalized Invite Link
            </span>
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="bg-transparent text-xs text-zinc-300 font-mono flex-1 outline-none truncate select-all px-1"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-2.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Fair Community Validation:</strong> Anti-fraud checks prevent duplicate browser fingerprints and self-referrals. Only authentic user registrations qualify.
            </span>
          </div>
        </div>

        {/* Redeem Friend's Referral Code Card */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Redeem Referral Code</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Were you invited by a friend? Enter their referral code below to receive your{' '}
              <strong className="text-emerald-400">+{POINT_TRIGGERS.WELCOME_BONUS} Welcome PTS</strong> bonus immediately.
            </p>
          </div>

          {userData?.referredBy ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Referral Successfully Activated</p>
                <p className="text-[11px] text-zinc-400">
                  Welcome bonus credited. Your account is linked to your referrer.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyReferralCode} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 8-char code or friend's link"
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 flex-1 outline-none focus:border-cyan-500/50 uppercase font-mono"
                  maxLength={50}
                  disabled={redeemingReferral}
                />
                <button
                  type="submit"
                  disabled={redeemingReferral || !referralInput.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-extrabold uppercase px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                >
                  {redeemingReferral ? 'Applying...' : 'Apply Code'}
                </button>
              </div>

              {referralFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    referralFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  }`}
                >
                  {referralFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{referralFeedback.message}</span>
                </div>
              )}
            </form>
          )}

          <div className="text-[11px] text-zinc-500">
            Note: Referral codes can be applied once per account to ensure fairness across the community.
          </div>
        </div>
      </div>

      {/* 4. History of Point Earnings Component */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-white text-lg">Point Earnings & Activity History</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Detailed ledger of all points earned, spent, and credited to your account.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('earned')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterType === 'earned' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Earned (+)
              </button>
              <button
                onClick={() => setFilterType('spent')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterType === 'spent' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Spent (-)
              </button>
            </div>

            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              title="Refresh Activity"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Transactions list */}
        <div>
          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading transaction history...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <Coins className="w-10 h-10 text-zinc-600 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-zinc-300">No point transactions found</p>
              <p className="text-xs text-zinc-500 mt-1">
                {filterType === 'all'
                  ? 'Start by checking in daily, downloading subtitles, or inviting friends!'
                  : `No ${filterType} transactions recorded yet.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-sm font-black ${
                        tx.points > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {tx.points > 0 ? `+${tx.points}` : tx.points} PTS
                    </span>
                    {tx.balanceAfter !== undefined && (
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        Bal: {tx.balanceAfter} PTS
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
