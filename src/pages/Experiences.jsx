import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Compass,
  GraduationCap
} from 'lucide-react';
import { EDUCATIONAL_TOURS_DATA } from '../data/educationalTours';

export default function Experiences() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { heroSlides, tours, eyebrow, heroTitle, heroTagline, intro, bottomCta } =
    EDUCATIONAL_TOURS_DATA;

  // Auto-Slide State for Category Hero
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);
  const totalSlides = heroSlides.length;

  // Reset & restart autoplay timer
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 4500);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, totalSlides]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    resetTimer();
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    resetTimer();
  };

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const activeSlide = heroSlides[currentSlide];

  return (
    <div className="bg-[#FAF7F0] text-charcoal min-h-screen">
      {/* ========================================================================= */}
      {/* 1. LARGE FULL-WIDTH HERO SLIDESHOW (AUTOPLAYING, 70-80vh DESKTOP)         */}
      {/* ========================================================================= */}
      <section
        className="relative w-full h-[65vh] sm:h-[72vh] md:h-[80vh] min-h-[480px] sm:min-h-[500px] max-h-[850px] flex flex-col justify-between overflow-hidden bg-forest-950 select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="College and Educational Tours Slideshow"
      >
        {/* Full-bleed media slideshow with smooth Framer Motion crossfade */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={activeSlide.image}
                alt={activeSlide.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: activeSlide.objectPosition || 'center 40%' }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Subtle Localized Readability Gradient: Only behind text on left, fading to 100% transparent */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[52%] bg-gradient-to-r from-black/65 via-black/30 to-transparent z-10 pointer-events-none" />

          {/* Subtle Top feather for navbar contrast */}
          <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />

          {/* Soft Bottom Transition to Warm Ivory Page Body */}
          <div className="absolute bottom-0 left-0 right-0 h-8 md:h-16 bg-gradient-to-t from-[#FAF7F0]/40 md:from-[#FAF7F0] via-transparent to-transparent z-10 pointer-events-none" />
        </div>

        {/* Floating Top Navigation */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-5 sm:pt-8 flex items-center justify-between">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-ivory/20 text-xs font-semibold uppercase tracking-kicker text-ivory hover:text-gold transition-colors focus-visible:outline-gold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gold" />
            <span>Back to Home</span>
          </Link>

          {/* Current Active Visit Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-black/35 backdrop-blur-md px-3 py-1 rounded-full border border-ivory/15 text-[11px] uppercase tracking-editorial text-ivory font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>{activeSlide.name}</span>
          </div>
        </div>

        {/* Overlay on the Hero: Title, Category, Location */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pb-5 sm:pb-12 md:pb-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-8">
            {/* Minimal Editorial Typography - compact on mobile, max-w-[540px] desktop */}
            <div className="max-w-[340px] sm:max-w-md md:max-w-[540px]">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 text-[10.5px] sm:text-xs tracking-expansive uppercase text-gold font-medium mb-2 sm:mb-3.5 drop-shadow-sm">
                <span className="w-6 h-px bg-gold/70" aria-hidden="true" />
                <span>{eyebrow}</span>
              </div>

              {/* Main Heading (52–64px desktop, 44–52px tablet, 32–42px mobile clamp) */}
              <h1 className="font-serif text-[clamp(2rem,4vw+1rem,2.5rem)] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.65rem] font-normal text-ivory leading-[1.08] sm:leading-[1.06] tracking-tight mb-2.5 sm:mb-4 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] whitespace-pre-line">
                {heroTitle}
              </h1>

              {/* Short Supporting Line */}
              <p className="text-sm sm:text-base text-ivory/85 leading-snug sm:leading-relaxed font-normal max-w-[320px] sm:max-w-md drop-shadow-sm mb-3 sm:mb-4">
                {heroTagline}
              </p>

              {/* Slide Location Label */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-editorial text-ivory/80 font-sans">
                <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span className="font-semibold text-ivory">{activeSlide.name}</span>
                <span className="text-ivory/40">•</span>
                <span className="text-ivory/70">{activeSlide.location}</span>
              </div>
            </div>

            {/* Right: Manual Slide Navigation */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-10 h-10 flex items-center justify-center rounded-sm bg-forest-900/80 hover:bg-forest-800 text-ivory border border-ivory/20 transition-all hover:border-gold focus-visible:outline-gold active:scale-95"
                  aria-label="Previous visit slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 flex items-center justify-center rounded-sm bg-forest-900/80 hover:bg-forest-800 text-ivory border border-ivory/20 transition-all hover:border-gold focus-visible:outline-gold active:scale-95"
                  aria-label="Next visit slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. BELOW HERO — CATEGORY INTRO                                            */}
      {/* ========================================================================= */}
      <div className="py-14 sm:py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl pb-12 sm:pb-16 border-b border-[#E0D8BD]">
            <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-earth font-medium block mb-3">
              {intro.eyebrow}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-forest tracking-tight mb-5">
              {intro.heading}
            </h2>
            <p className="text-base sm:text-lg text-charcoal-muted leading-relaxed font-normal">
              {intro.description}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 3. FEATURED EDUCATIONAL VISITS — ALTERNATING EDITORIAL LAYOUT             */}
          {/* ========================================================================= */}
          <section className="py-14 sm:py-20 space-y-20 sm:space-y-28">
            {tours.map((tour, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <article
                  key={tour.slug}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
                >
                  {/* Editorial Photography Column */}
                  <div
                    className={`lg:col-span-7 ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <Link
                      to={`/services/${tour.slug}`}
                      className="group relative aspect-[16/11] sm:aspect-[16/10] overflow-hidden rounded-sm border border-[#E0D8BD] bg-forest/10 block shadow-sm hover:border-earth/50 hover:shadow-xl transition-all duration-500 focus-visible:outline-gold"
                    >
                      <img
                        src={tour.coverImage}
                        alt={tour.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                        style={{ objectPosition: tour.heroPosition || 'center 40%' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />

                      {/* Tag Chip */}
                      {tour.tag && (
                        <div className="absolute top-4 left-4 bg-forest-900/90 backdrop-blur-sm text-ivory text-[10px] font-medium tracking-kicker uppercase px-3 py-1 rounded-sm border border-ivory/15">
                          {tour.tag}
                        </div>
                      )}

                      {/* Location Badge */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-ivory text-xs font-sans">
                        <span className="flex items-center gap-1.5 font-medium bg-forest-900/85 px-3 py-1 rounded-sm backdrop-blur-sm">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          {tour.location}
                        </span>
                        <span className="font-serif text-xs text-ivory/80 bg-forest-900/85 px-2.5 py-1 rounded-sm">
                          № {tour.number}
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Editorial Narrative & Direct Link Column */}
                  <div
                    className={`lg:col-span-5 flex flex-col justify-center space-y-5 ${
                      isEven ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs text-earth uppercase tracking-editorial font-medium">
                      <span className="font-serif font-semibold text-forest text-sm">
                        № {tour.number}
                      </span>
                      <span>/</span>
                      <span>{tour.location}</span>
                    </div>

                    <h3 className="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] font-normal text-forest leading-[1.1] tracking-tight group-hover:text-forest-900 transition-colors">
                      <Link to={`/services/${tour.slug}`} className="hover:text-forest-900 focus-visible:outline-gold">
                        {tour.title}
                      </Link>
                    </h3>

                    <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal">
                      {tour.description}
                    </p>

                    {/* Highlights pill summary */}
                    {tour.tag && (
                      <div className="pt-1 pb-1">
                        <span className="text-[11px] uppercase tracking-editorial text-earth font-medium">
                          {tour.tag} • Field Immersion
                        </span>
                      </div>
                    )}

                    {/* Action Links */}
                    <div className="pt-3 flex flex-wrap items-center gap-5 sm:gap-6">
                      <Link
                        to={`/services/${tour.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-kicker text-forest hover:text-earth transition-colors focus-visible:outline-gold group"
                      >
                        <span className="pb-0.5 border-b border-forest/40 group-hover:border-earth">
                          EXPLORE VISIT
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gold transition-transform duration-300 group-hover:translate-x-1.5" />
                      </Link>

                      <Link
                        to={`/plan-your-journey?destination=${encodeURIComponent(tour.slug)}`}
                        state={{
                          destination: tour.title,
                          category: 'College & Educational Tours'
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-editorial text-charcoal-muted hover:text-forest transition-colors focus-visible:outline-gold"
                      >
                        <span>Enquire for Visit</span>
                        <span className="text-gold">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* ========================================================================= */}
          {/* 4. END OF CATEGORY PAGE — COMPACT FINAL ENQUIRY CTA                       */}
          {/* ========================================================================= */}
          <section className="border-t border-[#E0D8BD] pt-14 sm:pt-20 pb-4">
            <div className="bg-[#173A2D] text-[#F5F0E5] rounded-sm p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-xl border border-[#1F4C3C]">
              {/* Subtle ambient lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C49A45]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#426047]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 rounded-sm text-[10px] sm:text-xs uppercase tracking-kicker text-gold mb-4 border border-white/10 font-medium">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Custom Institutional Arrangements</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-ivory tracking-tight leading-[1.08] mb-4">
                  {bottomCta.heading}
                </h2>

                <p className="text-sm sm:text-base text-ivory/80 leading-relaxed font-normal mb-8 max-w-xl mx-auto">
                  {bottomCta.subheading}
                </p>

                <Link
                  to="/plan-your-journey?destination=college-educational-tours"
                  state={{
                    destination: 'College & Educational Tours',
                    category: 'College & Educational Tours'
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gold hover:bg-gold-light text-forest-950 font-semibold text-xs sm:text-sm uppercase tracking-kicker rounded-sm transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 group focus-visible:outline-ivory"
                >
                  <span>{bottomCta.buttonText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
