/**
 * ============================================================================
 * COLLEGE & EDUCATIONAL TOURS DATA ARCHITECTURE
 * ============================================================================
 * Dedicated data models for College & Educational Tours (/services & /services/:slug).
 *
 * Uses ONLY local original project images from public/images/.
 * Zero external URLs, zero Unsplash/Pexels, zero invented claims.
 * All content grounded strictly in educational exposure, architectural design,
 * traditional craftsmanship, and large-scale industrial observation.
 * ============================================================================
 */

export const EDUCATIONAL_TOURS = [
  {
    id: 'kerala-arts-and-science',
    slug: 'kerala-arts-and-science',
    number: '01',
    title: 'Kerala Arts & Science',
    category: 'College & Educational Tours',
    location: 'Kovalam • Thiruvananthapuram',
    tag: 'Craft Traditions & Design Study',
    coverImage: '/images/kerala-arts-crafts-village-01.jpg',
    heroPosition: 'center 35%',
    images: [
      '/images/kerala-arts-crafts-village-03.jpg',
      '/images/kerala-arts-crafts-village-02.jpg',
      '/images/kerala-arts-crafts-village-04.jpg'
    ],
    description: 'A comprehensive campus immersion into traditional Kerala architecture, vernacular craft pavilions, and living artisan workshops.',
    about: 'Situated in the tranquil outskirts of Kovalam near Thiruvananthapuram, this extensive campus serves as a cultural and educational sanctuary dedicated to preserving and showcasing Kerala’s traditional craftsmanship. Designed with vernacular architectural idioms, open-air pavilions, and dedicated artisan ateliers, the visit offers student cohorts and institutional groups direct exposure to living craft traditions, material design philosophies, and cultural conservation practices.',
    experiences: [
      'Direct observation of master craftsmen working with handloom textiles, terracotta, and bell-metal casting',
      'Study of vernacular Kerala campus architecture, passive ventilation, and sloped clay-tile roof design',
      'Exploration of curated craft pavilions illustrating regional material arts and indigenous design heritage',
      'Field interaction with artisan collectives detailing traditional techniques and contemporary applications'
    ],
    highlights: [
      'Living craft ateliers covering traditional handloom, brass casting, and woodwork',
      'Harmonious open-air campus design nestled within coastal Thiruvananthapuram greenery',
      'Valuable educational exposure for design, architecture, arts, and humanities students',
      'Flexible group visit pacing suited for college batches and institutional cohorts'
    ],
    suitableFor: 'Design academies, architecture faculties, cultural study departments, and student group visits.'
  },
  {
    id: 'koodankulam-nuclear-plant',
    slug: 'koodankulam-nuclear-plant',
    number: '02',
    title: 'Koodankulam Nuclear Plant',
    category: 'College & Educational Tours',
    location: 'Koodankulam • Tirunelveli',
    tag: 'Industrial & Power Engineering',
    coverImage: '/images/koodankulam-nuclear-plant-01.jpg',
    heroPosition: 'center 45%',
    images: [
      '/images/koodankulam-nuclear-plant-02.avif',
      '/images/koodankulam-nuclear-plant-03.avif',
      '/images/koodankulam-nuclear-plant-04.jpg'
    ],
    description: 'Direct field perspective on one of India’s largest coastal energy installations, massive civil infrastructure, and high-capacity power generation.',
    about: 'Located along the southern coastline of Tamil Nadu in Tirunelveli district, the Koodankulam installation represents a landmark in large-scale energy infrastructure and modern engineering execution. A dedicated industrial visit offers engineering students and academic cohorts an irreplaceable real-world perspective on mega-scale coastal civil engineering, grid-scale power generation logistics, and regional infrastructure integration.',
    experiences: [
      'Visual study of large-scale containment structures and coastal heavy-engineering construction',
      'Appreciation of grid transmission networks, regional power distribution, and coastal civil engineering',
      'Field exposure to high-capacity industrial installation layouts and coastal environmental planning',
      'Connecting educational perspectives with regional geography and South Indian industrial corridors'
    ],
    highlights: [
      'One of India’s most prominent civil and energy infrastructure installations',
      'Real-world context for mechanical, electrical, civil, and energy engineering cohorts',
      'Scenic southern coastal transit route connecting easily with Tirunelveli and Kanyakumari',
      'Coordinated group transit logistics tailored to institutional field schedules'
    ],
    suitableFor: 'Engineering students, polytechnic colleges, technical faculties, and science cohorts.'
  }
];

export const EDUCATIONAL_TOURS_DATA = {
  slug: 'services',
  eyebrow: 'COLLEGE & EDUCATIONAL TOURS',
  heroTitle: 'College & Educational\nTours',
  heroTagline: 'Curated industrial and educational field visits tailored to institutional learning requirements and group rhythms.',
  intro: {
    eyebrow: 'EXPERIENTIAL LEARNING',
    heading: 'Bridging classroom learning with real-world exposure and regional exploration.',
    description: 'The Transit Story arranges custom educational and industrial visits for colleges, academic departments, and student cohorts. We coordinate dedicated private group transport, accommodation, and balanced schedules designed specifically around your institution’s requirements — never off-the-shelf packages.'
  },
  heroSlides: [
    {
      id: 'kerala-arts-slide',
      name: 'Kerala Arts & Science',
      location: 'Kovalam • Thiruvananthapuram',
      tag: 'Craft Traditions & Vernacular Design',
      image: '/images/kerala-arts-crafts-village-01.jpg',
      objectPosition: 'center 35%',
      slug: 'kerala-arts-and-science'
    },
    {
      id: 'koodankulam-slide',
      name: 'Koodankulam Nuclear Plant',
      location: 'Koodankulam • Tirunelveli',
      tag: 'Industrial Engineering & Mega Infrastructure',
      image: '/images/koodankulam-nuclear-plant-01.jpg',
      objectPosition: 'center 45%',
      slug: 'koodankulam-nuclear-plant'
    }
  ],
  tours: EDUCATIONAL_TOURS,
  bottomCta: {
    heading: 'Planning a college or educational visit?',
    subheading: 'Share your group size, travel dates, and academic focus. We will arrange the journey around your institution’s exact requirements.',
    buttonText: 'PLAN AN EDUCATIONAL VISIT →'
  }
};

/**
 * Slug resolver supporting primary slugs and common aliases
 */
export function getEducationalTourBySlug(slug) {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();

  const aliases = {
    'kerala-arts-and-science': 'kerala-arts-and-science',
    'kerala-arts-science': 'kerala-arts-and-science',
    'kerala-arts-crafts-village': 'kerala-arts-and-science',
    'kerala-arts': 'kerala-arts-and-science',
    'koodankulam-nuclear-plant': 'koodankulam-nuclear-plant',
    'koodankulam': 'koodankulam-nuclear-plant',
    'koodangulam': 'koodankulam-nuclear-plant',
    'koodankulam-nuclear-power-plant': 'koodankulam-nuclear-plant',
  };

  const targetId = aliases[clean] || clean;

  return (
    EDUCATIONAL_TOURS.find((t) => t.id === targetId || t.slug === targetId) ||
    EDUCATIONAL_TOURS.find((t) => t.slug.toLowerCase() === clean) ||
    EDUCATIONAL_TOURS.find(
      (t) =>
        t.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') === clean
    )
  );
}
