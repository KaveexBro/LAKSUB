import React, { useState } from 'react';
import { Crown, Coins, Sparkles, AlertCircle, ArrowUpRight, PlusCircle, Check } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface TierPointBadgeProps {
  requiredPoints?: number;
}

export const TierPointBadge: React.FC<TierPointBadgeProps> = ({ requiredPoints = 50 }) => {
  const { user, userData, isPro, signIn } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState(false);

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-netflix-red/10 border border-netflix-red/20 flex items-center justify-center text-netflix-red">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Subtitle Request Access</h4>
            <p className="text-xs text-zinc-400">
              Sign in to use your points (Free) or enjoy unlimited priority requests (Pro).
            </p>
          </div>
        </div>
        <button
          onClick={signIn}
          className="bg-netflix-red text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg flex-shrink-0"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  const currentPoints = userData?.points ?? 100;
  const hasEnoughPoints = currentPoints >= requiredPoints;

  // Helpful bonus claiming helper for Free users to test and never get stuck with 0 points
  const handleClaimDailyBonus = async () => {
    if (!user) return;
    setClaiming(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: currentPoints + 50,
      });
      setClaimedNotice(true);
      setTimeout(() => setClaimedNotice(false), 3000);
    } catch (err) {
      console.error('Error claiming points bonus:', err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Tier Info & Balance */}
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
              isPro
                ? 'bg-gradient-to-tr from-amber-500/20 to-red-500/20 border-amber-500/40 text-amber-400'
                : 'bg-zinc-800/80 border-white/10 text-cyan-400'
            }`}
          >
            {isPro ? <Crown className="w-6 h-6 text-amber-400" /> : <Coins className="w-6 h-6 text-cyan-400" />}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  isPro
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {isPro ? 'Pro Member' : 'Free Member'}
              </span>

              {isPro ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 0 Points Deducted (Unlimited)
                </span>
              ) : (
                <span className="text-xs font-semibold text-zinc-400">
                  Cost: <span className="text-white font-bold">{requiredPoints} Points</span> per request
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base">
                {isPro ? (
                  <span className="text-zinc-200">Unlimited Priority Subtitle Requests</span>
                ) : (
                  <span>
                    Your Balance:{' '}
                    <span
                      className={`text-lg font-black ${
                        hasEnoughPoints ? 'text-cyan-400' : 'text-red-400'
                      }`}
                    >
                      {currentPoints} PTS
                    </span>
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {!isPro && (
            <>
              {/* Quick Daily/Bonus Points claim button */}
              <button
                type="button"
                onClick={handleClaimDailyBonus}
                disabled={claiming}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                title="Claim 50 Bonus Points"
              >
                {claimedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">+50 PTS Added!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>{claiming ? 'Adding...' : '+50 PTS Bonus'}</span>
                  </>
                )}
              </button>

              <Link href="/upgrade">
                <button
                  type="button"
                  className="bg-gradient-to-r from-amber-500 to-netflix-red hover:from-amber-600 hover:to-red-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade Pro
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Warning message if Free tier user has insufficient points */}
      {!isPro && !hasEnoughPoints && (
        <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center gap-2 text-xs text-red-400 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Insufficient points. You have <strong className="text-white">{currentPoints} PTS</strong>, but need at least <strong className="text-white">{requiredPoints} PTS</strong>. Click "+50 PTS Bonus" above or upgrade to Pro to submit immediately.
          </span>
        </div>
      )}
    </div>
  );
};
