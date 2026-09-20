import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Close mobile menu whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Track scroll position for smooth transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'TOURS', path: '/tours' },
    { name: 'SERVICES', path: '/services' },
    { name: 'ABOUT', path: '/about' },
    { name: 'CONTACT', path: '/contact' },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 w-full bg-[#F8F4EA] transition-all duration-300 ease-editorial ${
        isScrolled
          ? 'border-b border-[#173A2D]/10 py-3 sm:py-3.5 shadow-[0_2px_14px_rgba(0,0,0,0.06)] text-[#20231F]'
          : 'border-b border-[#173A2D]/8 py-4 sm:py-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-[#20231F]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[44px]">
          {/* Brand / Logo with Real Client Emblem */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3.5 group text-left focus-visible:outline-[#C49A45] min-h-[44px]"
            aria-label="The Transit Story — Home"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-[#C49A45]/40 shadow-sm transition-transform duration-300 group-hover:scale-105 flex-shrink-0 bg-[#FAF8F3]">
              <img
                src="/logo/Transit-logo.jpeg"
                alt="The Transit Story emblem"
                className="w-full h-full object-cover scale-[1.04]"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-[1.1rem] sm:text-[1.3rem] font-medium tracking-wide text-[#173A2D] group-hover:text-[#426047] transition-colors leading-none whitespace-nowrap">
                The Transit Story
              </span>
              <span className="text-[8.5px] sm:text-[10px] font-sans tracking-wider sm:tracking-expansive uppercase mt-1 font-medium text-[#426047] whitespace-nowrap flex items-center gap-1 sm:gap-1.5">
                <span>Curated Journeys</span>
                <span className="text-[#C49A45]/70 font-light text-[8px] sm:text-[9px]" aria-hidden="true">|</span>
                <span>Crafted Experiences</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (CENTER) */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-8" aria-label="Main Navigation">
            {navLinks.map((link, idx) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + idx * 0.04, ease: 'easeOut' }}
              >
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) => {
                    const activeColor = 'text-[#173A2D] font-semibold';
                    const inactiveColor = 'text-[#4A4E49] hover:text-[#173A2D]';

                    return `group relative py-1.5 text-[12px] uppercase tracking-[0.16em] font-medium transition-colors duration-250 ${
                      isActive ? activeColor : inactiveColor
                    }`;
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.name}</span>
                      {/* Active line indicator or animated hover growth from left to right */}
                      {isActive ? (
                        <motion.span
                          layoutId="activeNavIndicator"
                          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#173A2D] rounded-full"
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                        />
                      ) : (
                        <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#173A2D] transition-all duration-300 ease-out group-hover:w-full" />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Right CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
            className="hidden md:flex items-center space-x-4"
          >
            <Link
              to="/plan-your-journey"
              className="group inline-flex items-center justify-center font-sans text-[11px] sm:text-xs font-medium uppercase tracking-editorial gap-2 px-5 py-2.5 rounded-sm bg-[#173A2D] text-[#F5F0E5] border border-[#173A2D] hover:bg-[#1F4C3C] hover:border-[#1F4C3C] transition-all duration-250 ease-editorial shadow-sm cursor-pointer select-none active:scale-[0.98]"
            >
              <span>Plan Your Trip</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F5F0E5] transition-transform duration-250 ease-editorial group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Mobile Hamburger Button (Guaranteed 44x44px touch target) */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-sm text-[#173A2D] hover:text-[#426047] active:bg-[#173A2D]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A45] transition-colors"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-b border-[#173A2D]/10 bg-[#F8F4EA] text-[#20231F] px-5 pt-3 pb-7 shadow-lg"
          >
            <nav className="flex flex-col space-y-1.5 pt-2" aria-label="Mobile Navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between text-xs uppercase tracking-[0.18em] py-3.5 px-3.5 rounded-sm transition-colors min-h-[46px] active:bg-[#173A2D]/15 ${
                      isActive
                        ? 'text-[#173A2D] bg-[#173A2D]/10 font-semibold'
                        : 'text-[#20231F] hover:text-[#173A2D] hover:bg-[#173A2D]/5 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.name}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#C49A45]" />}
                    </>
                  )}
                </NavLink>
              ))}

              <div className="pt-4 border-t border-[#173A2D]/10 flex flex-col space-y-3 mt-3">
                <Link
                  to="/plan-your-journey"
                  className="group flex items-center justify-center font-sans text-xs font-semibold uppercase tracking-editorial gap-2 px-5 py-3.5 rounded-sm bg-[#173A2D] text-[#F5F0E5] hover:bg-[#1F4C3C] active:scale-[0.98] transition-all duration-200 shadow-sm text-center min-h-[46px]"
                >
                  <span>Plan Your Trip</span>
                  <ArrowRight className="w-4 h-4 text-[#F5F0E5] transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/contact"
                  className="text-center text-xs tracking-kicker uppercase text-[#4A4E49] hover:text-[#173A2D] py-2.5 transition-colors font-medium min-h-[44px] flex items-center justify-center"
                >
                  Contact & Inquiries
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
