import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'wouter';
import { UserData } from '../types';
import { Trophy, Star, Medal, Info, X, CheckCircle2, TrendingUp, Award, Wallet } from 'lucide-react';
import { CreatorBadge } from '../components/CreatorBadge';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';
import { motion, AnimatePresence } from 'motion/react';

export const TopSubtitlers: React.FC = () => {
  const [topCreators, setTopCreators] = useState<(UserData & { avgRating?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const fetchTopCreators = async () => {
      try {
        const creatorsQuery = query(
          collection(db, 'users'),
          where('totalUploads', '>', 0),
          orderBy('totalUploads', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(creatorsQuery);
        let creators = snapshot.docs.map(doc => doc.data() as (UserData & { avgRating?: number }));

        // Find tied groups
        const uploadCounts = creators.map(c => c.totalUploads || 0);
        const duplicateCounts = uploadCounts.filter((item, index) => uploadCounts.indexOf(item) !== index);
        const tiedUploads = [...new Set(duplicateCounts)];

        if (tiedUploads.length > 0) {
          // Fetch ratings only for tied users
          const tiedUsers = creators.filter(c => tiedUploads.includes(c.totalUploads || 0));
          
          const avgRatings: Record<string, number> = {};

          await Promise.all(tiedUsers.map(async (user) => {
            const subsQuery = query(
              collection(db, 'subtitles'),
              where('authorUid', '==', user.uid),
              where('status', '==', 'approved')
            );
            const subsSnapshot = await getDocs(subsQuery);
            let totalRating = 0;
            let count = 0;
            subsSnapshot.forEach(doc => {
              const sub = doc.data();
              if (sub.averageRating > 0) {
                totalRating += sub.averageRating;
                count++;
              }
            });
            avgRatings[user.uid] = count > 0 ? totalRating / count : 0;
          }));

          // Attach avgRating to creators for display
          creators = creators.map(c => ({
            ...c,
            avgRating: avgRatings[c.uid] || 0
          }));

          // Sort tied users based on avgRating
          creators.sort((a, b) => {
            const uploadsA = a.totalUploads || 0;
            const uploadsB = b.totalUploads || 0;
            if (uploadsA === uploadsB && tiedUploads.includes(uploadsA)) {
              const ratingA = a.avgRating || 0;
              const ratingB = b.avgRating || 0;
              return ratingB - ratingA;
            }
            return uploadsB - uploadsA;
          });
        }

        setTopCreators(creators);
      } catch (err) {
        console.error("Error fetching top creators:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCreators();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return "border-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10 shadow-[0_0_30px_rgba(255,215,0,0.15)]"; // Gold
      case 1: return "border-[#C0C0C0] bg-[#C0C0C0]/5 hover:bg-[#C0C0C0]/10 shadow-[0_0_30px_rgba(192,192,192,0.1)]"; // Silver
      case 2: return "border-[#CD7F32] bg-[#CD7F32]/5 hover:bg-[#CD7F32]/10 shadow-[0_0_30px_rgba(205,127,50,0.1)]"; // Bronze
      default: return "border-white/10 bg-[#141414] hover:bg-white/[0.02]";
    }
  };

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-5 h-5 text-[#FFD700]" />;
      case 1: return <Medal className="w-5 h-5 text-[#C0C0C0]" />;
      case 2: return <Medal className="w-5 h-5 text-[#CD7F32]" />;
      default: return <span className="font-bold text-gray-500 text-lg">#{index + 1}</span>;
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-12 font-sans selection:bg-white/20">
      <Helmet>
        <title>Top Subtitlers | Rank Leaderboard | LAKSUB</title>
        <meta name="description" content="Discover the top-ranked Sinhala subtitlers and translators on LAKSUB based on their badge levels and upload counts." />
      </Helmet>

      <section className="pt-28 pb-16 px-4 md:px-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <AdZone zoneName="top-subtitlers-top" />
        </div>

        {/* Header & Description */}
        <div className="flex flex-col items-center text-center mb-16 relative">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white">Leaderboard</h1>
          <p className="text-gray-400 max-w-lg mx-auto text-lg mb-6">Discover the top-ranked Sinhala subtitlers and translators on LAKSUB based on their contributions.</p>
          
          <button 
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full transition-all border border-white/5 shadow-sm group"
          >
            <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
            How to become a Top Subtitler?
          </button>
        </div>

        {topCreators.length > 0 ? (
          <div className="flex flex-col gap-4 relative z-10">
            {topCreators.map((creator, index) => {
              const isTop3 = index < 3;
              return (
                <Link key={creator.uid} href={`/user/${creator.uid}`}>
                  <div className={`rounded-2xl p-5 md:p-6 flex items-center gap-4 sm:gap-6 transition-all duration-300 cursor-pointer group border ${getRankStyle(index)} ${isTop3 ? 'md:scale-[1.02]' : ''}`}>
                    
                    {/* Rank Badge */}
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-black/40 rounded-full border border-white/5 shadow-inner">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <div className={`shrink-0 rounded-full overflow-hidden bg-[#0a0a0a] border ${isTop3 ? 'border-current border-2 w-16 h-16 sm:w-20 sm:h-20' : 'border-white/10 w-12 h-12 sm:w-16 sm:h-16'}`}>
                      {creator.photoURL ? (
                        <img src={creator.photoURL} alt={creator.displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                          {(creator.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className={`font-bold truncate mb-2 transition-colors ${isTop3 ? 'text-xl sm:text-2xl text-white' : 'text-lg text-gray-200 group-hover:text-white'}`}>
                        {creator.displayName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                         <CreatorBadge uploadCount={creator.totalUploads || 0} />
                         {creator.avgRating !== undefined && creator.avgRating > 0 && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                              <Star className="w-3 h-3 fill-current" />
                              {creator.avgRating.toFixed(1)} Avg
                            </div>
                         )}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="shrink-0 text-right pr-2">
                      <div className={`text-2xl sm:text-3xl font-black ${isTop3 ? 'text-current' : 'text-gray-300 group-hover:text-white transition-colors'}`}>
                        {creator.totalUploads}
                      </div>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-1">
                        Uploads
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-[#141414] rounded-3xl border border-white/5">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-gray-600" />
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No Subtitlers Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              There are no published subtitles available yet. Check back later to see the top translators!
            </p>
          </div>
        )}
        
        <div className="mt-12">
          <AdZone zoneName="top-subtitlers-bottom" />
        </div>
      </section>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-netflix-red/10 p-2.5 rounded-full">
                    <Trophy className="w-6 h-6 text-netflix-red" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Top Subtitler Program</h2>
                    <p className="text-gray-400 text-sm font-medium mt-1">Ranking Criteria & Benefits</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-8">
                  
                  {/* Criteria Section */}
                  <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gray-400" /> 
                      How the Ranking Works
                    </h3>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold mb-1">Total Published Subtitles</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Ranks are primarily determined by the volume of approved subtitles you have uploaded. Consistent contributions directly increase your rank on the leaderboard.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="shrink-0 mt-0.5">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold mb-1">The Tie-Breaker: User Ratings</h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            If multiple creators tie with the exact same number of uploads, they are dynamically ranked based on their <strong>average user rating</strong>. Quality is just as important as quantity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Benefits Section */}
                  <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-gray-400" /> 
                      Creator Benefits
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Star className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold mb-1">Exclusive Badges</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Unlock prestige Creator Badges on your profile and beside your name across the platform based on your upload milestones.
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold mb-1">Earning Potential</h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Top creators accumulate a wallet balance through their contributions. Premium exposure means more downloads and better returns.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 sm:p-8 border-t border-white/5 bg-[#1a1a1a] shrink-0 text-center">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-colors"
                >
                  Got it, thanks!
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

