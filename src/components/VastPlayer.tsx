import React, { useEffect, useState, useRef } from 'react';

interface VastPlayerProps {
  vastUrl: string;
  onFinished: () => void;
  onSkip: () => void;
}

export const VastPlayer: React.FC<VastPlayerProps> = ({ vastUrl, onFinished, onSkip }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);
  const [impressionUrl, setImpressionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(5);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const impressionFired = useRef(false);

  useEffect(() => {
    const fetchVast = async () => {
      try {
        const res = await fetch(vastUrl);
        const text = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Extract MediaFile
        const mediaFiles = xmlDoc.getElementsByTagName('MediaFile');
        let mp4Url = '';
        for (let i = 0; i < mediaFiles.length; i++) {
          if (mediaFiles[i].getAttribute('type') === 'video/mp4') {
            mp4Url = mediaFiles[i].textContent?.trim() || '';
            break;
          }
        }
        
        if (!mp4Url && mediaFiles.length > 0) {
           mp4Url = mediaFiles[0].textContent?.trim() || '';
        }

        // Extract ClickThrough
        const clickThroughs = xmlDoc.getElementsByTagName('ClickThrough');
        let cUrl = '';
        if (clickThroughs.length > 0) {
          cUrl = clickThroughs[0].textContent?.trim() || '';
        }

        // Extract Impression
        const impressions = xmlDoc.getElementsByTagName('Impression');
        let iUrl = '';
        if (impressions.length > 0) {
          iUrl = impressions[0].textContent?.trim() || '';
        }

        if (mp4Url) {
          setVideoUrl(mp4Url);
          setClickUrl(cUrl);
          setImpressionUrl(iUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching VAST XML:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVast();
  }, [vastUrl]);

  useEffect(() => {
    if (loading || error) return;
    const timer = setInterval(() => {
      setSkipCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, error]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime > 0 && !impressionFired.current) {
      if (impressionUrl) {
         fetch(impressionUrl, { mode: 'no-cors' }).catch(e => console.error(e));
      }
      impressionFired.current = true;
    }
  };

  const handleVideoClick = () => {
    if (clickUrl) {
      window.open(clickUrl, '_blank');
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !videoUrl) {
    // If VAST fails to load, gracefully fast forward to finish so the user doesn't get stuck
    setTimeout(onFinished, 1000);
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-gray-500">
        <p>Loading sponsor message...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        autoPlay
        playsInline
        muted={isMuted}
        onClick={handleVideoClick}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onFinished}
        onError={() => onFinished()}
      />
      
      {/* Unmute Button Overlay */}
      {isMuted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(false);
          }}
          className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 backdrop-blur transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        </button>
      )}

      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        {skipCountdown > 0 ? (
          <button disabled className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded font-medium text-sm border border-white/10">
            Skip Ad in {skipCountdown}
          </button>
        ) : (
          <button 
            onClick={onSkip}
            className="bg-netflix-red text-white px-4 py-2 rounded font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
          >
            Skip Ad
          </button>
        )}
      </div>

      <div className="absolute top-4 left-4 z-10">
        <span className="bg-yellow-500 text-black text-xs font-black uppercase px-2 py-1 rounded">Advertisement</span>
      </div>
      
      {/* Click overlay just in case */}
      <div 
        className="absolute inset-0 z-0 bg-transparent cursor-pointer" 
        onClick={handleVideoClick}
        style={{ pointerEvents: 'none' }}
      >
        <div className="opacity-0 group-hover:opacity-100 absolute bottom-4 left-4 text-white font-medium bg-black/60 px-3 py-1 rounded text-sm transition-opacity">
          Learn More
        </div>
      </div>
    </div>
  );
};
