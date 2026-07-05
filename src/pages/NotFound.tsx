import React from 'react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <Helmet>
        <title>Page Not Found - LAKSUB</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent z-10" />
      <img 
        src="https://picsum.photos/seed/lost/1920/1080" 
        alt="Lost in space"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        referrerPolicy="no-referrer"
      />
      
      <div className="relative z-20 max-w-2xl">
        <h1 className="text-7xl md:text-9xl font-bold mb-4 text-netflix-red drop-shadow-2xl">404</h1>
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Lost your way?</h2>
        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg mx-auto">
          Sorry, we can't find that page. You'll find lots to explore on the home page.
        </p>
        <Link href="/">
          <button className="bg-white text-black px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-200 transition-colors">
            Netflix Home
          </button>
        </Link>
        
        <div className="mt-16 text-gray-500 text-sm flex items-center justify-center gap-2">
          <span className="w-12 h-[1px] bg-gray-600"></span>
          Error Code: NSES-404
          <span className="w-12 h-[1px] bg-gray-600"></span>
        </div>
      </div>
    </div>
  );
};
