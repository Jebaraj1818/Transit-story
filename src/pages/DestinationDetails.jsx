import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ArrowLeft,
  ArrowRight,
  Compass,
  Sparkles,
  CheckCircle2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import Button from '../components/Button';
import { getDestinationBySlug as getLocalDestinationBySlug } from '../data/destinations';
import { getJourneyBySlug } from '../data/journeys';
import { getDestinationBySlug } from '../api/client';

export default function DestinationDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top upon mounting or when slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Initial state from synchronous local lookup, then updated asynchronously from Flask API
  const [destination, setDestination] = useState(
    () => getLocalDestinationBySlug(slug) || getJourneyBySlug(slug)
  );

  useEffect(() => {
    let isMounted = true;
    getDestinationBySlug(slug).then((data) => {
      if (isMounted && data && data.title) {
        setDestination(data);
        // If URL used an old slug or alias, replace URL with canonical slug seamlessly
        if (data.slug && data.slug.toLowerCase() !== slug.toLowerCase() && location.pathname.startsWith('/tours/')) {
          navigate(`/tours/${data.slug}`, { replace: true });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug, navigate, location.pathname]);

  const isEducational =
    location.pathname.startsWith('/services') ||
    location.pathname.startsWith('/college-iv') ||
    destination?.category === 'College & Educational Tours';

  // Determine the back destination:
  // 1. If navigated from Tours (with optional category filter), use that exact URL.
  // 2. Otherwise fall back to the appropriate listing page.
  const stateFrom = location.state?.from;
  const backRoute = stateFrom
    ? stateFrom
    : isEducational
    ? '/services'
    : '/tours';

  // Derive a human-readable back label from the resolved route
  const getBackLabel = () => {
    if (stateFrom) {
      if (stateFrom.includes('category=')) {
        // Extract and humanise the category name from ?category=slug
        const match = stateFrom.match(/[?&]category=([^&]+)/);
        if (match) {
          const slug = decodeURIComponent(match[1]);
          // Convert slug to title: leisure-holiday → Leisure & Holiday
          const readable = slug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
            .replace('And', '&');
          return `← Back to ${readable}`;
        }
      }
      if (stateFrom.startsWith('/services')) return '← Back to Educational Tours';
      return '← Back to Tours';
    }
    return isEducational ? '← Back to Educational Tours' : '← Back to Tours';
  };
  const backLabel = getBackLabel();
  const ctaButtonText = isEducational ? 'Enquire for This Visit' : 'Plan This Journey';
  const ctaExploreText = isEducational ? 'Explore All Visits' : 'Explore All Tours';
  const encountersEyebrow = isEducational ? 'Academic & Field Focus' : 'Curated Encounters';
  const encountersTitle = isEducational ? 'What You Can Observe & Learn' : 'What You Can Experience';
  const notesEyebrow = isEducational ? 'Institutional Notes' : 'Curated Travel Notes';
  const notesTitle = isEducational ? 'Key Learning Areas' : 'Suggested Highlights';
  const bannerEyebrow = isEducational ? 'Educational & Industrial Visits' : 'Curated Travel Arrangements';
  const bottomHeading = isEducational ? 'Make This Visit Yours' : 'Make This Journey Yours';
  const bottomDesc = isEducational
    ? "Tell us your institutional requirements, expected cohort size, and preferred schedule. Transit Story coordinates dedicated group transport, accommodations, and itinerary flow tailored directly to your institution."
    : "Tell us when you wish to travel and who you will travel with. Transit Story coordinates private transit, verified stays, and custom pacing tailored entirely to your requirements.";

  // Normalize all available images
  const allImages =
    destination?.images && destination.images.length > 0
      ? destination.images
      : destination?.gallery && destination.gallery.length > 0
      ? destination.gallery
      : destination?.coverImage
      ? [destination.coverImage]
      : destination?.image
      ? [destination.image]
      : [];

  const heroImage = destination?.heroImage || destination?.coverImage || destination?.image || allImages[0];

  const normalizeImgPath = (p) => (p ? p.trim().split('?')[0] : '');
  const heroNorm = normalizeImgPath(heroImage);

  // Pool images: prioritize destination.gallery if specified, else allImages
  const pool =
    destination?.gallery && destination.gallery.length > 0
      ? destination.gallery
      : allImages;

  // Strictly exclude hero image and deduplicate inside gallery
  const uniqueGallery = [];
  const seen = new Set();
  for (const img of pool) {
    const norm = normalizeImgPath(img);
    if (norm && norm !== heroNorm && !seen.has(norm)) {
      seen.add(norm);
      uniqueGallery.push(img);
    }
  }

  // Strictly enforce destination rule: exactly up to 3 different gallery images (hero image never repeated)
  const galleryImages = uniqueGallery.slice(0, 3);

  // Lightbox state for photo gallery
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45 && galleryImages.length > 1) {
      // swipe left -> next photo
      setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length);
    } else if (diff < -45 && galleryImages.length > 1) {
      // swipe right -> prev photo
      setActivePhotoIndex((prev) =>
        prev === 0 ? galleryImages.length - 1 : prev - 1
      );
    }
    setTouchStartX(null);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowRight' && galleryImages.length) {
        setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.key === 'ArrowLeft' && galleryImages.length) {
        setActivePhotoIndex((prev) =>
          prev === 0 ? galleryImages.length - 1 : prev - 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, galleryImages.length]);

  if (!destination) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20 px-4 bg-[#F5F0E5]">
        <div className="max-w-md w-full text-center bg-[#FCFAF5] border border-[#E0D8BD] p-8 sm:p-10 rounded-sm shadow-sm">
          <Compass className="w-10 h-10 text-earth mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-normal text-forest mb-3">
            Destination Not Found
          </h2>
          <p className="text-sm text-charcoal-muted mb-8 leading-relaxed">
            The destination you are looking for is not listed or has moved.
          </p>
          <Button to="/tours" variant="primary">
            Explore All Tours
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F0] text-charcoal min-h-screen">
      {/* ========================================================================= */}
      {/* 1. FULL-WIDTH HERO (Large Original Image, Minimal Overlay)                 */}
      {/* ========================================================================= */}
      <section className="relative w-full h-[65vh] sm:h-[70vh] min-h-[480px] md:h-auto md:min-h-[74vh] lg:min-h-[78vh] flex flex-col justify-between overflow-hidden bg-forest-950 select-none">
        {/* Full-bleed media layer */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={heroImage}
            alt={destination.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: destination.heroPosition || 'center 40%' }}
          />

          {/* Subtle Localized Readability Gradient: Only behind text on left, fading to 100% transparent */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[52%] bg-gradient-to-r from-black/60 via-black/25 to-transparent z-10 pointer-events-none" />

          {/* Subtle Top feather for navbar contrast */}
          <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />

          {/* Soft Bottom Transition to Page Body */}
          <div className="absolute bottom-0 left-0 right-0 h-8 md:h-16 bg-gradient-to-t from-[#FAF7F0]/40 md:from-[#FAF7F0] via-transparent to-transparent z-10 pointer-events-none" />
        </div>

        {/* Floating Top Navigation */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-5 sm:pt-8 flex items-center justify-between">
          <Link
            to={backRoute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-ivory/20 text-[11px] font-semibold uppercase tracking-kicker text-ivory hover:text-gold hover:border-gold/40 transition-all duration-200 focus-visible:outline-gold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gold flex-shrink-0" />
            <span>{backLabel.replace('← ', '')}</span>
          </Link>
          <span className="text-[10.5px] uppercase tracking-expansive text-ivory/60 font-medium hidden sm:inline-block">
            Transit Story • Field Dossier
          </span>
        </div>

        {/* Overlay on the Hero: Controlled Typography, Left Positioned (~35–40% width on desktop, compact on mobile) */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pb-5 sm:pb-12 md:pb-14">
          <div className="max-w-[340px] sm:max-w-md md:max-w-[540px]">
            {/* Category / Eyebrow */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-[10.5px] sm:text-xs tracking-expansive uppercase text-gold font-medium mb-2 sm:mb-3.5 drop-shadow-sm">
              <span className="w-6 h-px bg-gold/70 hidden sm:inline-block" aria-hidden="true" />
              <span>{destination.category || 'CULTURAL & HERITAGE'}</span>
              <span className="text-ivory/40">•</span>
              <span className="text-ivory/80 font-normal flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gold/80" />
                {destination.location}
              </span>
            </div>

            {/* Destination Title: Controlled Editorial Scale (52–64px desktop, 44–52px tablet, 32–42px mobile clamp) */}
            <h1 className="font-serif text-[clamp(1.95rem,5.5vw,2.35rem)] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.65rem] font-normal text-ivory leading-[1.08] sm:leading-[1.06] tracking-tight mb-2.5 sm:mb-4 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
              {destination.title}
            </h1>

            {/* Very Short Supporting Line */}
            {destination.tag && (
              <p className="text-[13.5px] sm:text-sm text-ivory/80 font-light tracking-wide max-w-[320px] sm:max-w-md mb-4 sm:mb-6 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                {destination.tag}
              </p>
            )}

            {/* Compact CTA & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <Button
                to={`/plan-your-journey?destination=${encodeURIComponent(destination.slug)}`}
                state={{
                  destination: destination.title,
                  category: destination.category
                }}
                variant="primary"
                size="md"
                className="text-[11.5px] sm:text-xs tracking-wider shadow-md bg-forest hover:bg-forest-900 border-forest text-ivory group px-4 py-2 sm:px-5 sm:py-2.5"
              >
                <span>PLAN THIS JOURNEY</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
              </Button>

              {isEducational && (
                <Button
                  to={`/plan-your-journey?destination=${encodeURIComponent(destination.slug)}`}
                  state={{
                    destination: destination.title,
                    category: destination.category
                  }}
                  variant="outline"
                  size="md"
                  className="text-[11.5px] sm:text-xs tracking-wider shadow-md bg-black/35 backdrop-blur-sm border border-ivory/30 text-ivory hover:text-gold hover:border-gold/60 group px-4 py-2 sm:px-5 sm:py-2.5"
                >
                  <span>ENQUIRE FOR THIS VISIT</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
                </Button>
              )}

              {galleryImages.length > 0 && (
                <a
                  href="#gallery"
                  className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-sm bg-black/30 backdrop-blur-md border border-ivory/25 text-[11px] sm:text-xs font-semibold uppercase tracking-kicker text-ivory hover:text-gold hover:border-gold/50 transition-all"
                >
                  <span>Gallery</span>
                  <span>&darr;</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Below-hero back breadcrumb ── subtle, premium, always visible ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <Link
          to={backRoute}
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] font-medium text-earth hover:text-forest transition-colors duration-200 group focus-visible:outline-[#C49A45] min-h-[36px]"
          aria-label={backLabel}
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 flex-shrink-0" />
          <span>{backLabel.replace('← ', '')}</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESTINATION INTRODUCTION & ABOUT THE JOURNEY / VISIT                   */}
      {/* ========================================================================= */}
      <div className="py-14 sm:py-20 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-16 sm:mb-20 pb-12 border-b border-[#E0D8BD]">
            <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-earth font-medium block mb-3">
              {isEducational ? 'Educational Introduction' : 'Editorial Overview'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-[2.2rem] font-light text-forest leading-snug tracking-tight mb-6 text-balance">
              "{destination.description}"
            </h2>
            <div className="space-y-4 text-base sm:text-lg text-charcoal-muted leading-relaxed font-normal max-w-3xl">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-forest mb-2">
                {isEducational ? 'About the Visit' : 'About the Journey'}
              </h3>
              <p>{destination.about || destination.description}</p>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. HIGHLIGHTS & CURATED ENCOUNTERS (Editorial Layout)                     */}
          {/* ========================================================================= */}
          <section className="mb-16 sm:mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
              {/* Left 7 cols: What You Can Experience */}
              <div className="lg:col-span-7">
                <span className="text-[11px] uppercase tracking-kicker text-earth font-medium block mb-2">
                  {encountersEyebrow}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-forest leading-tight mb-6">
                  {encountersTitle}
                </h3>

                {destination.experiences && destination.experiences.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {destination.experiences.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 bg-[#FCFAF5] border border-[#E0D8BD] rounded-sm flex items-start gap-3.5"
                      >
                        <Sparkles className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-charcoal leading-relaxed font-normal">
                          {exp}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-charcoal-muted leading-relaxed font-normal">
                    Experiences, cultural immersion, and local walks customized upon departure.
                  </p>
                )}
              </div>

              {/* Right 5 cols: Suggested Highlights & Notes */}
              <div className="lg:col-span-5">
                <div className="bg-[#FCFAF5] border border-[#E0D8BD] p-6 sm:p-7 rounded-sm">
                  <span className="text-[11px] uppercase tracking-kicker text-earth font-medium block mb-2">
                    {notesEyebrow}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-forest mb-4">
                    {notesTitle}
                  </h3>

                  {destination.highlights && destination.highlights.length > 0 ? (
                    <ul className="space-y-3.5 mb-6 text-xs sm:text-sm text-charcoal-muted">
                      {destination.highlights.map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-earth flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{hl}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs sm:text-sm text-charcoal-muted mb-6 leading-relaxed">
                      Custom arrangements, private transfers, and tailored schedules coordinated upon request.
                    </p>
                  )}

                  {/* Suitable For info */}
                  {destination.suitableFor && (
                    <div className="pt-4 border-t border-[#E8E1CD] text-xs text-charcoal-light">
                      <div className="flex items-center gap-1.5 font-medium text-forest mb-1">
                        <Users className="w-3.5 h-3.5 text-earth" />
                        <span>Ideal For</span>
                      </div>
                      <span className="text-charcoal-muted leading-relaxed">{destination.suitableFor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. IMAGE GALLERY (Original Local Images, Masonry / Grid)                  */}
          {/* ========================================================================= */}
          {galleryImages.length > 0 && (
            <section id="gallery" className="mb-16 sm:mb-24 scroll-mt-24 border-t border-[#E0D8BD] pt-12 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
                <div>
                  <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-earth font-medium block mb-1.5">
                    Original Photography
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-normal text-forest tracking-tight">
                    Frames of {destination.title}
                  </h2>
                </div>
                <p className="text-xs uppercase tracking-editorial text-charcoal-light font-medium">
                  Tap any photo for full view
                </p>
              </div>

              {/* Editorial Gallery Grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${galleryImages.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'} gap-5 sm:gap-6`}>
                {galleryImages.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden rounded-sm border border-[#E0D8BD] bg-forest/5 cursor-pointer focus-visible:outline-gold transition-all duration-300 hover:border-earth/50 hover:shadow-lg"
                    tabIndex={0}
                    role="button"
                    aria-label={`View photo ${idx + 1} of ${destination.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActivePhotoIndex(idx);
                      }
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt={`${destination.title} photographic frame ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-forest-950/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-forest-900/90 text-ivory text-[10px] uppercase tracking-kicker px-3 py-1.5 rounded-sm border border-ivory/20 flex items-center gap-1.5 backdrop-blur-sm shadow-md">
                        <Maximize2 className="w-3.5 h-3.5 text-gold" />
                        View Full Photo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* 5. PLAN YOUR JOURNEY CTA (Strictly navigates to /plan-your-journey)        */}
          {/* ========================================================================= */}
          <section id="plan-section" className="border-t border-[#E0D8BD] pt-14 sm:pt-16 pb-6 scroll-mt-24">
            <div className="bg-[#173A2D] text-[#F5F0E5] rounded-sm p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-xl border border-[#1F4C3C]">
              {/* Subtle ambient lighting */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C49A45]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#426047]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 rounded-sm text-[10px] sm:text-xs uppercase tracking-kicker text-gold mb-5 border border-white/10">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{bannerEyebrow}</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-ivory tracking-tight leading-[1.08] mb-4">
                  Make This Journey Yours
                </h2>

                <p className="text-sm sm:text-base text-ivory/80 leading-relaxed font-normal mb-8 max-w-xl mx-auto">
                  {bottomDesc}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    to={`/plan-your-journey?destination=${encodeURIComponent(destination.slug)}`}
                    state={{
                      destination: destination.title,
                      category: destination.category || 'Custom Journey'
                    }}
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto tracking-widest bg-gold hover:bg-gold-dark text-forest-950 font-semibold py-3.5 px-8 text-xs uppercase"
                  >
                    <span>PLAN THIS JOURNEY &rarr;</span>
                  </Button>
                  {isEducational && (
                    <Button
                      to={`/plan-your-journey?destination=${encodeURIComponent(destination.slug)}`}
                      state={{
                        destination: destination.title,
                        category: destination.category || 'Educational Visit'
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto tracking-widest border-ivory/40 text-ivory hover:bg-white/10 py-3.5 px-7 text-xs uppercase"
                    >
                      <span>ENQUIRE FOR THIS VISIT &rarr;</span>
                    </Button>
                  )}
                  <Button
                    to={backRoute}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto tracking-widest border-ivory/20 text-ivory/80 hover:text-ivory hover:bg-white/5 py-3.5 px-6 text-xs uppercase"
                  >
                    {ctaExploreText}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIGHTBOX MODAL FOR FULL-RESOLUTION PHOTO VIEWING                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-forest-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
            onClick={() => setActivePhotoIndex(null)}
          >
            {/* Top Toolbar */}
            <div
              className="w-full max-w-6xl flex items-center justify-between text-ivory pt-2 pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs sm:text-sm font-sans">
                <span className="text-gold font-semibold tracking-wide">{destination.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-sm bg-white/10 hover:bg-white/20 active:scale-95 text-ivory transition-colors"
                aria-label="Close photo view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Image Container with Touch Swipe */}
            <div
              className="relative max-w-5xl max-h-[75vh] sm:max-h-[80vh] flex items-center justify-center my-auto touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={galleryImages[activePhotoIndex]}
                alt={`${destination.title} photograph ${activePhotoIndex + 1}`}
                className="max-h-[75vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-sm border border-ivory/20 shadow-2xl select-none"
              />

              {/* Prev / Next buttons if multiple images */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) =>
                        prev === 0 ? galleryImages.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-1 sm:-left-6 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 sm:p-3 rounded-full bg-forest-900/90 text-ivory hover:bg-forest-800 active:scale-95 border border-ivory/20 transition-all shadow-lg z-20"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length)
                    }
                    className="absolute right-1 sm:-right-6 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 sm:p-3 rounded-full bg-forest-900/90 text-ivory hover:bg-forest-800 active:scale-95 border border-ivory/20 transition-all shadow-lg z-20"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom thumbnail strip */}
            {galleryImages.length > 1 && (
              <div
                className="flex items-center gap-2.5 pb-2 overflow-x-auto max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhotoIndex(i)}
                    className={`w-14 h-10 sm:w-16 sm:h-12 rounded-sm overflow-hidden border transition-all ${
                      activePhotoIndex === i
                        ? 'border-gold scale-105 shadow-md'
                        : 'border-ivory/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
