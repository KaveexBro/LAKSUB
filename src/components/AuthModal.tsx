import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Bookmark, Star, Gift, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SiteLogo } from './SiteLogo';
import { Link } from 'wouter';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
      closeAuthModal();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User voluntarily closed the popup, no need to show an aggressive error
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for LAKSUB.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden z-10 text-center"
        >
          {/* Subtle Ambient Red Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-netflix-red/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header & Logo */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <SiteLogo className="h-9 w-auto object-contain" />
            </div>
            
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-netflix-red/10 border border-netflix-red/20 text-netflix-red text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3 h-3" /> Member Access
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sign In to LAKSUB
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-sinhala-text">
              ශ්‍රී ලංකාවේ විශාලතම සිංහල උපසිරැසි ප්‍රජාවට එකතු වන්න
            </p>
          </div>

          {/* Why Sign In Perks */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <div className="w-6 h-6 rounded-lg bg-netflix-red/10 border border-netflix-red/20 flex items-center justify-center flex-shrink-0 text-netflix-red">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white">Free Subtitle Downloads</span>
                <span className="text-[11px] text-gray-500 block">නොමිලේ වේගවත් උපසිරැසි බාගත කිරීම්</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-300">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                <Bookmark className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white">Personal Watchlist & History</span>
                <span className="text-[11px] text-gray-500 block">ඔබ නැරඹූ සහ බැලීමට ඇති චිත්‍රපට සුරකින්න</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-300">
              <div className="w-6 h-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-400">
                <Star className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white">Ratings, Comments & Requests</span>
                <span className="text-[11px] text-gray-500 block">අදහස් පළ කරන්න සහ නව උපසිරැසි ඉල්ලුම් කරන්න</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                <Gift className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white">+100 Free Welcome Points</span>
                <span className="text-[11px] text-gray-500 block">ලියාපදිංචි වූ වහාම නොමිලේ ලකුණු 100 ක්</span>
              </div>
            </div>
          </div>

          {authError && (
            <div className="mb-4 bg-red-900/40 border border-red-500/30 text-red-200 text-xs p-3 rounded-xl flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Primary Continue with Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-4 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {signingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Connecting with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 4-Color G SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm">Continue with Google</span>
              </>
            )}
          </button>

          {/* Reassurance & Terms footer */}
          <div className="mt-5 text-[11px] text-gray-500 leading-relaxed">
            <p>
              Fast 1-click login. No new password needed.
            </p>
            <p className="mt-2 text-[10px] text-gray-500">
              By continuing, you agree to our{' '}
              <Link href="/terms" onClick={closeAuthModal} className="text-gray-400 hover:text-white underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" onClick={closeAuthModal} className="text-gray-400 hover:text-white underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
