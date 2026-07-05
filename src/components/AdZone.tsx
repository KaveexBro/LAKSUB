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
    <div className="w-full my-6 flex flex-col gap-6">
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

        return (
          <div key={ad.id} className="bg-[#181818]/80 border border-white/10 rounded-xl flex flex-col justify-center items-center w-full transition-all duration-300 overflow-hidden relative" style={{ minHeight: adConfig?.height || '300px', transform: 'translateZ(0)', willChange: 'transform' }}>
            <div className="w-full bg-black/60 py-1.5 px-4 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 z-10 backdrop-blur-sm">
              <span>Advertisement</span>
              {ad.type === 'direct' && <span className="text-netflix-red/70">Sponsored</span>}
            </div>
            <div className="w-full flex-1 flex items-center justify-center relative p-2 overflow-x-auto overflow-y-hidden">
              {ad.type === 'direct' ? (
                <a 
                  href={ad.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full h-full block group overflow-hidden rounded-lg"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.campaignName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </a>
              ) : adConfig ? (
                <iframe
                  title={`Advertisement ${ad.format || 'native'}`}
                  name={iframeId}
                  src={adConfig.src}
                  width={adConfig.width}
                  height={adConfig.height}
                  frameBorder="0"
                  scrolling="no"
                  className="border-none transition-all duration-300 rounded-lg max-w-full"
                  style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', minWidth: adConfig.width === '100%' ? 'auto' : adConfig.width }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
