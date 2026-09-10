import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AdsterraPopunder: React.FC = () => {
  const { isAdFree } = useAuth();

  useEffect(() => {
    // Do not inject for Pro users
    if (isAdFree) return;

    const scriptId = 'adsterra-inline-popunder';

    // Check if it already exists to prevent duplicate injections
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      
      // =========================================================================
      // PASTE YOUR FULL ADSTERRA INLINE SCRIPT INSIDE THE BACKTICKS BELOW
      // Example: script.innerHTML = `(function() { ... })();`;
      // =========================================================================
      script.innerHTML = `
        /* Paste the 19KB Adsterra script here */
      `;

      // Append to body to ensure it runs
      document.body.appendChild(script);
    }

    return () => {
      // Optional: Cleanup script on unmount
      const script = document.getElementById(scriptId);
      if (script) {
        script.remove();
      }
    };
  }, [isAdFree]);

  return null;
};
