import React, { useEffect, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Subtitle } from '../types';
import { Helmet } from 'react-helmet-async';
import { Download, ArrowLeft, Video, MonitorPlay } from 'lucide-react';
import { motion } from 'motion/react';

export const VideoDownloads: React.FC = () => {
  const [, paramsBySlug] = useRoute('/subtitles/:slug/video');
  const [, paramsById] = useRoute('/subtitle/:id/video');
  
  const [subtitle, setSubtitle] = useState<Subtitle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubtitle = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (paramsBySlug?.slug) {
          const slug = paramsBySlug.slug;
          const q = query(collection(db, 'subtitles'), where('slug', '==', slug));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            setSubtitle({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Subtitle);
          } else {
            setError('Subtitle not found');
          }
        } else if (paramsById?.id) {
          const id = paramsById.id;
          const docRef = doc(db, 'subtitles', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setSubtitle({ id: docSnap.id, ...docSnap.data() } as Subtitle);
          } else {
            setError('Subtitle not found');
          }
        } else {
          setError('Invalid URL');
        }
      } catch (err) {
        console.error("Error fetching subtitle:", err);
        setError('Error loading video downloads');
      } finally {
        setLoading(false);
      }
    };

    fetchSubtitle();
  }, [paramsBySlug?.slug, paramsById?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-bg text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  if (error || !subtitle) {
    return (
      <div className="min-h-screen bg-netflix-bg text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">{error || 'Not Found'}</h2>
        <Link href="/">
          <a className="btn-primary">Return Home</a>
        </Link>
      </div>
    );
  }

  const fullTitle = `${subtitle.movieTitle} ${subtitle.type === 'series' ? `S${subtitle.season?.toString().padStart(2, '0')} E${subtitle.episode?.toString().padStart(2, '0')}` : ''}`.trim();

  const rawLinks = subtitle.videoOptions?.filter(o => o.type === 'raw') || [];
  const hardcodedLinks = subtitle.videoOptions?.filter(o => o.type === 'hardcoded') || [];

  if (subtitle.videoLinks) {
    if (subtitle.videoLinks.raw?.p480) rawLinks.push({ id: 'old-r-480', type: 'raw', resolution: '480p', sourceName: 'Direct', url: subtitle.videoLinks.raw.p480 });
    if (subtitle.videoLinks.raw?.p720) rawLinks.push({ id: 'old-r-720', type: 'raw', resolution: '720p', sourceName: 'Direct', url: subtitle.videoLinks.raw.p720 });
    if (subtitle.videoLinks.raw?.p1080) rawLinks.push({ id: 'old-r-1080', type: 'raw', resolution: '1080p', sourceName: 'Direct', url: subtitle.videoLinks.raw.p1080 });
    if (subtitle.videoLinks.hardcoded?.p480) hardcodedLinks.push({ id: 'old-h-480', type: 'hardcoded', resolution: '480p', sourceName: 'Direct', url: subtitle.videoLinks.hardcoded.p480 });
    if (subtitle.videoLinks.hardcoded?.p720) hardcodedLinks.push({ id: 'old-h-720', type: 'hardcoded', resolution: '720p', sourceName: 'Direct', url: subtitle.videoLinks.hardcoded.p720 });
    if (subtitle.videoLinks.hardcoded?.p1080) hardcodedLinks.push({ id: 'old-h-1080', type: 'hardcoded', resolution: '1080p', sourceName: 'Direct', url: subtitle.videoLinks.hardcoded.p1080 });
  }

  const hasVideoLinks = rawLinks.length > 0 || hardcodedLinks.length > 0;

  const groupByResolution = (links: typeof rawLinks) => {
    const grouped: Record<string, typeof rawLinks> = {
      '480p': [],
      '720p': [],
      '1080p': []
    };
    links.forEach(link => {
      if (grouped[link.resolution]) {
        grouped[link.resolution].push(link);
      }
    });
    return grouped;
  };

  const rawGrouped = groupByResolution(rawLinks);
  const hcGrouped = groupByResolution(hardcodedLinks);

  return (
    <>
      <Helmet>
        <title>Download Video - {fullTitle} | LAKSUB</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-netflix-bg text-white flex flex-col">
        <main className="flex-grow pt-24 pb-12 px-4 md:px-12 max-w-5xl mx-auto w-full">
          <Link href={subtitle.slug ? `/subtitles/${subtitle.slug}` : `/subtitle/${subtitle.id}`}>
            <a className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Subtitle Details
            </a>
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-netflix-surface border border-white/10 rounded-2xl p-6 md:p-10 shadow-xl"
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Download Video</h1>
              <p className="text-xl text-gray-300 font-medium">
                {fullTitle} ({subtitle.releaseYear})
              </p>
            </div>
            
            {hasVideoLinks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                
                {/* Raw Video Links */}
                {rawLinks.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                      <Video className="w-6 h-6 text-blue-400" />
                      <h2 className="text-2xl font-bold">Video (Raw)</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {['480p', '720p', '1080p'].map(res => (
                        rawGrouped[res].length > 0 && (
                          <div key={res} className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-400">{res}</h3>
                            {rawGrouped[res].map(link => (
                              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#333333] rounded-xl border border-white/5 transition-all group">
                                <div className="flex flex-col">
                                  <span className="font-bold text-lg">{link.sourceName}</span>
                                  {(link.videoType || link.videoSize || link.additionalDetails) && (
                                    <span className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                      {link.videoType && <span>{link.videoType}</span>}
                                      {link.videoType && (link.videoSize || link.additionalDetails) && <span>•</span>}
                                      {link.videoSize && <span>{link.videoSize}</span>}
                                      {link.videoSize && link.additionalDetails && <span>•</span>}
                                      {link.additionalDetails && <span>{link.additionalDetails}</span>}
                                    </span>
                                  )}
                                </div>
                                <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                              </a>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Hardcoded Video Links */}
                {hardcodedLinks.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                      <MonitorPlay className="w-6 h-6 text-green-400" />
                      <h2 className="text-2xl font-bold">Subtitle Hardcoded Video</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {['480p', '720p', '1080p'].map(res => (
                        hcGrouped[res].length > 0 && (
                          <div key={res} className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-400">{res}</h3>
                            {hcGrouped[res].map(link => (
                              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-[#2a2a2a] hover:bg-[#333333] rounded-xl border border-white/5 transition-all group">
                                <div className="flex flex-col">
                                  <span className="font-bold text-lg">{link.sourceName}</span>
                                  {(link.videoType || link.videoSize || link.additionalDetails) && (
                                    <span className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                      {link.videoType && <span>{link.videoType}</span>}
                                      {link.videoType && (link.videoSize || link.additionalDetails) && <span>•</span>}
                                      {link.videoSize && <span>{link.videoSize}</span>}
                                      {link.videoSize && link.additionalDetails && <span>•</span>}
                                      {link.additionalDetails && <span>{link.additionalDetails}</span>}
                                    </span>
                                  )}
                                </div>
                                <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                              </a>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400">No video download links available for this title yet.</h3>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};
