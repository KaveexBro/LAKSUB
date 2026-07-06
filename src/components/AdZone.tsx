import React, { useEffect, useState, useRef } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AdCampaign } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AdZoneProps {
  zoneName: string;
}

export const AdZone: React.FC<AdZoneProps> = ({ zoneName }) => {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [iframeHeights, setIframeHeights] = useState<Record<string, number>>({});
  const { isAdFree } = useAuth();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'resize' && event.data.id) {
        setIframeHeights(prev => ({
          ...prev,
          [event.data.id]: Math.max(300, event.data.height + 20)
        }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isAdFree) {
      setLoading(false);
      return;
    }

    const fetchAds = async () => {
      try {
        const q = query(collection(db, 'ad_campaigns'));
        const snapshot = await getDocs(q);
        const activeAds = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign))
          .filter(ad => ad.isActive && (ad.zones?.includes(zoneName) || ad.zone === zoneName));

        setAds(activeAds);
      } catch (error) {
        console.error("Error fetching ads for zone:", zoneName, error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [zoneName, isAdFree]);

  if (isAdFree || loading || ads.length === 0) {
    return null;
  }

  const pageLoadCount = parseInt(sessionStorage.getItem('laksub_page_loads') || '1');
  const adsToDisplay = ads.filter(ad => {
    if (ad.displayFrequency && ad.displayFrequency > 1) {
      return pageLoadCount % ad.displayFrequency === 0;
    }
    return true;
  });

  if (adsToDisplay.length === 0) return null;

  return (
    <div className="w-full my-4 md:my-6 lg:my-8 flex flex-col gap-4 md:gap-6 lg:gap-8 items-center justify-center">
      {adsToDisplay.map(ad => {
        const getAdsterraConfig = () => {
          if (ad.type === 'direct') return null;
          const format = ad.format || 'native';
          if (format === 'native') {
            return { src: '/ad.html', width: '100%', height: iframeHeights[`ad-iframe-${ad.id}`] || 300 };
          }
          const [w, h] = format.split('x');
          return { src: `/ad-${format}.html`, width: `${w}px`, height: `${h}px` };
        };

        const adConfig = getAdsterraConfig();
        const iframeId = `ad-iframe-${ad.id}`;
        const isDirect = ad.type === 'direct';

        return (
          <div 
            key={ad.id} 
            className={`group relative flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] w-full max-w-[1000px] ${ad.deviceTargeting === 'desktop' ? 'hidden md:flex' : ad.deviceTargeting === 'mobile' ? 'flex md:hidden' : 'flex'}`}
          >
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" />
            
            <div className="w-full bg-[#111]/90 py-2 px-4 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/5 z-10 backdrop-blur-md">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/80 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                Advertisement
              </span>
              {isDirect && <span className="text-netflix-red/90 drop-shadow-md">Sponsored</span>}
            </div>

            <div 
              className={`w-full flex items-center justify-center relative ${isDirect ? 'p-0' : 'p-4'}`}
              style={{ minHeight: isDirect ? 'auto' : (adConfig?.height || '250px') }}
            >
              {isDirect ? (
                <a 
                  href={ad.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full block relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.campaignName} 
                    className="w-full h-auto max-h-[400px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </a>
              ) : adConfig ? (
                <div className="flex justify-center items-center overflow-x-auto w-full custom-scrollbar">
                  <iframe
                    title={`Advertisement ${ad.format || 'native'}`}
                    name={iframeId}
                    src={adConfig.src}
                    width={adConfig.width}
                    height={adConfig.height}
                    frameBorder="0"
                    scrolling="no"
                    className="border-none rounded-lg max-w-full"
                    style={{ minWidth: adConfig.width === '100%' ? 'auto' : adConfig.width }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
