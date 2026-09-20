/**
 * Editorial Motion System for The Transit Story
 * Provides distinct motion personalities per section while respecting reduced-motion preferences.
 */

// Timing constants (in seconds)
export const TIMING = {
  micro: 0.28,
  standard: 0.55,
  editorial: 0.85,
  cinematic: 1.2,
  staggerFast: 0.08,
  staggerMedium: 0.12,
  staggerSlow: 0.18,
};

export const EASINGS = {
  editorial: [0.16, 1, 0.3, 1], // Smooth exponential deceleration
  gentle: [0.25, 0.1, 0.25, 1],
  anticipate: [0.38, 0.005, 0.215, 1],
};

/**
 * Creates motion variants tailored to reduced-motion preference.
 */
export const createMotionVariants = (shouldReduceMotion = false) => {
  if (shouldReduceMotion) {
    return {
      fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
      lineReveal: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
      fadeUp: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
      fadeLeft: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
      fadeRight: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
      scaleReveal: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
      imageMaskReveal: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } },
      },
      staggerContainer: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      },
      staggerItem: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
    };
  }

  return {
    // 1. Standard subtle fade up
    fadeUp: {
      hidden: { opacity: 0, y: 24 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: TIMING.editorial, ease: EASINGS.editorial },
      },
    },

    // 2. Editorial directional entrances (e.g. for College IV & Journey Ideas)
    fadeLeft: {
      hidden: { opacity: 0, x: -32 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: TIMING.editorial, ease: EASINGS.editorial },
      },
    },
    fadeRight: {
      hidden: { opacity: 0, x: 32 },
      visible: {
        opacity: 1,
        x: 0,
        transition: { duration: TIMING.editorial, ease: EASINGS.editorial },
      },
    },

    // 3. Image Masked Vertical Entrance
    imageMaskReveal: {
      hidden: { opacity: 0, y: 30, scale: 1.04 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.95, ease: EASINGS.editorial },
      },
    },

    // 4. Line Width Reveal (from 0% to 100%)
    lineReveal: {
      hidden: { scaleX: 0, originX: 0 },
      visible: {
        scaleX: 1,
        originX: 0,
        transition: { duration: 0.9, ease: EASINGS.editorial },
      },
    },

    // 5. Scale & Fade (for final CTA or spotlight)
    scaleReveal: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: TIMING.editorial, ease: EASINGS.editorial },
      },
    },

    // 6. Stagger Containers
    staggerContainer: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: TIMING.staggerMedium,
          delayChildren: 0.1,
        },
      },
    },
    staggerSlowContainer: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: TIMING.staggerSlow,
          delayChildren: 0.15,
        },
      },
    },
    staggerItem: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: TIMING.standard, ease: EASINGS.editorial },
      },
    },
  };
};
