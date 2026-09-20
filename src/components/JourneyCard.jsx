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
      className={`group flex flex-col bg-[#FCFAF5] border border-[#E3DCBF] rounded-sm overflow-hidden hover:border-earth/40 hover:shadow-[0_10px_30px_-6px_rgba(23,58,45,0.08)] transition-all duration-500 ${className}`}
    >
      {/* Editorial Photography Framing */}
      <Link
        to={journeyHref}
        className="relative aspect-[16/10] overflow-hidden block bg-forest/10 focus-visible:outline-gold"
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
          <span className="absolute top-4 left-4 bg-forest/90 backdrop-blur-sm text-ivory text-[10px] font-medium tracking-kicker uppercase px-3 py-1 rounded-sm border border-ivory/10">
            {category}
          </span>
        )}
      </Link>

      {/* Narrative & Details Area */}
      <div className="flex flex-col flex-1 p-5 sm:p-7 md:p-8">
        {/* Metadata: Location & Duration */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-charcoal-muted/90 tracking-wide mb-3 font-sans">
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-earth flex-shrink-0" />
              <span>{location}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-earth flex-shrink-0" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-2xl sm:text-[1.65rem] font-normal text-forest group-hover:text-forest-900 transition-colors leading-[1.22] mb-3">
          <Link to={journeyHref} className="focus-visible:outline-gold">
            {title}
          </Link>
        </h3>

        {/* Narrative Description */}
        {description && (
          <p className="text-sm text-charcoal-muted leading-relaxed line-clamp-3 mb-6 flex-1 font-normal">
            {description}
          </p>
        )}

        {/* Discover CTA Link */}
        <div className="pt-4 border-t border-[#E8E1CD] mt-auto">
          <Link
            to={journeyHref}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-kicker text-forest group-hover:text-earth transition-colors focus-visible:outline-gold py-1 min-h-[36px]"
          >
            <span>Discover Journey</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
