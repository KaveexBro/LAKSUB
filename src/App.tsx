/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdBlockDetector } from './components/AdBlockDetector';
import { GlobalAds } from './components/GlobalAds';
import { AdZone } from './components/AdZone';
import { db } from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const SubtitleDetails = lazy(() => import('./pages/SubtitleDetails').then(m => ({ default: m.SubtitleDetails })));
const SeriesDetails = lazy(() => import('./pages/SeriesDetails').then(m => ({ default: m.SeriesDetails })));
const VideoDownloads = lazy(() => import('./pages/VideoDownloads').then(m => ({ default: m.VideoDownloads })));
const Explore = lazy(() => import('./pages/Explore').then(m => ({ default: m.Explore })));
const TopSubtitlers = lazy(() => import('./pages/TopSubtitlers').then(m => ({ default: m.TopSubtitlers })));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ApplyCreator = lazy(() => import('./pages/ApplyCreator').then(m => ({ default: m.ApplyCreator })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const PublicProfile = lazy(() => import('./pages/PublicProfile').then(m => ({ default: m.PublicProfile })));
const UpgradePro = lazy(() => import('./pages/UpgradePro').then(m => ({ default: m.UpgradePro })));
const RequestSubtitle = lazy(() => import('./pages/RequestSubtitle').then(m => ({ default: m.RequestSubtitle })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const DMCA = lazy(() => import('./pages/DMCA').then(m => ({ default: m.DMCA })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Fallback for async content rendering
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

function AppContent() {
  const [location] = useLocation();
  const isStandalonePage = ['/privacy', '/terms', '/dmca', '/contact', '/about', '/faq'].includes(location);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('the client is offline')) {
            console.warn("Please check your Firebase configuration. The client is offline.");
          } else if (error.message.includes('unavailable')) {
            console.warn("Firebase is currently unavailable. This is normal immediately after provisioning a new database. It should resolve itself within a few minutes. Please refresh the page.");
          }
        }
      }
    }
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-netflix-bg text-white font-sans selection:bg-netflix-red selection:text-white">
      {!isStandalonePage && <Navbar />}
      {!isStandalonePage && (
        <div className="max-w-7xl mx-auto px-4 md:px-12 w-full relative z-40">
          <AdZone zoneName="global-header" className="pt-24 pb-4" />
        </div>
      )}
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div></div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/subtitle/:id" component={SubtitleDetails} />
          <Route path="/subtitle/:id/video" component={VideoDownloads} />
          <Route path="/subtitles/:slug" component={SubtitleDetails} />
          <Route path="/subtitles/:slug/video" component={VideoDownloads} />
          <Route path="/movies/:slug" component={SubtitleDetails} />
          <Route path="/tv-series/:slug" component={SubtitleDetails} />
          <Route path="/series/:slug" component={SeriesDetails} />
          <Route path="/explore">
            <Explore />
          </Route>
          <Route path="/movies">
            <Explore initialType="movie" />
          </Route>
          <Route path="/series">
            <Explore initialType="series" />
          </Route>
          <Route path="/top-subtitlers" component={TopSubtitlers} />
          <Route path="/dashboard" component={CreatorDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/apply" component={ApplyCreator} />
          <Route path="/profile" component={Profile} />
          <Route path="/user/:uid" component={PublicProfile} />
          <Route path="/upgrade" component={UpgradePro} />
          <Route path="/request" component={RequestSubtitle} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/dmca" component={DMCA} />
          <Route path="/contact" component={Contact} />
          <Route path="/about" component={About} />
          <Route path="/faq" component={FAQ} />
          <Route path="*" component={NotFound} />
        </Switch>
      </Suspense>
      {!isStandalonePage && (
        <>
          <div className="max-w-7xl mx-auto px-4 md:px-12 w-full">
            <AdZone zoneName="global-footer" />
          </div>
          <Footer />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <SiteSettingsProvider>
          <AuthProvider>
          <AdBlockDetector>
            <GlobalAds />
            <ScrollToTop />
            <AppContent />
          </AdBlockDetector>
        </AuthProvider>
        </SiteSettingsProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

