import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, ArrowLeft, Mail, Database, Lock, UserCheck, Cookie, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'wouter';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-12 pb-16 px-4 md:px-12">
      <Helmet>
        <title>Privacy Policy - LAKSUB</title>
        <meta name="description" content="Privacy Policy for LAKSUB (Sinhala Subtitles) platform detailing data handling, Google OAuth, Firebase, and AdSense." />
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-netflix-surface p-8 md:p-12 rounded-2xl border border-white/10 shadow-2xl"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-xs">Back to Home</span>
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-netflix-red/10 border border-netflix-red/20 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-netflix-red" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Effective & Verified: October 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm md:text-base">
          {/* Section 1 */}
          <section className="bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Globe className="w-5 h-5 text-netflix-red" />
              <h2>1. Data Controller & Contact Information</h2>
            </div>
            <p>
              LAKSUB (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the LAKSUB platform (<strong>laksub.com</strong>), providing Sinhala subtitle downloads, community reviews, creator portfolios, and multimedia metadata.
            </p>
            <p className="mt-3">
              For any privacy inquiries, GDPR/CCPA data requests, or concerns regarding your personal information, please contact our designated Data Protection team:
            </p>
            <div className="mt-4 flex items-center gap-3 bg-black/40 p-4 rounded-lg border border-white/10">
              <Mail className="w-5 h-5 text-netflix-red flex-shrink-0" />
              <div>
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider">Privacy & Legal Inquiries</span>
                <a href="mailto:laksub.contact@gmail.com" className="text-white hover:text-netflix-red font-semibold transition-colors">
                  laksub.contact@gmail.com
                </a>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <UserCheck className="w-5 h-5 text-netflix-red" />
              <h2>2. Information We Collect</h2>
            </div>
            <p>
              We collect information that you directly provide when using our platform, as well as automatic technical telemetry necessary to deliver secure download services:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-300">
              <li>
                <strong className="text-white">Account Information (via Google OAuth):</strong> When you sign in with Google, we collect your verified email address, full display name, and avatar profile picture URL. We never receive or store your Google account password.
              </li>
              <li>
                <strong className="text-white">Activity & Gamification Data:</strong> Subtitle download logs, daily bonus streak timestamps, community point balance, referral codes, watchlist items, and content rating history.
              </li>
              <li>
                <strong className="text-white">Creator & Request Submissions:</strong> Subtitle upload files, descriptions, user requests, translation comments, and creator application messages.
              </li>
              <li>
                <strong className="text-white">Technical Device Data:</strong> Anonymized IP addresses, browser user agent, device screen dimensions, and standard HTTP referrers collected for rate limiting and fraud prevention.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Database className="w-5 h-5 text-netflix-red" />
              <h2>3. Technology Stack & Third-Party Service Providers</h2>
            </div>
            <p>
              To maintain high uptime, instant subtitle search, and secure downloads, LAKSUB relies strictly on industry-standard third-party sub-processors. We explicitly disclose our live technical stack:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <h3 className="font-bold text-white text-sm">Google Cloud & Firebase</h3>
                <p className="text-xs text-gray-400 mt-1">
                  <strong>Firestore & Firebase Storage:</strong> Stores registered user accounts, subtitle metadata, ratings, comments, points, and static files.
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <h3 className="font-bold text-white text-sm">Google Identity (OAuth 2.0)</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Provides one-click sign-in without passwords, ensuring user credentials are encrypted and managed directly by Google.
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <h3 className="font-bold text-white text-sm">Google AdSense</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Serves contextual and programmatic display advertising to finance server bandwidth and keep free subtitle downloads available.
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <h3 className="font-bold text-white text-sm">TMDB API & YouTube</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Fetches official movie synopsis, posters, backdrops, and trailer video players. No personal data is sent to TMDB.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Cookie className="w-5 h-5 text-netflix-red" />
              <h2>4. Cookies, Analytics & Advertising</h2>
            </div>
            <p>
              We use cookies and browser storage (localStorage / sessionStorage) to deliver seamless features:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-300">
              <li>
                <strong className="text-white">Essential Session Cookies:</strong> Maintain your Google OAuth authentication session and store transient UI states (e.g. dismissed banners).
              </li>
              <li>
                <strong className="text-white">Google AdSense Third-Party Cookies:</strong> Google and its advertising partners use cookies to serve ads based on your prior visits to LAKSUB or other websites. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-netflix-red underline">Google Ads Settings</a> or through <a href="https://aboutads.info" target="_blank" rel="noopener noreferrer" className="text-netflix-red underline">aboutads.info</a>.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Lock className="w-5 h-5 text-netflix-red" />
              <h2>5. Data Retention, Account Deletion & User Rights</h2>
            </div>
            <p>
              We believe in data minimization and complete user control over personal data:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-300">
              <li>
                <strong className="text-white">Right to Access & Portability:</strong> You can view all your uploaded subtitles, ratings, comments, and point logs directly in your User Profile.
              </li>
              <li>
                <strong className="text-white">Right to Erasure (Account Deletion):</strong> You may request complete erasure of your account, download history, and associated personal records at any time. Simply email <a href="mailto:laksub.contact@gmail.com" className="text-netflix-red underline">laksub.contact@gmail.com</a> from your registered Google account with the subject line <em>&ldquo;Account Deletion Request&rdquo;</em>. We process verified deletion requests within 7 business days.
              </li>
              <li>
                <strong className="text-white">Data Security:</strong> All data in transit is encrypted using modern TLS (HTTPS). Access to production Firestore databases is protected by strict role-based security rules.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Policy Updates</h2>
            <p>
              We may periodically update this Privacy Policy to reflect platform enhancements or legal adjustments. Any modifications will be posted here with an updated revision date.
            </p>
          </section>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
            <span>Last Updated: October 2026</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link href="/dmca" className="hover:text-white transition-colors">DMCA Notice</Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
