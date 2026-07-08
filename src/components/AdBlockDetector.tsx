import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export const AdBlockDetector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdBlockActive, setIsAdBlockActive] = useState(false);
  const [checking, setChecking] = useState(true);
  const { isAdFree } = useAuth();

  const checkAdBlock = async () => {
    if (isAdFree) {
      setIsAdBlockActive(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    
    // Method 1: Bait Element
    const bait = document.createElement('div');
    bait.innerHTML = '&nbsp;';
    bait.className = 'adsbox ad-placement ad-content';
    bait.style.position = 'absolute';
    bait.style.left = '-9999px';
    bait.style.top = '-9999px';
    bait.style.height = '1px';
    bait.style.width = '1px';
    document.body.appendChild(bait);

    const isBaitBlocked = () => {
      if (bait.offsetParent === null || 
          bait.offsetHeight === 0 || 
          bait.offsetLeft === 0 || 
          bait.offsetTop === 0 || 
          bait.offsetWidth === 0 || 
          bait.clientHeight === 0 || 
          bait.clientWidth === 0) {
        return true;
      }
      if (window.getComputedStyle !== undefined) {
        const style = window.getComputedStyle(bait, null);
        if (style && (style.getPropertyValue('display') === 'none' || style.getPropertyValue('visibility') === 'hidden')) {
          return true;
        }
      }
      return false;
    };

    // Method 2: Multiple Fetch URLs
    const adUrls = [
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      'https://googleads.g.doubleclick.net/pagead/ads',
      'https://static.ads-twitter.com/uwt.js',
      'https://connect.facebook.net/en_US/fbevents.js'
    ];

    const checkFetch = async (url: string) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        return false;
      } catch (e) {
        // If it throws an error (including AbortError), it might be blocked or just slow.
        // We consider it blocked to be safe, but at least we don't hang forever.
        return true;
      }
    };

    // Method 3: Dynamic Script Load
    const checkScriptLoad = () => {
      return new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.onerror = () => {
          script.remove();
          resolve(true); // Blocked
        };
        script.onload = () => {
          script.remove();
          resolve(false); // Not blocked
        };
        document.head.appendChild(script);
        
        // Timeout in case it's silently swallowed
        setTimeout(() => {
          if (document.head.contains(script)) {
            script.remove();
          }
          resolve(false); 
        }, 2000);
      });
    };

    // Run checks
    const baitBlocked = isBaitBlocked();
    bait.remove();

    if (baitBlocked) {
      setIsAdBlockActive(true);
      setChecking(false);
      return;
    }

    const scriptBlocked = await checkScriptLoad();
    if (scriptBlocked) {
      setIsAdBlockActive(true);
      setChecking(false);
      return;
    }

    // Check fetches in parallel
    const fetchResults = await Promise.all(adUrls.map(checkFetch));
    if (fetchResults.some(res => res === true)) {
      setIsAdBlockActive(true);
      setChecking(false);
      return;
    }

    // Method 3: Global Variable Check (delayed slightly to allow scripts to load/fail)
    setTimeout(() => {
      if ((window as any).adsbygoogle === undefined && (window as any).google_ad_client === undefined) {
        // This is less reliable as a standalone check but good as a fallback
        // For now, we'll stick to the more aggressive bait and fetch methods
      }
    }, 1000);

    setIsAdBlockActive(false);
    setChecking(false);
  };

  useEffect(() => {
    // Initial check
    checkAdBlock();

    // Also check for Brave's specific shield behavior
    if ((navigator as any).brave && (navigator as any).brave.isBrave) {
      (navigator as any).brave.isBrave().then((isBrave: boolean) => {
        if (isBrave) {
          // Brave often blocks even if the fetch succeeds due to its aggressive shields
          // We can't definitively say it's blocked just because it's Brave, 
          // but we can be more sensitive.
          // For now, we'll rely on the fetch check as it's more accurate for "blocking"
        }
      });
    }
  }, [isAdFree]);

  if (checking) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdBlockActive) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#141414] flex items-center justify-center p-4">
        {/* Simple background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-netflix-red/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-md w-full bg-[#181818] border border-white/10 p-8 rounded-2xl text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-netflix-red/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-netflix-red" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Ad Blocker Detected</h1>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              We've detected that you're using an <span className="text-white font-bold">Ad Blocker</span> or a browser with built-in blocking like <span className="text-white font-bold">Brave</span>.
            </p>
          </div>

          <div className="bg-black/40 p-5 rounded-xl text-xs text-left border border-white/5 space-y-3">
            <p className="text-gray-300 font-bold uppercase tracking-wider">To continue using LAKSUB:</p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-netflix-red mt-1 flex-shrink-0" />
                <span>Disable your Ad Blocker extension for this site</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-netflix-red mt-1 flex-shrink-0" />
                <span>Turn off Brave Shields (click the lion icon in address bar)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-netflix-red mt-1 flex-shrink-0" />
                <span>Refresh the page after making these changes</span>
              </li>
            </ul>
          </div>

          <p className="text-[10px] text-gray-500 italic leading-tight">
            Ads help us keep our subtitle services free for everyone. We appreciate your understanding and support!
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-netflix-red text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-netflix-red/20"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            I've Disabled It, Refresh
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
