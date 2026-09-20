import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles, MapPin } from 'lucide-react';
import { SERVICES_DATA } from '../data/services';
import { getServices } from '../api/client';

export default function Services() {
  const [services, setServices] = useState(SERVICES_DATA);

  useEffect(() => {
    let isMounted = true;
    getServices().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setServices(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const hotelBooking = services.find((s) => s.id === 'hotel-booking');
  const transportation = services.find((s) => s.id === 'transportation');
  const tourPlanning = services.find((s) => s.id === 'tour-planning');
  const educationalTours = services.find((s) => s.id === 'college-educational-tours');
  const groupTravel = services.find((s) => s.id === 'group-travel');
  const customTravel = services.find((s) => s.id === 'custom-travel');

  const coreServices = [hotelBooking, transportation, tourPlanning].filter(Boolean);
  const collectiveServices = [groupTravel, customTravel].filter(Boolean);

  return (
    <div className="min-h-screen pt-5 sm:pt-8 md:pt-12 pb-14 sm:pb-20 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. EDITORIAL SERVICES MASTHEAD (Clear positioning, tight rhythm)         */}
        {/* ========================================================================= */}
        <header>
          {/* Subtle Editorial Rule */}
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-3.5 sm:mb-4 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Travel Arrangements & Logistics • Transit Story</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              tailored logistical coordination
            </span>
          </div>

          <div className="max-w-3xl">
            {/* Main Page Heading */}
            <h1 className="font-serif text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-normal text-forest tracking-tight leading-[1.08] mb-2 sm:mb-3">
              SERVICES
            </h1>

            {/* Core Business Positioning */}
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-forest font-normal italic mb-2.5 tracking-tight">
              &ldquo;You choose the journey. We arrange the rest.&rdquo;
            </p>

            {/* Editorial Supporting Description */}
            <p className="text-xs sm:text-sm md:text-base text-charcoal-muted leading-relaxed font-normal text-balance">
              Transit Story provides comprehensive travel arrangements tailored to your journey.
              Rather than selling rigid tour packages, we coordinate dependable private transit,
              handpicked stays, customized student visits, and group logistics around your pace.
            </p>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. CORE TRAVEL ARRANGEMENTS (Hotel, Transportation, Tour Planning)       */}
        {/* ========================================================================= */}
        <section className="mt-7 sm:mt-10 pt-5 sm:pt-6 border-t border-[#E3DCBF]">
          <div className="flex items-baseline justify-between gap-4 mb-5 sm:mb-7">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium text-charcoal-light">
              Core Travel Arrangements
            </div>
            <span className="text-xs text-charcoal-muted hidden sm:inline font-serif italic">
              Tailored logistical coordination across South India
            </span>
          </div>

          {/* 3-Column Grid for Core Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
            {coreServices.map((service) => (
              <article
                key={service.id}
                className="group flex flex-col bg-white/70 hover:bg-white border border-[#E3DCBF] hover:border-[#173A2D]/35 rounded-sm overflow-hidden transition-all duration-300 shadow-sm hover:shadow-[0_6px_22px_rgba(23,58,45,0.06)]"
              >
                {/* Visual Media Frame — Clean, natural, no number badges, no dark overlays */}
                <div className="relative aspect-[16/10] overflow-hidden bg-forest/5">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>

                {/* Card Content Hierarchy */}
                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  {/* Category Eyebrow */}
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-earth font-medium mb-1">
                    {service.eyebrow}
                  </span>

                  {/* Service Title */}
                  <h2 className="font-serif text-xl sm:text-[1.35rem] font-normal text-forest tracking-tight leading-snug">
                    {service.title}
                  </h2>

                  {/* Concise Description */}
                  <p className="text-xs sm:text-[13px] text-charcoal-muted leading-relaxed mt-2 flex-grow">
                    {service.description}
                  </p>

                  {/* 3–4 Supporting Points */}
                  {service.points && (
                    <ul className="mt-3.5 pt-3 border-t border-[#E8E1CD]/70 space-y-1.5 text-left">
                      {service.points.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-[11px] sm:text-xs text-charcoal/85 leading-snug"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-earth/70 mt-1.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. COLLEGE & EDUCATIONAL TOURS FEATURE (Distinct Editorial Presentation)   */}
        {/* ========================================================================= */}
        {educationalTours && (
          <section className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#E3DCBF]">
            <div className="bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
                {/* Left 5 cols on desktop: Image Frame */}
                <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto min-h-[220px] lg:min-h-full overflow-hidden bg-forest/10">
                  <img
                    src={educationalTours.image}
                    alt={educationalTours.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right 7 cols on desktop: Editorial Content */}
                <div className="lg:col-span-7 p-5 sm:p-7 md:p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-earth font-medium block mb-1">
                      {educationalTours.eyebrow}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl text-forest tracking-tight mb-2">
                      {educationalTours.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-xl">
                      {educationalTours.description}
                    </p>

                    {/* Supporting Points */}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-[#E5DEC7] text-left">
                      {educationalTours.points.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-[11px] sm:text-xs text-charcoal/85 leading-snug"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-earth/70 mt-1.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Single Subtle Text-Link CTA to Dedicated Educational Page */}
                  <div className="pt-4 mt-5 border-t border-[#E5DEC7] flex items-center justify-between">
                    <Link
                      to={educationalTours.actionLink}
                      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] font-medium text-forest hover:text-earth transition-colors focus-visible:outline-[#C49A45] min-h-[36px] group"
                    >
                      <span>{educationalTours.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <span className="text-[11px] text-charcoal-light font-serif italic hidden sm:inline">
                      Field immersion & industrial visits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 4. COLLECTIVE & BESPOKE TRAVEL (Group Travel & Custom Travel)             */}
        {/* ========================================================================= */}
        <section className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#E3DCBF]">
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium text-charcoal-light mb-5 sm:mb-7">
            Collective & Bespoke Travel
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-7">
            {collectiveServices.map((service) => (
              <article
                key={service.id}
                className="group flex flex-col bg-white/70 hover:bg-white border border-[#E3DCBF] hover:border-[#173A2D]/35 rounded-sm overflow-hidden transition-all duration-300 shadow-sm hover:shadow-[0_6px_22px_rgba(23,58,45,0.06)]"
              >
                {/* Visual Media Frame — Clean, natural, no number badges */}
                <div className="relative aspect-[16/10] overflow-hidden bg-forest/5">
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>

                {/* Card Content Hierarchy */}
                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-earth font-medium mb-1">
                    {service.eyebrow}
                  </span>

                  <h2 className="font-serif text-xl sm:text-[1.35rem] font-normal text-forest tracking-tight leading-snug">
                    {service.title}
                  </h2>

                  <p className="text-xs sm:text-[13px] text-charcoal-muted leading-relaxed mt-2 flex-grow">
                    {service.description}
                  </p>

                  {service.points && (
                    <ul className="mt-3.5 pt-3 border-t border-[#E8E1CD]/70 space-y-1.5 text-left">
                      {service.points.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-[11px] sm:text-xs text-charcoal/85 leading-snug"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-earth/70 mt-1.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. "HOW TRAVEL ARRANGEMENTS WORK" (Editorial & Clean)                     */}
        {/* ========================================================================= */}
        <section className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-[#E3DCBF]">
          <div className="max-w-3xl mb-6 sm:mb-7">
            <div className="flex items-center gap-2 text-earth text-[10px] sm:text-xs uppercase tracking-kicker font-medium mb-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Journey Coordination</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-forest tracking-tight">
              How Travel Arrangements Work
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed mt-1">
              No complicated packages or rigid terms. Tell us what you need and we coordinate every phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8">
            <div className="p-4 sm:p-5 bg-white/60 border border-[#E3DCBF] rounded-sm">
              <span className="font-mono text-[11px] sm:text-xs text-earth font-bold block mb-1">
                DESTINATION
              </span>
              <h4 className="font-serif text-lg text-forest mb-1">Share Your Destination</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Tell us where you want to travel, your dates, and traveler count — from single families to full student cohorts.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white/60 border border-[#E3DCBF] rounded-sm">
              <span className="font-mono text-[11px] sm:text-xs text-earth font-bold block mb-1">
                ARRANGEMENTS
              </span>
              <h4 className="font-serif text-lg text-forest mb-1">Select What You Need</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Choose transport only, stays only, or complete day-wise itinerary coordination. You keep full flexibility.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white/60 border border-[#E3DCBF] rounded-sm">
              <span className="font-mono text-[11px] sm:text-xs text-earth font-bold block mb-1">
                CONFIRMATION
              </span>
              <h4 className="font-serif text-lg text-forest mb-1">Travel with Ease</h4>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Direct coordination with reliable vehicle fleet, booked accommodations, and dedicated travel support.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. ONE PRIMARY GLOBAL CTA (Plan Your Journey)                             */}
          {/* ========================================================================= */}
          <div className="bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="max-w-2xl">
              <div className="flex items-center gap-1.5 text-earth text-[10px] sm:text-xs uppercase tracking-kicker font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to Discuss Your Travel?</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-forest tracking-tight mb-1">
                You choose the journey. We arrange the rest.
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Tell us your preferred destination, traveler count, and required arrangements.
                We coordinate vehicles, accommodations, and pacing.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/plan-your-journey"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 bg-forest hover:bg-forest-800 text-ivory text-xs uppercase tracking-editorial font-medium rounded-sm transition-colors shadow-sm focus-visible:outline-gold min-h-[44px]"
              >
                <span>PLAN YOUR JOURNEY →</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
