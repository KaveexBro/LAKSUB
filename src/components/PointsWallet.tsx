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
  ArrowUp,
  Share2,
  Gift,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { PointManager, POINT_TRIGGERS } from '../services/PointManager';
import { PointTransaction } from '../types';
import { ReferralHub } from './ReferralHub';

interface PointsWalletProps {
  onRefresh?: () => void;
}

export const PointsWallet: React.FC<PointsWalletProps> = ({ onRefresh }) => {
  const { user, userData, isPro, signIn } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentPoints = userData?.points ?? 100;
  const today = new Date().toISOString().split('T')[0];
  const isDailyClaimed = userData?.lastDailyBonusDate === today;

  // Referral URL
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
          {/* Ambient Lighting */}
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
                  {isPro ? 'Priority Queue • 0 PTS Deducted' : 'Earn via 4 Methods • 50 PTS per request'}
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
                  className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{claimingDaily ? 'Claiming...' : 'Claim Today (+10 PTS)'}</span>
                </button>
              )}

              <button
                onClick={() => setIsReferralModalOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Invite Friends (+50 PTS)</span>
              </button>

              <Link href="/request">
                <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
                  <span>Request Subtitle</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Link>

              {!isPro && (
                <Link href="/upgrade">
                  <button className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5 ml-auto">
                    <Crown className="w-3.5 h-3.5" />
                    Upgrade to Pro
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Tier Comparison & Upgrade Card */}
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-white text-base">Membership Tier Status</h3>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-300">FREE Tier</span>
                  <span className="text-cyan-400">Active</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Earn points via Daily visits (+10), unique Downloads (+2), Ratings (+1), and Real Referrals (+50).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-300">PRO Member</span>
                  <span className="text-amber-400 font-mono">UNLIMITED</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Enjoy unlimited priority requests without any points deducted, zero ads, and instant direct downloads.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-black/60 border border-white/5 rounded-2xl">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">
              Your Referral Link
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-cyan-300 truncate select-all flex-1">
                {referralUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-xs p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Copy Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ways to Earn Points Quick Action Row */}
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Ways for FREE Members to Earn Points
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Way 1 */}
          <div className="bg-zinc-900/80 border border-white/10 hover:border-emerald-500/40 transition-all rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                +{POINT_TRIGGERS.DAILY_LOGIN} PTS
              </span>
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Daily Website Visit</h4>
            <p className="text-xs text-zinc-400 mb-3">
              Visit LAKSUB every day to automatically receive your daily check-in bonus.
            </p>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              {isDailyClaimed ? '✓ Claimed for today' : '• Ready to claim'}
            </div>
          </div>

          {/* Way 2 */}
          <div className="bg-zinc-900/80 border border-white/10 hover:border-cyan-500/40 transition-all rounded-2xl p-5 shadow-lg">
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
              Earn +2 points for each unique subtitle downloaded. Duplicate downloads are flagged.
            </p>
            <Link href="/explore">
              <span className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer">
                Explore Subtitles <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Way 3 */}
          <div className="bg-zinc-900/80 border border-white/10 hover:border-amber-500/40 transition-all rounded-2xl p-5 shadow-lg">
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
              Leave a rating on any subtitle to earn +1 point and support creators in the community.
            </p>
            <Link href="/explore">
              <span className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer">
                Rate Now <ArrowUpRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Way 4 */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-black border border-cyan-500/40 hover:border-cyan-400 transition-all rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                +{POINT_TRIGGERS.VERIFIED_REFERRAL} PTS
              </span>
            </div>
            <h4 className="font-bold text-sm text-cyan-300 mb-1">Real Referrals</h4>
            <p className="text-xs text-zinc-400 mb-3">
              Invite real friends to LAKSUB. Anti-fraud engine validates authentic accounts.
            </p>
            <button
              onClick={() => setIsReferralModalOpen(true)}
              className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              Share Link <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. History of Point Earnings Component */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Point Transaction History</h3>
              <p className="text-xs text-zinc-400">
                Track all incoming bonus rewards and request expenses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/60 border border-white/10 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-white/10 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('earned')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'earned'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilterType('spent')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'spent'
                    ? 'bg-red-500/20 text-red-400 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Spent
              </button>
            </div>

            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* History Table / List */}
        <div className="pt-4">
          {loadingHistory ? (
            <div className="py-16 text-center text-zinc-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-500" />
              Loading your point history...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <Coins className="w-10 h-10 mx-auto mb-2 text-zinc-600 opacity-50" />
              <p className="text-sm font-bold text-zinc-300">No point transactions found</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Your point activity will appear here as you visit daily (+10), download unique subtitles (+2), rate movies (+1), or refer friends (+50).
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-black/40 border border-white/5 hover:border-white/15 p-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center flex-shrink-0">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                        {new Date(tx.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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

      {/* Referral Hub Modal */}
      <ReferralHub
        isModal={true}
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
      />
    </div>
  );
};
