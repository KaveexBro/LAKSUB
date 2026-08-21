import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'wouter';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-12 pb-12 px-4 md:px-12">
      <Helmet>
        <title>Terms of Use - LAKSUB</title>
        <meta name="description" content="Terms of Use for LAKSUB (Sinhala Subtitles) platform." />
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
            <FileText className="w-6 h-6 text-netflix-red" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Terms of Use</h1>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LAKSUB, you agree to comply with and be bound by these Terms of Use. If you do not agree, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. User Conduct</h2>
            <p>
              When using LAKSUB, you agree not to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Use the website for any illegal purpose.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Upload or distribute any malicious software.</li>
              <li>Interfere with the operation of the website.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Intellectual Property</h2>
            <p>
              The content on LAKSUB, including text, graphics, and logos, is the property of LAKSUB or its content suppliers and is protected by copyright laws. Subtitles are created by independent translators and are for personal use only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Disclaimer of Warranties</h2>
            <p>
              LAKSUB is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the accuracy or reliability of the content or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
            <p>
              In no event shall LAKSUB be liable for any damages arising out of the use or inability to use the website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Governing Law</h2>
            <p>
              These Terms of Use shall be governed by and construed in accordance with the laws of Sri Lanka.
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
