import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

/**
 * Editorial JourneyCard component
 * Designed like an independent travel publication feature rather than an e-commerce card.
 */
export default function JourneyCard({
  image,
  category,
  title,
  location,
  duration,
  description,
  slug,
  className = '',
}) {
  const journeyHref = `/journeys/${slug}`;

  return (
    <article
      className={`group flex flex-col bg-transparent overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Editorial Photography Framing */}
      <Link
        to={journeyHref}
        className="relative aspect-[16/10] overflow-hidden rounded-sm block bg-forest/10 focus-visible:outline-gold shadow-sm"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {/* Category Tag */}
        {category && (
          <span className="absolute top-4 left-4 bg-forest-950/90 backdrop-blur-md text-ivory text-[10px] font-semibold tracking-kicker uppercase px-2.5 py-1 rounded-sm border border-gold/30 shadow-sm">
            {category}
          </span>
        )}
      </Link>

      {/* Narrative & Details Area: Direct typography without card wrapper */}
      <div className="flex flex-col flex-1 pt-4 pb-2">
        {/* Metadata: Location & Duration */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-charcoal-muted/90 tracking-wide mb-2.5 font-sans">
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span>{location}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Title: Level 3 Destination Heading */}
        <h3 className="font-serif text-xl sm:text-2xl lg:text-[1.65rem] font-medium text-forest group-hover:text-forest-900 transition-colors leading-[1.18] mb-2.5">
          <Link to={journeyHref} className="focus-visible:outline-gold">
            {title}
          </Link>
        </h3>

        {/* Narrative Description: Level 5 Body */}
        {description && (
          <p className="text-xs sm:text-[13.5px] text-charcoal-muted leading-relaxed line-clamp-3 mb-5 flex-1 font-normal">
            {description}
          </p>
        )}

        {/* Discover CTA Link */}
        <div className="pt-3 border-t border-[#E8E1CD] mt-auto">
          <Link
            to={journeyHref}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-editorial text-forest group-hover:text-gold transition-colors focus-visible:outline-gold py-1 min-h-[36px]"
          >
            <span className="border-b border-forest/30 group-hover:border-gold pb-0.5 transition-colors">
              Discover Journey
            </span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5 text-gold" />
          </Link>
        </div>
      </div>
    </article>
  );
}
