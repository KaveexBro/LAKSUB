import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'wouter';

export const GlobalAds: React.FC = () => {
  const { isAdFree } = useAuth();
  const [location] = useLocation();
  const [popunderEnabled, setPopunderEnabled] = useState(true);
  const [socialBarEnabled, setSocialBarEnabled] = useState(true);
  const [displayFrequency, setDisplayFrequency] = useState(1);
  const [pageLoadCount, setPageLoadCount] = useState(1);

  useEffect(() => {
    const fetchGlobalAdSettings = async () => {
      try {
        const globalAdsDoc = await getDoc(doc(db, 'settings', 'global_ads'));
        if (globalAdsDoc.exists()) {
          const data = globalAdsDoc.data();
          setPopunderEnabled(data.popunder !== false); // Default true
          setSocialBarEnabled(data.socialBar !== false); // Default true
          setDisplayFrequency(data.displayFrequency || 1);
        }
      } catch (error) {
        console.warn("Error fetching global ad settings:", error);
      }
    };
    
    fetchGlobalAdSettings();
  }, []);
  
  // Track page loads/navigation
  useEffect(() => {
    let currentCount = parseInt(sessionStorage.getItem('laksub_page_loads') || '0');
    currentCount += 1;
    sessionStorage.setItem('laksub_page_loads', currentCount.toString());
    setPageLoadCount(currentCount);
  }, [location]);
  
  useEffect(() => {
    if (isAdFree) return;
    
    const shouldDisplay = pageLoadCount % displayFrequency === 0;
    
    // Using simple document script injection ensures Adsterra scripts aren't stripped by React
    const injectScript = (src: string, id: string) => {
      if (!document.getElementById(id)) {
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.type = 'text/javascript';
        script.async = true;
        document.head.appendChild(script);
      }
    };

    const removeScript = (id: string) => {
      const script = document.getElementById(id);
      if (script) {
        script.remove();
      }
    };

    // Removed popunder to reduce annoyances as requested by the user
    removeScript('adsterra-popunder');
    
    if (shouldDisplay && socialBarEnabled) {
      injectScript('https://pl30103765.effectivecpmnetwork.com/3e/97/30/3e973068a48f3d9e8db012fdd60ea471.js', 'adsterra-socialbar');
    } else {
      removeScript('adsterra-socialbar');
    }

    return () => {
      // It's hard to remove injected inner nodes from Adsterra scripts
      // We rely on the outermost script removal for future requests
    };
  }, [isAdFree, popunderEnabled, socialBarEnabled, displayFrequency, pageLoadCount]);

  return null;
};
