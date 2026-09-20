import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
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

/**
 * ScrollToTop utility ensuring route changes scroll to the top of the viewport
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-ivory text-charcoal font-sans">
      <ScrollToTop />
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
