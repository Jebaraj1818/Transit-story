import React, { useEffect, useLayoutEffect } from 'react';
import { Routes, Route, useLocation, useNavigationType, Navigate, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingActions from './components/FloatingActions';

// Pages
import Home from './pages/Home';
import Tours from './pages/Tours';
import Services from './pages/Services';
import Journeys from './pages/Journeys';
import Experiences from './pages/Experiences';
import Stories from './pages/Stories';
import StoryDetails from './pages/StoryDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import PlanJourney from './pages/PlanJourney';
import CulturalHeritageDetails from './pages/CulturalHeritageDetails';
import DestinationDetails from './pages/DestinationDetails';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

const scrollPositions = new Map();

/**
 * ScrollRestorationHandler:
 * - Instantly resets scroll to top (0, 0) upon forward navigation (PUSH/REPLACE).
 * - Immediately restores previous browsing position upon Back/Forward navigation (POP).
 * - Eliminates unwanted smooth scrolling or vertical sliding during page transitions.
 */
function ScrollRestorationHandler() {
  const location = useLocation();
  const navType = useNavigationType();

  // Disable browser's automatic scroll restoration to avoid race conditions with React rendering
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Continuously record scroll position while the user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      scrollPositions.set(location.key, y);
      scrollPositions.set(location.pathname + location.search, y);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key, location.pathname, location.search]);

  // Synchronously save scroll before leaving, and restore or reset scroll before paint
  useLayoutEffect(() => {
    if (navType === 'POP') {
      const savedY =
        scrollPositions.get(location.key) ??
        scrollPositions.get(location.pathname + location.search);

      if (typeof savedY === 'number') {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
        // Secondary check in case dynamic content/layout expands on next frame
        const raf = requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
        });
        return () => {
          cancelAnimationFrame(raf);
          scrollPositions.set(location.key, window.scrollY);
          scrollPositions.set(location.pathname + location.search, window.scrollY);
        };
      }
    } else {
      // PUSH or REPLACE: new destination or page begins at top immediately
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    return () => {
      // Runs synchronously before the next route's layout effect resets scroll
      scrollPositions.set(location.key, window.scrollY);
      scrollPositions.set(location.pathname + location.search, window.scrollY);
    };
  }, [location.pathname, location.search, location.key, navType]);

  return null;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-ivory text-charcoal font-sans">
      <ScrollRestorationHandler />
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Main All Tours Destination Directory */}
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/cultural-heritage" element={<Navigate to="/tours?category=cultural-heritage" replace />} />
          <Route path="/journeys/cultural-heritage" element={<Navigate to="/tours?category=cultural-heritage" replace />} />
          
          
          {/* Services Architecture */}
          <Route path="/services" element={<Services />} />
          <Route path="/services/college-educational-tours" element={<Experiences />} />
          <Route path="/college-iv" element={<Experiences />} />
          <Route path="/experiences" element={<Experiences />} />
          
          {/* Dedicated Individual Destination & Educational Visit Pages */}
          <Route path="/services/:slug" element={<DestinationDetails />} />
          <Route path="/college-iv/:slug" element={<DestinationDetails />} />
          <Route path="/tours/:slug" element={<DestinationDetails />} />
          <Route path="/destinations/:slug" element={<DestinationDetails />} />
          <Route path="/journeys/:slug" element={<DestinationDetails />} />
          <Route path="/journeys" element={<Journeys />} />

          {/* Editorial & Utility Pages */}
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:slug" element={<StoryDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/plan-your-journey" element={<PlanJourney />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

          {/* Catch-all route to Home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
