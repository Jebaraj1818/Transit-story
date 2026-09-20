import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { getSiteSettings } from '../api/client';

/**
 * FloatingActions Component
 * 
 * Contains:
 *  1. BackToTopButton: Smooth scrolls to top when clicked; appears after scrolling down ~350px.
 *  2. WhatsAppFloatingButton: Direct messaging action with gentle ambient pulse.
 *    WhatsApp URL is loaded from live site settings (same source as Footer) with graceful fallback.
 * 
 * Stacked cleanly in the bottom-right viewport with no overlap and full mobile responsiveness.
 */
export default function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [whatsappHref, setWhatsappHref] = useState('#');
  const shouldReduceMotion = useReducedMotion();

  // Load live WhatsApp URL from site settings (consistent with Footer)
  useEffect(() => {
    let isMounted = true;
    getSiteSettings().then((settings) => {
      if (isMounted && settings?.whatsapp_url &&
          typeof settings.whatsapp_url === 'string' &&
          settings.whatsapp_url.trim() !== '' &&
          settings.whatsapp_url.trim() !== '#') {
        setWhatsappHref(settings.whatsapp_url.trim());
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Track scroll position to show/hide Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <aside
      aria-label="Floating quick actions"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-center gap-2.5 sm:gap-3 pointer-events-none"
    >
      {/* 1. Back to Top Button (Appears on scroll down) */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            key="back-to-top"
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            initial={{ opacity: 0, y: 14, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="group pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#173A2D] text-[#F5F0E5] border border-[#C49A45]/45 hover:border-[#C49A45] hover:bg-[#1F4C3C] shadow-[0_4px_16px_rgba(23,58,45,0.28)] hover:shadow-[0_8px_24px_rgba(23,58,45,0.4)] flex items-center justify-center transition-colors duration-200 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C49A45] focus-visible:outline-offset-2"
          >
            <ArrowUp className="w-5 h-5 text-[#F5F0E5] transition-transform duration-200 group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. WhatsApp Floating Action Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: 1,
                scale: 1,
                y: [0, -3, 0],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.3 }
            : {
                y: {
                  repeat: Infinity,
                  duration: 4,
                  ease: 'easeInOut',
                },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }
        }
        whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative pointer-events-auto"
      >
        {/* Subtle Ambient Pulse Ring */}
        <span
          className="absolute -inset-1 rounded-full bg-[#25D366]/35 animate-ping pointer-events-none opacity-50"
          style={{ animationDuration: '3.5s' }}
          aria-hidden="true"
        />

        <a
          href={whatsappHref}
          target={whatsappHref !== '#' ? '_blank' : undefined}
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#22c35e] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_10px_28px_rgba(37,211,102,0.55)] border border-white/30 transition-all duration-300 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#25D366] focus-visible:outline-offset-2"
        >
          <svg
            className="w-6 h-6 sm:w-6.5 sm:h-6.5 fill-current drop-shadow-sm"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.54 1.777.818 2.796.818 3.182 0 5.768-2.587 5.768-5.767.001-3.181-2.585-5.767-5.768-5.767zm3.393 8.163c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.115-.494-1.748-.707-2.883-2.476-2.97-2.593-.087-.116-.708-.94-.708-1.793 0-.853.449-1.272.608-1.446.16-.175.348-.218.464-.218.116 0 .232.002.333.007.107.005.251-.041.391.297.145.348.493 1.202.536 1.29.044.087.073.189.015.305-.058.116-.087.189-.174.291-.087.102-.183.228-.261.306-.087.087-.179.182-.077.357.102.174.453.748.973 1.211.671.597 1.236.782 1.41.869.174.087.276.073.378-.044.102-.116.435-.508.551-.682.116-.174.232-.145.391-.087.16.058 1.014.479 1.189.566.174.087.29.131.333.203.044.073.044.421-.1 0.826zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.957-1.399C8.423 21.498 10.151 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.154-.479-4.436-1.302l-.318-.205-2.946.83.842-2.868-.225-.333C4.053 14.978 3.6 13.528 3.6 12c0-4.632 3.768-8.4 8.4-8.4 4.633 0 8.4 3.768 8.4 8.4 0 4.632-3.767 8.4-8.4 8.4z" />
          </svg>
        </a>
      </motion.div>
    </aside>
  );
}
