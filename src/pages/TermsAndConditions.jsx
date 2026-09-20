import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen pt-5 sm:pt-8 md:pt-12 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Masthead */}
        <header className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-3.5 sm:mb-4 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Service Terms • The Transit Story</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              editorial terms structure
            </span>
          </div>

          <div className="max-w-3xl">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-earth font-medium block mb-2.5">
              TERMS & CONDITIONS
            </span>
            <h1 className="font-serif text-[2.25rem] sm:text-4xl md:text-5xl font-normal text-forest tracking-tight leading-[1.08] mb-3">
              Terms & Conditions
            </h1>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal">
              General guidelines and terms governing travel curation, logistical coordination, and journey arrangements with The Transit Story.
            </p>
          </div>
        </header>

        {/* Editorial Advisory Notice */}
        <div className="p-4 sm:p-5 bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm mb-8 text-xs text-charcoal-muted leading-relaxed">
          <p className="font-medium text-forest mb-1">Editorial Notice</p>
          <p>
            This document represents a structured operational overview for The Transit Story's bespoke travel model. Formal legal terms and conditions will be ratified prior to enterprise-level transaction processing.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8 sm:space-y-10 text-charcoal-muted text-sm sm:text-[15px] leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              1. Scope of Services
            </h2>
            <p>
              The Transit Story coordinates bespoke travel arrangements across South India, including private vehicle fleets, verified accommodations, academic industrial visits (IVs), and curated day-wise itinerary flows. We act as a travel planning and logistics coordination service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              2. Journey Requests & Customization
            </h2>
            <p>
              Submissions made through our website enquiry forms constitute an expression of interest to plan a custom trip. A bespoke proposal, including recommended routes, vehicle options, and accommodation suggestions, will be provided based on your specifications.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              3. Bookings & Travel Coordination
            </h2>
            <p>
              Travel arrangements are confirmed only after mutual review and written confirmation of the finalized itinerary and logistical requirements. Changes to travel dates, passenger counts, or route stops can be adjusted in coordination with our desk subject to operator availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              4. Traveler Responsibilities
            </h2>
            <p>
              Travelers are responsible for carrying valid government identification, adhering to regional cultural norms and temple guidelines, and providing accurate passenger counts for vehicle safety compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              5. Inquiries & Correspondence
            </h2>
            <p>
              For clarification on any terms or assistance with your journey plans, please reach out via our{' '}
              <Link to="/contact" className="text-forest underline underline-offset-4 hover:text-earth font-medium">
                Contact Page
              </Link>{' '}
              or submit a request via{' '}
              <Link to="/plan-your-journey" className="text-forest underline underline-offset-4 hover:text-earth font-medium">
                Plan Your Journey
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
            to="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-editorial font-medium text-forest hover:text-earth transition-colors"
          >
            <span>View Privacy Policy →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
