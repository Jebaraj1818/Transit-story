import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-5 sm:pt-8 md:pt-12 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Masthead */}
        <header className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-3.5 sm:mb-4 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Legal & Transparency • Transit Story</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              editorial policy structure
            </span>
          </div>

          <div className="max-w-3xl">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-earth font-medium block mb-2.5">
              LEGAL & PRIVACY
            </span>
            <h1 className="font-serif text-[2.25rem] sm:text-4xl md:text-5xl font-normal text-forest tracking-tight leading-[1.08] mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal">
              How Transit Story respects, protects, and handles personal details provided for travel curation and logistics coordination.
            </p>
          </div>
        </header>

        {/* Editorial Advisory Notice */}
        <div className="p-4 sm:p-5 bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm mb-8 text-xs text-charcoal-muted leading-relaxed">
          <p className="font-medium text-forest mb-1">Editorial Notice</p>
          <p>
            This document outlines the operational privacy standards of Transit Story. Final client-approved legal text and formal terms will be updated in conjunction with institutional deployment.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 sm:space-y-10 text-charcoal-muted text-sm sm:text-[15px] leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              1. Information We Collect
            </h2>
            <p>
              When you enquire about or plan a journey with Transit Story, we collect necessary travel-related details, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Full name, email address, and mandatory contact phone number.</li>
              <li>Trip preferences, intended travel dates, group size, and destination interests.</li>
              <li>Institutional details for college industrial visits and academic cohorts.</li>
              <li>Any special accommodation, dietary, or transit requests provided voluntarily.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              2. How We Use Your Information
            </h2>
            <p>
              Information gathered is utilized exclusively to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Formulate bespoke itineraries and provide accurate logistics estimates.</li>
              <li>Coordinate vehicle transit, hotel accommodations, and local entry requirements.</li>
              <li>Communicate directly regarding itinerary updates, confirmations, or travel advice.</li>
              <li>Deliver requested travel dispatches or updates if subscribed to our newsletter.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              3. Information Sharing & Coordination
            </h2>
            <p>
              We do not sell, rent, or trade your personal information. Relevant traveler details are shared strictly with verified travel partners (such as private fleet operators, hotels, and homestay hosts) solely as needed to fulfill your journey arrangements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              4. Data Retention & Safeguards
            </h2>
            <p>
              We apply standard technical and organizational security measures to protect your personal information against unauthorized access, loss, or misuse during transmission and storage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              5. Contact Regarding Privacy
            </h2>
            <p>
              For any questions regarding your data or our privacy practices, please contact our team through our{' '}
              <Link to="/contact" className="text-forest underline underline-offset-4 hover:text-earth font-medium">
                Contact Page
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-6 border-t border-[#E3DCBF] flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-editorial font-medium text-forest hover:text-earth transition-colors"
          >
            <span>← Return to Home</span>
          </Link>
          <Link
            to="/terms-and-conditions"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-editorial font-medium text-forest hover:text-earth transition-colors"
          >
            <span>View Terms & Conditions →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
