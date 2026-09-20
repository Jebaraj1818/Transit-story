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
  ChevronLeft,
  ChevronRight,
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

// Main Homepage Hero Slideshow Configuration
export const HERO_VIDEO_MOBILE = '/images/hero/hero-vedio-final.mp4'; // Vertical mobile video
export const HERO_VIDEO_DESKTOP_CANDIDATES = [
  '/images/hero/hero-video-desktop.mp4',
  '/images/hero/hero-vedio-desktop.mp4',
  '/images/hero/hero-video-landscape.mp4',
  '/images/hero/hero-vedio-landscape.mp4',
  '/images/hero/hero-video-wide.mp4',
  '/images/hero/hero-vedio-wide.mp4',
];

// Order: 1. Photo (5s) -> 2. Video (plays until ended event) -> 3. Photo (5s) -> Loop
const DEFAULT_HERO_SLIDES = [
  {
    id: 'hero-photo-1',
    type: 'image',
    src: '/images/hero/hero01.jpg',
    fallback: '/images/hero/hero01.jpg',
    alt: 'Ancient Dravidian temple architecture and heritage journey',
    duration: 5000,
  },
  {
    id: 'hero-video',
    type: 'video',
    src: HERO_VIDEO_MOBILE,
    fallback: HERO_VIDEO_MOBILE,
    alt: 'Cinematic journey through South Indian landscapes and roads',
  },
  {
    id: 'hero-photo-2',
    type: 'image',
    src: '/images/hero/hero-02.jpg',
    fallback: '/images/hero/hero-02.jpg',
    alt: 'Cultural exploration and curated travel destinations',
    duration: 5000,
  },
];

const DEFAULT_COLLEGE_IV_SLIDES = [
  {
    num: '01',
    total: '03',
    name: 'KERALA ARTS & CRAFTS VILLAGE',
    location: 'Kovalam, Thiruvananthapuram',
    image: '/images/kerala-arts-crafts-village-04.jpg',
    alt: 'Kerala Arts and Crafts Village Kovalam cultural artisan craft exhibition',
    position: 'center 35%',
  },
  {
    num: '02',
    total: '03',
    name: 'KERALA ARTS & CRAFTS VILLAGE',
    location: 'Kovalam, Thiruvananthapuram',
    image: '/images/kerala-arts-crafts-village-01-alt.jpg',
    alt: 'Kerala Arts and Crafts Village architecture and craft pavilions',
    position: 'center 35%',
  },
  {
    num: '03',
    total: '03',
    name: 'KOODANKULAM NUCLEAR POWER PLANT',
    location: 'Koodankulam, Tamil Nadu',
    image: '/images/koodankulam-nuclear-plant-01.jpg',
    alt: 'Koodankulam Nuclear Power Plant industrial engineering installation',
    position: 'center 35%',
  },
];

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);
  const [collegeIvSlides, setCollegeIvSlides] = useState(DEFAULT_COLLEGE_IV_SLIDES);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const heroVideoRef = useRef(null);
  const heroTouchStartX = useRef(null);

  // Responsive viewport tracking for hero video source (Mobile < 768px vs Desktop/Tablet >= 768px)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check availability of candidate desktop landscape video files
  const [desktopVideoUrl, setDesktopVideoUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const probeDesktopVideos = async () => {
      for (const candidate of HERO_VIDEO_DESKTOP_CANDIDATES) {
        try {
          const res = await fetch(candidate, { method: 'HEAD' });
          if (res.ok && isMounted) {
            setDesktopVideoUrl(candidate);
            return;
          }
        } catch {
          // Probe next candidate
        }
      }
    };

    probeDesktopVideos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active video URL based on viewport and landscape video presence
  const activeHeroVideo = isDesktop && desktopVideoUrl ? desktopVideoUrl : HERO_VIDEO_MOBILE;
  const isUsingLandscapeVideo = isDesktop && Boolean(desktopVideoUrl);

  // Synchronize heroSlides whenever activeHeroVideo updates
  useEffect(() => {
    setHeroSlides((prevSlides) =>
      prevSlides.map((slide) => {
        if (slide.type === 'video') {
          return {
            ...slide,
            src: activeHeroVideo,
            fallback: HERO_VIDEO_MOBILE,
          };
        }
        return slide;
      })
    );
  }, [activeHeroVideo]);

  // Dynamically load media from SiteSettings with seamless fallback to committed local assets
  useEffect(() => {
    let isMounted = true;
    getSiteSettings()
      .then((settings) => {
        if (!isMounted || !settings) return;

        const photo1 = resolveMediaUrl(settings.homepage_hero_photo_1, '/images/hero/hero01.jpg');
        const customVideo = settings.homepage_hero_video
          ? resolveMediaUrl(settings.homepage_hero_video)
          : null;
        const video = customVideo || activeHeroVideo;
        const photo2 = resolveMediaUrl(settings.homepage_hero_photo_2, '/images/hero/hero-02.jpg');

        setHeroSlides([
          {
            id: 'hero-photo-1',
            type: 'image',
            src: photo1,
            fallback: '/images/hero/hero01.jpg',
            alt: 'Ancient Dravidian temple architecture and heritage journey',
            duration: 5000,
          },
          {
            id: 'hero-video',
            type: 'video',
            src: video,
            fallback: HERO_VIDEO_MOBILE,
            alt: 'Cinematic journey through South Indian landscapes and roads',
          },
          {
            id: 'hero-photo-2',
            type: 'image',
            src: photo2,
            fallback: '/images/hero/hero-02.jpg',
            alt: 'Cultural exploration and curated travel destinations',
            duration: 5000,
          },
        ]);

        const iv1 = resolveMediaUrl(settings.college_iv_slide_1, '/images/kerala-arts-crafts-village-04.jpg');
        const iv2 = resolveMediaUrl(settings.college_iv_slide_2, '/images/kerala-arts-crafts-village-01-alt.jpg');
        const iv3 = resolveMediaUrl(settings.college_iv_slide_3, '/images/koodankulam-nuclear-plant-01.jpg');

        setCollegeIvSlides([
          {
            num: '01',
            total: '03',
            name: 'KERALA ARTS & CRAFTS VILLAGE',
            location: 'Kovalam, Thiruvananthapuram',
            image: iv1,
            alt: 'Kerala Arts and Crafts Village Kovalam cultural artisan craft exhibition',
            position: 'center 35%',
          },
          {
            num: '02',
            total: '03',
            name: 'KERALA ARTS & CRAFTS VILLAGE',
            location: 'Kovalam, Thiruvananthapuram',
            image: iv2,
            alt: 'Kerala Arts and Crafts Village architecture and craft pavilions',
            position: 'center 35%',
          },
          {
            num: '03',
            total: '03',
            name: 'KOODANKULAM NUCLEAR POWER PLANT',
            location: 'Koodankulam, Tamil Nadu',
            image: iv3,
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
    setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevHeroSlide = useCallback(() => {
    setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  const selectHeroSlide = (idx) => {
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

  // Preload hero images to eliminate image decode lag during slide transitions
  useEffect(() => {
    heroSlides.forEach((slide) => {
      if (slide.type === 'image') {
        const img = new Image();
        img.src = slide.src;
      }
    });
  }, [heroSlides]);

  // Slideshow Timing & Video Playback Lifecycle
  useEffect(() => {
    const activeSlide = heroSlides[currentHeroSlide];
    if (!activeSlide) return;

    if (activeSlide.type === 'video') {
      if (heroVideoRef.current) {
        heroVideoRef.current.currentTime = 0;
        const playPromise = heroVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Hero video autoplay notice:', err);
          });
        }
      }

      // Safety fail-safe timeout in case browser blocks playback or 'ended' event
      const safetyTimer = setTimeout(() => {
        nextHeroSlide();
      }, 25000);

      return () => {
        clearTimeout(safetyTimer);
      };
    } else {
      // Photo slide active:
      // Allow video to smoothly crossfade out on its last rendered frame
      // Pause gently after crossfade completes (without seeking to 0, preventing decoder stalls)
      const pauseTimer = setTimeout(() => {
        if (heroVideoRef.current && !heroVideoRef.current.paused) {
          heroVideoRef.current.pause();
        }
      }, 1100);

      const photoTimer = setTimeout(() => {
        nextHeroSlide();
      }, activeSlide.duration || 5000);

      return () => {
        clearTimeout(pauseTimer);
        clearTimeout(photoTimer);
      };
    }
  }, [currentHeroSlide, nextHeroSlide, heroSlides]);

  // Interactive Services State
  const [activeService, setActiveService] = useState(0);

  // Interactive Journey Route State (Section 6: How It Works)
  const [hoveredStep, setHoveredStep] = useState(null);

  const [currentIvSlide, setCurrentIvSlide] = useState(0);
  const [isIvSliderPaused, setIsIvSliderPaused] = useState(false);

  // Autoplay College IV Cinematic Carousel every 4.5s with Pause on Hover & Reset on Manual Change
  useEffect(() => {
    if (isIvSliderPaused) return;
    const timer = setInterval(() => {
      setCurrentIvSlide((prev) => (prev + 1) % collegeIvSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isIvSliderPaused, currentIvSlide, collegeIvSlides.length]);

  const nextIvSlide = () => {
    setCurrentIvSlide((prev) => (prev + 1) % collegeIvSlides.length);
  };

  const prevIvSlide = () => {
    setCurrentIvSlide((prev) => (prev - 1 + collegeIvSlides.length) % collegeIvSlides.length);
  };

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

  // 2. Interactive Services List (What We Arrange)
  const servicesList = [
    {
      title: 'Transportation',
      eyebrow: 'Transit Coordination',
      desc: 'Dedicated AC tourist buses, tempo travelers, and reliable private vehicles with experienced drivers for intercity and regional travel.',
      image: '/images/services/home-transportation.jpg',
      tag: 'Buses • Vans • Intercity Transfers',
    },
    {
      title: 'Hotels & Stays',
      eyebrow: 'Accommodation Booking',
      desc: 'Heritage homestays, comfortable star hotels, student-friendly group accommodations, or serene backwater houseboats.',
      image: '/images/services/home-hotels-stays.jpg',
      tag: 'Homestays • Star Hotels • Houseboats',
    },
    {
      title: 'Itinerary Planning',
      eyebrow: 'Custom Pacing & Flow',
      desc: 'Carefully tailored day-wise schedules designed around your group rhythm — ensuring balanced travel without rushed stops.',
      image: '/images/services/home-itinerary-planning.jpg',
      tag: 'Route Flow • Custom Timing & Pacing',
    },
    {
      title: 'Experiences & Activities',
      eyebrow: 'Curated Access',
      desc: 'Temple access coordination, artisanal craft workshop entries, nature walks, boat cruises, and amusement park passes.',
      image: '/images/services/home-experiences-activities.jpg',
      tag: 'Guided Walks • Cultural Access • Passes',
    },
    {
      title: 'Group Arrangements',
      eyebrow: 'End-to-End Coordination',
      desc: 'Seamless management for large college batches, institutions, and extended family groups with dedicated logistical oversight.',
      image: '/images/services/home-group-arrangements.jpg',
      tag: 'College Groups • Family & Alumni Formats',
    },
  ];

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
    <div className="flex flex-col space-y-16 sm:space-y-24 pb-0">
      {/* ========================================================================= */}
      {/* SECTION 1 — CINEMATIC HERO (Full Media Layer with Motion System)          */}
      {/* ========================================================================= */}
      <section
        className="relative w-full h-[68vh] sm:h-[72vh] min-h-[470px] md:h-auto md:min-h-[86vh] flex flex-col justify-between overflow-hidden bg-forest-950 select-none"
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
      >
        {/* MEDIA LAYER: Cinematic Crossfade Slideshow (Photo 1 -> Video -> Photo 2) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {heroSlides.map((slide, idx) => {
            const isActive = idx === currentHeroSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000 ease-in-out will-change-[opacity] transform-gpu ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                aria-hidden={!isActive}
              >
                {slide.type === 'image' ? (
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    loading="eager"
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
                ) : (
                  <video
                    ref={heroVideoRef}
                    key={slide.src || activeHeroVideo}
                    muted
                    playsInline
                    preload="auto"
                    onEnded={nextHeroSlide}
                    className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover transform-gpu"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      minWidth: '100%',
                      minHeight: '100%',
                      // Desktop (≥768px): anchor to mountain zone (85% down the frame)
                      // Mobile (<768px): centered crop — already correct
                      objectPosition: isDesktop ? 'center 85%' : 'center center',
                    }}
                  >
                    <source src={slide.src || activeHeroVideo} type="video/mp4" />
                  </video>
                )}
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

            {/* CTAs: Compact Editorial Scale */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-4"
            >
              <Button
                to="/plan-your-journey"
                variant="primary"
                size="md"
                className="text-[11.5px] sm:text-xs tracking-wider shadow-md bg-forest hover:bg-forest-900 border-forest text-ivory group px-4 py-2 sm:px-5 sm:py-2.5 whitespace-nowrap"
              >
                <span>Plan Your Journey</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
              </Button>
              <Button
                to="/tours"
                variant="outlineLight"
                size="md"
                className="text-[11.5px] sm:text-xs tracking-wider group border-ivory/40 text-ivory hover:bg-ivory hover:text-forest px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-[2px] whitespace-nowrap"
              >
                <span>Explore Tours</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
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
              <span className="font-serif text-sm font-semibold text-gold">01</span>
              <span className="w-5 sm:w-6 h-px bg-gold/60 hidden sm:inline-block" aria-hidden="true" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-editorial sm:tracking-expansive text-ivory/90 font-medium whitespace-nowrap">
                Scroll to Explore
              </span>
            </motion.div>

            {/* Subtle Premium Hero Slideshow Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5 bg-black/40 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-ivory/20 shadow-lg flex-shrink-0">
              <button
                type="button"
                onClick={prevHeroSlide}
                aria-label="Previous hero slide"
                className="p-1 text-ivory/70 hover:text-ivory hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-gold rounded-full"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 px-1">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => selectHeroSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 focus:outline-none ${
                      idx === currentHeroSlide
                        ? 'w-6 bg-gold'
                        : 'w-1.5 bg-ivory/40 hover:bg-ivory/70'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextHeroSlide}
                aria-label="Next hero slide"
                className="p-1 text-ivory/70 hover:text-ivory hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-1 focus:ring-gold rounded-full"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
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
      <section id="planning-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header: Editorial Heading System (Variant A) */}
        <SectionHeading
          eyebrow="TRAVEL YOUR WAY"
          title="What Are You Planning?"
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

        {/* Asymmetric 4-Part Editorial Grid with Staggered Entrance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {planningCategories.map((cat, idx) => (
            <motion.article
              key={cat.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.75,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`${cat.span} group relative flex flex-col bg-[#FCFAF5] border border-[#E0D8BD] rounded-sm overflow-hidden hover:border-earth/50 hover:shadow-[0_16px_36px_-10px_rgba(23,58,45,0.1)] transition-all duration-500`}
            >
              {/* Image Frame with Masked Vertical Reveal & Scale Hover: Natural Landscape Proportions */}
              <Link
                to={cat.link}
                className="relative aspect-[16/10] sm:aspect-[3/2] lg:aspect-[16/10] overflow-hidden block bg-forest/10 focus-visible:outline-gold"
                tabIndex={-1}
                aria-hidden="true"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/60 via-transparent to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />

                <div className="absolute top-3.5 left-3.5 flex items-center">
                  <span className="bg-forest-900/90 backdrop-blur-sm text-ivory text-[10px] font-medium tracking-kicker uppercase px-2.5 py-1 rounded-sm border border-ivory/15 shadow-sm">
                    {cat.subtitle}
                  </span>
                </div>
              </Link>

              {/* Card Details: Comfortable Editorial Breathing Room */}
              <div className="flex flex-col flex-1 p-6 sm:p-7">
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-forest leading-snug mb-2.5 group-hover:text-forest-900 transition-all duration-300 group-hover:translate-x-1">
                  <Link to={cat.link} className="focus-visible:outline-gold">
                    {cat.title}
                  </Link>
                </h3>

                <p className="text-sm text-charcoal-muted leading-relaxed font-normal mb-4 flex-1">
                  {cat.desc}
                </p>

                <div className="pt-3.5 border-t border-[#E8E1CD] mt-auto flex items-center justify-between">
                  <Link
                    to={cat.link}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-kicker text-forest group-hover:text-earth transition-colors focus-visible:outline-gold"
                  >
                    <span>{cat.ctaText || 'Explore Category'}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-gold" />
                  </Link>
                  <span className="text-[10px] text-charcoal-light font-medium uppercase tracking-editorial">
                    {cat.subtitle}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — INTERACTIVE SERVICES SECTION (Interactive Movement)            */}
      {/* ========================================================================= */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-[#FAF7F0] border border-[#E0D8BD] rounded-sm p-5 sm:p-8 lg:p-10">
          {/* Section Header: Editorial Heading System (Variant A) */}
          <SectionHeading
            eyebrow="SERVICES & ARRANGEMENTS"
            title="Everything You Need for the Journey"
            description="One place to arrange the important parts of your trip. No need to manage disconnected vendors, separate bus charters, or unfamiliar hotel bookings."
            variant="editorial-left"
          />

          {/* Interactive Split View: List on Left (7 cols) + Dynamic Image Preview on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
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
                    {/* Animated Divider Line */}
                    {index > 0 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.75,
                          delay: index * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="h-px bg-[#E8E1CD] origin-left"
                      />
                    )}

                    <div
                      onMouseEnter={() => setActiveService(index)}
                      onClick={() => setActiveService(index)}
                      className={`py-4 sm:py-4.5 cursor-pointer transition-all duration-300 group ${
                        isActive
                          ? 'opacity-100 bg-[#F4EFE3]/80 px-4 -mx-4 rounded-sm shadow-sm'
                          : 'opacity-75 hover:opacity-100 hover:bg-[#F8F4EA]/60 px-4 -mx-4 rounded-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 transition-transform duration-300 group-hover:translate-x-2">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-px bg-earth/60" aria-hidden="true" />
                            <span className="text-[10px] sm:text-[11px] uppercase tracking-kicker text-earth font-medium">
                              {service.eyebrow}
                            </span>
                          </div>

                          <h3
                            className={`font-serif text-xl sm:text-2xl font-normal transition-colors ${
                              isActive
                                ? 'text-forest font-medium'
                                : 'text-forest/80 group-hover:text-forest'
                            }`}
                          >
                            {service.title}
                          </h3>

                          <p
                            className={`text-xs sm:text-sm text-charcoal-muted leading-relaxed font-normal transition-all duration-300 ${
                              isActive ? 'block mt-2' : 'hidden sm:block sm:opacity-80'
                            }`}
                          >
                            {service.desc}
                          </p>

                          {/* Mobile Dedicated Service Visual Preview when active */}
                          {isActive && (
                            <div className="block lg:hidden mt-3.5 rounded-sm overflow-hidden border border-[#E0D8BD] shadow-sm aspect-[16/10] bg-forest/5">
                              <img
                                src={service.image}
                                alt={service.title}
                                loading="lazy"
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex-shrink-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                              isActive
                                ? 'border-forest bg-forest text-ivory shadow-sm'
                                : 'border-forest/25 text-forest group-hover:border-forest group-hover:bg-forest group-hover:text-ivory'
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
                          className="h-0.5 bg-gold mt-3.5 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Dynamic Reveal Image Window (Right 5 cols) with Smooth Opacity + Scale Transition */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] rounded-sm overflow-hidden border border-[#E0D8BD] shadow-md bg-forest/10">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeService}
                    src={servicesList[activeService].image}
                    alt={servicesList[activeService].title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full object-cover object-center"
                  />
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/70 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-6 left-6 right-6 text-ivory">
                  <span className="text-[10px] uppercase tracking-kicker text-gold font-medium block mb-1">
                    Arranged by The Transit Story
                  </span>
                  <h4 className="font-serif text-xl sm:text-2xl font-normal text-ivory mb-1">
                    {servicesList[activeService].title}
                  </h4>
                  <p className="text-xs text-ivory/80 font-normal">
                    {servicesList[activeService].tag}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Custom Request Callout */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 pt-6 border-t border-[#E8E1CD] flex flex-col sm:flex-row items-center justify-between gap-5"
          >
            <p className="text-sm text-charcoal-muted font-normal text-center sm:text-left">
              Have unique requirements for your family, student team, or group? We coordinate custom travel details.
            </p>
            <Button to="/plan-your-journey" variant="primary" size="md" className="flex-shrink-0 tracking-widest">
              Customize Your Requirements
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — JOURNEY IDEAS (Compact Editorial Destination Inspiration)     */}
      {/* ========================================================================= */}
      <section id="journey-ideas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header: Editorial Heading System (Variant D: Oversized Display) */}
        <SectionHeading
          eyebrow="DESTINATION INSPIRATION"
          title="Journey Ideas to Spark Your Travel"
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

        {/* 1. Top Featured Row: 2 Spotlight Destinations (Side-by-Side Equal Heights) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {journeyIdeas.slice(0, 2).map((dest, index) => {
            const destLink = `/tours/${dest.slug}`;

            return (
                <motion.article
                  key={dest.id}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.75, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col bg-[#FCFAF5] border border-[#E0D8BD] rounded-sm overflow-hidden hover:border-earth/50 hover:shadow-[0_16px_36px_-10px_rgba(23,58,45,0.12)] transition-all duration-500"
                >
                  <Link
                    to={destLink}
                    className="relative aspect-[16/10] overflow-hidden block bg-forest/10 focus-visible:outline-gold"
                  >
                    <img
                      src={dest.coverImage}
                      alt={dest.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/65 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    
                    {/* Badges on image */}
                    <div className="absolute top-4 left-4 bg-forest-900/90 backdrop-blur-sm text-ivory text-[10px] font-medium tracking-kicker uppercase px-3 py-1 rounded-sm border border-ivory/15">
                      {dest.tag}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-ivory text-xs font-sans">
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gold" />
                        {dest.location}
                      </span>
                      <span className="uppercase tracking-editorial text-[10px] bg-forest-900/80 px-2.5 py-1 rounded-sm">
                        Explore
                      </span>
                    </div>
                  </Link>

                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <span className="text-xs text-earth font-medium uppercase tracking-editorial block mb-1.5">
                      {dest.location}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-normal text-forest leading-tight mb-2.5 group-hover:text-forest-900 transition-colors">
                      <Link to={destLink}>
                        {dest.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-charcoal-muted leading-relaxed font-normal mb-5 flex-1">
                      {dest.description}
                    </p>
                    <div className="pt-3.5 border-t border-[#E8E1CD] mt-auto flex items-center justify-between">
                      <Link
                        to={destLink}
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-kicker text-forest group-hover:text-earth transition-colors focus-visible:outline-gold"
                      >
                        <span>Explore Destination</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-gold" />
                      </Link>
                      <span className="text-[10px] text-charcoal-light font-medium uppercase tracking-editorial">
                        Arranged On Request
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
        </div>

        {/* 2. Secondary Editorial Grid: Remaining Destinations (Compact & Harmonious) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {journeyIdeas.slice(2).map((dest, index) => {
            const destLink = `/tours/${dest.slug}`;

            return (
              <motion.article
                key={dest.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: (index + 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col bg-[#FCFAF5] border border-[#E0D8BD] rounded-sm overflow-hidden hover:border-earth/40 hover:shadow-md transition-all duration-500"
              >
                <Link
                  to={destLink}
                  className="relative aspect-[16/10] overflow-hidden block bg-forest/10 focus-visible:outline-gold"
                >
                  <img
                    src={dest.coverImage}
                    alt={dest.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />
                  <span className="absolute top-3 left-3 bg-forest-900/90 backdrop-blur-sm text-ivory text-[10px] font-medium tracking-kicker uppercase px-2.5 py-1 rounded-sm border border-ivory/15">
                    {dest.tag}
                  </span>
                </Link>

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <span className="text-xs text-earth font-medium uppercase tracking-editorial block mb-1.5">
                    {dest.location}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-forest leading-snug mb-2 group-hover:text-forest-900 transition-colors">
                    <Link to={destLink}>
                      {dest.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-charcoal-muted leading-relaxed font-normal mb-4 flex-1">
                    {dest.description}
                  </p>
                  <div className="pt-3.5 border-t border-[#E8E1CD] mt-auto flex items-center justify-between">
                    <Link
                      to={destLink}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-kicker text-forest group-hover:text-earth transition-colors"
                    >
                      <span>Explore Destination</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1 text-gold" />
                    </Link>
                    <span className="text-[10px] text-charcoal-light font-medium uppercase tracking-editorial">
                      Bespoke
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIvSlide}
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={collegeIvSlides[currentIvSlide].image}
                alt={collegeIvSlides[currentIvSlide].alt}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: collegeIvSlides[currentIvSlide].position || 'center 35%',
                }}
                onError={(e) => {
                  const fallback = DEFAULT_COLLEGE_IV_SLIDES[currentIvSlide]?.image;
                  if (fallback && e.currentTarget.src !== fallback && !e.currentTarget.src.endsWith(fallback)) {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallback;
                  }
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Subtle Localized Gradient: Shields text readability without darkening the whole photograph */}
          {/* Mobile: localized bottom gradient protecting text while leaving top/center image completely bright and natural */}
          <div className="absolute inset-x-0 bottom-0 h-[72%] sm:hidden bg-gradient-to-t from-[#0B1A14]/90 via-[#0B1A14]/35 to-transparent pointer-events-none" />
          {/* Desktop: localized left gradient protecting left-side text while leaving right image 100% bright */}
          <div className="absolute inset-y-0 left-0 w-[55%] hidden sm:block bg-gradient-to-r from-[#0B1A14]/85 via-[#0B1A14]/35 to-transparent pointer-events-none" />
          {/* Subtle top feather */}
          <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
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

            {/* Compact CTA Buttons: Side-by-side / wrap neatly on mobile without covering the image */}
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 pt-1 sm:pt-2"
            >
              {/* PLAN A COLLEGE IV: Navigates to /tours with College & Educational Tours category active */}
              <Link
                to="/tours?category=college-educational"
                className="group inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-7 sm:py-4 rounded-sm bg-[#C49A45] text-[#173A2D] font-sans text-[11px] sm:text-[13px] font-semibold uppercase tracking-editorial transition-all duration-300 ease-editorial hover:bg-[#D4B066] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:scale-[1.02] shadow-lg cursor-pointer select-none active:scale-[0.98] min-h-[42px] sm:min-h-[48px]"
              >
                <span>PLAN A COLLEGE IV</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#173A2D] transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
              </Link>

              {/* EXPLORE PLACES: Retained to /tours */}
              <Link
                to="/tours"
                className="group inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-7 sm:py-4 rounded-sm bg-black/35 backdrop-blur-sm border border-[#F5F0E5]/40 text-[#F5F0E5] font-sans text-[11px] sm:text-[13px] font-semibold uppercase tracking-editorial transition-all duration-300 ease-editorial hover:bg-[#F5F0E5] hover:text-[#173A2D] hover:border-[#F5F0E5] [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:scale-[1.02] shadow-md cursor-pointer select-none active:scale-[0.98] min-h-[42px] sm:min-h-[48px]"
              >
                <span>Explore Places</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F5F0E5] group-hover:text-[#173A2D] transition-all duration-300 ease-editorial group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* Bottom Row: Slide-Specific Label + Navigation Controls */}
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
                  <span className="text-[10px] sm:text-[11px] font-serif text-[#C49A45] tracking-widest uppercase">
                    {collegeIvSlides[currentIvSlide].num} / {collegeIvSlides[currentIvSlide].total}
                  </span>
                  <span className="text-[10px] text-[#C49A45]/50" aria-hidden="true">&middot;</span>
                  <span className="text-[9.5px] sm:text-[10.5px] text-[#F5F0E5]/75 tracking-wider uppercase font-medium">
                    {collegeIvSlides[currentIvSlide].location}
                  </span>
                </div>
                <span className="font-serif text-sm sm:text-base text-[#F5F0E5] tracking-wide uppercase mt-0.5">
                  {collegeIvSlides[currentIvSlide].name}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Manual Navigation Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevIvSlide}
                aria-label="Previous slide"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm bg-black/40 hover:bg-[#173A2D] text-[#F5F0E5] border border-[#F5F0E5]/25 hover:border-[#C49A45] flex items-center justify-center transition-all duration-200 backdrop-blur-sm cursor-pointer select-none active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-[#F5F0E5]" />
              </button>
              <button
                type="button"
                onClick={nextIvSlide}
                aria-label="Next slide"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm bg-black/40 hover:bg-[#173A2D] text-[#F5F0E5] border border-[#F5F0E5]/25 hover:border-[#C49A45] flex items-center justify-center transition-all duration-200 backdrop-blur-sm cursor-pointer select-none active:scale-95"
              >
                <ChevronRight className="w-4 h-4 text-[#F5F0E5]" />
              </button>
            </div>
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
      {/* SECTION 6 — HOW IT WORKS (Connected Editorial Journey Flow)               */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header: Editorial Heading System (Variant B: Centered) */}
        <SectionHeading
          eyebrow="HOW WE ARRANGE"
          title="How It Works"
          subtitle="How We Arrange Your Journey"
          description="Planning a custom journey doesn’t require complex coordination. Four clear steps from concept to your travel day."
          variant="centered"
          className="mb-8 sm:mb-12"
        />

        {/* DESKTOP: Connected Editorial Journey Flow (Horizontal Route) */}
        <div className="hidden lg:block relative pt-2 pb-6">
          {/* Subtle Stage Progression Marker Bar */}
          <div className="flex items-center justify-between max-w-4xl mx-auto mb-8 px-2 text-[11px] uppercase tracking-[0.22em] text-[#426047] font-medium select-none">
            <span className="flex items-center gap-2 transition-colors duration-300">
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 0 ? 'bg-[#C49A45] scale-125' : 'bg-[#C49A45]/70'}`} />
              01 &middot; Idea
            </span>
            <span className="text-[#C49A45]/40 text-xs select-none">→</span>
            <span className="flex items-center gap-2 transition-colors duration-300">
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 1 ? 'bg-[#C49A45] scale-125' : 'bg-[#C49A45]/70'}`} />
              02 &middot; Requirements
            </span>
            <span className="text-[#C49A45]/40 text-xs select-none">→</span>
            <span className="flex items-center gap-2 transition-colors duration-300">
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 2 ? 'bg-[#C49A45] scale-125' : 'bg-[#C49A45]/70'}`} />
              03 &middot; Arrangement
            </span>
            <span className="text-[#C49A45]/40 text-xs select-none">→</span>
            <span className="flex items-center gap-2 transition-colors duration-300">
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hoveredStep === 3 ? 'bg-[#173A2D] scale-125' : 'bg-[#173A2D]/80'}`} />
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
                      className={`font-serif text-5xl xl:text-6xl font-light tracking-tight transition-all duration-300 select-none ${
                        isHovered
                          ? 'text-[#173A2D] -translate-y-1'
                          : isPastOrCurrent
                          ? 'text-[#173A2D]/70'
                          : 'text-[#173A2D]/30'
                      }`}
                    >
                      {item.num}
                    </span>
                    <span className="text-[10px] xl:text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C49A45]">
                      {item.kicker}
                    </span>
                  </div>

                  {/* Route Indicator: Waypoint Node + Connected Horizontal Line */}
                  <div className="relative flex items-center h-4 mb-2">
                    {/* Waypoint Dot */}
                    <div className="relative z-20 flex items-center justify-center">
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          idx === 3
                            ? isHovered
                              ? 'w-3.5 h-3.5 bg-[#C49A45] ring-4 ring-[#C49A45]/30'
                              : 'w-3 h-3 bg-[#173A2D] ring-4 ring-[#E0D8BD]'
                            : isHovered
                            ? 'w-3.5 h-3.5 bg-[#C49A45] ring-4 ring-[#C49A45]/30 scale-110'
                            : isPastOrCurrent
                            ? 'w-2.5 h-2.5 bg-[#173A2D] ring-2 ring-[#C49A45]'
                            : 'w-2.5 h-2.5 bg-[#173A2D] ring-4 ring-[#FAF7F0]'
                        }`}
                      />
                    </div>

                    {/* Connecting Route Line to the next step */}
                    {idx < 3 && (
                      <div className="absolute top-1/2 left-3 right-[-2rem] xl:right-[-3rem] -translate-y-1/2 h-[1.5px] bg-[#E0D8BD] z-10 overflow-visible">
                        {/* Progressive Animated Line Highlight */}
                        <div
                          className={`absolute top-0 left-0 h-full bg-[#C49A45] transition-all duration-300 ${
                            isHovered || (hoveredStep !== null && hoveredStep > idx)
                              ? 'w-full'
                              : 'w-0'
                          }`}
                        />

                        {/* Directional Route Arrow */}
                        <div
                          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1 bg-[#FAF7F0] text-[10px] text-[#A68031] transition-transform duration-300 select-none ${
                            isHovered ? 'translate-x-1.5 text-[#C49A45]' : ''
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
                    className={`w-px h-5 ml-[4px] transition-colors duration-300 ${
                      isHovered ? 'bg-[#C49A45]' : 'bg-[#E0D8BD]/80'
                    }`}
                    aria-hidden="true"
                  />

                  {/* Step Title with Underline Reveal */}
                  <div className="pt-2">
                    <h3
                      className={`font-serif text-xl xl:text-[1.35rem] font-normal leading-snug transition-colors duration-200 ${
                        isHovered ? 'text-[#0B1A14]' : 'text-[#173A2D]'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {/* Subtle underline reveal */}
                    <div
                      className={`h-[1.5px] bg-[#C49A45] mt-2 transition-all duration-300 origin-left ${
                        isHovered ? 'w-12 opacity-100' : 'w-0 opacity-0'
                      }`}
                    />

                    {/* Step Description */}
                    <p
                      className={`text-xs xl:text-sm leading-relaxed font-normal mt-2.5 transition-colors duration-200 ${
                        isHovered ? 'text-[#20231F]' : 'text-[#4A4E49]'
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
                      className={`block rounded-full transition-all duration-300 ${
                        isLast
                          ? 'w-3.5 h-3.5 bg-[#C49A45] ring-4 ring-[#C49A45]/30'
                          : 'w-3 h-3 bg-[#173A2D] ring-4 ring-[#FAF7F0] group-hover:bg-[#C49A45]'
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
                      <span className="font-serif text-2xl sm:text-3xl font-light text-[#173A2D]/40 select-none">
                        {item.num}
                      </span>
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C49A45]">
                        {item.kicker}
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#426047] font-medium">
                        &middot; {item.stage}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-[#173A2D] leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#4A4E49] leading-relaxed font-normal mt-1.5 max-w-xl">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — NEWSLETTER SUBSCRIPTION (Editorial Travel Dispatches)         */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 7 — NEWSLETTER SUBSCRIPTION (Refined Magazine Closing Page)        */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#F8F5EE] border-y border-[#E3D9C3] py-14 sm:py-16 lg:py-20 select-none">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          {/* Eyebrow with Decorative Rules & Muted Gold Accent */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-3 mb-3.5 sm:mb-4"
          >
            <span className="w-8 sm:w-12 h-px bg-[#C49A45]/40" aria-hidden="true" />
            <span className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.26em] font-semibold text-[#C49A45]">
              STAY IN THE LOOP
            </span>
            <span className="w-8 sm:w-12 h-px bg-[#C49A45]/40" aria-hidden="true" />
          </motion.div>

          {/* Strong Cormorant Garamond Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-2xl sm:text-4xl lg:text-[3.15rem] font-normal text-[#173A2D] leading-[1.12] sm:leading-[1.08] tracking-tight"
          >
            Stories worth travelling for.
          </motion.h2>

          {/* Supporting Text (DM Sans) */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base text-[#4A4E49] leading-relaxed font-normal max-w-xl mx-auto mt-3 sm:mt-3.5"
          >
            Occasional journeys, places, stories and travel ideas from The Transit Story.
          </motion.p>

          {/* Understated Editorial Line Below */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-2.5 sm:gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#173A2D]/65 font-medium mt-3 sm:mt-3.5"
          >
            <span>Curated Journeys</span>
            <span className="text-[#C49A45]">&bull;</span>
            <span>New Places</span>
            <span className="text-[#C49A45]">&bull;</span>
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
                  className="p-5 sm:p-6 bg-white border border-[#C49A45]/45 rounded-[9px] text-center space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#173A2D] text-[#C49A45] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="font-serif text-lg sm:text-xl font-normal text-[#173A2D]">
                      You&apos;re on the list.
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A4E49] leading-relaxed">
                    Thank you — we&apos;ll keep the good journeys coming.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewsletterStatus('idle');
                      setNewsletterEmail('');
                    }}
                    className="text-[11px] uppercase tracking-wider text-[#4A4E49] hover:text-[#173A2D] underline underline-offset-4 pt-1 cursor-pointer"
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
                  {/* Form Container: Stacks cleanly on mobile, horizontal on desktop */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-1 w-full">
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => {
                          setNewsletterEmail(e.target.value);
                          if (newsletterError) setNewsletterError('');
                        }}
                        placeholder="Your email address"
                        aria-label="Your email address"
                        required
                        className="w-full h-12 sm:h-13 px-4 sm:px-5 text-base sm:text-[15px] text-[#173A2D] placeholder-[#4A4E49]/55 bg-white border border-[#173A2D]/30 rounded-[8px] shadow-[0_1px_3px_rgba(23,58,45,0.04)] hover:border-[#173A2D]/50 focus:border-[#173A2D] focus:shadow-[0_2px_8px_rgba(23,58,45,0.08)] focus:outline-none focus:ring-2 focus:ring-[#173A2D]/12 font-sans transition-all duration-200 ease-out"
                      />
                      {newsletterError && (
                        <p className="absolute -bottom-5 left-1 text-[11px] text-[#A63A2B] font-medium">
                          {newsletterError}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 h-12 sm:h-13 bg-[#173A2D] hover:bg-[#1F4C3C] text-[#F5F0E5] text-xs sm:text-[13px] font-semibold uppercase tracking-editorial rounded-[8px] shadow-[0_1px_3px_rgba(23,58,45,0.08)] hover:shadow-[0_4px_12px_rgba(23,58,45,0.18)] [@media(hover:hover)]:hover:-translate-y-[2px] active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer select-none flex-shrink-0 min-h-[48px]"
                    >
                      <span>{newsletterStatus === 'loading' ? 'Subscribing...' : 'SUBSCRIBE'}</span>
                      <ArrowRight className="w-4 h-4 text-[#C49A45] transition-transform duration-200 ease-out group-hover:translate-x-1.5" />
                    </button>
                  </div>

                  {/* Subtle Helper Text */}
                  <p className="text-xs text-[#4A4E49]/70 text-center mt-2.5 sm:mt-3 font-sans font-normal">
                    No spam. Just occasional travel stories and ideas.
                  </p>
                </form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — FINAL EDITORIAL CTA (Deep Forest #173A2D, Warm Ivory #F5F0E5) */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#173A2D] text-[#F5F0E5] py-14 sm:py-20 my-0 border-t border-[#1F4C3C] overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <span className="w-8 h-px bg-[#C49A45]/40" aria-hidden="true" />
            <span className="text-[11px] sm:text-xs uppercase tracking-kicker text-[#C49A45] font-medium">
              WHERE NEXT?
            </span>
            <span className="w-8 h-px bg-[#C49A45]/40" aria-hidden="true" />
          </motion.div>

          {/* Headline with Line-by-Line Reveal */}
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-[#F5F0E5] tracking-tight leading-[1.08] sm:leading-[1.06]">
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
                className="block italic text-[#C49A45]"
              >
                TO GO NEXT?
              </motion.span>
            </div>
          </h2>

          {/* Paragraph (Warm Ivory with reduced opacity) */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-sm sm:text-lg text-[#F5F0E5]/80 max-w-xl mx-auto leading-relaxed font-normal text-balance"
          >
            Tell us where you want to go and what you need. We'll help arrange the journey around you.
          </motion.p>

          {/* Staggered Buttons */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-5"
          >
            <Button
              to="/plan-your-journey"
              variant="gold"
              size="lg"
              className="tracking-widest shadow-sm w-full sm:w-auto"
            >
              <span>Plan Your Journey</span>
              <ArrowRight className="w-4 h-4 text-[#173A2D]" />
            </Button>
            <Button
              to="/contact"
              variant="outlineLight"
              size="lg"
              className="tracking-widest w-full sm:w-auto"
            >
              <span>Speak With a Curator</span>
              <ArrowRight className="w-4 h-4 text-[#F5F0E5]" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
