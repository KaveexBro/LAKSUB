import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'wouter';
import { UserData } from '../types';
import { Trophy } from 'lucide-react';
import { CreatorBadge } from '../components/CreatorBadge';
import { Helmet } from 'react-helmet-async';
import { AdZone } from '../components/AdZone';

export const TopSubtitlers: React.FC = () => {
  const [topCreators, setTopCreators] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch top creators
    const creatorsQuery = query(
      collection(db, 'users'),
      where('totalUploads', '>', 0),
      orderBy('totalUploads', 'desc'),
      limit(50) // Top 50 subtitlers on the dedicated page
    );
    
    getDocs(creatorsQuery).then(snapshot => {
      const creators = snapshot.docs.map(doc => doc.data() as UserData);
      setTopCreators(creators);
    }).catch(err => {
      console.error("Error fetching top creators:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-netflix-bg text-white pb-12">
      <Helmet>
        <title>Top Subtitlers | Rank Leaderboard | LAKSUB</title>
        <meta name="description" content="Discover the top-ranked Sinhala subtitlers and translators on LAKSUB based on their badge levels and upload counts." />
      </Helmet>

      <section className="pt-24 pb-12 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="mb-6">
          <AdZone zoneName="top-subtitlers-top" />
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Top Subtitlers</h1>
        </div>

        {topCreators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-10">
            {topCreators.map((creator, index) => (
              <Link key={creator.uid} href={`/user/${creator.uid}`}>
                <div className="bg-netflix-surface/80 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer group transform-gpu backface-hidden">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-gray-700 group-hover:border-netflix-red transition-colors shadow-lg transform-gpu">
                      {creator.photoURL ? (
                        <img src={creator.photoURL} alt={creator.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-400">
                          {(creator.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl text-white text-xs font-bold tracking-wide px-4 py-1.5 rounded-full border-2 border-gray-700 transform-gpu">
                      #{index + 1}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white truncate w-full mb-2 group-hover:text-netflix-red transition-colors">{creator.displayName}</h3>
                  
                  <div className="mb-4 flex justify-center w-full">
                     <CreatorBadge uploadCount={creator.totalUploads || 0} />
                  </div>
                  
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5 transform-gpu">{creator.totalUploads} Uploads</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-netflix-surface/30 rounded-3xl border border-white/5">
            <Trophy className="w-20 h-20 mx-auto mb-6 text-gray-700" />
            <h3 className="text-2xl font-bold text-white mb-2">No Subtitlers Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              There are no published subtitles available yet. Check back later to see the top translators!
            </p>
          </div>
        )}
        
        <div className="mt-8">
          <AdZone zoneName="top-subtitlers-bottom" />
        </div>
      </section>
    </main>
  );
};
