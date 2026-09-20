/**
 * ============================================================================
 * SERVICES DATA ARCHITECTURE
 * ============================================================================
 * The Transit Story provides broad travel arrangements rather than only
 * fixed tour packages. Customers communicate their destination and requirements,
 * and The Transit Story arranges the journey accordingly.
 *
 * Dedicated service visuals used for core services.
 * Neutral, verified wording with zero unsupported claims.
 * ============================================================================
 */

export const SERVICES_DATA = [
  {
    id: 'hotel-booking',
    eyebrow: 'Accommodations',
    title: 'Hotel Booking',
    description: "Accommodation arrangements coordinated around your route and travel preferences — from heritage stays and family hotels to student group lodging and serene backwater houseboats.",
    points: [
      'Heritage homestays and boutique lodgings',
      'Star hotels, family resorts, and guest stays',
      'Student-friendly group accommodations and dormitories',
      'Houseboat and coastal stay arrangements'
    ],
    image: '/images/services/hotel-booking.jpg',
    isEducational: false,
  },
  {
    id: 'transportation',
    eyebrow: 'Fleet & Transit',
    title: 'Transportation',
    description: 'Private vehicle and coach arrangements for individual, family, group, and educational travel as required. Well-maintained vehicles suited to regional South Indian routes.',
    points: [
      'AC tourist coaches and passenger buses',
      'Tempo Travelers and spacious group minivans',
      'Private sedans and SUVs for family itineraries',
      'Intercity transfers and station pick-up coordination'
    ],
    image: '/images/services/transportation.jpg',
    isEducational: false,
  },
  {
    id: 'tour-planning',
    eyebrow: 'Route & Schedule',
    title: 'Tour Planning',
    description: 'Help coordinate destinations, travel requirements, and journey planning. Balanced day-wise schedules crafted around your pacing without rushed stops.',
    points: [
      'Day-wise route pacing and transit scheduling',
      'Destination sequence and timing coordination',
      'Rest stops and regional food recommendations',
      'Temple visit hours and local access planning'
    ],
    image: '/images/services/tour-planning.jpg',
    isEducational: false,
  },
  {
    id: 'college-educational-tours',
    eyebrow: 'Industrial & Academic Visits',
    title: 'College & Educational Tours',
    description: 'Educational and industrial visit arrangements for colleges and student groups. Structured travel combining facility visits, science landmarks, and team exploration.',
    points: [
      'Industrial visit and academic site coordination',
      'Student cohort transportation and group lodging',
      'Curriculum-aligned technical and cultural exposure',
      'Itinerary planning tailored to institutional schedules'
    ],
    image: '/images/kerala-arts-crafts-village-01.jpg',
    isEducational: true,
    actionLink: '/services/college-educational-tours',
    actionText: 'Explore Educational Tours',
  },
  {
    id: 'group-travel',
    eyebrow: 'Family & Collective Travel',
    title: 'Group Travel',
    description: 'Travel arrangements for groups based on their requirements. Smooth coordination for extended family gatherings, alumni groups, and community outings.',
    points: [
      'Coordinated multi-family and alumni travel',
      'Comfortable pacing for travelers of all ages',
      'Group dining and common stay coordination',
      'Recreation, theme park, and scenic stops'
    ],
    image: '/images/wonderla-group-escapes-01.jpg',
    isEducational: false,
  },
  {
    id: 'custom-travel',
    eyebrow: 'Flexible Planning',
    title: 'Custom Travel Arrangements',
    description: "Flexible travel planning based on the customer's destination and needs. You communicate the destinations and duration; we coordinate the journey arrangements.",
    points: [
      'End-to-end custom itinerary planning',
      'Freedom to choose preferred circuits and stops',
      'Flexible vehicle type and lodging combinations',
      'Direct coordination for unique travel requirements'
    ],
    image: '/images/kodaikanal-01.jpg',
    isEducational: false,
  },
];
