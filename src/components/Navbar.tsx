import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { Search, User, LogOut, Crown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationBell } from './NotificationBell';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex flex-col items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className="absolute top-full mt-2 px-2 py-1 bg-netflix-surface border border-white/10 rounded text-[10px] font-semibold tracking-wide text-white whitespace-nowrap z-[110] shadow-2xl pointer-events-none"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { settings } = useSiteSettings();
  const { user, userData, isPro, signIn, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-gradient-to-b from-black/90 to-transparent px-4 md:px-12 py-3 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          className="md:hidden text-white p-1"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link href="/">
          <div className="flex flex-col cursor-pointer group">
            <img 
              src={settings.logoUrl || "/logo.png"} 
              alt="LAKSUB" 
              className="h-8 md:h-10 w-auto object-contain group-hover:scale-105 transition-transform origin-left" 
            />
            <span className="text-[8px] md:text-[10px] font-medium text-white/40 tracking-[0.2em] leading-none mt-1">
              Sinhala Subtitles
            </span>
          </div>
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-semibold tracking-wide text-gray-400">
          <Link href="/"><span className="hover:text-white cursor-pointer transition-colors">Home</span></Link>
          <Link href="/series"><span className="hover:text-white cursor-pointer transition-colors">TV Shows</span></Link>
          <Link href="/movies"><span className="hover:text-white cursor-pointer transition-colors">Movies</span></Link>
          <Link href="/explore"><span className="hover:text-white cursor-pointer transition-colors">Explore</span></Link>
          <Link href="/top-subtitlers"><span className="hover:text-white cursor-pointer transition-colors">Top Subtitlers</span></Link>
          <Link href="/request"><span className="hover:text-white cursor-pointer transition-colors">Request</span></Link>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <Tooltip text="Search Subtitles">
          <Link href="/explore">
            <Search className="w-5 h-5 text-white cursor-pointer hover:text-netflix-red transition-colors" />
          </Link>
        </Tooltip>
        
        {user && <NotificationBell />}
        
        {user ? (
          <div className="flex items-center gap-4">
            {isPro ? (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-2 py-1 rounded-sm uppercase tracking-tighter">
                <Crown className="w-3 h-3" /> Pro
              </span>
            ) : (
              <Link 
                href="/upgrade" 
                className="hidden sm:block text-[10px] font-bold bg-netflix-red text-white px-3 py-1.5 rounded-sm hover:bg-red-700 transition-colors uppercase tracking-widest"
              >
                Upgrade
              </Link>
            )}
            
            <Tooltip text="Account Menu">
              <div className="relative cursor-pointer" ref={menuRef}>
                <div 
                  className="w-8 h-8 rounded-sm overflow-hidden bg-gray-800 border border-white/10"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {userData?.photoURL ? (
                    <img src={userData.photoURL || undefined} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-full h-full p-1 text-gray-400" />
                  )}
                </div>
                
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-netflix-surface/95 backdrop-blur-xl border border-white/10 rounded-md shadow-2xl py-2 z-[110]"
                    >
                      <div className="px-4 py-3 border-b border-white/5 mb-2">
                        <p className="text-sm font-bold text-white truncate uppercase tracking-tighter">{userData?.displayName}</p>
                        <p className="text-[10px] text-gray-500 truncate font-mono">{userData?.email}</p>
                        {isPro && userData?.proExpiry && (
                          <p className="text-[9px] text-yellow-500 font-bold tracking-tight mt-1 flex items-center gap-1">
                            <Crown className="w-2 h-2" /> Expires: {new Date(userData.proExpiry).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <Link href="/profile">
                        <span onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer uppercase tracking-widest transition-colors">My Profile</span>
                      </Link>
                      
                      {userData?.role === 'admin' && (
                        <Link href="/admin">
                          <span onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer uppercase tracking-widest transition-colors">Admin Dashboard</span>
                        </Link>
                      )}
                      
                      {(userData?.role === 'creator' || userData?.role === 'admin') && (
                        <Link href="/dashboard">
                          <span onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer uppercase tracking-widest transition-colors">Creator Dashboard</span>
                        </Link>
                      )}
                      
                      {userData?.role === 'user' && (
                        <Link href="/apply">
                          <span onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer uppercase tracking-widest transition-colors">Become a Creator</span>
                        </Link>
                      )}
                      
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-netflix-red hover:bg-netflix-red/10 flex items-center gap-2 mt-2 border-t border-white/5 pt-2 uppercase tracking-widest transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Tooltip>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="bg-netflix-red text-white px-6 py-2 rounded-sm text-xs font-bold tracking-wide hover:bg-red-700 transition-all active:scale-95 shadow-lg"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-netflix-surface z-[110] md:hidden flex flex-col p-8 border-r border-white/10"
            >
              <div className="mb-12">
                <div className="flex flex-col">
                  <img 
                    src={settings.logoUrl || "/logo.png"} 
                    alt="LAKSUB" 
                    className="h-12 w-auto object-contain self-start" 
                  />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] leading-none mt-2">
                    Sinhala Subtitles
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-6 text-lg font-bold tracking-[0.2em]">
                <Link href="/"><span onClick={() => setIsMobileMenuOpen(false)} className="hover:text-netflix-red transition-colors">Home</span></Link>
                <Link href="/series"><span onClick={() => setIsMobileMenuOpen(false)} className="hover:text-netflix-red transition-colors">TV Shows</span></Link>
                <Link href="/movies"><span onClick={() => setIsMobileMenuOpen(false)} className="hover:text-netflix-red transition-colors">Movies</span></Link>
                <Link href="/explore"><span onClick={() => setIsMobileMenuOpen(false)} className="hover:text-netflix-red transition-colors">Explore</span></Link>
                <Link href="/top-subtitlers"><span onClick={() => setIsMobileMenuOpen(false)} className="hover:text-netflix-red transition-colors">Top Subtitlers</span></Link>
                <Link href="/request"><span onClick={() => setIsMobileMenuOpen(false)} className="hover:text-netflix-red transition-colors">Request</span></Link>
              </div>
              
              <div className="mt-auto pt-8 border-t border-white/5">
                {isPro && userData?.proExpiry && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-[10px] text-yellow-500 font-bold tracking-wide mb-1 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Pro Member
                    </p>
                    <p className="text-xs font-bold text-white">
                      Expires: {new Date(userData.proExpiry).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {!isPro && (
                  <Link 
                    href="/upgrade" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center bg-netflix-red text-white py-3 rounded-xl font-bold tracking-wide text-sm"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
