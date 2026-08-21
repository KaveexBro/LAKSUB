import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Info, ArrowLeft, Film, Globe, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'wouter';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-12 pb-12 px-4 md:px-12">
      <Helmet>
        <title>About Us - LAKSUB</title>
        <meta name="description" content="Learn more about LAKSUB, the premier Sinhala subtitle platform." />
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-netflix-surface p-8 md:p-12 rounded-2xl border border-gray-800 shadow-2xl"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-sm">Back to Home</span>
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-netflix-red/10 rounded-full flex items-center justify-center">
            <Info className="w-6 h-6 text-netflix-red" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">About LAKSUB</h1>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
            <p>
              At LAKSUB, our mission is to break down language barriers and bring global entertainment to the Sri Lankan audience. We strive to provide high-quality, accurate, and timely Sinhala subtitles for movies and TV series from around the world.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-6">Why Choose Us?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
                <Film className="w-8 h-8 text-netflix-red mb-4" />
                <h3 className="font-bold text-white mb-2">Vast Collection</h3>
                <p className="text-sm">Access thousands of subtitles for the latest blockbusters, classic movies, and trending TV series.</p>
              </div>
              <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
                <Globe className="w-8 h-8 text-netflix-red mb-4" />
                <h3 className="font-bold text-white mb-2">Global Content</h3>
                <p className="text-sm">Enjoy content from Hollywood, Bollywood, Kollywood, and beyond, all localized in Sinhala.</p>
              </div>
              <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
                <Users className="w-8 h-8 text-netflix-red mb-4" />
                <h3 className="font-bold text-white mb-2">Community Driven</h3>
                <p className="text-sm">Our platform is powered by a dedicated community of passionate translators and movie enthusiasts.</p>
              </div>
              <div className="bg-black/50 p-6 rounded-xl border border-gray-800">
                <Zap className="w-8 h-8 text-netflix-red mb-4" />
                <h3 className="font-bold text-white mb-2">Fast Updates</h3>
                <p className="text-sm">Get subtitles for new releases quickly, ensuring you never miss out on the latest entertainment.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Join Our Community</h2>
            <p>
              Whether you're a movie buff looking for the perfect subtitle or a talented translator wanting to contribute, LAKSUB is the place for you. Join our growing community and help us make global cinema accessible to everyone in Sri Lanka.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};
