import React, { useState } from 'react';
import { Crown, Coins, Sparkles, AlertCircle, ArrowUpRight, Users, Gift, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { ReferralHub } from '../ReferralHub';
import { POINTS_CONFIG } from '../../utils/pointsAndReferrals';

interface TierPointBadgeProps {
  requiredPoints?: number;
}

export const TierPointBadge: React.FC<TierPointBadgeProps> = ({ requiredPoints = 50 }) => {
  const { user, userData, isPro, signIn } = useAuth();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [showHowToEarn, setShowHowToEarn] = useState(false);

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
              Sign in to earn & spend points (Free) or enjoy unlimited priority requests (Pro).
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

  return (
    <>
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
                  className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isPro
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  {isPro ? 'Pro Member' : 'Free Member'}
                </span>

                {isPro ? (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> UNLIMITED POINTS (0 PTS Deducted)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-zinc-400">
                    Cost: <span className="text-white font-bold">{requiredPoints} PTS</span> per request
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
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {!isPro && (
              <>
                <button
                  type="button"
                  onClick={() => setShowHowToEarn(!showHowToEarn)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" />
                  Ways to Earn
                </button>

                <button
                  type="button"
                  onClick={() => setIsReferralModalOpen(true)}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow"
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Invite Friends (+50 PTS)</span>
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

        {/* Expandable Ways To Earn Points for Free Members */}
        {!isPro && showHowToEarn && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <span className="text-emerald-400 font-bold text-xs block">+{POINTS_CONFIG.DAILY_VISIT} PTS</span>
              <span className="text-[11px] text-zinc-300">Daily Website Visit</span>
            </div>
            <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <span className="text-cyan-400 font-bold text-xs block">+{POINTS_CONFIG.SUBTITLE_DOWNLOAD} PTS</span>
              <span className="text-[11px] text-zinc-300">Download Subtitle (1x)</span>
            </div>
            <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
              <span className="text-amber-400 font-bold text-xs block">+{POINTS_CONFIG.SUBTITLE_RATING} PTS</span>
              <span className="text-[11px] text-zinc-300">Rate a Subtitle</span>
            </div>
            <div className="bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-xl">
              <span className="text-cyan-300 font-bold text-xs block">+{POINTS_CONFIG.REAL_REFERRAL} PTS</span>
              <span className="text-[11px] text-zinc-300">Real Friend Referral</span>
            </div>
          </div>
        )}

        {/* Warning message if Free tier user has insufficient points */}
        {!isPro && !hasEnoughPoints && (
          <div className="mt-3 pt-3 border-t border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-red-400 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Insufficient points. You have <strong className="text-white">{currentPoints} PTS</strong>, but need at least <strong className="text-white">{requiredPoints} PTS</strong>.
              </span>
            </div>
            <button
              onClick={() => setIsReferralModalOpen(true)}
              className="text-cyan-400 hover:underline font-bold text-xs flex items-center gap-1"
            >
              Earn points now <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Referral Center Modal */}
      <ReferralHub
        isModal={true}
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
      />
    </>
  );
};
