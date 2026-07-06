import re

with open('src/components/AdZone.tsx', 'r') as f:
    content = f.read()

bad_render = """  return (
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
  );"""

good_render = """  return (
    <div className="w-full my-8 flex flex-col gap-8 items-center justify-center">
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
            className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] w-full max-w-[1000px]"
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
  );"""

content = content.replace(bad_render, good_render)

with open('src/components/AdZone.tsx', 'w') as f:
    f.write(content)
