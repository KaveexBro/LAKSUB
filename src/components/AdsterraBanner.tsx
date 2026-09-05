import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  /**
   * The raw JavaScript code provided by Adsterra.
   * Note: You must provide the FULL script, as the one pasted earlier was truncated.
   */
  scriptContent: string;
  className?: string;
  containerId?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ 
  scriptContent, 
  className = '', 
  containerId = 'adsterra-ad-container' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;

    // 2. Inject the raw JavaScript code
    // We use textContent to safely inject the raw JS string.
    script.textContent = scriptContent;

    // 3. Append the script to the designated container (or body if you prefer global)
    // Appending to our local container ensures it's sandboxed slightly better visually.
    const targetContainer = containerRef.current;
    
    if (targetContainer) {
      targetContainer.appendChild(script);
    }

    // 4. Cleanup function to remove the script when the component unmounts
    return () => {
      if (targetContainer && targetContainer.contains(script)) {
        targetContainer.removeChild(script);
      }
    };
  }, [scriptContent]); // Re-run if the script content ever changes

  return (
    <div 
      ref={containerRef} 
      id={containerId} 
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-[#141414] shadow-lg backdrop-blur-md transition-all duration-300 w-full min-h-[50px] p-2 ${className}`}
      style={{ zIndex: 10 }}
    >
      {/* 
        This div is purely a visual placeholder while the script runs. 
        Adsterra's script might replace the contents or append an iframe.
      */}
      <div className="text-[10px] uppercase tracking-widest text-gray-500 absolute top-2 left-2 pointer-events-none">
        Advertisement
      </div>
    </div>
  );
};
