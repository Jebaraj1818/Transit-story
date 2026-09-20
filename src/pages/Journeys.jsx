import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Compass, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import { SAMPLE_JOURNEYS } from '../data/journeys';

export default function Journeys() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Cultural Immersion',
    'Offbeat Experiences',
    'Intellectual Voyages',
    'Economic Growth & Craft',
  ];

  const filteredJourneys =
    selectedCategory === 'All'
      ? SAMPLE_JOURNEYS
      : SAMPLE_JOURNEYS.filter((j) => j.category === selectedCategory);

  const leadJourney = filteredJourneys[0] || SAMPLE_JOURNEYS[0];
  const secondJourney = filteredJourneys[1] || SAMPLE_JOURNEYS[1];
  const otherJourneys = filteredJourneys.slice(2);

  return (
    <div className="py-12 sm:py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Masthead / Intro */}
        <header className="max-w-4xl pb-12 sm:pb-16 border-b border-[#E3DCBF]">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px bg-earth" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-earth font-medium">
              Curated Expeditions • Volume I
            </span>
          </div>

          <h1 className="font-serif text-[clamp(1.95rem,5.5vw,2.5rem)] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-normal text-forest tracking-tight leading-[1.08] text-balance mb-6">
            Journeys Rooted in Memory, Place & Living Culture.
          </h1>

          <p className="text-base sm:text-lg text-charcoal-muted leading-relaxed font-normal max-w-2xl">
            Every journey is conceived as an intellectual voyage and an unhurried cultural immersion. We travel directly into artisan guilds, sacred architectural landscapes, and living South Indian communities.
          </p>

          {/* Curatorial Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-8 mt-2">
            <span className="text-xs uppercase tracking-editorial text-charcoal-light mr-2 font-medium">
              Filter By Theme:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] sm:text-xs uppercase tracking-editorial px-3.5 py-1.5 rounded-sm transition-all duration-300 font-medium ${
                  selectedCategory === cat
                    ? 'bg-forest text-ivory shadow-sm'
                    : 'bg-white/60 text-charcoal-muted hover:text-forest hover:bg-white border border-[#E3DCBF]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 01. LEAD FEATURED EXPEDITION (Dominant Asymmetrical Cover Spread)          */}
        {/* ========================================================================= */}
        {leadJourney && (
          <section className="py-14 sm:py-20 border-b border-[#E3DCBF]">
            {/* Lead Section Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-light tracking-editorial uppercase mb-6 pb-3 border-b border-[#E8E1CD]">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-medium text-forest uppercase tracking-editorial">Lead Featured Itinerary</span>
              </div>
              <span className="text-earth font-medium">{leadJourney.category}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Left 7 Columns: Cinematic Image with Hover Zoom */}
              <Link
                to={`/journeys/${leadJourney.slug}`}
                className="lg:col-span-7 group relative aspect-[16/11] sm:aspect-[16/10] overflow-hidden rounded-sm border border-[#E0D8BD] bg-forest/10 block focus-visible:outline-gold"
              >
                <img
                  src={leadJourney.image}
                  alt={leadJourney.title}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 flex flex-wrap items-center justify-between gap-2 text-ivory text-xs font-medium">
                  <span className="bg-forest-900/90 backdrop-blur-md px-3 py-1.5 rounded-sm tracking-editorial uppercase border border-ivory/15">
                    {leadJourney.location}
                  </span>
                  <span className="bg-forest-900/90 backdrop-blur-md px-3 py-1.5 rounded-sm tracking-editorial uppercase border border-ivory/15 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    {leadJourney.duration}
                  </span>
                </div>
              </Link>

              {/* Right 5 Columns: Editorial Narrative Column */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
                {leadJourney.theme && (
                  <span className="text-[11px] uppercase tracking-kicker text-gold-dark font-medium">
                    {leadJourney.theme}
                  </span>
                )}

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-normal text-forest leading-[1.14] tracking-tight">
                  <Link
                    to={`/journeys/${leadJourney.slug}`}
                    className="hover:text-forest-900 transition-colors focus-visible:outline-gold"
                  >
                    {leadJourney.title}
                  </Link>
                </h2>

                <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal">
                  {leadJourney.description}
                </p>

                {/* Key Curated Encounters */}
                {leadJourney.highlights && (
                  <div className="pt-2 pb-2">
                    <span className="text-[11px] uppercase tracking-editorial text-earth font-medium block mb-3">
                      Selected Curatorial Encounters:
                    </span>
                    <ul className="space-y-2.5 text-xs text-charcoal-muted font-normal">
                      {leadJourney.highlights.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Button
                    to={`/journeys/${leadJourney.slug}`}
                    variant="primary"
                    size="md"
                    className="tracking-widest w-full sm:w-auto"
                  >
                    Explore Itinerary
                  </Button>
                  <Link
                    to={`/journeys/${leadJourney.slug}`}
                    className="text-xs uppercase tracking-kicker font-semibold text-forest hover:text-earth transition-colors inline-flex items-center gap-1.5 py-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 02. SECONDARY FEATURE (Reversed Narrative-First Layout)                    */}
        {/* ========================================================================= */}
        {secondJourney && (
          <section className="py-14 sm:py-20 border-b border-[#E3DCBF]">
            {/* Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-light tracking-editorial uppercase mb-6 pb-3 border-b border-[#E8E1CD]">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-medium text-forest uppercase tracking-editorial">Highland Terroirs & Lore</span>
              </div>
              <span className="text-earth font-medium">{secondJourney.category}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Left 5 Columns: Narrative First */}
              <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col justify-center space-y-5">
                <div className="flex items-center gap-3 text-xs text-charcoal-muted tracking-wide font-sans">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-earth flex-shrink-0" />
                    {secondJourney.location}
                  </span>
                  <span>•</span>
                  <span>{secondJourney.duration}</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.5rem] font-normal text-forest leading-[1.15] tracking-tight">
                  <Link
                    to={`/journeys/${secondJourney.slug}`}
                    className="hover:text-forest-900 transition-colors focus-visible:outline-gold"
                  >
                    {secondJourney.title}
                  </Link>
                </h2>

                <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal">
                  {secondJourney.description}
                </p>

                {secondJourney.highlights && (
                  <div className="pt-2 pb-2">
                    <span className="text-[11px] uppercase tracking-editorial text-earth font-medium block mb-3">
                      Selected Encounters:
                    </span>
                    <ul className="space-y-2.5 text-xs text-charcoal-muted font-normal">
                      {secondJourney.highlights.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    to={`/journeys/${secondJourney.slug}`}
                    variant="outline"
                    size="md"
                    className="tracking-widest w-full sm:w-auto"
                  >
                    Discover Itinerary &rarr;
                  </Button>
                </div>
              </div>

              {/* Right 7 Columns: Landscape Photography */}
              <Link
                to={`/journeys/${secondJourney.slug}`}
                className="lg:col-span-7 order-1 lg:order-2 group relative aspect-[16/11] sm:aspect-[16/10] overflow-hidden rounded-sm border border-[#E0D8BD] bg-forest/10 block focus-visible:outline-gold"
              >
                <img
                  src={secondJourney.image}
                  alt={secondJourney.title}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute top-4 left-4 bg-forest-900/90 backdrop-blur-md text-ivory text-[10px] font-medium tracking-kicker uppercase px-3 py-1 rounded-sm border border-ivory/15">
                  {secondJourney.category}
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 03 & 04. EDITORIAL DIPTYCH (Architectural & Artisanal Voyages)             */}
        {/* ========================================================================= */}
        {otherJourneys.length > 0 && (
          <section className="py-14 sm:py-20 border-b border-[#E3DCBF]">
            <div className="max-w-2xl mb-12">
              <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-earth font-medium block mb-2">
                Parallel Chapters
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-forest tracking-tight">
                Classical Sacred Arts & Coastal Weaving
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
              {otherJourneys.map((journey, index) => {
                const itemIndex = `№ 0${index + 3}`;
                return (
                  <article
                    key={journey.id}
                    className="group flex flex-col bg-[#FCFAF5] border border-[#E0D8BD] rounded-sm overflow-hidden hover:border-earth/40 hover:shadow-[0_12px_32px_-8px_rgba(23,58,45,0.08)] transition-all duration-500"
                  >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E8E1CD] text-xs text-charcoal-light uppercase tracking-editorial">
                      <span className="font-serif font-semibold text-forest text-sm">{itemIndex}</span>
                      <span className="text-earth font-medium">{journey.category}</span>
                    </div>

                    {/* Image */}
                    <Link
                      to={`/journeys/${journey.slug}`}
                      className="relative aspect-[16/10] overflow-hidden block bg-forest/10 focus-visible:outline-gold"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <img
                        src={journey.image}
                        alt={journey.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </Link>

                    {/* Card Narrative */}
                    <div className="flex flex-col flex-1 p-6 sm:p-8">
                      <div className="flex items-center gap-3 text-xs text-charcoal-muted mb-3 font-sans">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-earth flex-shrink-0" />
                          {journey.location}
                        </span>
                        <span>•</span>
                        <span>{journey.duration}</span>
                      </div>

                      <h3 className="font-serif text-2xl sm:text-[1.65rem] font-normal text-forest leading-[1.22] mb-3 group-hover:text-forest-900 transition-colors">
                        <Link to={`/journeys/${journey.slug}`} className="focus-visible:outline-gold">
                          {journey.title}
                        </Link>
                      </h3>

                      <p className="text-sm text-charcoal-muted leading-relaxed line-clamp-3 mb-6 flex-1 font-normal">
                        {journey.description}
                      </p>

                      <div className="pt-4 border-t border-[#E8E1CD] mt-auto">
                        <Link
                          to={`/journeys/${journey.slug}`}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-kicker text-forest group-hover:text-earth transition-colors focus-visible:outline-gold"
                        >
                          <span>Explore This Chapter</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* BESPOKE CURATION & INQUIRY MASTHEAD                                       */}
        {/* ========================================================================= */}
        <section className="py-14 sm:py-20">
          <div className="bg-[#FAF7F0] border border-[#E0D8BD] rounded-sm p-5 sm:p-10 md:p-16 max-w-4xl mx-auto text-center relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-4 text-earth">
              <Compass className="w-5 h-5 text-earth" />
              <span className="text-[11px] uppercase tracking-expansive font-medium">
                Tailored Expeditions
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-4xl font-normal text-forest leading-tight mb-4">
              Seeking a Customized Itinerary for Research or Family?
            </h3>

            <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto leading-relaxed mb-8 font-normal">
              We design private, bespoke cultural journeys tailored around specific areas of inquiry: classical dance epigraphy, temple bronze lost-wax crafts, indigenous forest botany, or handloom textile traditions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button to="/plan-your-journey" variant="primary" size="md" className="w-full sm:w-auto min-h-[46px]">
                Initiate a Bespoke Plan
              </Button>
              <Button to="/contact" variant="outline" size="md" className="w-full sm:w-auto min-h-[46px]">
                Speak With a Curator
              </Button>
            </div>
          </div>
        </section>

        {/* Development Note */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-charcoal-light uppercase tracking-editorial">
            [Sample modular itineraries for layout demonstration. Final journeys curated directly with regional partners and client historians.]
          </p>
        </div>
      </div>
    </div>
  );
}
