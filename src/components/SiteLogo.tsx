import React, { useState } from 'react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

interface SiteLogoProps {
  className?: string;
}

export const SiteLogo: React.FC<SiteLogoProps> = ({ className = '' }) => {
  const { settings } = useSiteSettings();
  const src = settings.logoUrl || "/logo.png";
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  return (
    <img 
      src={src} 
      alt="LAKSUB" 
      className={`transition-opacity duration-300 ${loadedSrc === src ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={() => setLoadedSrc(src)}
      referrerPolicy="no-referrer"
      style={{ color: 'transparent' }} // Hides alt text while loading
    />
  );
};
