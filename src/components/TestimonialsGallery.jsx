import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Compass, MapPin } from 'lucide-react';
import { getTestimonials, DEFAULT_TESTIMONIALS } from '../api/client';
import { resolveMediaUrl } from '../utils/media';

/**
 * Redesigned Single-Screenshot Editorial Testimonials Carousel
 *
 * Desktop: Elegant two-column editorial split
 * - Left: Editorial introduction, travel coordinates motif, narrative storytelling & controls
 * - Right: Prominent, large portrait screenshot frame with smooth slide transitions
 *
 * Mobile: Clean stacked layout with touch-swipeable single image carousel
 */
export default function TestimonialsGallery() {
  const shouldReduceMotion = useReducedMotion();
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1); // 1 = next, -1 = prev
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed, number = index
  const [isLoading, setIsLoading] = useState(true);

  // Load testimonials from API with graceful fallback
  useEffect(() => {
    let isMounted = true;
    getTestimonials()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const valid = data.filter(
            (t) => t && (t.isActive ?? t.is_active ?? true) && (t.imageUrl || t.image_url)
          );
          if (valid.length > 0) {
            setTestimonials(valid);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const total = testimonials.length;

  // Slide navigation
  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setSlideDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setSlideDirection(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToSlide = useCallback((index) => {
    if (total <= 1) return;
    setCurrentIndex((prev) => {
      setSlideDirection(index > prev ? 1 : -1);
      return index;
    });
  }, [total]);

  // Touch swipe support for mobile carousel
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null || total <= 1) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Only swipe if horizontal motion is significantly larger than vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Lightbox handlers
  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const prevLightbox = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setLightboxIndex((prev) => (prev - 1 + total) % total);
    },
    [total]
  );

  const nextLightbox = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setLightboxIndex((prev) => (prev + 1) % total);
    },
    [total]
  );

  // Background body scroll locking when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [lightboxIndex]);

  // Lightbox keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevLightbox();
      } else if (e.key === 'ArrowRight') {
        nextLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, closeLightbox, prevLightbox, nextLightbox]);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const currentItem = testimonials[currentIndex % total];
  const activeLightboxItem = lightboxIndex !== null ? testimonials[lightboxIndex] : null;
  const currentImgUrl = resolveMediaUrl(currentItem?.imageUrl || currentItem?.image_url);

  // Slide transition variants
  const slideVariants = {
    enter: (direction) => ({
      x: shouldReduceMotion ? 0 : direction > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (direction) => ({
      x: shouldReduceMotion ? 0 : direction > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.985,
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.25,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <section
      className="w-full bg-[#F5F0E5] py-14 sm:py-20 lg:py-24 border-b border-[#E3D9C3] relative overflow-hidden"
      aria-label="Customer Testimonials"
    >
      {/* Subtle atmospheric ambient glow */}
      <div
        className="pointer-events-none absolute -top-32 right-0 w-[420px] h-[420px] bg-[#C49A45]/06 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-0 w-[420px] h-[420px] bg-[#173A2D]/05 rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Main Wide Editorial Container (1120px - 1240px desktop grid) */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Editorial Storytelling & Context (5 cols desktop)            */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 mb-3 sm:mb-3.5"
            >
              <span className="w-6 sm:w-8 h-px bg-[#C49A45]" aria-hidden="true" />
              <span className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-semibold text-[#C49A45]">
                REAL TRAVEL EXPERIENCES
              </span>
            </motion.div>

            {/* Main Heading (Cormorant Garamond) */}
            <motion.h2
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.25rem] font-normal text-[#173A2D] leading-[1.08] tracking-tight"
            >
              Words From The Journey
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-[#3A4038] italic font-normal mt-3 sm:mt-4 leading-relaxed"
            >
              Experiences shared by the people who travelled with us.
            </motion.p>

            {/* Supporting Line */}
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm text-[#5C635B] font-normal mt-2 leading-relaxed"
            >
              Every journey leaves a story worth sharing. Authentic, unedited messages from our travelers across South India's trails and heritage landscapes.
            </motion.p>

            {/* Subtle Travel Route Motif / Coordinate Accent */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.26 }}
              className="mt-6 pt-5 border-t border-[#173A2D]/12 hidden sm:flex items-center gap-4 text-[#173A2D]/60 text-[11px] font-sans"
            >
              <div className="flex items-center gap-1.5 text-[#173A2D]/75">
                <Compass className="w-3.5 h-3.5 text-[#C49A45]" />
                <span className="tracking-wider uppercase text-[10px] font-medium">Verified Itineraries</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-[#C49A45]/60" />
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#5C635B]">
                <MapPin className="w-3 h-3 text-[#173A2D]/50" />
                <span>TN &middot; KL &middot; KA &middot; PY</span>
              </div>
            </motion.div>

            {/* Desktop Navigation & Indicator Cluster (Integrated on Left) */}
            {total > 1 && (
              <div className="mt-8 hidden lg:flex items-center gap-5">
                {/* Arrow Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous customer review"
                    className="w-10 h-10 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] hover:text-[#C49A45] flex items-center justify-center shadow-sm border border-[#C49A45]/30 focus:outline-none focus:ring-2 focus:ring-[#C49A45] transition-all duration-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 -ml-0.5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next customer review"
                    className="w-10 h-10 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] hover:text-[#C49A45] flex items-center justify-center shadow-sm border border-[#C49A45]/30 focus:outline-none focus:ring-2 focus:ring-[#C49A45] transition-all duration-200 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 -mr-0.5" />
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                  {/* Segmented Progress Bars */}
                  <div className="flex items-center gap-1.5">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to testimonial ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === currentIndex
                            ? 'w-6 bg-[#C49A45]'
                            : 'w-2 bg-[#173A2D]/20 hover:bg-[#173A2D]/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Single Large Featured Review Screenshot (7 cols desktop)     */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-end">
            {/* The Prominent Screenshot Frame */}
            <div
              className="relative w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[470px] xl:max-w-[490px]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Outer Warm-Stone Frame */}
              <div className="relative bg-[#ECE5D8] border border-[#173A2D]/12 rounded-2xl p-3 sm:p-4 shadow-[0_12px_36px_rgba(23,58,45,0.08),0_2px_8px_rgba(23,58,45,0.04)]">
                
                {/* Floating Previous Arrow on Left Edge (Quick Access) */}
                {total > 1 && (
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous customer review"
                    className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] hover:text-[#C49A45] flex items-center justify-center shadow-md border border-[#C49A45]/30 focus:outline-none focus:ring-2 focus:ring-[#C49A45] transition-all duration-200 cursor-pointer z-10 lg:hidden"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5" />
                  </button>
                )}

                {/* Floating Next Arrow on Right Edge (Quick Access) */}
                {total > 1 && (
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next customer review"
                    className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] hover:text-[#C49A45] flex items-center justify-center shadow-md border border-[#C49A45]/30 focus:outline-none focus:ring-2 focus:ring-[#C49A45] transition-all duration-200 cursor-pointer z-10 lg:hidden"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 -mr-0.5" />
                  </button>
                )}

                {/* Interactive Clickable Review Frame */}
                <button
                  type="button"
                  onClick={() => openLightbox(currentIndex)}
                  aria-label={`Enlarge review screenshot: ${currentItem?.title || 'Customer review'}`}
                  className="group relative w-full block text-left bg-[#FAF7F0] border border-[#173A2D]/10 hover:border-[#C49A45]/60 rounded-xl overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C49A45] cursor-pointer"
                >
                  {/* Portrait Screenshot Container: Height gives review readable clarity */}
                  <div className="relative w-full h-[400px] xs:h-[450px] sm:h-[500px] md:h-[540px] lg:h-[560px] xl:h-[590px] bg-[#E7E0D2] flex items-center justify-center overflow-hidden p-2 sm:p-3">
                    <AnimatePresence mode="wait" custom={slideDirection}>
                      <motion.div
                        key={currentItem?.id || currentIndex}
                        custom={slideDirection}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full h-full flex items-center justify-center"
                      >
                        <img
                          src={currentImgUrl}
                          alt={`WhatsApp customer review - ${currentItem?.title || 'Transit Story traveler experience'}`}
                          loading="eager"
                          className="w-full h-full object-contain object-center rounded transition-transform duration-300 ease-out group-hover:scale-[1.015] select-none"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Subtle Zoom Prompt on Hover */}
                    <div className="absolute inset-0 bg-[#173A2D]/15 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#173A2D]/90 text-[#F5F0E5] text-xs font-medium tracking-wide shadow-md">
                        <ZoomIn className="w-3.5 h-3.5 text-[#C49A45]" />
                        <span>Tap to read full review</span>
                      </span>
                    </div>
                  </div>

                  {/* Context Caption Strip Below Screenshot */}
                  <div className="w-full px-3.5 py-2.5 sm:py-3 bg-[#FAF7F0] border-t border-[#173A2D]/08 flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <h3 className="font-serif text-sm sm:text-base text-[#173A2D] font-medium truncate leading-tight">
                        {currentItem?.title || 'Traveler Experience'}
                      </h3>
                      {currentItem?.customerName && (
                        <p className="text-[11px] sm:text-xs text-[#5C635B] truncate mt-0.5">
                          {currentItem.customerName}
                        </p>
                      )}
                    </div>

                    <span className="flex-shrink-0 flex items-center gap-1 text-[11px] text-[#C49A45] font-medium">
                      <ZoomIn className="w-3 h-3" />
                      <span className="hidden sm:inline">Enlarge</span>
                    </span>
                  </div>
                </button>
              </div>

              {/* Mobile-Only Controls & Progress Strip (Below Frame) */}
              {total > 1 && (
                <div className="mt-4 flex lg:hidden items-center justify-between px-2 text-xs text-[#173A2D]">
                  {/* Previous / Next Small Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevSlide}
                      aria-label="Previous customer review"
                      className="w-8 h-8 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] flex items-center justify-center shadow-sm border border-[#C49A45]/30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      aria-label="Next customer review"
                      className="w-8 h-8 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] flex items-center justify-center shadow-sm border border-[#C49A45]/30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-1.5">
                    {testimonials.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentIndex
                            ? 'w-4 bg-[#C49A45]'
                            : 'w-1.5 bg-[#173A2D]/25'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL SCREENSHOT LIGHTBOX MODAL                                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {lightboxIndex !== null && activeLightboxItem && (
          <motion.div
            key="lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Full customer testimonial screenshot"
            className="fixed inset-0 z-[9999] bg-[#0E1F18]/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
          >
            {/* Top Bar: Title & Close Button */}
            <div className="absolute top-3 sm:top-5 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-between z-30 pointer-events-none">
              <div className="pointer-events-auto bg-[#173A2D]/85 border border-[#C49A45]/30 rounded-md px-3 sm:px-4 py-1.5 text-left text-xs sm:text-sm text-[#F5F0E5] shadow-lg max-w-[70vw] truncate">
                <span className="font-serif text-sm sm:text-base font-normal text-[#F5F0E5]">
                  {activeLightboxItem.title || 'Customer Experience Review'}
                </span>
                {activeLightboxItem.customerName && (
                  <span className="text-[#C49A45] text-xs ml-2 font-sans font-medium">
                    &middot; {activeLightboxItem.customerName}
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Close screenshot lightbox (Escape)"
                className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#173A2D] text-[#F5F0E5] hover:text-[#C49A45] hover:bg-[#1F4C3C] border border-[#C49A45]/35 flex items-center justify-center shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#C49A45] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Previous in Lightbox */}
            {total > 1 && (
              <button
                type="button"
                onClick={prevLightbox}
                aria-label="Previous screenshot (Left arrow)"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#173A2D]/80 hover:bg-[#173A2D] text-[#F5F0E5] hover:text-[#C49A45] border border-[#C49A45]/35 flex items-center justify-center shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#C49A45] cursor-pointer z-30"
              >
                <ChevronLeft className="w-6 h-6 -ml-0.5" />
              </button>
            )}

            {/* Main Full Screenshot Presentation Container */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()} // Clicking the image container does not close the lightbox
              className="relative max-h-[86vh] sm:max-h-[88vh] max-w-[92vw] sm:max-w-[78vw] md:max-w-[65vw] lg:max-w-[500px] flex flex-col items-center justify-center overflow-hidden rounded-lg sm:rounded-xl bg-[#091510] border border-[#C49A45]/30 shadow-2xl z-20"
            >
              <img
                src={resolveMediaUrl(activeLightboxItem.imageUrl || activeLightboxItem.image_url)}
                alt={`Full WhatsApp customer review - ${activeLightboxItem.title || 'The Transit Story review'}`}
                className="max-h-[82vh] sm:max-h-[84vh] w-auto max-w-full object-contain block select-none pointer-events-auto"
              />
            </motion.div>

            {/* Navigation Next in Lightbox */}
            {total > 1 && (
              <button
                type="button"
                onClick={nextLightbox}
                aria-label="Next screenshot (Right arrow)"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#173A2D]/80 hover:bg-[#173A2D] text-[#F5F0E5] hover:text-[#C49A45] border border-[#C49A45]/35 flex items-center justify-center shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#C49A45] cursor-pointer z-30"
              >
                <ChevronRight className="w-6 h-6 -mr-0.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
