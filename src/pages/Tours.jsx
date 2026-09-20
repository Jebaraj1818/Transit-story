import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { MapPin, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { getAllTours, matchesTourCategory, TOUR_CATEGORY_FILTERS } from '../data/destinations';
import { getDestinations, getCategories } from '../api/client';

export default function Tours() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';

  // State with initial local fallback so render is instantaneous
  const [allTours, setAllTours] = useState(() => getAllTours());
  const [categories, setCategories] = useState(TOUR_CATEGORY_FILTERS);

  // Fetch from Flask REST API
  useEffect(() => {
    let isMounted = true;
    getDestinations('all').then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setAllTours(data);
      }
    });
    getCategories().then((cats) => {
      if (isMounted && Array.isArray(cats) && cats.length > 0) {
        const formatted = cats.map((c) => ({
          id: c.slug || String(c.id),
          slug: c.slug,
          numericId: c.id,
          label: c.label || c.name || c.slug,
          name: c.name || c.label,
        }));
        // Ensure 'all' is at the front
        if (!formatted.some((c) => c.id === 'all')) {
          formatted.unshift({ id: 'all', label: 'All', slug: 'all' });
        }
        setCategories(formatted);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter tours based on active category
  const filteredTours = useMemo(() => {
    return allTours.filter((tour) => matchesTourCategory(tour, currentCategory));
  }, [allTours, currentCategory]);

  const handleCategoryChange = (categoryId) => {
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  const location = useLocation();
  // Capture the full Tours URL (with any ?category= filter) to pass as navigation state
  const toursFrom = location.pathname + location.search;

  return (
    <div className="min-h-screen pt-5 sm:pt-8 md:pt-12 pb-12 sm:pb-16 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. REFINED EDITORIAL MASTHEAD (Tight, intentional rhythm)                 */}
        {/* ========================================================================= */}
        <header>
          {/* Subtle Editorial Masthead Rule */}
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-3.5 sm:mb-4 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Destination Directory • Curated Expeditions</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              volume i / south india
            </span>
          </div>

          <div className="max-w-3xl">
            {/* Clean Dominant Main Heading */}
            <h1 className="font-serif text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-normal text-forest tracking-tight leading-[1.08] mb-2 sm:mb-3">
              ALL TOURS
            </h1>

            {/* Editorial Supporting Description */}
            <p className="text-xs sm:text-sm md:text-base text-charcoal-muted leading-relaxed font-normal text-balance">
              Explore journeys across culture, education, leisure, and custom travel.
              Unhurried pacing, living traditions, architectural marvels, and coordinated private transit.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* 2. REFINED CATEGORY NAVIGATION / FILTERS (Single row on desktop)          */}
          {/* ========================================================================= */}
          <div className="mt-5 sm:mt-7">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-charcoal-light font-medium mb-2.5">
              Filter By Travel Theme
            </div>

            {/* Mobile horizontal scrolling container, single row on desktop */}
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 lg:flex-nowrap flex-wrap">
              {categories.map((cat) => {
                const catId = cat.slug || cat.id;
                const isActive = currentCategory === catId || (currentCategory === 'all' && catId === 'all');

                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => handleCategoryChange(catId)}
                    className={`inline-flex items-center whitespace-nowrap text-[11px] sm:text-xs uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-sm transition-all duration-200 font-medium min-h-[42px] sm:min-h-[38px] touch-manipulation focus-visible:outline-[#C49A45] ${
                      isActive
                        ? 'bg-forest text-ivory shadow-sm border border-forest'
                        : 'bg-white/80 text-charcoal-muted hover:text-forest hover:bg-white border border-[#E0D7BD] hover:border-forest/40'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span>{cat.label || cat.name || cat.slug || 'All'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 3. DESTINATIONS DIRECTORY LISTING (Cards arrive visibly sooner)          */}
        {/* ========================================================================= */}
        <section className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#E3DCBF]">
          {/* Active Category Indicator & Reset Action (without numerical count) */}
          {currentCategory !== 'all' && (
            <div className="flex items-baseline justify-between gap-4 mb-4 sm:mb-6">
              <div className="text-xs uppercase tracking-[0.18em] font-serif italic text-earth">
                {categories.find((c) => (c.slug || c.id) === currentCategory)?.label ||
                 TOUR_CATEGORY_FILTERS.find((c) => c.id === currentCategory)?.label}
              </div>

              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className="text-xs uppercase tracking-[0.16em] text-earth hover:text-forest underline underline-offset-4 transition-colors font-medium min-h-[32px] flex items-center"
              >
                Reset to All Tours
              </button>
            </div>
          )}

          {/* Cards Grid */}
          {filteredTours.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-7">
              {filteredTours.map((tour) => {
                if (!tour) return null;
                const destinationUrl = `/tours/${tour.slug || tour.id}`;
                const cardImage =
                  tour.coverImage ||
                  tour.heroImage ||
                  (Array.isArray(tour.images) && tour.images[0]) ||
                  (Array.isArray(tour.gallery) && tour.gallery[0]) ||
                  '/images/nellaiyappar-temple-02.jpg';
                const categoryBadge = tour.categoryName || tour.category || 'Curated Tour';
                const title = tour.title || 'Curated Tour';
                const description = tour.description || tour.about || '';

                return (
                  <article
                    key={tour.id || tour.slug}
                    className="group flex flex-col bg-white/70 hover:bg-white border border-[#E3DCBF] hover:border-forest/35 rounded-sm overflow-hidden transition-all duration-300 shadow-sm hover:shadow-[0_6px_20px_rgba(23,58,45,0.06)]"
                  >
                    {/* Visual Card Media */}
                    <Link
                      to={destinationUrl}
                      state={{ from: toursFrom }}
                      className="relative block aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-forest/10 focus-visible:outline-gold"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <img
                        src={cardImage}
                        alt={title}
                        loading="lazy"
                        style={{ objectPosition: tour.heroPosition || 'center' }}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] sm:text-[11px] uppercase tracking-wider font-medium bg-forest-900/90 text-ivory backdrop-blur-sm border border-ivory/15 shadow-sm">
                          {categoryBadge}
                        </span>
                      </div>

                      {/* Quick Location Badge */}
                      {tour.location && (
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-ivory/90 text-xs font-medium drop-shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span className="truncate">{tour.location}</span>
                        </div>
                      )}
                    </Link>

                    {/* Card Content Block */}
                    <div className="p-4 sm:p-4.5 flex flex-col flex-grow">
                      {/* Destination Name */}
                      <h2 className="font-serif text-[1.3rem] sm:text-[1.45rem] font-normal text-forest tracking-tight group-hover:text-forest-800 transition-colors leading-snug">
                        <Link
                          to={destinationUrl}
                          state={{ from: toursFrom }}
                          className="focus-visible:outline-[#C49A45] hover:underline hover:decoration-earth/50"
                        >
                          {title}
                        </Link>
                      </h2>

                      {/* Short Description */}
                      {description && (
                        <p className="text-xs sm:text-[13px] text-charcoal-muted line-clamp-2 leading-relaxed mt-2 flex-grow">
                          {description}
                        </p>
                      )}

                      {/* Action / Click Indication */}
                      <div className="pt-3.5 mt-3.5 border-t border-[#E8E1CD]/70 flex items-center justify-between">
                        <Link
                          to={destinationUrl}
                          state={{ from: toursFrom }}
                          className="text-[11px] sm:text-xs uppercase tracking-editorial font-medium text-forest group-hover:text-gold flex items-center gap-1.5 transition-colors focus-visible:outline-[#C49A45] min-h-[34px]"
                        >
                          <span>Explore Destination</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                        {tour.tag && (
                          <span className="text-[10px] uppercase tracking-wider text-charcoal-light hidden sm:inline-block max-w-[130px] truncate">
                            {tour.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-white/40 border border-[#E3DCBF] rounded-sm px-4">
              <Compass className="w-9 h-9 text-earth/50 mx-auto mb-2.5" />
              <h3 className="font-serif text-lg sm:text-xl text-forest mb-1.5">No Destinations Found</h3>
              <p className="text-xs sm:text-sm text-charcoal-muted mb-4 max-w-md mx-auto">
                No itineraries currently match this specific travel category.
              </p>
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className="inline-flex items-center justify-center px-4 py-2 bg-forest text-ivory text-xs uppercase tracking-editorial font-medium rounded-sm hover:bg-forest-800 transition-colors min-h-[40px]"
              >
                View All Destinations
              </button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. BESPOKE & INSTITUTIONAL PLANNING BANNER                                */}
        {/* ========================================================================= */}
        <section className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#E3DCBF]">
          <div className="bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="max-w-2xl">
              <div className="flex items-center gap-1.5 text-earth text-xs uppercase tracking-kicker font-medium mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Routing & Private Transit</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-forest tracking-tight mb-1.5">
                Planning an Unlisted Destination or College Cohort?
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Whether coordinating department industrial visits, family gatherings, or custom heritage circuits across South India, our travel desk handles complete vehicle coordination, pacing, and lodging.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/plan-your-journey"
                className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 bg-forest hover:bg-forest-800 text-ivory text-xs uppercase tracking-editorial font-medium rounded-sm transition-colors shadow-sm focus-visible:outline-gold min-h-[44px]"
              >
                <span>Plan a Custom Journey</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
