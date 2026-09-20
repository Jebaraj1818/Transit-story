import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function About() {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = {
    initial: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <div className="min-h-screen pt-4 sm:pt-6 md:pt-10 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. EDITORIAL MASTHEAD & HERO                                              */}
        {/* ========================================================================= */}
        <header className="mb-10 sm:mb-14 md:mb-16">
          {/* Subtle Editorial Top Rule */}
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-5 sm:mb-7 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Our Ethos &amp; Origin • The Transit Story</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              editorial brand story
            </span>
          </div>

          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            {/* Small Eyebrow */}
            <span className="inline-block text-[11px] sm:text-xs uppercase tracking-[0.25em] text-earth font-medium mb-3">
              OUR ETHOS &amp; ORIGIN
            </span>

            {/* Controlled Editorial Heading: 40-48px on mobile, controlled on desktop */}
            <h1 className="font-serif text-[2.5rem] sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-normal text-forest tracking-tight leading-[1.08] mb-3 sm:mb-4">
              The Story Behind <br className="hidden sm:inline" />
              <span className="italic font-light">The Transit</span>
            </h1>

            {/* Short Subtitle */}
            <p className="font-serif text-lg sm:text-xl md:text-2xl text-forest/90 font-normal italic leading-snug">
              Crafted experiences and meaningful journeys rooted in Tamil Nadu, India.
            </p>
          </motion.div>
        </header>

        {/* ========================================================================= */}
        {/* 2. EDITORIAL FEATURE STORY SECTION (Two-Column Editorial Composition)    */}
        {/* ========================================================================= */}
        <section className="pt-8 sm:pt-10 border-t border-[#E3DCBF] mb-12 sm:mb-16 md:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Vertical Editorial Eyebrow / Label */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-28">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.22em] text-earth font-medium mb-2">
                  <span className="w-3 h-px bg-earth" aria-hidden="true" />
                  <span>THE TRANSIT STORY</span>
                </div>
                <p className="text-xs text-charcoal-light font-normal hidden lg:block leading-relaxed">
                  A perspective on mindful exploration, cultural resonance, and conscious patronage.
                </p>
              </div>
            </aside>

            {/* Right Column: Main Story with Prominent Opening Quote Treatment */}
            <motion.div {...fadeIn} className="lg:col-span-9 space-y-6 sm:space-y-8">
              {/* Prominent Opening Statement Treatment */}
              <div className="border-l-2 border-gold/70 pl-4 sm:pl-6 py-1">
                <blockquote className="font-serif text-xl sm:text-2xl md:text-[1.75rem] text-forest font-normal italic leading-relaxed text-balance">
                  &ldquo;The Transit Story was founded on a simple realization: the most transformative journeys are not measured by miles traversed or tick-box monuments, but by the depth of human and cultural resonance left in one&rsquo;s consciousness.&rdquo;
                </blockquote>
              </div>

              {/* Narrative Paragraph with Comfortable Reading Width */}
              <div className="max-w-2xl text-sm sm:text-base md:text-[17px] text-charcoal leading-relaxed font-normal">
                <p>
                  Based in Tamil Nadu, our work connects mindful travelers with knowledge-holders, temple historians, handloom masters, and rural stewards who maintain centuries of living heritage. We view transit not as passive transit time, but as an intellectual voyage and an act of conscious patronage.
                </p>
              </div>

              {/* Authentic Cultural Visual Frame (Nellaiyappar temple living heritage) */}
              <div className="pt-2">
                <div className="overflow-hidden rounded-sm border border-[#E3DCBF] bg-forest/5 aspect-[16/9] sm:aspect-[21/9] max-w-3xl">
                  <img
                    src="/images/nellaiyappar-temple-02.jpg"
                    alt="Historic temple architecture and living cultural heritage in Tamil Nadu"
                    loading="lazy"
                    className="w-full h-full object-cover object-[center_35%] transition-transform duration-700 ease-out hover:scale-[1.02]"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-charcoal-light pt-2 px-0.5">
                  <span className="font-serif italic text-charcoal-muted">
                    Centuries of living temple heritage and regional craftsmanship • Tamil Nadu
                  </span>
                  <span className="hidden sm:inline-block uppercase tracking-[0.16em] text-[10px] text-earth">
                    Living Heritage
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. OUR ETHOS SECTION (Editorial Two-Column Principles)                   */}
        {/* ========================================================================= */}
        <section className="pt-10 sm:pt-14 border-t border-[#E3DCBF] mb-14 sm:mb-20">
          <div className="max-w-3xl mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-earth font-medium block mb-2">
              OUR ETHOS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-forest tracking-tight">
              How We Think About Travel
            </h2>
          </div>

          {/* Two Editorial Columns (Not SaaS Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 pt-2">
            {/* Principle 01 */}
            <motion.div {...fadeIn} className="border-t border-[#E3DCBF] pt-5 sm:pt-6">
              <span className="font-mono text-xs sm:text-sm text-gold font-semibold tracking-wider block mb-2">
                01
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight mb-3">
                Rooted in Authenticity
              </h3>
              <p className="text-sm sm:text-[15px] text-charcoal-muted leading-relaxed max-w-md">
                We reject staged tourism in favor of slow, deliberate immersion alongside indigenous and regional communities.
              </p>
            </motion.div>

            {/* Principle 02 */}
            <motion.div {...fadeIn} className="border-t border-[#E3DCBF] pt-5 sm:pt-6">
              <span className="font-mono text-xs sm:text-sm text-gold font-semibold tracking-wider block mb-2">
                02
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight mb-3">
                Economic Co-growth
              </h3>
              <p className="text-sm sm:text-[15px] text-charcoal-muted leading-relaxed max-w-md">
                Direct community interaction ensures that local craft economies and conservation efforts flourish sustainably.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. DEFINING BRAND MANIFESTO SECTION (Deep Forest & Warm Ivory)           */}
        {/* ========================================================================= */}
        <motion.section {...fadeIn} className="mb-14 sm:mb-20">
          <div className="bg-forest text-ivory rounded-sm p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-editorial">
            {/* Fine subtle gold rule */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/20 via-gold/70 to-gold/20" />

            <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
              <div className="flex items-center justify-center gap-3 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-gold font-medium">
                <span className="w-5 h-px bg-gold/50" aria-hidden="true" />
                <span>EVERY JOURNEY HAS A STORY</span>
                <span className="w-5 h-px bg-gold/50" aria-hidden="true" />
              </div>

              <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-normal italic leading-snug tracking-tight text-ivory px-2 sm:px-4">
                &ldquo;Every itinerary is an invitation to listen closely, ask deeper questions, and journey with reverence.&rdquo;
              </blockquote>

              <div className="pt-1">
                <span className="text-[11px] sm:text-xs text-ivory/60 tracking-wider uppercase">
                  The Transit Story Philosophy
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ========================================================================= */}
        {/* 5. CONNECT TO THE ACTUAL BUSINESS (Travel Arrangements & Logistics)      */}
        {/* ========================================================================= */}
        <section className="pt-8 sm:pt-12 border-t border-[#E3DCBF] mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium block mb-2">
                BEYOND HERITAGE IMMERSIONS
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-forest tracking-tight mb-3">
                &ldquo;You choose the journey. We arrange the rest.&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-xl font-normal">
                While cultural depth defines our ethos, The Transit Story is a comprehensive travel arrangements service. We coordinate private transportation fleets, hotel and accommodation arrangements, tour planning, college and educational travel, group journeys, and tailored logistics across South India with seamless attention to comfort.
              </p>
            </div>

            {/* Travel Capabilities Checklist / Badges */}
            <div className="lg:col-span-5 bg-white/60 border border-[#E3DCBF] rounded-sm p-4 sm:p-6">
              <span className="text-[10px] uppercase tracking-[0.18em] text-forest font-semibold block mb-3">
                Arrangements We Coordinate
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-charcoal">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span>Private Transportation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span>Hotel &amp; Stays</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span>Curated Tour Planning</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span>College &amp; Educational IV</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span>Group Travel Logistics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                  <span>Custom Itineraries</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. FINAL EDITORIAL CTA                                                    */}
        {/* ========================================================================= */}
        <section className="bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-1.5 text-earth text-[10px] sm:text-xs uppercase tracking-kicker font-medium mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>Begin Your Journey</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-[2rem] text-forest tracking-tight leading-snug mb-2">
                Your Journey, Your Way.
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed font-normal">
                Tell us where you wish to explore. We coordinate the vehicles, accommodations, and pacing for an unhurried, authentic experience.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-shrink-0">
              <Link
                to="/plan-your-journey"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-forest hover:bg-forest-800 text-ivory text-xs uppercase tracking-editorial font-medium rounded-sm transition-colors shadow-sm focus-visible:outline-gold min-h-[44px]"
              >
                <span>PLAN YOUR JOURNEY →</span>
              </Link>
              <Link
                to="/tours"
                className="inline-flex items-center justify-center px-4 py-3 text-xs uppercase tracking-editorial text-forest hover:text-earth font-medium transition-colors text-center"
              >
                <span>EXPLORE TOURS →</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
