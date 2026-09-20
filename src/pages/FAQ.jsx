import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import { getFaqs } from '../api/client';

const DEFAULT_FAQ_ITEMS = [
  {
    id: 'customize-trip',
    question: 'Can I customise my trip?',
    answer:
      'Yes, entirely. Every journey with The Transit Story is arranged around your timeline, group size, and preferred destinations. Rather than selling rigid pre-packaged tours, we build the itinerary and logistics around what you want to experience.',
  },
  {
    id: 'transportation',
    question: 'Do you arrange transportation?',
    answer:
      'Yes. We coordinate dedicated private transport — including comfortable cars, tempo travelers, and tourist buses with verified professional drivers across South India. Whether for intercity travel, local sightseeing, or full multi-day routes, transportation is arranged to match your group size.',
  },
  {
    id: 'hotel-bookings',
    question: 'Can you help with hotel bookings and stays?',
    answer:
      'Yes. We coordinate accommodations that match your travel style — from heritage homestays and boutique retreats to star hotels and family-friendly stays. All accommodations are verified for safety, comfort, and hospitality.',
  },
  {
    id: 'college-educational-tours',
    question: 'Do you organise college and educational tours?',
    answer:
      'Yes. We coordinate tailored industrial visits (IVs), field immersions, and academic expeditions for college departments, schools, and student batches. We handle fleet buses, student-friendly accommodation, entry permissions, and faculty coordination.',
  },
  {
    id: 'how-to-enquire',
    question: 'How can I enquire about a journey?',
    answer:
      'You can submit a journey request through our "Plan Your Journey" form, specifying your preferred destinations, travel dates, group size, and required arrangements. Alternatively, you can reach out via our Contact page or speak directly with our curation desk.',
  },
  {
    id: 'travel-dates',
    question: 'Are there fixed departure dates or can we choose our own?',
    answer:
      'You choose your own dates. We operate on a bespoke model, so your journey starts whenever you are ready to travel. We advise on optimal seasons and regional timing for specific destinations to ensure the best experience.',
  },
];

export default function FAQ() {
  const shouldReduceMotion = useReducedMotion();
  const [faqs, setFaqs] = useState(DEFAULT_FAQ_ITEMS);
  const [openId, setOpenId] = useState(DEFAULT_FAQ_ITEMS[0].id);

  useEffect(() => {
    let isMounted = true;
    getFaqs().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setFaqs(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen pt-5 sm:pt-8 md:pt-12 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Masthead */}
        <header className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-3.5 sm:mb-4 border-b border-[#E3DCBF]/80 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-earth font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-px bg-earth" aria-hidden="true" />
              <span>Help & Guidance • The Transit Story</span>
            </div>
            <span className="hidden sm:inline-block font-serif italic text-charcoal-muted tracking-normal text-xs lowercase">
              practical questions
            </span>
          </div>

          <div className="max-w-3xl">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-earth font-medium block mb-2.5">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h1 className="font-serif text-[2.25rem] sm:text-4xl md:text-5xl font-normal text-forest tracking-tight leading-[1.08] mb-3">
              Questions & Practical Notes
            </h1>
            <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed font-normal">
              Everything you need to know about how we plan, arrange, and coordinate custom travel across South India.
            </p>
          </div>
        </header>

        {/* FAQ Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((item) => {
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white/70 border border-[#E3DCBF] rounded-sm overflow-hidden transition-colors hover:border-earth/40"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer focus-visible:outline-[#C49A45] select-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-lg sm:text-xl text-forest font-normal leading-snug">
                    {item.question}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full bg-forest/5 flex items-center justify-center flex-shrink-0 text-forest transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-forest/10 text-gold' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
                    >
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#E8E1CD]/60 text-xs sm:text-sm text-charcoal-muted leading-relaxed font-normal">
                        <p>{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 sm:mt-16 bg-[#FAF6EC] border border-[#E0D7BD] rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-earth text-xs uppercase tracking-kicker font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Have a specific question?</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-forest font-normal tracking-tight">
              Ready to discuss your journey?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1 leading-relaxed">
              Our travel curators are happy to help answer any questions or build a custom plan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Button to="/plan-your-journey" variant="primary" size="md">
              Plan Your Journey
            </Button>
            <Button to="/contact" variant="outline" size="md">
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
