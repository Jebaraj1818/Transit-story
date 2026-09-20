import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Premium Editorial Section Heading Component
 *
 * Spacing calibrated for balanced, compact, breathable editorial rhythm:
 * - Eyebrow to title: 8-12px
 * - Title to description: 12-16px
 * - Description to action: 16-24px
 * - Entire heading block to section content: 32-40px (mb-8 sm:mb-10)
 *
 * Variants:
 *  - 'editorial-left' (Variant A): Eyebrow with decorative thin rule, large heading, description underneath.
 *  - 'centered' (Variant B): Eyebrow with decorative rule, centered heading, description centered underneath.
 *  - 'split-editorial' (Variant C): Eyebrow, heading on one side, description and extra details beside or underneath.
 *  - 'oversized-display' (Variant D): High-impact large display typography, micro-label, action link.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  description,
  variant = 'editorial-left',
  theme = 'light',
  action = null,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  const isDark = theme === 'dark';

  // Typography and color tokens based on theme (Strict 5-Color Palette)
  const textColor = isDark ? 'text-[#F5F0E5]' : 'text-[#173A2D]';
  const descColor = isDark ? 'text-[#F5F0E5]/80' : 'text-[#4A4E49]';
  const eyebrowColor = isDark ? 'text-[#C49A45]' : 'text-[#426047]';
  const ruleColor = isDark ? 'bg-[#C49A45]/40' : 'bg-[#426047]/40';

  // Framer Motion reveal variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
        delayChildren: 0.04,
      },
    },
  };

  const eyebrowVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10, letterSpacing: '0.3em' },
    visible: {
      opacity: 1,
      y: 0,
      letterSpacing: '0.25em',
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const descVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // -------------------------------------------------------------
  // VARIANT B: CENTERED (e.g. How It Works, Philosophy)
  // -------------------------------------------------------------
  if (variant === 'centered') {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={containerVariants}
        className={`max-w-3xl mx-auto text-center ${className}`}
      >
        {/* Eyebrow with subtle editorial details */}
        <motion.div variants={eyebrowVariants} className="flex items-center justify-center gap-2.5 sm:gap-3 mb-3 sm:mb-3.5">
          <span className={`w-6 sm:w-8 h-px ${ruleColor}`} aria-hidden="true" />
          <span className={`text-[10px] sm:text-[11.5px] uppercase font-medium tracking-[0.22em] ${eyebrowColor}`}>
            {eyebrow}
          </span>
          <span className={`w-6 sm:w-8 h-px ${ruleColor}`} aria-hidden="true" />
        </motion.div>

        {/* Main Editorial Title: 100% Visual Importance (52-64px desktop, 44-52px tablet, 32-38px mobile, 400 weight) */}
        <motion.h2
          variants={titleVariants}
          className={`font-serif text-[1.85rem] sm:text-4xl lg:text-[3.5rem] xl:text-[3.75rem] font-normal ${textColor} tracking-tight leading-[1.08] sm:leading-[1.0] mb-2 sm:mb-2.5`}
        >
          {title}
        </motion.h2>

        {/* Secondary Editorial Subtitle: 55-65% Visual Importance (Italic serif, refined earth-green / gold accent) */}
        {subtitle && (
          <motion.p
            variants={titleVariants}
            className="font-serif italic font-light text-base sm:text-xl lg:text-[1.4rem] text-[#567A5C] leading-snug tracking-normal mb-3 sm:mb-4"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Supporting Description: 35-40% Visual Importance (Understated neutral, 600-700px max width) */}
        {description && (
          <motion.p
            variants={descVariants}
            className={`text-xs sm:text-[0.925rem] ${descColor} leading-relaxed font-normal max-w-[660px] mx-auto text-center`}
          >
            {description}
          </motion.p>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT C: SPLIT EDITORIAL (e.g. College IV, Institutional)
  // -------------------------------------------------------------
  if (variant === 'split-editorial') {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={containerVariants}
        className={`space-y-3.5 ${className}`}
      >
        {/* Eyebrow */}
        <motion.div variants={eyebrowVariants} className="flex items-center gap-2.5">
          <span className={`text-[10.5px] sm:text-xs uppercase font-medium tracking-kicker ${eyebrowColor}`}>
            {eyebrow}
          </span>
          <span className={`w-6 h-px ${ruleColor}`} aria-hidden="true" />
        </motion.div>

        {/* Split Editorial Headline */}
        <motion.h2
          variants={titleVariants}
          className={`font-serif text-2xl sm:text-3xl lg:text-5xl font-normal ${textColor} leading-[1.12] sm:leading-[1.1] tracking-tight`}
        >
          {title}
          {subtitle && (
            <span className="block mt-1 italic font-light text-[#C49A45] text-xl sm:text-3xl lg:text-4xl">
              {subtitle}
            </span>
          )}
        </motion.h2>

        {/* Decorative Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-px ${ruleColor} origin-left w-16 sm:w-20 my-2`}
        />

        {/* Description */}
        {description && (
          <motion.p
            variants={descVariants}
            className={`text-sm sm:text-base ${descColor} leading-relaxed font-normal max-w-xl`}
          >
            {description}
          </motion.p>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT D: OVERSIZED DISPLAY (e.g. Journey Ideas, Final Call)
  // -------------------------------------------------------------
  if (variant === 'oversized-display') {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={containerVariants}
        className={`flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 ${className}`}
      >
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <motion.div variants={eyebrowVariants} className="flex items-center gap-2 mb-2.5 sm:mb-3.5">
            <span className={`text-[10.5px] sm:text-xs uppercase font-medium tracking-kicker ${eyebrowColor}`}>
              {eyebrow}
            </span>
            <span className={`w-6 h-px ${ruleColor}`} aria-hidden="true" />
          </motion.div>

          {/* Oversized Title */}
          <motion.h2
            variants={titleVariants}
            className={`font-serif text-2xl sm:text-4xl md:text-5xl font-normal ${textColor} tracking-tight leading-[1.12] sm:leading-[1.08]`}
          >
            {title}
            {subtitle && (
              <span className="block italic text-[#C49A45] text-lg sm:text-2xl md:text-3xl mt-1">
                {subtitle}
              </span>
            )}
          </motion.h2>

          {/* Description */}
          {description && (
            <motion.p
              variants={descVariants}
              className={`mt-2.5 sm:mt-4 text-xs sm:text-base ${descColor} leading-relaxed font-normal`}
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Action element (e.g. "View All Tours ->") */}
        {action && (
          <motion.div variants={descVariants} className="flex-shrink-0 self-start md:self-auto pt-1">
            {action}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT A: EDITORIAL LEFT (Default — e.g. Planning, Services)
  // -------------------------------------------------------------
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={containerVariants}
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 ${className}`}
    >
      <div className="max-w-2xl">
        {/* Eyebrow + Rule */}
        <motion.div variants={eyebrowVariants} className="flex items-center gap-2 mb-2.5 sm:mb-3.5">
          <span className={`text-[10.5px] sm:text-xs uppercase font-medium tracking-kicker ${eyebrowColor}`}>
            {eyebrow}
          </span>
          <span className={`w-6 h-px ${ruleColor}`} aria-hidden="true" />
        </motion.div>

        {/* Main Editorial Title */}
        <motion.h2
          variants={titleVariants}
          className={`font-serif text-2xl sm:text-3xl md:text-[2.75rem] font-normal ${textColor} tracking-tight leading-[1.14] sm:leading-[1.12]`}
        >
          {title}
          {subtitle && (
            <span className="block mt-1 italic font-light opacity-95">
              {subtitle}
            </span>
          )}
        </motion.h2>

        {/* Description */}
        {description && (
          <motion.p
            variants={descVariants}
            className={`mt-3.5 sm:mt-4 text-sm sm:text-base ${descColor} leading-relaxed font-normal`}
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Action Element */}
      {action && (
        <motion.div variants={descVariants} className="flex-shrink-0 self-start md:self-auto pt-1">
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
