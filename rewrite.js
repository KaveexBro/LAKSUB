const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'wouter';
import { UserData } from '../types';
import { Trophy, Info, Star, Medal } from 'lucide-react';
import { CreatorBadge } from '../components/CreatorBadge';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';

export const TopSubtitlers: React.FC = () => {
  const [topCreators, setTopCreators] = useState<(UserData & { avgRating?: number })[]>([]);
  const [loading, setLoading] = useState(true);

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
            return uploadsB - uploadsA; // fallback (already sorted by this, but just in case)
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
      case 0: return "border-[#FFD700] bg-[#FFD700]/5 text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.15)]"; // Gold
      case 1: return "border-[#C0C0C0] bg-[#C0C0C0]/5 text-[#C0C0C0] shadow-[0_0_30px_rgba(192,192,192,0.1)]"; // Silver
      case 2: return "border-[#CD7F32] bg-[#CD7F32]/5 text-[#CD7F32] shadow-[0_0_30px_rgba(205,127,50,0.1)]"; // Bronze
      default: return "border-white/5 bg-[#121212] text-white hover:bg-[#1a1a1a]";
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
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Leaderboard</h1>
          
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-2xl w-full text-left flex items-start gap-4">
            <div className="bg-white/10 p-2 rounded-full shrink-0 mt-1">
              <Info className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2 tracking-wide">How to become a Top Subtitler?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                Ranks are determined by the <strong>total number of published subtitles</strong>. The more quality translations you upload, the higher you climb.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                <strong>Tie-breaker:</strong> If multiple creators have the exact same number of uploads, they are ranked based on their <strong>average user rating</strong>. Quality matters just as much as quantity!
              </p>
            </div>
          </div>
        </div>

        {topCreators.length > 0 ? (
          <div className="flex flex-col gap-4 relative z-10">
            {topCreators.map((creator, index) => {
              const isTop3 = index < 3;
              return (
                <Link key={creator.uid} href={`/user/${creator.uid}`}>
                  <div className={`rounded-2xl p-5 md:p-6 flex items-center gap-6 transition-all duration-300 cursor-pointer group border ${getRankStyle(index)} ${isTop3 ? 'md:scale-[1.02]' : 'hover:border-white/20'}`}>
                    
                    {/* Rank Badge */}
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-black/40 rounded-full border border-white/5">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <div className={`shrink-0 rounded-full overflow-hidden bg-[#141414] border ${isTop3 ? 'border-current border-2 w-16 h-16 md:w-20 md:h-20' : 'border-white/10 w-14 h-14'}`}>
                      {creator.photoURL ? (
                        <img src={creator.photoURL} alt={creator.displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                          {(creator.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate mb-1.5 transition-colors ${isTop3 ? 'text-xl md:text-2xl text-white' : 'text-lg text-gray-200 group-hover:text-white'}`}>
                        {creator.displayName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                         <CreatorBadge uploadCount={creator.totalUploads || 0} />
                         {creator.avgRating !== undefined && creator.avgRating > 0 && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                              <Star className="w-3 h-3 fill-current" />
                              {creator.avgRating.toFixed(1)} Avg
                            </div>
                         )}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="shrink-0 text-right hidden xs:block">
                      <div className={`text-2xl md:text-3xl font-black ${isTop3 ? 'text-current' : 'text-gray-300'}`}>
                        {creator.totalUploads}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-1">
                        Uploads
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-[#121212] rounded-3xl border border-white/5">
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
    </main>
  );
};
`

fs.writeFileSync('src/pages/TopSubtitlers.tsx', content);
