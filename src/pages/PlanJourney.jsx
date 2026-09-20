import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
import Button from '../components/Button';
import { Compass, Check, MapPin } from 'lucide-react';
import { submitJourneyEnquiry, getDestinationBySlug } from '../api/client';

export default function PlanJourney() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const resolveDestinationName = (dest) => {
    if (!dest) return '';
    const clean = dest.toLowerCase().trim();
    const serviceMap = {
      'college-educational-tours': 'College & Educational Tours',
      'college-iv': 'College & Educational Tours',
      'hotel-booking': 'Hotel Booking & Accommodations',
      'transportation': 'Transportation & Transit',
      'tour-planning': 'Tour & Itinerary Planning',
      'group-travel': 'Group Travel Arrangements',
      'custom-travel': 'Custom Travel Arrangements',
      'cultural-heritage': 'Cultural & Heritage Journey',
      'cultural-heritage-journey': 'Cultural & Heritage Journey',
    };
    if (serviceMap[clean]) return serviceMap[clean];

    // If already a formatted display title with spaces and uppercase letters
    if (dest.includes(' ') && dest[0] === dest[0].toUpperCase()) {
      return dest;
    }

    // Convert slug to clean title casing (e.g. courtallam -> Courtallam)
    return clean
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/ And /g, ' & ');
  };

  // Read destination or service from location.state or query parameters
  const rawInitial =
    location.state?.destination ||
    location.state?.journey ||
    searchParams.get('service') ||
    searchParams.get('destination') ||
    searchParams.get('interest') ||
    (searchParams.get('type') === 'college-iv' ? 'College & Educational Tours' : '') ||
    '';

  const [destination, setDestination] = useState(() => resolveDestinationName(rawInitial));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [travelers, setTravelers] = useState('Solo traveler');
  const [timeframe, setTimeframe] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if location.state or query params change, resolving canonical destination title
  useEffect(() => {
    const rawTarget =
      location.state?.destination ||
      location.state?.journey ||
      searchParams.get('service') ||
      searchParams.get('destination') ||
      searchParams.get('interest') ||
      (searchParams.get('type') === 'college-iv' ? 'College & Educational Tours' : '') ||
      '';

    if (!rawTarget) return;

    let isMounted = true;
    getDestinationBySlug(rawTarget)
      .then((d) => {
        if (isMounted && d && d.title) {
          setDestination(d.title);
        } else if (isMounted) {
          setDestination(resolveDestinationName(rawTarget));
        }
      })
      .catch(() => {
        if (isMounted) {
          setDestination(resolveDestinationName(rawTarget));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.state, searchParams]);

  // Ensure page always starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setPhoneError('Please enter your phone number.');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    try {
      await submitJourneyEnquiry({
        fullName,
        email,
        phone,
        destination,
        travelers,
        timeframe,
        notes,
        type: destination.toLowerCase().includes('college') ? 'college_iv' : 'journey_request'
      });
    } catch (err) {
      console.warn('Journey Enquiry API notice:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Bespoke Curation"
          title="Plan Your Journey"
          description="Tell us your travel intentions, cultural interests, and preferred rhythm. We will craft a bespoke itinerary tailored to you."
          align="center"
        />

        <div className="bg-white/60 border border-ivory-200 p-4 sm:p-7 md:p-10 rounded-sm shadow-sm mt-8 sm:mt-10">
          {submitted ? (
            <div className="text-center py-10 sm:py-12 space-y-4">
              <div className="w-12 h-12 bg-forest/10 rounded-full flex items-center justify-center mx-auto text-forest mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-forest">
                Your Journey Request is Received
              </h3>
              <p className="text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
                Thank you for entrusting us with your journey plans. A travel curator from Transit Story will reach out within 24 to 48 hours to schedule a conversation.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setFullName('');
                    setEmail('');
                    setPhone('');
                    setPhoneError('');
                    setNotes('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Submit another request
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate={false}>
              {/* Destination / Journey of Interest */}
              <div>
                <label htmlFor="destination" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                  Selected Journey / Destination:
                </label>
                <div className="relative">
                  <input
                    id="destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Nellaiyappar Temple, Thirumalai Kovil, Kutralam..."
                    className="w-full px-4 py-3 bg-ivory-50 border border-ivory-200 rounded-sm text-base sm:text-sm font-semibold text-forest focus:border-gold focus:outline-none min-h-[46px]"
                  />
                  {destination && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-editorial text-earth font-medium bg-ivory-100 px-2 py-0.5 rounded-sm pointer-events-none">
                      Prefilled
                    </span>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-ivory-50 border border-ivory-200 rounded-sm text-base sm:text-sm text-charcoal focus:border-gold focus:outline-none min-h-[46px]"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label htmlFor="planEmail" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    id="planEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-ivory-50 border border-ivory-200 rounded-sm text-base sm:text-sm text-charcoal focus:border-gold focus:outline-none min-h-[46px]"
                  />
                </div>

                <div>
                  <label htmlFor="planPhone" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="planPhone"
                    type="tel"
                    inputMode="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full px-4 py-3 bg-ivory-50 border rounded-sm text-base sm:text-sm text-charcoal focus:border-gold focus:outline-none min-h-[46px] ${
                      phoneError ? 'border-[#A63A2B] bg-[#FFF8F7]' : 'border-ivory-200'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-[11px] text-[#A63A2B] font-medium mt-1.5">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label htmlFor="travelers" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                    Estimated Travelers
                  </label>
                  <select
                    id="travelers"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    className="w-full px-4 py-3 bg-ivory-50 border border-ivory-200 rounded-sm text-base sm:text-sm text-charcoal focus:border-gold focus:outline-none min-h-[46px]"
                  >
                    <option>Solo traveler</option>
                    <option>Couple / 2 travelers</option>
                    <option>Small group (3-6)</option>
                    <option>Curated collective (7+)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timeframe" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                    Approximate Timeframe
                  </label>
                  <input
                    id="timeframe"
                    type="text"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="e.g. October 2026 or Winter"
                    className="w-full px-4 py-3 bg-ivory-50 border border-ivory-200 rounded-sm text-base sm:text-sm text-charcoal focus:border-gold focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                  Primary Themes of Interest
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-charcoal">
                  <label className="flex items-center gap-3 p-3.5 bg-ivory-50/80 border border-ivory-200/80 rounded-sm cursor-pointer hover:bg-ivory-100 min-h-[46px] select-none">
                    <input type="checkbox" className="w-4 h-4 accent-forest flex-shrink-0" defaultChecked />
                    <span className="text-xs sm:text-sm">Cultural Immersion & Craft</span>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 bg-ivory-50/80 border border-ivory-200/80 rounded-sm cursor-pointer hover:bg-ivory-100 min-h-[46px] select-none">
                    <input type="checkbox" className="w-4 h-4 accent-forest flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Offbeat & Rural Trails</span>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 bg-ivory-50/80 border border-ivory-200/80 rounded-sm cursor-pointer hover:bg-ivory-100 min-h-[46px] select-none">
                    <input type="checkbox" className="w-4 h-4 accent-forest flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Intellectual & Architectural History</span>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 bg-ivory-50/80 border border-ivory-200/80 rounded-sm cursor-pointer hover:bg-ivory-100 min-h-[46px] select-none">
                    <input type="checkbox" className="w-4 h-4 accent-forest flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Culinary & Ecological Terroir</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-xs uppercase tracking-wider text-charcoal-muted font-medium mb-2">
                  Additional Notes or Intentions
                </label>
                <textarea
                  id="notes"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any specific places, pacing preferences, or inspirations for your journey..."
                  className="w-full px-4 py-3 bg-ivory-50 border border-ivory-200 rounded-sm text-base sm:text-sm text-charcoal focus:border-gold focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" className="w-full min-h-[48px]">
                  Submit Journey Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
