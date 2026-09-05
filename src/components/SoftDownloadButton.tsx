import React, { useState, useEffect } from 'react';
import { Download, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SoftDownloadButtonProps {
  onDownloadComplete: () => void;
  adsterraDirectLink?: string;
  isPro?: boolean;
}

export const SoftDownloadButton: React.FC<SoftDownloadButtonProps> = ({ 
  onDownloadComplete, 
  adsterraDirectLink = 'https://elementalconsessionconsession.com/t2jpi3d3?key=cba011a23fc64c12de1d13a7f3a4897d', // Adsterra Smart Link
  isPro = false
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown finished
      setCountdown(null);
      onDownloadComplete();
    }
  }, [countdown, onDownloadComplete]);

  const handleInitialClick = () => {
    if (isPro) {
      // Pro users bypass ads and countdown
      onDownloadComplete();
      return;
    }

    // 1. Open Adsterra link in new tab
    if (adsterraDirectLink) {
      window.open(adsterraDirectLink, '_blank');
    }
    
    // 2. Start the 10-second countdown
    setCountdown(10);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <AnimatePresence mode="wait">
        {countdown === null ? (
          <motion.button
            key="download-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleInitialClick}
            className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_15px_rgba(229,9,20,0.4)] hover:shadow-[0_0_25px_rgba(229,9,20,0.6)]"
          >
            <Download className="w-6 h-6" />
            <span className="text-lg">Sinhala Subtitle බාගත කරන්න (Download)</span>
          </motion.button>
        ) : (
          <motion.div
            key="countdown-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#181818] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-center shadow-inner"
          >
            <div className="relative flex items-center justify-center w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#E50914"
                  strokeWidth="4"
                  strokeDasharray={28 * 2 * Math.PI}
                  strokeDashoffset={(28 * 2 * Math.PI) * (1 - countdown / 10)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute text-xl font-bold text-white">{countdown}</span>
            </div>
            
            <p className="text-gray-300 font-medium text-lg">
              ඔබේ උපසිරැසිය සූදානම් වෙමින් පවතී...<br/>
              <span className="text-netflix-red font-bold">{countdown}</span> තත්පර රැඳී සිටින්න.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {countdown !== null && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 items-start"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-500/90 text-sm leading-relaxed text-left">
            ⚠️ උපසිරැසිය ඩවුන්ලෝඩ් නොවන්නේ නම්, කරුණාකර ඔබගේ <strong>Ad Blocker</strong> එක ක්‍රියාවිරහිත කර පිටුව Refresh කරන්න. අපගේ සේවාව නොමිලේ පවත්වාගෙන යාමට එය විශාල සහයකි!
          </p>
        </motion.div>
      )}
    </div>
  );
};
