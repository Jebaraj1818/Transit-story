import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Helper to render editorial title with selective accent emphasis
 * Syntax: "Words *in asterisks* become gold italic accent"
 */
function renderEditorialTitle(title, accentClass = 'italic font-light text-[#D6A85F]') {
  if (!title || typeof title !== 'string') return title;
  if (!title.includes('*')) return title;
  const parts = title.split(/\*([^*]+)\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={accentClass}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

/**
 * Premium Editorial Section Heading Component
 *
 * 6-Level Typography System:
 * - Level 2: Main Section Heading (Cormorant Garamond, responsive clamp, 1.08-1.12 line-height)
 * - Level 4: Editorial Subtitle (Cormorant Garamond italic, earth-green / gold tone)
 * - Level 5: Body Description (DM Sans, 14-16px, comfortable leading, muted charcoal)
 * - Level 6: Eyebrow / Kicker (DM Sans, 10.5-12px, uppercase, 0.24em tracking)
 *
 * Variants:
 *  - 'editorial-left' (Variant A): Eyebrow with decorative thin rule, large heading, description underneath.
 *  - 'centered' (Variant B): Eyebrow with dual rules, centered heading, subtitle, description centered underneath.
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

  // Typography and color tokens based on theme (Refined Editorial Palette)
  // Deep Forest: #13271F | Antique Gold: #D6A85F | Warm Ivory: #F5F1E8 | Earthy Green: #263D32 / #426047
  const textColor = isDark ? 'text-[#F5F1E8]' : 'text-[#13271F]';
  const descColor = isDark ? 'text-[#E5E2D9]/85' : 'text-[#4A4E49]';
  const eyebrowColor = isDark ? 'text-[#D6A85F]' : 'text-[#426047]';
  const ruleColor = isDark ? 'bg-[#D6A85F]/50' : 'bg-[#D6A85F]/60';
  const accentClass = isDark ? 'italic font-light text-[#D6A85F]' : 'italic font-light text-[#D6A85F]';

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
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10, letterSpacing: '0.28em' },
    visible: {
      opacity: 1,
      y: 0,
      letterSpacing: '0.24em',
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
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
        {eyebrow && (
          <motion.div variants={eyebrowVariants} className="flex items-center justify-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
            <span className={`w-6 sm:w-8 h-px ${ruleColor}`} aria-hidden="true" />
            <span className={`text-[10px] sm:text-[11.5px] uppercase font-semibold tracking-[0.24em] ${eyebrowColor}`}>
              {eyebrow}
            </span>
            <span className={`w-6 sm:w-8 h-px ${ruleColor}`} aria-hidden="true" />
          </motion.div>
        )}

        {/* Main Editorial Title: Level 2 Typography with clamp() */}
        <motion.h2
          variants={titleVariants}
          className={`font-serif text-[clamp(1.95rem,3.2vw+0.8rem,3.4rem)] font-normal ${textColor} tracking-tight leading-[1.08] sm:leading-[1.04] mb-2 sm:mb-2.5 text-balance`}
        >
          {renderEditorialTitle(title, accentClass)}
        </motion.h2>

        {/* Secondary Editorial Subtitle: Level 4 Typography (Italic serif, refined earth-green / gold accent) */}
        {subtitle && (
          <motion.p
            variants={titleVariants}
            className="font-serif italic font-light text-base sm:text-xl lg:text-[1.35rem] text-[#567A5C] leading-snug tracking-normal mb-3 sm:mb-3.5"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Supporting Description: Level 5 Typography */}
        {description && (
          <motion.p
            variants={descVariants}
            className={`text-xs sm:text-[0.9375rem] ${descColor} leading-relaxed font-normal max-w-[660px] mx-auto text-center`}
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
        {eyebrow && (
          <motion.div variants={eyebrowVariants} className="flex items-center gap-2.5">
            <span className={`text-[10.5px] sm:text-xs uppercase font-semibold tracking-[0.24em] ${eyebrowColor}`}>
              {eyebrow}
            </span>
            <span className={`w-6 h-px ${ruleColor}`} aria-hidden="true" />
          </motion.div>
        )}

        {/* Split Editorial Headline */}
        <motion.h2
          variants={titleVariants}
          className={`font-serif text-2xl sm:text-3xl lg:text-[2.85rem] font-normal ${textColor} leading-[1.1] sm:leading-[1.06] tracking-tight`}
        >
          {renderEditorialTitle(title, accentClass)}
          {subtitle && (
            <span className="block mt-1 italic font-light text-[#D6A85F] text-xl sm:text-2xl lg:text-3xl">
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

        {/* Description: Level 5 Typography */}
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
          {eyebrow && (
            <motion.div variants={eyebrowVariants} className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className={`text-[10.5px] sm:text-xs uppercase font-semibold tracking-[0.24em] ${eyebrowColor}`}>
                {eyebrow}
              </span>
              <span className={`w-6 h-px ${ruleColor}`} aria-hidden="true" />
            </motion.div>
          )}

          {/* Oversized Title: Level 1-2 Display scale */}
          <motion.h2
            variants={titleVariants}
            className={`font-serif text-[clamp(2rem,3.6vw+0.6rem,3.65rem)] font-normal ${textColor} tracking-tight leading-[1.08] sm:leading-[1.04]`}
          >
            {renderEditorialTitle(title, accentClass)}
            {subtitle && (
              <span className="block italic text-[#D6A85F] font-light text-lg sm:text-2xl md:text-[1.65rem] mt-1.5">
                {subtitle}
              </span>
            )}
          </motion.h2>

          {/* Description */}
          {description && (
            <motion.p
              variants={descVariants}
              className={`mt-2.5 sm:mt-3.5 text-xs sm:text-[0.9375rem] ${descColor} leading-relaxed font-normal max-w-xl`}
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
        {eyebrow && (
          <motion.div variants={eyebrowVariants} className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className={`text-[10.5px] sm:text-xs uppercase font-semibold tracking-[0.24em] ${eyebrowColor}`}>
              {eyebrow}
            </span>
            <span className={`w-6 h-px ${ruleColor}`} aria-hidden="true" />
          </motion.div>
        )}

        {/* Main Editorial Title: Level 2 Typography with clamp() */}
        <motion.h2
          variants={titleVariants}
          className={`font-serif text-[clamp(1.85rem,3vw+0.6rem,2.85rem)] font-normal ${textColor} tracking-tight leading-[1.12] sm:leading-[1.08]`}
        >
          {renderEditorialTitle(title, accentClass)}
          {subtitle && (
            <span className="block mt-1 italic font-light text-[#567A5C] text-lg sm:text-xl">
              {subtitle}
            </span>
          )}
        </motion.h2>

        {/* Description: Level 5 Typography */}
        {description && (
          <motion.p
            variants={descVariants}
            className={`mt-3 sm:mt-3.5 text-xs sm:text-[0.9375rem] ${descColor} leading-relaxed font-normal max-w-xl`}
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
