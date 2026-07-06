/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { SubtitleDetails } from './pages/SubtitleDetails';
import { SeriesDetails } from './pages/SeriesDetails';
import { VideoDownloads } from './pages/VideoDownloads';
import { Explore } from './pages/Explore';
import { TopSubtitlers } from './pages/TopSubtitlers';
import { CreatorDashboard } from './pages/CreatorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ApplyCreator } from './pages/ApplyCreator';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';
import { UpgradePro } from './pages/UpgradePro';
import { RequestSubtitle } from './pages/RequestSubtitle';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { DMCA } from './pages/DMCA';
import { FAQ } from './pages/FAQ';
import { NotFound } from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdBlockDetector } from './components/AdBlockDetector';
import { GlobalAds } from './components/GlobalAds';
import { AdZone } from './components/AdZone';
import { db } from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

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

export default function App() {
  const [location] = useLocation();
  const isStandalonePage = ['/privacy', '/terms', '/dmca', '/contact', '/about'].includes(location);

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
        // Skip logging for other errors like permission-denied, as this is simply a connection test.
      }
    }
    testConnection();
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AdBlockDetector>
            <GlobalAds />
            <ScrollToTop />
            <div className="min-h-screen bg-netflix-bg text-white font-sans selection:bg-netflix-red selection:text-white">
              {!isStandalonePage && <Navbar />}
              {!isStandalonePage && (
                <div className="max-w-7xl mx-auto px-4 md:px-12 w-full pt-24 pb-4">
                  <AdZone zoneName="global-header" />
                </div>
              )}
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
              {!isStandalonePage && (
                <>
                  <div className="max-w-7xl mx-auto px-4 md:px-12 w-full">
                    <AdZone zoneName="global-footer" />
                  </div>
                  <Footer />
                </>
              )}
            </div>
          </AdBlockDetector>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

