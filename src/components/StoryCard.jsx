import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

/**
 * Editorial magazine-style StoryCard component
 * Reflects independent travel journal dispatches and cultural essays.
 */
export default function StoryCard({
  image,
  category,
  title,
  excerpt,
  date,
  readTime,
  slug,
  className = '',
}) {
  const storyHref = `/stories/${slug}`;

  return (
    <article
      className={`group flex flex-col bg-[#FCFAF5] border border-[#E3DCBF] rounded-sm overflow-hidden hover:border-earth/40 hover:shadow-[0_10px_30px_-6px_rgba(23,58,45,0.08)] transition-all duration-500 ${className}`}
    >
      {/* Story Photography */}
      <Link
        to={storyHref}
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
        {category && (
          <span className="absolute bottom-3 left-3 bg-forest-900/90 backdrop-blur-sm text-ivory text-[10px] font-medium tracking-kicker uppercase px-2.5 py-1 rounded-sm border border-ivory/10">
            {category}
          </span>
        )}
      </Link>

      {/* Story Narrative & Metadata */}
      <div className="flex flex-col flex-1 p-5 sm:p-7">
        {/* Date & Read Time */}
        <div className="flex items-center gap-3 text-xs text-charcoal-muted/80 mb-2.5 font-sans">
          {date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span>{date}</span>
            </div>
          )}
          {date && readTime && <span className="text-[#C4BBA2]">•</span>}
          {readTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-earth flex-shrink-0" />
              <span>{readTime}</span>
            </div>
          )}
        </div>

        {/* Story Headline */}
        <h3 className="font-serif text-xl sm:text-[1.35rem] font-normal text-forest leading-[1.26] mb-3 group-hover:text-forest-900 transition-colors">
          <Link to={storyHref} className="focus-visible:outline-gold">
            {title}
          </Link>
        </h3>

        {/* Story Excerpt */}
        {excerpt && (
          <p className="text-sm text-charcoal-muted leading-relaxed line-clamp-3 mb-5 flex-1 font-normal">
            {excerpt}
          </p>
        )}

        {/* Dispatch Action */}
        <div className="pt-4 border-t border-[#E8E1CD] mt-auto">
          <Link
            to={storyHref}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-kicker uppercase text-forest group-hover:text-earth transition-colors focus-visible:outline-gold py-1 min-h-[36px]"
          >
            <span>Read Field Note</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
