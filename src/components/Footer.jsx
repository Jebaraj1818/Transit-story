import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Compass, Mail, Phone } from 'lucide-react';
import Button from './Button';
import { SOCIAL_LINKS } from '../config/socialLinks';
import { getSiteSettings } from '../api/client';

/**
 * Recognizable Official Brand Icons (24x24 viewBox, scalable, editorial weight)
 */
function WhatsAppIcon({ className = 'w-[22px] h-[22px]' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-[22px] h-[22px]' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-[22px] h-[22px]' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

/**
 * Editorial Footer Component for The Transit Story.
 *
 * Strict Brand Palette:
 *  - Charcoal background: #20231F (darker, quieter, and conclusive)
 *  - Typography: Warm Ivory #F5F0E5
 *  - Accents: Muted Gold #C49A45
 *  - Borders: Earthy Charcoal #2D312C
 */
export default function Footer() {
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getSiteSettings().then((settings) => {
      if (isMounted && settings) {
        setSiteSettings(settings);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isValidUrl = (url) => typeof url === 'string' && url.trim().length > 0 && url.trim() !== '#';

  const whatsappHref = isValidUrl(siteSettings?.whatsapp_url)
    ? siteSettings.whatsapp_url.trim()
    : (isValidUrl(SOCIAL_LINKS.find((s) => s.id === 'whatsapp')?.href) ? SOCIAL_LINKS.find((s) => s.id === 'whatsapp').href : null);

  const instagramHref = isValidUrl(siteSettings?.instagram_url)
    ? siteSettings.instagram_url.trim()
    : (isValidUrl(SOCIAL_LINKS.find((s) => s.id === 'instagram')?.href) ? SOCIAL_LINKS.find((s) => s.id === 'instagram').href : null);

  const linkedinHref = isValidUrl(siteSettings?.linkedin_url)
    ? siteSettings.linkedin_url.trim()
    : (isValidUrl(SOCIAL_LINKS.find((s) => s.id === 'linkedin')?.href) ? SOCIAL_LINKS.find((s) => s.id === 'linkedin').href : null);

  const hasSocials = Boolean(whatsappHref || instagramHref || linkedinHref);

  return (
    <footer className="relative bg-[#20231F] text-[#F5F0E5]/90 border-t border-[#2D312C] overflow-hidden">
      {/* Clean, Non-Gradient Transition Divider */}
      <div className="w-full h-px bg-[#C49A45]/35" />

      {/* Spacious Upper Editorial Statement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-8 sm:pb-10 border-b border-[#2D312C]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-px bg-[#C49A45]" aria-hidden="true" />
              <span className="text-[10.5px] sm:text-xs uppercase tracking-kicker text-[#C49A45] font-medium">
                The Final Frame
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-normal text-[#F5F0E5] leading-[1.12] sm:leading-[1.08] tracking-tight">
              Where will your journey <br />
              <span className="italic text-[#C49A45] font-light">take you next?</span>
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
            <Button
              to="/plan-your-journey"
              variant="gold"
              size="md"
              className="tracking-widest w-full sm:w-auto"
            >
              <span>Plan Your Trip</span>
              <ArrowRight className="w-4 h-4 text-[#173A2D]" />
            </Button>
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-editorial text-[#F5F0E5]/70 hover:text-[#C49A45] py-2.5 transition-colors font-medium min-h-[44px]"
            >
              <span>Speak With a Curator</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-[#C49A45]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 lg:gap-14">
          {/* Column 1: Brand Emblem & Ethos (5 cols) */}
          <div className="md:col-span-5 flex flex-col space-y-5">
            <Link
              to="/"
              className="flex items-center gap-3.5 group text-left w-fit focus-visible:outline-[#C49A45] min-h-[44px]"
              aria-label="The Transit Story — Home"
            >
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#C49A45]/40 p-0.5 bg-[#FAF8F3] shadow-sm flex-shrink-0 transition-transform duration-500 group-hover:scale-105">
                <img
                  src="/logo/Transit-logo.jpeg"
                  alt="The Transit Story emblem"
                  className="w-full h-full object-cover scale-[1.04] rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-2xl font-normal tracking-wide text-[#F5F0E5] group-hover:text-[#C49A45] transition-colors leading-tight">
                  The Transit Story
                </span>
                <span className="text-[9.5px] sm:text-[11px] font-sans tracking-kicker text-[#C49A45] uppercase -mt-0.5 font-medium">
                  Curated Journeys
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#F5F0E5]/70 leading-relaxed max-w-sm font-normal">
              Travel beyond destinations. Discover people, culture, knowledge, and living stories. Crafted itineraries connecting curious travelers with heritage, landscapes, and institutions across South India.
            </p>

            <div className="pt-1 flex flex-col space-y-2 text-xs text-[#F5F0E5]/60">
              <div className="flex items-center gap-2 text-[#C49A45]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="uppercase tracking-editorial text-[10.5px] sm:text-[11px] font-medium">
                  Rooted in Tamil Nadu, South India
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#C49A45] flex-shrink-0" />
                <span className="uppercase tracking-editorial text-[10.5px] sm:text-[11px]">
                  Custom Logistics • College IV • Heritage
                </span>
              </div>
              <a
                href={`mailto:${siteSettings?.contact_email || 'transitstory.in@gmail.com'}`}
                className="flex items-center gap-2 text-[#F5F0E5]/75 hover:text-[#C49A45] transition-colors group pt-0.5"
                aria-label="Email The Transit Story"
              >
                <Mail className="w-3.5 h-3.5 text-[#C49A45] flex-shrink-0" />
                <span className="font-sans text-[11px] sm:text-xs tracking-normal lowercase group-hover:underline">
                  {siteSettings?.contact_email || 'transitstory.in@gmail.com'}
                </span>
              </a>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[#F5F0E5]/75 pt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#C49A45] flex-shrink-0" />
                <div className="flex items-center flex-wrap gap-x-2 font-sans text-[11px] sm:text-xs tracking-normal">
                  <a
                    href="tel:+918248697026"
                    className="hover:text-[#C49A45] transition-colors hover:underline"
                    aria-label="Call +91 8248697026"
                  >
                    +91 8248697026
                  </a>
                  <span className="text-[#C49A45]/60 select-none" aria-hidden="true">|</span>
                  <a
                    href="tel:+917871020387"
                    className="hover:text-[#C49A45] transition-colors hover:underline"
                    aria-label="Call +91 78710 20387"
                  >
                    +91 78710 20387
                  </a>
                </div>
              </div>
            </div>

            {/* Editorial Social Media Row */}
            {hasSocials && (
              <div className="pt-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C49A45] font-semibold block mb-2.5">
                  Connect With Us
                </span>
                <div className="flex items-center gap-4">
                  {/* WhatsApp */}
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="p-1 text-[#F5F0E5]/75 hover:text-[#C49A45] hover:bg-white/[0.04] rounded-sm transition-all duration-200 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[#C49A45] focus-visible:ring-offset-2 focus-visible:ring-offset-[#20231F] flex items-center justify-center cursor-pointer"
                    >
                      <WhatsAppIcon className="w-[22px] h-[22px]" />
                    </a>
                  )}

                  {/* Instagram */}
                  {instagramHref && (
                    <a
                      href={instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="p-1 text-[#F5F0E5]/75 hover:text-[#C49A45] hover:bg-white/[0.04] rounded-sm transition-all duration-200 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[#C49A45] focus-visible:ring-offset-2 focus-visible:ring-offset-[#20231F] flex items-center justify-center cursor-pointer"
                    >
                      <InstagramIcon className="w-[22px] h-[22px]" />
                    </a>
                  )}

                  {/* LinkedIn */}
                  {linkedinHref && (
                    <a
                      href={linkedinHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="p-1 text-[#F5F0E5]/75 hover:text-[#C49A45] hover:bg-white/[0.04] rounded-sm transition-all duration-200 ease-out hover:scale-110 focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-[#C49A45] focus-visible:ring-offset-2 focus-visible:ring-offset-[#20231F] flex items-center justify-center cursor-pointer"
                    >
                      <LinkedInIcon className="w-[22px] h-[22px]" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-3 sm:space-y-4">
            <h4 className="font-serif text-lg font-normal text-[#F5F0E5] tracking-wide border-b border-[#2D312C] pb-2">
              Explore
            </h4>
            <ul className="space-y-1 text-xs uppercase tracking-editorial font-medium text-[#F5F0E5]/70">
              <li>
                <Link to="/" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/tours" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Tours & Journeys
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Travel Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  About Our Ethos
                </Link>
              </li>
              <li>
                <Link to="/plan-your-journey" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Plan Your Journey
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Useful Links & Support (4 cols - Replaced Arrangements) */}
          <div className="md:col-span-4 space-y-3 sm:space-y-4">
            <h4 className="font-serif text-lg font-normal text-[#F5F0E5] tracking-wide border-b border-[#2D312C] pb-2">
              Information & Support
            </h4>
            <ul className="space-y-1 text-xs uppercase tracking-editorial font-medium text-[#F5F0E5]/70">
              <li>
                <Link to="/faq" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-[#C49A45] transition-colors py-2 flex items-center min-h-[38px]">
                  Terms & Conditions
                </Link>
              </li>
            </ul>

            <div className="pt-2 sm:pt-3">
              <Link
                to="/plan-your-journey"
                className="group inline-flex items-center gap-2 text-xs uppercase tracking-kicker text-[#C49A45] hover:text-[#D4B066] transition-colors font-semibold py-1.5 min-h-[40px]"
              >
                <span>Customize Your Requirements</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-[#C49A45]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Bar */}
        <div className="mt-8 pt-5 border-t border-[#2D312C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#F5F0E5]/50 gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} The Transit Story. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-[10px] sm:text-[10.5px] uppercase tracking-editorial text-[#F5F0E5]/50">
            <span>Rooted in Tamil Nadu</span>
            <span>•</span>
            <span>Cultural Storytelling</span>
            <span>•</span>
            <span>Tailored Transit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

