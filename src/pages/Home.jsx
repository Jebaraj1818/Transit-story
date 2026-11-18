import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bus,
  Hotel,
  Compass,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
  Factory,
  Sparkles,
  ArrowRight,
  Route,
  ArrowUpRight,
  BookOpen,
  Feather,
  Clock,
  Check,
} from 'lucide-react';
import Button from '../components/Button';
import SectionHeading from '../components/SectionHeading';
import { DESTINATIONS } from '../data/destinations';
import { subscribeNewsletter, getJourneyIdeas, getSiteSettings, getCategories } from '../api/client';
import { resolveMediaUrl } from '../utils/media';
import TestimonialsGallery from '../components/TestimonialsGallery';

// Helper to resolve responsive WebP variants for hero slides, while preserving fallbacks and external URLs
function getHeroSlideSources(url, defaultBase) {
  const resolved = resolveMediaUrl(url, defaultBase);
  if (!resolved || resolved.includes('hero01')) {
    return {
      src: '/images/hero/hero01.webp',
      srcMobile: '/images/hero/hero01-mobile.webp',
      srcDesktop: '/images/hero/hero01.webp',
      fallback: '/images/hero/hero01.jpg',
    };
  }
  if (resolved.includes('hero-02')) {
    return {
      src: '/images/hero/hero-02.webp',
      srcMobile: '/images/hero/hero-02-mobile.webp',
      srcDesktop: '/images/hero/hero-02.webp',
      fallback: '/images/hero/hero-02.jpg',
    };
  }
  if (resolved.includes('hero-video-poster')) {
    return {
      src: '/images/hero/hero-video-poster.webp',
      srcMobile: '/images/hero/hero-video-poster-mobile.webp',
      srcDesktop: '/images/hero/hero-video-poster.webp',
      fallback: '/images/hero/hero-video-poster.jpg',
    };
  }
  // External or Vercel Blob URL (e.g. customized in site settings)
  return {
    src: resolved,
    srcMobile: resolved,
    srcDesktop: resolved,
    fallback: resolved,
  };
}

// Helper to resolve responsive WebP variants for College IV slides, while preserving fallbacks and external URLs
function getCollegeIvSlideSources(url, defaultBase) {
  const resolved = resolveMediaUrl(url, defaultBase);
  if (!resolved || resolved.includes('kerala-arts-crafts-village-04')) {
    return {
      image: '/images/kerala-arts-crafts-village-04.webp',
      imageMobile: '/images/kerala-arts-crafts-village-04-mobile.webp',
      imageDesktop: '/images/kerala-arts-crafts-village-04.webp',
      fallback: '/images/kerala-arts-crafts-village-04.jpg',
    };
  }
  if (resolved.includes('kerala-arts-crafts-village-01')) {
    return {
      image: '/images/kerala-arts-crafts-village-01-alt.webp',
      imageMobile: '/images/kerala-arts-crafts-village-01-alt-mobile.webp',
      imageDesktop: '/images/kerala-arts-crafts-village-01-alt.webp',
      fallback: '/images/kerala-arts-crafts-village-01-alt.jpg',
    };
  }
  if (resolved.includes('koodankulam')) {
    return {
      image: '/images/koodankulam-nuclear-plant-01.webp',
      imageMobile: '/images/koodankulam-nuclear-plant-01-mobile.webp',
      imageDesktop: '/images/koodankulam-nuclear-plant-01.webp',
      fallback: '/images/koodankulam-nuclear-plant-01.jpg',
    };
  }
  return {
    image: resolved,
    imageMobile: resolved,
    imageDesktop: resolved,
    fallback: resolved,
  };
}

// Order: 1. Photo (4.5s) -> 2. Photo (4.5s) -> 3. Photo (4.5s) -> Loop
const DEFAULT_HERO_SLIDES = [
  {
    id: 'hero-photo-1',
    type: 'image',
    src: '/images/hero/hero01.webp',
    srcMobile: '/images/hero/hero01-mobile.webp',
    srcDesktop: '/images/hero/hero01.webp',
    fallback: '/images/hero/hero01.jpg',
    alt: 'Ancient Dravidian temple architecture and heritage journey',
    duration: 4500,
  },
  {
    id: 'hero-photo-2',
    type: 'image',
    src: '/images/hero/hero-video-poster.webp',
    srcMobile: '/images/hero/hero-video-poster-mobile.webp',
    srcDesktop: '/images/hero/hero-video-poster.webp',
    fallback: '/images/hero/hero-video-poster.jpg',
    alt: 'Scenic mountain landscape and winding hill roads',
    duration: 4500,
  },
  {
    id: 'hero-photo-3',
    type: 'image',
    src: '/images/hero/hero-02.webp',
    srcMobile: '/images/hero/hero-02-mobile.webp',
    srcDesktop: '/images/hero/hero-02.webp',
    fallback: '/images/hero/hero-02.jpg',
    alt: 'Cultural exploration and curated travel destinations',
    duration: 4500,
  },
];

const DEFAULT_COLLEGE_IV_SLIDES = [
  {
    num: '01',
    total: '03',
    name: 'KERALA ARTS & CRAFTS VILLAGE',
    location: 'Kovalam, Thiruvananthapuram',
    image: '/images/kerala-arts-crafts-village-04.webp',
    imageMobile: '/images/kerala-arts-crafts-village-04-mobile.webp',
    imageDesktop: '/images/kerala-arts-crafts-village-04.webp',
    fallback: '/images/kerala-arts-crafts-village-04.jpg',
    alt: 'Kerala Arts and Crafts Village Kovalam cultural artisan craft exhibition',
    position: 'center 35%',
  },
  {
    num: '02',
    total: '03',
    name: 'KERALA ARTS & CRAFTS VILLAGE',
    location: 'Kovalam, Thiruvananthapuram',
    image: '/images/kerala-arts-crafts-village-01-alt.webp',
    imageMobile: '/images/kerala-arts-crafts-village-01-alt-mobile.webp',
    imageDesktop: '/images/kerala-arts-crafts-village-01-alt.webp',
    fallback: '/images/kerala-arts-crafts-village-01-alt.jpg',
    alt: 'Kerala Arts and Crafts Village architecture and craft pavilions',
    position: 'center 35%',
  },
  {
    num: '03',
    total: '03',
    name: 'KOODANKULAM NUCLEAR POWER PLANT',
    location: 'Koodankulam, Tamil Nadu',
    image: '/images/koodankulam-nuclear-plant-01.webp',
    imageMobile: '/images/koodankulam-nuclear-plant-01-mobile.webp',
    imageDesktop: '/images/koodankulam-nuclear-plant-01.webp',
    fallback: '/images/koodankulam-nuclear-plant-01.jpg',
    alt: 'Koodankulam Nuclear Power Plant industrial engineering installation',
    position: 'center 35%',
  },
];

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);
  const [collegeIvSlides, setCollegeIvSlides] = useState(DEFAULT_COLLEGE_IV_SLIDES);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [prevHeroSlideIndex, setPrevHeroSlideIndex] = useState(0);
  const heroTouchStartX = useRef(null);

  // Dynamically load media from SiteSettings with seamless fallback to committed local assets
  useEffect(() => {
    let isMounted = true;
    getSiteSettings()
      .then((settings) => {
        if (!isMounted || !settings) return;

        const s1 = getHeroSlideSources(settings.homepage_hero_photo_1, '/images/hero/hero01.webp');
        const s2 = getHeroSlideSources(settings.homepage_hero_photo_2, '/images/hero/hero-video-poster.webp');
        const s3 = getHeroSlideSources(settings.homepage_hero_photo_3, '/images/hero/hero-02.webp');

        setHeroSlides([
          {
            id: 'hero-photo-1',
            type: 'image',
            ...s1,
            alt: 'Ancient Dravidian temple architecture and heritage journey',
            duration: 4500,
          },
          {
            id: 'hero-photo-2',
            type: 'image',
            ...s2,
            alt: 'Scenic mountain landscape and winding hill roads',
            duration: 4500,
          },
          {
            id: 'hero-photo-3',
            type: 'image',
            ...s3,
            alt: 'Cultural exploration and curated travel destinations',
            duration: 4500,
          },
        ]);

        const iv1 = getCollegeIvSlideSources(settings.college_iv_slide_1, '/images/kerala-arts-crafts-village-04.webp');
        const iv2 = getCollegeIvSlideSources(settings.college_iv_slide_2, '/images/kerala-arts-crafts-village-01-alt.webp');
        const iv3 = getCollegeIvSlideSources(settings.college_iv_slide_3, '/images/koodankulam-nuclear-plant-01.webp');

        setCollegeIvSlides([
          {
            num: '01',
            total: '03',
            name: 'KERALA ARTS & CRAFTS VILLAGE',
            location: 'Kovalam, Thiruvananthapuram',
            ...iv1,
            alt: 'Kerala Arts and Crafts Village Kovalam cultural artisan craft exhibition',
            position: 'center 35%',
          },
          {
            num: '02',
            total: '03',
            name: 'KERALA ARTS & CRAFTS VILLAGE',
            location: 'Kovalam, Thiruvananthapuram',
            ...iv2,
            alt: 'Kerala Arts and Crafts Village architecture and craft pavilions',
            position: 'center 35%',
          },
          {
            num: '03',
            total: '03',
            name: 'KOODANKULAM NUCLEAR POWER PLANT',
            location: 'Koodankulam, Tamil Nadu',
            ...iv3,
            alt: 'Koodankulam Nuclear Power Plant industrial engineering installation',
            position: 'center 35%',
          },
        ]);
      })
      .catch((err) => {
        console.warn('Notice: Using default local assets for homepage media.', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const nextHeroSlide = useCallback(() => {
    setCurrentHeroSlide((curr) => {
      setPrevHeroSlideIndex(curr);
      return (curr + 1) % heroSlides.length;
    });
  }, [heroSlides.length]);

  const prevHeroSlide = useCallback(() => {
    setCurrentHeroSlide((curr) => {
      setPrevHeroSlideIndex(curr);
      return (curr - 1 + heroSlides.length) % heroSlides.length;
    });
  }, [heroSlides.length]);

  const selectHeroSlide = (idx) => {
    setPrevHeroSlideIndex(currentHeroSlide);
    setCurrentHeroSlide(idx);
  };

  const handleHeroTouchStart = (e) => {
    heroTouchStartX.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e) => {
    if (heroTouchStartX.current === null) return;
    const diff = heroTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextHeroSlide();
      else prevHeroSlide();
    }
    heroTouchStartX.current = null;
  };

  // Targeted preload & decoding for upcoming hero slide image well before slide finishes
  // Avoids downloading all images on mobile; starts after 1.2s so LCP is protected, and decodes in background
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIdx = (currentHeroSlide + 1) % heroSlides.length;
      const nextSlide = heroSlides[nextIdx];
      if (nextSlide && nextSlide.type === 'image') {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const targetSrc = isMobile ? (nextSlide.srcMobile || nextSlide.src) : (nextSlide.srcDesktop || nextSlide.src);
        if (targetSrc) {
          const img = new Image();
          img.src = targetSrc;
          if (img.decode) {
            img.decode().catch(() => {});
          }
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentHeroSlide, heroSlides]);

  // Slideshow Timing Lifecycle (4.5s per slide with crisp crossfade)
  useEffect(() => {
    const activeSlide = heroSlides[currentHeroSlide];
    if (!activeSlide) return;

    const photoTimer = setTimeout(() => {
      nextHeroSlide();
    }, activeSlide.duration || 4500);

    return () => {
      clearTimeout(photoTimer);
    };
  }, [currentHeroSlide, nextHeroSlide, heroSlides]);

  // Interactive Services State
  const [activeService, setActiveService] = useState(0);

  // Interactive Journey Route State (Section 6: How It Works)
  const [hoveredStep, setHoveredStep] = useState(null);

  const [currentIvSlide, setCurrentIvSlide] = useState(0);
  const [prevIvSlideIndex, setPrevIvSlideIndex] = useState(0);
  const [isIvSliderPaused, setIsIvSliderPaused] = useState(false);

  const nextIvSlide = useCallback(() => {
    setCurrentIvSlide((curr) => {
      setPrevIvSlideIndex(curr);
      return (curr + 1) % collegeIvSlides.length;
    });
  }, [collegeIvSlides.length]);

  const prevIvSlide = useCallback(() => {
    setCurrentIvSlide((curr) => {
      setPrevIvSlideIndex(curr);
      return (curr - 1 + collegeIvSlides.length) % collegeIvSlides.length;
    });
  }, [collegeIvSlides.length]);

  // Autoplay College IV Cinematic Carousel every 4.5s with Pause on Hover & Reset on Manual Change
  useEffect(() => {
    if (isIvSliderPaused) return;
    const timer = setInterval(() => {
      nextIvSlide();
    }, 4500);
    return () => clearInterval(timer);
  }, [isIvSliderPaused, nextIvSlide]);

  // Targeted preload & decoding for upcoming College IV slide shortly before needed
  // Avoids downloading all full-resolution images at once on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIdx = (currentIvSlide + 1) % collegeIvSlides.length;
      const nextSlide = collegeIvSlides[nextIdx];
      if (nextSlide) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const targetSrc = isMobile ? (nextSlide.imageMobile || nextSlide.image) : (nextSlide.imageDesktop || nextSlide.image);
        if (targetSrc) {
          const img = new Image();
          img.src = targetSrc;
          if (img.decode) {
            img.decode().catch(() => {});
          }
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentIvSlide, collegeIvSlides]);

  const ivTouchStartX = useRef(null);
  const handleIvTouchStart = (e) => {
    ivTouchStartX.current = e.touches[0].clientX;
  };
  const handleIvTouchEnd = (e) => {
    if (ivTouchStartX.current === null) return;
    const diff = ivTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextIvSlide();
      else prevIvSlide();
    }
    ivTouchStartX.current = null;
  };

  // Curated Journey Ideas State from Flask API with in-memory fallback
  const [journeyIdeas, setJourneyIdeas] = useState(() => DESTINATIONS);

  useEffect(() => {
    let isMounted = true;
    getJourneyIdeas().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setJourneyIdeas(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // 'idle' | 'loading' | 'success'
  const [newsletterError, setNewsletterError] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@') || !newsletterEmail.includes('.')) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }
    setNewsletterError('');
    setNewsletterStatus('loading');
    try {
      await subscribeNewsletter(newsletterEmail);
    } catch (err) {
      console.warn('Newsletter API notice:', err);
    } finally {
      setNewsletterStatus('success');
    }
  };


  // 1. Service Discovery Categories (What Are You Planning?)
  const DEFAULT_PLANNING_CATEGORIES = [
    {
      id: 'cultural',
      slug: 'cultural-heritage',
      title: 'Cultural & Heritage Journeys',
      subtitle: 'Living Architecture & Artisanal Roots',
      desc: 'Ancient Dravidian temple corridors, 19th-century merchant mansions, lost-wax bronze studios, and handloom traditions across Tamil Nadu.',
      image: '/images/nellaiyappar-temple-02.jpg',
      link: '/tours?category=cultural-heritage',
      number: '01',
      span: 'lg:col-span-7',
      ctaText: 'Explore Cultural Tours',
    },
    {
      id: 'college-iv',
      slug: 'college-educational',
      title: 'College & Educational Tours',
      subtitle: 'Industrial Visits & Curriculum Travel',
      desc: 'Coordinated student travel for colleges and departments — combining industrial facility visits, science landmarks, and team exploration.',
      image: '/images/koodankulam-nuclear-plant-01.jpg',
      link: '/tours?category=college-educational',
      number: '02',
      span: 'lg:col-span-5',
      ctaText: 'Explore Educational Tours',
    },
    {
      id: 'leisure',
      slug: 'leisure-holiday',
      title: 'Leisure & Holiday Tours',
      subtitle: 'Highland Retreats & Serene Waters',
      desc: 'Misty tea estates in the Nilgiris, quiet pine walks in Kodaikanal, and cascading mountain waterfalls in Courtallam.',
      image: '/images/kutralam-01.webp',
      link: '/tours?category=leisure-holiday',
      number: '03',
      span: 'lg:col-span-5',
      ctaText: 'Explore Holiday Journeys',
    },
    {
      id: 'group-custom',
      slug: 'group-custom',
      title: 'Group & Custom Trips',
      subtitle: 'Tailored Formats & Private Transit',
      desc: 'Family gatherings, alumni groups, or custom friend getaways. You decide the destinations and duration; we coordinate the complete logistics.',
      image: '/images/wonderla-group-escapes-01.jpg',
      link: '/tours?category=group-custom',
      number: '04',
      span: 'lg:col-span-7',
      ctaText: 'Plan Your Custom Trip',
    },
  ];

  const [planningCategories, setPlanningCategories] = useState(DEFAULT_PLANNING_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    getCategories().then((cats) => {
      if (isMounted && Array.isArray(cats) && cats.length > 0) {
        setPlanningCategories((prev) =>
          prev.map((item) => {
            const matched = cats.find((c) => c.slug === item.slug || c.id === item.slug);
            if (matched && matched.description) {
              return {
                ...item,
                desc: matched.description,
                image: matched.coverImage || item.image,
              };
            }
            return item;
          })
        );
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Interactive Services List (What We Arrange) - with optimized responsive WebP assets
  const servicesList = [
    {
      title: 'Transportation',
      eyebrow: 'Transit Coordination',
      desc: 'Dedicated AC tourist buses, tempo travelers, and reliable private vehicles with experienced drivers for intercity and regional travel.',
      image: '/images/services/home-transportation.jpg',
      imageWebp: '/images/services/home-transportation.webp',
      imageMobile: '/images/services/home-transportation-mobile.webp',
      tag: 'Buses • Vans • Intercity Transfers',
    },
    {
      title: 'Hotels & Stays',
      eyebrow: 'Accommodation Booking',
      desc: 'Heritage homestays, comfortable star hotels, student-friendly group accommodations, or serene backwater houseboats.',
      image: '/images/services/home-hotels-stays.jpg',
      imageWebp: '/images/services/home-hotels-stays.webp',
      imageMobile: '/images/services/home-hotels-stays-mobile.webp',
      tag: 'Homestays • Star Hotels • Houseboats',
    },
    {
      title: 'Itinerary Planning',
      eyebrow: 'Custom Pacing & Flow',
      desc: 'Carefully tailored day-wise schedules designed around your group rhythm — ensuring balanced travel without rushed stops.',
      image: '/images/services/home-itinerary-planning.jpg',
      imageWebp: '/images/services/home-itinerary-planning.webp',
      imageMobile: '/images/services/home-itinerary-planning-mobile.webp',
      tag: 'Route Flow • Custom Timing & Pacing',
    },
    {
      title: 'Experiences & Activities',
      eyebrow: 'Curated Access',
      desc: 'Temple access coordination, artisanal craft workshop entries, nature walks, boat cruises, and amusement park passes.',
      image: '/images/services/home-experiences-activities.jpg',
      imageWebp: '/images/services/home-experiences-activities.webp',
      imageMobile: '/images/services/home-experiences-activities-mobile.webp',
      tag: 'Guided Walks • Cultural Access • Passes',
    },
    {
      title: 'Group Arrangements',
      eyebrow: 'End-to-End Coordination',
      desc: 'Seamless management for large college batches, institutions, and extended family groups with dedicated logistical oversight.',
      image: '/images/services/home-group-arrangements.jpg',
      imageWebp: '/images/services/home-group-arrangements.webp',
      imageMobile: '/images/services/home-group-arrangements-mobile.webp',
      tag: 'College Groups • Family & Alumni Formats',
    },
  ];

  // Pre-warm Services images when visitor approaches the Services section (350px before entering viewport)
  useEffect(() => {
    const section = document.getElementById('services');
    if (!section || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const isMobile = window.innerWidth <= 768;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          servicesList.forEach((s) => {
            const img = new Image();
            img.src = isMobile ? (s.imageMobile || s.imageWebp || s.image) : (s.imageWebp || s.image);
          });
          observer.disconnect();
        }
      },
      { rootMargin: '350px' }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // 3. How It Works Steps (Editorial Journey Progression)
  const steps = [
    {
      num: '01',
      stage: 'Idea',
      kicker: 'TELL US WHERE',
      title: 'Tell us where you want to go',
      desc: 'Share your desired destination, travel dates, and travel interests.',
    },
    {
      num: '02',
      stage: 'Requirements',
      kicker: 'TELL US WHAT YOU NEED',
      title: 'Tell us what you need',
      desc: 'Select what to arrange: transport, hotel category, itinerary pacing, or group size.',
    },
    {
      num: '03',
      stage: 'Arrangement',
      kicker: 'WE ARRANGE',
      title: 'We arrange the journey',
      desc: 'We coordinate the transit, accommodation, and build your custom schedule.',
    },
    {
      num: '04',
      stage: 'Journey',
      kicker: 'YOU TRAVEL',
      title: 'You travel',
      desc: 'Enjoy a well-arranged journey tailored specifically to your needs.',
    },
  ];

  return (
    <div className="flex flex-col pb-0">
      {/* ========================================================================= */}
      {/* SECTION 1 — CINEMATIC HERO (Full Media Layer with Motion System)          */}
      {/* ========================================================================= */}
      <section
        className="relative w-full h-[68vh] sm:h-[72vh] min-h-[470px] md:h-auto md:min-h-[86vh] flex flex-col justify-between overflow-hidden bg-forest-950 select-none"
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
      >
        {/* MEDIA LAYER: Cinematic Crossfade Slideshow (Photo 1 -> Photo 2 -> Photo 3) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-[#13271F]">
          {heroSlides.map((slide, idx) => {
            const isCurrent = idx === currentHeroSlide;
            const isPrev = idx === prevHeroSlideIndex && !isCurrent;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full overflow-hidden will-change-[opacity] transform-gpu ${
                  isCurrent
                    ? 'opacity-100 z-10 transition-opacity duration-700 motion-reduce:transition-none ease-in-out'
                    : isPrev
                      ? 'opacity-100 z-0'
                      : 'opacity-0 z-0 pointer-events-none'
                }`}
                aria-hidden={!isCurrent}
              >
                <picture className="absolute inset-0 w-full h-full">
                  {slide.srcMobile && (
                    <source media="(max-width: 768px)" srcSet={slide.srcMobile} type="image/webp" />
                  )}
                  {slide.srcDesktop && (
                    <source media="(min-width: 769px)" srcSet={slide.srcDesktop} type="image/webp" />
                  )}
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchpriority={idx === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover object-center transform scale-100"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      minWidth: '100%',
                      minHeight: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                    onError={(e) => {
                      if (slide.fallback && e.currentTarget.src !== slide.fallback && !e.currentTarget.src.endsWith(slide.fallback)) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = slide.fallback;
                      }
                    }}
                  />
                </picture>
              </div>
            );
          })}

          {/* Subtle Localized Readability Gradient: Only behind text on left, fading to 100% transparent */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[50%] bg-gradient-to-r from-black/55 via-black/25 to-transparent z-10 pointer-events-none" />

          {/* Subtle Top feather for navbar contrast */}
          <div className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />

          {/* Soft Bottom Transition to Warm Ivory Page Body */}
          <div className="absolute bottom-0 left-0 right-0 h-8 md:h-16 bg-gradient-to-t from-[#F5F0E5]/40 md:from-[#F5F0E5] via-transparent to-transparent z-10 pointer-events-none" />
        </div>

        {/* HERO CONTENT CONTAINER: Magazine Cover Composition */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-6 sm:pt-16 md:pt-24 pb-4 sm:pb-8 md:pb-10 flex-1 flex flex-col justify-between">
          {/* Main Editorial Text Block - max-w-[540px] (~40% width on desktop) */}
          <div className="max-w-[340px] sm:max-w-[480px] md:max-w-[540px] pt-1 sm:pt-4 md:pt-6">
            {/* Small Eyebrow: Subtle and Refined */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 text-[10.5px] sm:text-xs tracking-expansive uppercase text-gold font-medium mb-2 sm:mb-4 drop-shadow-sm"
            >
              <span className="w-6 h-px bg-gold/70" aria-hidden="true" />
              <span>YOUR JOURNEY. YOUR WAY.</span>
            </motion.div>

            {/* Main Heading: Refined Editorial Serif (52–64px desktop, 44–52px tablet, 32–42px mobile clamp) */}
            <motion.h1
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2rem,4vw+1rem,2.5rem)] sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.65rem] font-normal text-ivory leading-[1.08] sm:leading-[1.06] tracking-tight text-balance mb-2.5 sm:mb-5 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
            >
              <span className="block">You Choose The Journey.</span>
              <span className="block italic font-light text-ivory/95">We Arrange The Rest.</span>
            </motion.h1>

            {/* Supporting Prose: Smaller & Quieter */}
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-ivory/85 leading-snug sm:leading-relaxed font-normal max-w-[320px] sm:max-w-md mb-3.5 sm:mb-7 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
            >
              From custom routes and private transport to stays and local experiences across South India.
            </motion.p>

            {/* Editorial Action Lockup: Natural visual hierarchy, zero boxed-template feel */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 sm:gap-6 pt-1 sm:pt-2 flex-wrap"
            >
              {/* Primary: Tactile, confident ivory pill button */}
              <Link
                to="/plan-your-journey"
                className="group inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-ivory text-forest font-sans text-xs uppercase tracking-[0.16em] font-medium transition-all duration-300 hover:bg-[#C49A45] hover:text-forest-950 shadow-sm active:scale-[0.98] select-none"
              >
                <span>Plan Your Journey</span>
                <ArrowRight className="w-3.5 h-3.5 text-forest group-hover:text-forest-950 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary: Elegant, unboxed editorial text link with refined underline */}
              <Link
                to="/tours"
                className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-ivory/90 hover:text-[#C49A45] transition-colors py-2 px-1 select-none"
              >
                <span className="border-b border-ivory/35 group-hover:border-[#C49A45] pb-0.5 transition-colors">
                  Explore Places
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C49A45] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Bottom Editorial Bar & Scroll Anchor with Subtle Premium Controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.85 }}
            className="pt-2 sm:pt-6 md:pt-10 mt-3 sm:mt-8 md:mt-12 border-t border-ivory/15 flex items-center justify-between gap-2 sm:gap-3 text-ivory/75 text-xs font-sans"
          >
            {/* Scroll Indicator: Gentle Floating Loop */}
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0"
              onClick={() => {
                const el = document.getElementById('planning-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="w-5 sm:w-6 h-px bg-gold/60 hidden sm:inline-block" aria-hidden="true" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-editorial sm:tracking-expansive text-ivory/90 font-medium whitespace-nowrap">
                Scroll to Explore
              </span>
            </motion.div>

            {/* Subtle Premium Hero Slideshow Indicator Dots */}
            <div className="flex items-center bg-black/40 backdrop-blur-md px-3 sm:px-3.5 py-2 rounded-full border border-ivory/20 shadow-lg flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => selectHeroSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 focus:outline-none ${idx === currentHeroSlide
                      ? 'w-6 bg-gold'
                      : 'w-1.5 bg-ivory/40 hover:bg-ivory/70'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Editorial Badges */}
            <div className="hidden lg:flex items-center gap-6 text-[11px] uppercase tracking-editorial text-ivory/65">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Custom Itineraries
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Dedicated Transport & Stays
              </span>
            </div>

            {/* Geographic Coordinates Label */}
            <div className="text-[10px] uppercase tracking-kicker text-gold/80 font-mono hidden sm:block">
              8°43'N 77°42'E // S. INDIA
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — "WHAT ARE YOU PLANNING?" (Asymmetric Image-First Grid)        */}
      {/* ========================================================================= */}
      <section id="planning-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-14 sm:py-20">
        {/* Section Header: Editorial Heading System (Variant A) */}
        <SectionHeading
          eyebrow="TAILORED ARRANGEMENTS"
          title="What Are You *Planning?*"
          subtitle="Curated Travel Styles & Regional Focus"
          description="Every trip is arranged around your timeline, group size, and interests. Select your travel style below and let us organize the logistics."
          variant="editorial-left"
          action={
            <Link
              to="/plan-your-journey"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-kicker font-semibold text-forest hover:text-earth transition-colors pb-1 border-b border-forest/30 hover:border-forest focus-visible:outline-gold"
            >
              <span>Start Customizing</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-gold" />
            </Link>
          }
        />

        {/* Asymmetric 4-Part Editorial Grid with Staggered Entrance (De-boxed, photography-first) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {planningCategories.map((cat, idx) => (
            <motion.article
              key={cat.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.7,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`${cat.span} group relative flex flex-col bg-transparent`}
            >
              {/* Image Frame: Natural Landscape Proportions, Clean Edge */}
              <Link
                to={cat.link}
                className="relative aspect-[16/10] sm:aspect-[16/10] overflow-hidden rounded-sm block bg-forest/10 focus-visible:outline-gold"
                tabIndex={-1}
                aria-hidden="true"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-ivory/90 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-sm border border-ivory/15 shadow-sm">
                    {cat.number}
                  </span>
                </div>
              </Link>

              {/* Details: Natural typography directly on the canvas without card enclosure */}
              <div className="flex flex-col flex-1 pt-4 sm:pt-5 pb-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-gold font-semibold mb-1.5">
                  {cat.subtitle}
                </div>

                <h3 className="font-serif text-2xl sm:text-[1.75rem] font-medium text-forest leading-snug mb-2 group-hover:text-forest-900 transition-colors">
                  <Link to={cat.link} className="focus-visible:outline-gold">
                    {cat.title}
                  </Link>
                </h3>

                <p className="text-xs sm:text-[14px] text-charcoal-muted leading-relaxed font-normal mb-4 flex-1">
                  {cat.desc}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    to={cat.link}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest group-hover:text-gold transition-colors focus-visible:outline-gold"
                  >
                    <span className="border-b border-forest/30 group-hover:border-gold pb-0.5 transition-colors">
                      {cat.ctaText || 'Explore Category'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
                  </Link>
                  <span className="text-[10px] text-charcoal-light/80 font-mono uppercase tracking-wider">
                    Transit Story
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — INTERACTIVE SERVICES SECTION (Subtle Parchment Rhythm Canvas)  */}
      {/* ========================================================================= */}
      <section id="services" className="w-full bg-[#F7F3EA] border-y border-[#E5DCBE] py-16 sm:py-24 my-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Section Header: Editorial Heading System (Variant A) */}
          <SectionHeading
            eyebrow="SERVICES & ARRANGEMENTS"
            title="Everything You Need *for the Journey*"
            subtitle="Coordinated Transport, Stays & Itinerary Logistics"
            description="One place to arrange the important parts of your trip. No need to manage disconnected vendors, separate bus charters, or unfamiliar hotel bookings."
            variant="editorial-left"
          />

          {/* Interactive Split View: List on Left (7 cols) + Dynamic Image Preview on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Services List Column with Animated Horizontal Dividers */}
            <div className="lg:col-span-7">
              {servicesList.map((service, index) => {
                const isActive = activeService === index;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {/* Clean Hairline Divider Line */}
                    {index > 0 && (
                      <div className="h-px bg-[#E0D8BD]/80 w-full" />
                    )}

                    <div
                      onMouseEnter={() => setActiveService(index)}
                      onClick={() => setActiveService(index)}
                      className="py-4 sm:py-5 cursor-pointer transition-all duration-300 group select-none"
                    >
                      <div className="flex items-center justify-between gap-4 transition-transform duration-300 group-hover:translate-x-1">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-px transition-colors duration-300 ${isActive ? 'bg-gold' : 'bg-earth/50'}`} aria-hidden="true" />
                            <span className={`text-[10px] sm:text-[11.5px] uppercase tracking-kicker font-semibold transition-colors ${isActive ? 'text-gold' : 'text-earth'}`}>
                              {service.eyebrow}
                            </span>
                          </div>

                          <h3
                            className={`font-serif text-xl sm:text-2xl lg:text-[1.75rem] font-medium transition-colors leading-snug ${isActive
                              ? 'text-forest font-semibold'
                              : 'text-forest/75 group-hover:text-forest'
                              }`}
                          >
                            {service.title}
                          </h3>

                          <p
                            className={`text-xs sm:text-[14px] text-charcoal-muted leading-relaxed font-normal transition-all duration-300 ${isActive ? 'block mt-2' : 'hidden sm:block sm:opacity-75'
                              }`}
                          >
                            {service.desc}
                          </p>

                          {/* Mobile Dedicated Service Visual Preview when active (Clean frameless reveal) */}
                          {isActive && (
                            <div className="block lg:hidden mt-3.5 rounded-sm overflow-hidden aspect-[16/10] bg-forest-950 relative shadow-sm">
                              <picture className="w-full h-full block">
                                <source srcSet={service.imageMobile || service.imageWebp || service.image} type="image/webp" />
                                <img
                                  src={service.image}
                                  alt={service.title}
                                  loading="eager"
                                  decoding="async"
                                  className="w-full h-full object-cover object-center"
                                />
                              </picture>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute bottom-3 left-3 text-ivory text-[11px] font-sans font-medium">
                                {service.tag}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex-shrink-0">
                          <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${isActive
                              ? 'border-forest bg-forest text-ivory shadow-sm'
                              : 'border-forest/20 text-forest/70 group-hover:border-forest group-hover:bg-forest group-hover:text-ivory'
                              }`}
                          >
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Active Gold Line Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="serviceActiveLine"
                          className="h-0.5 bg-gold mt-3.5 rounded-full w-14"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Dynamic Reveal Image Window (Right 5 cols) with Smooth Opacity Transition (Unboxed) */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative aspect-[4/3] lg:aspect-[4/3] rounded-sm overflow-hidden shadow-sm bg-forest-950">
                {servicesList.map((service, index) => {
                  const isCurrent = activeService === index;
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-out will-change-[opacity] ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                      aria-hidden={!isCurrent}
                    >
                      <picture className="w-full h-full block">
                        <source srcSet={service.imageWebp || service.image} type="image/webp" />
                        <img
                          src={service.image}
                          alt={service.title}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="w-full h-full object-cover object-center transform scale-100"
                        />
                      </picture>
                    </div>
                  );
                })}

                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-6 left-6 right-6 text-ivory">
                  <span className="text-[10px] uppercase tracking-kicker text-gold font-semibold block mb-1">
                    Arranged by Transit Story
                  </span>
                  <h4 className="font-serif text-xl sm:text-2xl font-medium text-ivory mb-1">
                    {servicesList[activeService].title}
                  </h4>
                  <p className="text-xs text-ivory/80 font-normal">
                    {servicesList[activeService].tag}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Custom Request Callout: Clean unboxed editorial row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 pt-6 border-t border-[#E0D8BD]/80 flex flex-col sm:flex-row items-center justify-between gap-5"
          >
            <p className="text-xs sm:text-[14px] text-charcoal-muted font-normal text-center sm:text-left max-w-xl">
              Have unique requirements for your family, student team, or group? We coordinate custom travel details.
            </p>
            <Link
              to="/plan-your-journey"
              className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-full bg-forest text-ivory text-xs uppercase tracking-editorial font-medium hover:bg-gold hover:text-forest-950 transition-all duration-300 shadow-sm flex-shrink-0 active:scale-[0.98] select-none"
            >
              <span>Customize Your Requirements</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — JOURNEY IDEAS (Asymmetric Editorial Destination Portfolio)     */}
      {/* ========================================================================= */}
      <section id="journey-ideas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-24">
        {/* Section Header: Editorial Heading System (Variant D: Oversized Display) */}
        <SectionHeading
          eyebrow="DESTINATION INSPIRATION"
          title="Journey Ideas *to Spark Your Travel*"
          subtitle="Curated Routes & Southern Horizons"
          description="These are not fixed packages. Choose any destination below, tell us your timeline, and we will build the itinerary and arrangements around your group."
          variant="oversized-display"
          action={
            <Link
              to="/tours"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-kicker font-semibold text-forest hover:text-earth transition-colors pb-1 border-b border-forest/30 hover:border-forest focus-visible:outline-gold"
            >
              <span>View All Tours</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-gold" />
            </Link>
          }
        />

        {journeyIdeas.length > 0 && (
          <div className="space-y-12 sm:space-y-16">
            {/* 1. Asymmetric Editorial Spotlight (First Destination) */}
            {(() => {
              const spotlight = journeyIdeas[0];
              const spotlightLink = `/tours/${spotlight.slug}`;
              return (
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
                >
                  {/* Immersive Photography (7 cols) */}
                  <div className="lg:col-span-7">
                    <Link
                      to={spotlightLink}
                      state={{ from: '/' }}
                      className="group relative aspect-[16/10] sm:aspect-[16/10] overflow-hidden rounded-sm block bg-forest/10 focus-visible:outline-gold shadow-sm"
                    >
                      <img
                        src={spotlight.coverImage}
                        alt={spotlight.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {spotlight.tag && (
                        <div className="absolute top-4 left-4">
                          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1 bg-black/50 backdrop-blur-md text-ivory rounded-sm border border-ivory/20 shadow-sm">
                            {spotlight.tag}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-ivory text-xs font-sans">
                        <span className="flex items-center gap-1.5 font-medium text-white drop-shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-gold" />
                          {spotlight.location}
                        </span>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-ivory/80">
                          Volume I · S. India
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Editorial Narrative Column (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em] text-gold font-semibold mb-2">
                      <span className="w-5 h-px bg-gold/70" aria-hidden="true" />
                      <span>FEATURED SPOTLIGHT</span>
                    </div>

                    <h3 className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] font-medium text-forest leading-[1.08] tracking-tight mb-3">
                      <Link
                        to={spotlightLink}
                        state={{ from: '/' }}
                        className="hover:text-forest-900 transition-colors focus-visible:outline-gold"
                      >
                        {spotlight.title}
                      </Link>
                    </h3>

                    <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal mb-6">
                      {spotlight.description}
                    </p>

                    <div className="flex items-center gap-6 pt-2 border-t border-[#E0D8BD]/70">
                      <Link
                        to={spotlightLink}
                        state={{ from: '/' }}
                        className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest hover:text-gold transition-colors focus-visible:outline-gold"
                      >
                        <span className="border-b border-forest/30 group-hover:border-gold pb-0.5 transition-colors">
                          Discover Journey
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
                      </Link>
                      <span className="text-[11px] text-charcoal-light/80 uppercase tracking-editorial font-mono">
                        Bespoke Pacing
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* 2. Companion Destinations: Open Editorial Gallery (3 Columns, Unboxed) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 pt-2">
              {journeyIdeas.slice(1, 4).map((dest, index) => {
                const destLink = `/tours/${dest.slug}`;

                return (
                  <motion.article
                    key={dest.id || dest.slug}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.65, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex flex-col bg-transparent"
                  >
                    <Link
                      to={destLink}
                      state={{ from: '/' }}
                      className="relative aspect-[16/10] overflow-hidden rounded-sm block bg-forest/10 focus-visible:outline-gold shadow-sm"
                    >
                      <img
                        src={dest.coverImage}
                        alt={dest.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-75 group-hover:opacity-55 transition-opacity" />

                      {dest.tag && (
                        <span className="absolute top-3 left-3 bg-black/45 backdrop-blur-md text-ivory text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-sm border border-ivory/20 shadow-sm">
                          {dest.tag}
                        </span>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-ivory text-xs font-sans">
                        <span className="flex items-center gap-1.5 font-medium truncate text-white drop-shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span className="truncate">{dest.location}</span>
                        </span>
                      </div>
                    </Link>

                    <div className="pt-4 flex flex-col flex-1">
                      <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-gold font-semibold mb-1">
                        {dest.location}
                      </div>

                      <h4 className="font-serif text-xl sm:text-2xl lg:text-[1.65rem] font-medium text-forest leading-snug mb-2 group-hover:text-forest-900 transition-colors">
                        <Link to={destLink} state={{ from: '/' }}>
                          {dest.title}
                        </Link>
                      </h4>

                      <p className="text-xs sm:text-[13.5px] text-charcoal-muted leading-relaxed font-normal mb-4 flex-1 line-clamp-2">
                        {dest.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between">
                        <Link
                          to={destLink}
                          state={{ from: '/' }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-forest group-hover:text-gold transition-colors"
                        >
                          <span className="border-b border-forest/30 group-hover:border-gold pb-0.5 transition-colors">
                            Explore Destination
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 5 — COLLEGE IV / INDUSTRIAL VISITS (Cinematic Full-Width Hero)    */}
      {/* ========================================================================= */}
      <section
        id="college-iv"
        className="relative w-full h-[60vh] sm:h-[74vh] lg:h-[78vh] min-h-[440px] sm:min-h-[520px] max-h-[820px] overflow-hidden bg-forest-950 select-none my-0 border-y border-[#1F4C3C]"
        onMouseEnter={() => setIsIvSliderPaused(true)}
        onMouseLeave={() => setIsIvSliderPaused(false)}
        onTouchStart={handleIvTouchStart}
        onTouchEnd={handleIvTouchEnd}
        aria-label="College IV and Industrial Visits"
      >
        {/* Full-bleed Cinematic Slideshow Background: 100% width, 100% height, object-fit: cover */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {collegeIvSlides.map((slide, idx) => {
            const isCurrent = idx === currentIvSlide;
            const isPrev = idx === prevIvSlideIndex && !isCurrent;

            return (
              <div
                key={slide.name + idx}
                className={`absolute inset-0 w-full h-full overflow-hidden will-change-[opacity] transform-gpu ${
                  isCurrent
                    ? 'opacity-100 z-[2] transition-opacity duration-700 motion-reduce:transition-none ease-in-out'
                    : isPrev
                      ? 'opacity-100 z-[1]'
                      : 'opacity-0 z-0 pointer-events-none'
                }`}
                aria-hidden={!isCurrent}
              >
                <picture className="w-full h-full">
                  {slide.imageMobile && (
                    <source media="(max-width: 768px)" srcSet={slide.imageMobile} type="image/webp" />
                  )}
                  {slide.imageDesktop && (
                    <source media="(min-width: 769px)" srcSet={slide.imageDesktop} type="image/webp" />
                  )}
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: slide.position || 'center 35%',
                    }}
                    onError={(e) => {
                      const fallback = DEFAULT_COLLEGE_IV_SLIDES[idx]?.image || DEFAULT_COLLEGE_IV_SLIDES[idx]?.fallback;
                      if (fallback && e.currentTarget.src !== fallback && !e.currentTarget.src.endsWith(fallback)) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </picture>
              </div>
            );
          })}

          {/* Subtle Localized Gradient: Shields text readability without darkening the whole photograph */}
          {/* Mobile: localized bottom gradient protecting text while leaving top/center image completely bright and natural */}
          <div className="absolute inset-x-0 bottom-0 h-[72%] sm:hidden bg-gradient-to-t from-[#0B1A14]/90 via-[#0B1A14]/35 to-transparent z-[3] pointer-events-none" />
          {/* Desktop: localized left gradient protecting left-side text while leaving right image 100% bright */}
          <div className="absolute inset-y-0 left-0 w-[55%] hidden sm:block bg-gradient-to-r from-[#0B1A14]/85 via-[#0B1A14]/35 to-transparent z-[3] pointer-events-none" />
          {/* Subtle top feather */}
          <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/25 to-transparent z-[3] pointer-events-none" />
        </div>

        {/* Content Container (Directly on Top of Full-Bleed Image — Zero White Margin, Zero Boxed Card) */}
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col justify-between pt-8 sm:pt-20 lg:pt-24 pb-5 sm:pb-12">
          {/* Center-Left / Lower-Left Focal Area: Eyebrow + Dominant Title + Compact Buttons */}
          <div className="max-w-[340px] sm:max-w-xl md:max-w-2xl space-y-2.5 sm:space-y-5 my-auto pt-4 sm:pt-0">
            {/* Small Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <span className="text-[9.5px] sm:text-[11.5px] uppercase font-medium tracking-[0.22em] text-[#C49A45]">
                COLLEGE IV / INDUSTRIAL VISITS
              </span>
              <span className="w-5 sm:w-8 h-px bg-[#C49A45]/50" aria-hidden="true" />
            </motion.div>

            {/* Dominant Editorial Heading: Mobile 32–38px clamp, Desktop 5xl/6xl untouched */}
            <motion.h2
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[clamp(2rem,3.5vw+1.25rem,2.375rem)] sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-normal text-[#F5F0E5] leading-[1.08] sm:leading-[1.02] tracking-tight drop-shadow-md"
            >
              <span className="block">From Classroom</span>
              <span className="block italic font-light text-[#C49A45] mt-0.5 sm:mt-2">
                to the Real World
              </span>
            </motion.h2>

            {/* Compact Supporting Text: 14px mobile, 16px desktop */}
            <motion.p
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="text-[13.5px] sm:text-base text-[#F5F0E5]/85 leading-snug sm:leading-relaxed font-normal max-w-[320px] sm:max-w-md drop-shadow-sm"
            >
              Curated academic expeditions and industrial immersions across South India.
            </motion.p>

            {/* Editorial Action Lockup: Natural hierarchy, unboxed design */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 sm:gap-6 pt-1 sm:pt-2 flex-wrap"
            >
              {/* Primary: Tactile, warm gold pill button */}
              <Link
                to="/tours?category=college-educational"
                className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#C49A45] hover:bg-[#D4B066] text-[#173A2D] font-sans text-xs uppercase tracking-[0.16em] font-semibold transition-all duration-300 shadow-sm active:scale-[0.98] select-none"
              >
                <span>Plan A College IV</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#173A2D] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* Secondary: Text-led editorial link with subtle underline */}
              <Link
                to="/tours"
                className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#F5F0E5]/90 hover:text-[#C49A45] transition-colors py-2 px-1 select-none"
              >
                <span className="border-b border-[#F5F0E5]/35 group-hover:border-[#C49A45] pb-0.5 transition-colors">
                  Explore Places
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C49A45] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Bottom Row: Slide-Specific Label */}
          <div className="flex items-end justify-between w-full pt-4">
            {/* Slide-Specific Subtle Editorial Label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIvSlide}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] sm:text-[10.5px] text-[#F5F0E5]/75 tracking-wider uppercase font-medium">
                    {collegeIvSlides[currentIvSlide].location}
                  </span>
                </div>
                <span className="font-serif text-sm sm:text-base text-[#F5F0E5] tracking-wide uppercase mt-0.5">
                  {collegeIvSlides[currentIvSlide].name}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Thin Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 z-20 overflow-hidden">
          <motion.div
            className="h-full bg-[#C49A45]"
            animate={{ width: `${((currentIvSlide + 1) / collegeIvSlides.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — HOW IT WORKS (Connected Sandstone Canvas Flow)                */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#F6F1E6] border-y border-[#E3DCBF] py-12 sm:py-16 lg:py-16 my-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Section Header: Editorial Heading System (Variant B: Centered) */}
          <SectionHeading
            eyebrow="HOW WE ARRANGE"
            title="How It *Works*"
            subtitle="Four Clear Steps From Concept to Travel Day"
            description="Planning a custom journey doesn’t require complex coordination. Four clear steps from concept to your travel day."
            variant="centered"
            className="mb-8 sm:mb-12"
          />

          {/* DESKTOP: Connected Editorial Journey Flow (Horizontal Route) */}
          <div className="hidden lg:block relative pt-2 pb-6">
            {/* Subtle Stage Progression Marker Bar */}
            <div className="flex items-center justify-between max-w-4xl mx-auto mb-8 px-2 text-[11px] uppercase tracking-[0.24em] text-earth font-medium select-none">
              <span className="flex items-center gap-2 transition-colors duration-300">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 0 ? 'bg-gold scale-125' : 'bg-gold/70'}`} />
                01 &middot; Idea
              </span>
              <span className="text-gold/40 text-xs select-none">→</span>
              <span className="flex items-center gap-2 transition-colors duration-300">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 1 ? 'bg-gold scale-125' : 'bg-gold/70'}`} />
                02 &middot; Requirements
              </span>
              <span className="text-gold/40 text-xs select-none">→</span>
              <span className="flex items-center gap-2 transition-colors duration-300">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 2 ? 'bg-gold scale-125' : 'bg-gold/70'}`} />
                03 &middot; Arrangement
              </span>
              <span className="text-gold/40 text-xs select-none">→</span>
              <span className="flex items-center gap-2 transition-colors duration-300">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 3 ? 'bg-forest scale-125' : 'bg-forest/80'}`} />
                04 &middot; Journey
              </span>
            </div>

            {/* 4-Step Horizontal Journey Grid (Zero Boxed Cards / Zero Tile Borders) */}
            <div className="grid grid-cols-4 gap-8 xl:gap-12 relative">
              {steps.map((item, idx) => {
                const isHovered = hoveredStep === idx;
                const isPastOrCurrent = hoveredStep !== null ? idx <= hoveredStep : false;

                return (
                  <motion.div
                    key={item.num}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.45,
                      delay: idx * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onMouseEnter={() => setHoveredStep(idx)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className="group relative cursor-pointer flex flex-col"
                  >
                    {/* Top: Editorial Number + Kicker */}
                    <div className="flex items-baseline justify-between mb-3">
                      <span
                        className={`font-serif text-5xl xl:text-6xl font-light tracking-tight transition-all duration-300 select-none ${isHovered
                          ? 'text-forest -translate-y-1'
                          : isPastOrCurrent
                            ? 'text-forest/70'
                            : 'text-forest/30'
                          }`}
                      >
                        {item.num}
                      </span>
                      <span className="text-[10px] xl:text-[11.5px] uppercase tracking-[0.22em] font-semibold text-gold">
                        {item.kicker}
                      </span>
                    </div>

                    {/* Route Indicator: Waypoint Node + Connected Horizontal Line */}
                    <div className="relative flex items-center h-4 mb-2">
                      {/* Waypoint Dot */}
                      <div className="relative z-20 flex items-center justify-center">
                        <span
                          className={`block rounded-full transition-all duration-300 ${idx === 3
                            ? isHovered
                              ? 'w-3.5 h-3.5 bg-gold ring-4 ring-gold/30'
                              : 'w-3 h-3 bg-forest ring-4 ring-[#E0D8BD]'
                            : isHovered
                              ? 'w-3.5 h-3.5 bg-gold ring-4 ring-gold/30 scale-110'
                              : isPastOrCurrent
                                ? 'w-2.5 h-2.5 bg-forest ring-2 ring-gold'
                                : 'w-2.5 h-2.5 bg-forest ring-4 ring-[#FAF7F0]'
                            }`}
                        />
                      </div>

                      {/* Connecting Route Line to the next step */}
                      {idx < 3 && (
                        <div className="absolute top-1/2 left-3 right-[-2rem] xl:right-[-3rem] -translate-y-1/2 h-[1.5px] bg-[#E0D8BD] z-10 overflow-visible">
                          {/* Progressive Animated Line Highlight */}
                          <div
                            className={`absolute top-0 left-0 h-full bg-gold transition-all duration-300 ${isHovered || (hoveredStep !== null && hoveredStep > idx)
                              ? 'w-full'
                              : 'w-0'
                              }`}
                          />

                          {/* Directional Route Arrow */}
                          <div
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 bg-[#F6F1E6] text-[10px] text-gold-dark transition-transform duration-300 select-none ${isHovered ? 'translate-x-1.5 text-gold' : ''
                              }`}
                            aria-hidden="true"
                          >
                            →
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vertical Guide Stem (linking waypoint to step content) */}
                    <div
                      className={`w-px h-5 ml-[4px] transition-colors duration-300 ${isHovered ? 'bg-gold' : 'bg-[#E0D8BD]/80'
                        }`}
                      aria-hidden="true"
                    />

                    {/* Step Title (Level 4 Subheading) */}
                    <div className="pt-2">
                      <h3
                        className={`font-serif text-xl xl:text-[1.35rem] font-medium leading-snug transition-colors duration-200 ${isHovered ? 'text-forest-950' : 'text-forest'
                          }`}
                      >
                        {item.title}
                      </h3>

                      {/* Subtle underline reveal */}
                      <div
                        className={`h-[1.5px] bg-gold mt-2 transition-all duration-300 origin-left ${isHovered ? 'w-12 opacity-100' : 'w-0 opacity-0'
                          }`}
                      />

                      {/* Step Description: Level 5 Body */}
                      <p
                        className={`text-xs xl:text-[13.5px] leading-relaxed font-normal mt-2.5 transition-colors duration-200 ${isHovered ? 'text-charcoal' : 'text-charcoal-muted'
                          }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* MOBILE & TABLET: Connected Vertical Timeline */}
          <div className="block lg:hidden relative pl-6 sm:pl-8 py-2">
            {/* Continuous Left Vertical Route Line */}
            <div
              className="absolute left-[1.125rem] sm:left-[1.375rem] top-3 bottom-6 w-[1.5px] bg-[#E0D8BD]"
              aria-hidden="true"
            />

            <div className="flex flex-col space-y-8 sm:space-y-10">
              {steps.map((item, idx) => {
                const isLast = idx === steps.length - 1;

                return (
                  <motion.div
                    key={item.num}
                    initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{
                      duration: 0.45,
                      delay: idx * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group relative flex items-start"
                  >
                    {/* Left: Waypoint Node on the continuous vertical line */}
                    <div className="absolute -left-[1.625rem] sm:-left-[1.875rem] top-1 flex items-center justify-center">
                      <span
                        className={`block rounded-full transition-all duration-300 ${isLast
                          ? 'w-3.5 h-3.5 bg-gold ring-4 ring-gold/30'
                          : 'w-3 h-3 bg-forest ring-4 ring-[#FAF7F0] group-hover:bg-gold'
                          }`}
                      />
                    </div>

                    {/* Horizontal Branch Stem (├─) connecting vertical line to content */}
                    <div
                      className="w-4 sm:w-6 h-px bg-[#E0D8BD] mt-2.5 flex-shrink-0 mr-3.5"
                      aria-hidden="true"
                    />

                    {/* Content Container (NO Card, NO Tile Border) */}
                    <div className="flex-1">
                      {/* Header Row: Number + Kicker + Stage */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-serif text-2xl sm:text-3xl font-light text-forest/40 select-none">
                          {item.num}
                        </span>
                        <span className="text-[10px] sm:text-[11.5px] uppercase tracking-[0.22em] font-semibold text-gold">
                          {item.kicker}
                        </span>
                        <span className="text-[9.5px] uppercase tracking-[0.2em] text-earth font-medium">
                          &middot; {item.stage}
                        </span>
                      </div>

                      {/* Title: Level 4 Subheading */}
                      <h3 className="font-serif text-lg sm:text-xl font-medium text-forest leading-snug">
                        {item.title}
                      </h3>

                      {/* Description: Level 5 Body */}
                      <p className="text-xs sm:text-[13.5px] text-charcoal-muted leading-relaxed font-normal mt-1.5 max-w-xl">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: WORDS FROM THE JOURNEY (Customer Testimonials Screenshot Gallery) */}
      {/* ========================================================================= */}
      <TestimonialsGallery />

      {/* ========================================================================= */}
      {/* SECTION 7 — NEWSLETTER SUBSCRIPTION (Refined Magazine Closing Page)        */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#F4EFE4] border-y border-[#E0D7BD] py-12 sm:py-14 lg:py-16 my-0 select-none">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          {/* Eyebrow with Decorative Rules & Muted Gold Accent */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-3 mb-3.5 sm:mb-4"
          >
            <span className="w-8 sm:w-12 h-px bg-gold/50" aria-hidden="true" />
            <span className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.26em] font-semibold text-gold">
              STAY IN THE LOOP
            </span>
            <span className="w-8 sm:w-12 h-px bg-gold/50" aria-hidden="true" />
          </motion.div>

          {/* Strong Cormorant Garamond Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-2xl sm:text-4xl lg:text-[3.15rem] font-normal text-forest leading-[1.12] sm:leading-[1.08] tracking-tight"
          >
            Stories <span className="italic font-light text-gold">worth travelling for.</span>
          </motion.h2>

          {/* Supporting Text (DM Sans) */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal max-w-xl mx-auto mt-3 sm:mt-3.5"
          >
            Occasional journeys, places, stories and travel ideas from Transit Story.
          </motion.p>

          {/* Understated Editorial Line Below */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-2.5 sm:gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-forest/70 font-medium mt-3 sm:mt-3.5"
          >
            <span>Curated Journeys</span>
            <span className="text-gold">&bull;</span>
            <span>New Places</span>
            <span className="text-gold">&bull;</span>
            <span>Travel Stories</span>
          </motion.div>

          {/* Newsletter Form: One Cohesive Editorial Unit */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 sm:mt-8 max-w-xl mx-auto w-full"
          >
            <AnimatePresence mode="wait">
              {newsletterStatus === 'success' ? (
                <motion.div
                  key="newsletter-success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="p-5 sm:p-6 bg-white border border-gold/45 rounded-[9px] text-center space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-forest text-gold flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="font-serif text-lg sm:text-xl font-normal text-forest">
                      You&apos;re on the list.
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                    Thank you — we&apos;ll keep the good journeys coming.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewsletterStatus('idle');
                      setNewsletterEmail('');
                    }}
                    className="text-[11px] uppercase tracking-wider text-charcoal-muted hover:text-forest underline underline-offset-4 pt-1 cursor-pointer"
                  >
                    Add another email
                  </button>
                </motion.div>
              ) : (
                <form
                  key="newsletter-form"
                  onSubmit={handleNewsletterSubmit}
                  className="w-full"
                >
                  {/* Form Container: Unified, elegant editorial pill input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/95 border border-[#E0D8BD] focus-within:border-gold rounded-2xl sm:rounded-full p-1.5 shadow-sm transition-all gap-2 sm:gap-0">
                    <div className="relative flex-1 w-full">
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => {
                          setNewsletterEmail(e.target.value);
                          if (newsletterError) setNewsletterError('');
                        }}
                        placeholder="Enter your email address"
                        aria-label="Your email address"
                        required
                        className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-[15px] text-forest placeholder-charcoal-muted/55 bg-transparent border-0 focus:outline-none font-sans"
                      />
                      {newsletterError && (
                        <p className="absolute -bottom-5 left-4 text-[11px] text-[#A63A2B] font-medium">
                          {newsletterError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="group inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-forest hover:bg-forest-900 text-ivory text-xs font-semibold uppercase tracking-editorial transition-all duration-200 cursor-pointer select-none flex-shrink-0 active:scale-[0.98]"
                    >
                      <span>{newsletterStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold transition-transform duration-200 ease-out group-hover:translate-x-1" />
                    </button>
                  </div>

                  {/* Subtle Helper Text */}
                  <p className="text-xs text-charcoal-muted/70 text-center mt-3 font-sans font-normal">
                    No spam. Just occasional travel stories and ideas.
                  </p>
                </form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — FINAL EDITORIAL CTA (Deep Forest #13271F, Warm Ivory #F5F1E8) */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#13271F] text-[#F5F1E8] py-16 sm:py-24 my-0 border-t border-[#1F4C3C] overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <span className="w-8 h-px bg-gold/50" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-gold font-semibold">
              WHERE NEXT?
            </span>
            <span className="w-8 h-px bg-gold/50" aria-hidden="true" />
          </motion.div>

          {/* Headline with Line-by-Line Reveal */}
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-white tracking-tight leading-[1.08] sm:leading-[1.06]">
            <div className="overflow-hidden">
              <motion.span
                initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                WHERE DO YOU WANT
              </motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="block italic font-light text-gold"
              >
                TO GO NEXT?
              </motion.span>
            </div>
          </h2>

          {/* Paragraph (Warm Light Secondary Text) */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-sm sm:text-lg text-[#E5E2D9]/90 max-w-xl mx-auto leading-relaxed font-normal text-balance"
          >
            Tell us where you want to go and what you need. We'll help arrange the journey around you.
          </motion.p>

          {/* Editorial Actions: Natural visual hierarchy, zero boxed-template feel */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-7"
          >
            {/* Primary: Tactile, warm gold pill button */}
            <Link
              to="/plan-your-journey"
              className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-gold hover:bg-gold-light text-forest font-sans text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-sm active:scale-[0.98] select-none"
            >
              <span>Plan Your Journey</span>
              <ArrowRight className="w-4 h-4 text-forest transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            {/* Secondary: Text-led editorial link with subtle underline */}
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#E5E2D9] hover:text-gold transition-colors py-2 px-2 select-none"
            >
              <span className="border-b border-[#E5E2D9]/40 group-hover:border-gold pb-0.5 transition-colors">
                Speak With a Curator
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gold transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
