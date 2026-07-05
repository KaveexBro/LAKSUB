import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'wouter';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-12 pb-12 px-4 md:px-12">
      <Helmet>
        <title>Privacy Policy - LAKSUB</title>
        <meta name="description" content="Privacy Policy for LAKSUB (Sinhala Subtitles) platform." />
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
            <ShieldCheck className="w-6 h-6 text-netflix-red" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Privacy Policy</h1>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to LAKSUB. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Data We Collect</h2>
            <p>
              When you use LAKSUB, we may collect the following information:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Account Information: Name, email address, and profile picture (via Google OAuth).</li>
              <li>Usage Data: Information about how you interact with our website, including subtitles downloaded and pages visited.</li>
              <li>Technical Data: IP address, browser type, and device information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <p>
              We use the collected data to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Provide and maintain our services.</li>
              <li>Personalize your experience on the platform.</li>
              <li>Communicate with you regarding updates or support.</li>
              <li>Analyze usage patterns to improve our website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Third-Party Services</h2>
            <p>
              We use third-party services like Google OAuth for authentication and Supabase for database management. These services have their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-800 text-sm text-gray-500">
            Last updated: March 19, 2026
          </div>
        </div>
      </motion.div>
    </div>
  );
};
