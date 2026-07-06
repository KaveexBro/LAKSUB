import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Subtitle, UserData } from '../types';
import { motion } from 'motion/react';
import { 
  User, 
  Upload, 
  Star, 
  Clock,
  ShieldCheck,
  Crown,
  ArrowLeft,
  Calendar,
  Film
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { CreatorBadge } from '../components/CreatorBadge';
import { getTMDBImageUrl } from '../services/tmdbService';
import { AdZone } from '../components/AdZone';

export const PublicProfile: React.FC = () => {
  const [, params] = useRoute<{ uid: string }>('/user/:uid');
  const uid = params?.uid;
  
  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [uploads, setUploads] = useState<Subtitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatorAvgRating, setCreatorAvgRating] = useState<number>(0);

  useEffect(() => {
    if (!uid) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch User Info
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = { uid: userDoc.id, ...userDoc.data() } as UserData;
          setTargetUser(userData);
          
          // Fetch User's Uploads
          const uploadsQuery = query(
            collection(db, 'subtitles'),
            where('authorUid', '==', uid),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
          );
          const uploadsSnap = await getDocs(uploadsQuery);
          const uploadsData = uploadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle));
          setUploads(uploadsData);

          // Calculate Creator Average Rating
          if (uploadsData.length > 0) {
            const ratedSubs = uploadsData.filter(s => s.ratingCount > 0);
            if (ratedSubs.length > 0) {
              const totalRating = ratedSubs.reduce((sum, s) => sum + s.averageRating, 0);
              setCreatorAvgRating(totalRating / ratedSubs.length);
            }
          }
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error("Error fetching public profile data:", err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="min-h-screen bg-netflix-bg text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">{error || 'User not found'}</h2>
        <Link href="/">
          <button className="bg-netflix-red text-white px-6 py-2 rounded font-bold">Go Home</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-12 px-4 md:px-12">
      <Helmet>
        <title>{targetUser.displayName} - Creator Profile - LAKSUB</title>
        <meta name="description" content={`View ${targetUser.displayName}'s profile and Sinhala subtitles on LAKSUB.`} />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Back</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-netflix-red/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-netflix-red shadow-[0_0_30px_rgba(229,9,20,0.3)]">
              <img 
                src={targetUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.displayName)}&background=random`} 
                alt={targetUser.displayName}
                className="w-full h-full object-cover"
              />
            </div>
            {targetUser.role !== 'user' && (
              <div className="absolute -bottom-2 -right-2 bg-netflix-red p-2 rounded-full border-2 border-netflix-bg shadow-xl">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{targetUser.displayName}</h1>              <div className="flex flex-wrap gap-2">
                {targetUser.role === 'admin' && (
                  <span className="bg-netflix-red text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
                {targetUser.role === 'creator' && (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Creator
                  </span>
                )}
                {targetUser.proExpiry && new Date(targetUser.proExpiry) > new Date() && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Pro Member
                  </span>
                )}
                {uploads.length > 0 && <CreatorBadge uploadCount={uploads.length} />}
              </div>
            </div>
            
            {targetUser.bio && (
              <p className="text-gray-300 font-medium mb-6 italic max-w-xl leading-loose">"{targetUser.bio}"</p>
            )}            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Uploads</p>
                <p className="text-xl font-black font-mono">{uploads.length}</p>
              </div>
              {creatorAvgRating > 0 && (
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Avg. Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black font-mono text-yellow-500">{creatorAvgRating.toFixed(1)}</p>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uploads Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Upload className="w-6 h-6 text-netflix-red" /> Subtitles by {targetUser.displayName}
            </h2>
            <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {uploads.length} Results
            </div>
          </div>
          
          {uploads.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {uploads.map((sub) => (
                <Link key={sub.id} href={sub.slug ? `/subtitles/${sub.slug}` : `/subtitles/${sub.id}`}>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="aspect-[2/3] relative group cursor-pointer rounded-xl overflow-hidden shadow-lg border border-white/10"
                  >
                    <img 
                      src={sub.posterPath ? getTMDBImageUrl(sub.posterPath) : `https://picsum.photos/seed/${(sub.movieTitle || '').replace(/\s+/g, '')}/400/600`} 
                      alt={sub.movieTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="font-bold text-sm line-clamp-2 mb-2 leading-tight">{sub.movieTitle}</h3>                      <div className="flex items-center flex-wrap gap-2 text-[9px] text-gray-300 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{sub.averageRating > 0 ? sub.averageRating.toFixed(1) : 'New'}</span>
                        </div>
                        <span className="bg-white/20 px-1.5 py-0.5 rounded-sm">{sub.type}</span>
                        <span>{sub.releaseYear}</span>
                      </div>
                    </div>
                    {sub.proOnlyUntil && new Date(sub.proOnlyUntil) > new Date() && (
                      <div className="absolute top-2 right-2 bg-netflix-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-lg z-20">
                        PRO
                      </div>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-12 text-center border border-dashed border-white/10">
              <Film className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No subtitles uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8 pb-12">
        <AdZone zoneName="public-profile-bottom" />
      </div>
    </div>
  );
};
