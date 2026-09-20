/**
 * ============================================================================
 * DESTINATIONS DATA SYSTEM
 * ============================================================================
 * Data-driven architecture for Journey Ideas and Dedicated Destination Pages.
 *
 * Each destination contains:
 * - id: unique identifier string
 * - slug: primary URL slug
 * - title: destination name
 * - category: journey thematic category (e.g. "Cultural & Heritage Journey")
 * - location: regional label (e.g. "Tirunelveli • Tamil Nadu")
 * - tag: thematic subtitle badge
 * - coverImage: primary full-bleed hero banner image (LOCAL ASSET)
 * - heroPosition: CSS object-position for hero crop control
 * - images: array of all local photographic frames for the destination gallery
 * - description: concise introductory quote/overview
 * - about: authentic narrative of the destination and what makes it special
 * - highlights: categorized genuine travel highlights (no fake packages)
 * - experiences: curated experiential encounters
 * - suitableFor: note on ideal traveler types
 * ============================================================================
 */

export const DESTINATIONS = [
  {
    id: 'courtallam',
    slug: 'courtallam',
    title: 'Courtallam',
    mainCategory: 'leisure-holiday',
    categoryName: 'Leisure & Holiday',
    category: 'Nature & Wellness Journey',
    location: 'Tenkasi • Tamil Nadu',
    tag: 'Cascades & Herbal Waters',
    coverImage: '/images/kutralam-01.webp',
    heroImage: '/images/kutralam-01.webp',
    heroPosition: 'center 40%',
    gallery: [
      '/images/kutralam-02.jpg',
      '/images/kutralam-03.jpg'
    ],
    images: [
      '/images/kutralam-01.webp',
      '/images/kutralam-02.jpg',
      '/images/kutralam-03.jpg'
    ],
    description: 'Cascading Western Ghats waterfalls flowing through medicinal forest groves, renowned for cool mountain breezes and revitalizing natural waters.',
    about: 'Nestled in the lush foothills of the Western Ghats within Tenkasi district, Courtallam is celebrated for its perennial waterfalls and soothing microclimate. Originating in dense herbal forest groves, the mountain streams tumble over stepped granite rocks into natural bathing pools, making it a beloved destination for relaxation, wellness, and scenic nature trails.',
    experiences: [
      'Natural bathing in mineral-rich mountain waterfalls and stepped pools',
      'Morning walks along tranquil forest paths surrounded by Western Ghats ridgelines',
      'Visiting heritage riverside shrines and quiet local viewpoints overlooking the plains',
      'Exploring nearby spice groves, village coconut farms, and traditional food stalls'
    ],
    highlights: [
      'Multiple cascading falls including Main Falls, Five Falls, and Old Courtallam',
      'Lush Western Ghats flora, medicinal forest canopy, and refreshing mountain air',
      'Comfortable access to Tenkasi heritage temples and border scenic routes',
      'Ideal base for relaxed wellness getaways and gentle nature walks'
    ],
    suitableFor: 'Family holidays, nature seekers, wellness getaways, and student retreats.'
  },
  {
    id: 'munnar',
    slug: 'munnar',
    title: 'Munnar',
    mainCategory: 'leisure-holiday',
    categoryName: 'Leisure & Holiday',
    category: 'Highland & Plantation Journey',
    location: 'Idukki Highlands • Kerala',
    tag: 'Tea Valleys & Cloud Ridges',
    coverImage: '/images/munnar-02.jpg',
    heroImage: '/images/munnar-02.jpg',
    heroPosition: 'center 45%',
    gallery: [
      '/images/munnar-01.webp',
      '/images/munnar-03.webp',
      '/images/munnar-04.jpg'
    ],
    images: [
      '/images/munnar-02.jpg',
      '/images/munnar-01.webp',
      '/images/munnar-03.webp',
      '/images/munnar-04.jpg'
    ],
    description: 'Rolling carpet of emerald tea estates, mist-laden highland ridges, and serene mountain air in the Western Ghats.',
    about: 'Situated at the confluence of three mountain streams in the High Ranges of Kerala, Munnar is renowned for vast manicured tea plantations, cool mountain climate, and dramatic cloud-filled valleys. Quiet walking paths trace ancient tea estate bridle paths through cool morning mist and protected shola forest belts.',
    experiences: [
      'Walking through single-estate orthodox tea gardens during early morning mist',
      'Panoramic mountain views across the Anamudi ranges and valley reservoirs',
      'Discovering colonial tea history and regional highland spice cultivars',
      'Quiet mountain evenings in heritage plantation bungalows'
    ],
    highlights: [
      'Vast expanses of high-altitude tea valleys rolling as far as the eye can see',
      'Cool mountain climate with fresh alpine air year-round',
      'Protected shola habitats home to endemic birds and flora',
      'Unhurried scenic drives through winding Western Ghats mountain passes'
    ],
    suitableFor: 'Couples, photography enthusiasts, family retreats, and nature lovers.'
  },
  {
    id: 'ooty-nilgiris',
    slug: 'ooty-nilgiris',
    title: 'Ooty & Nilgiris',
    mainCategory: 'leisure-holiday',
    categoryName: 'Leisure & Holiday',
    category: 'Highland & Shola Journey',
    location: 'Nilgiri Highlands • Tamil Nadu',
    tag: 'Highland Terroirs & Shola Ridges',
    coverImage: '/images/ooty-01.jpg',
    heroImage: '/images/ooty-01.jpg',
    heroPosition: 'center 35%',
    gallery: [
      '/images/ooty-02.jpg',
      '/images/ooty-03.jpg',
      '/images/ooty-04.jpg'
    ],
    images: [
      '/images/ooty-01.jpg',
      '/images/ooty-02.jpg',
      '/images/ooty-03.jpg',
      '/images/ooty-04.jpg'
    ],
    description: 'Venture past commercial tourist spots into single-estate organic tea walks, quiet Toda hamlets, and mist-covered shola ridges.',
    about: 'Rising high above the Coimbatore plains, the Nilgiri plateau offers an unhurried highland realm of rolling tea carpets, ancient shola forest pockets, and indigenous heritage. Experience cool mountain air, historic colonial architecture, and protected biosphere trails.',
    experiences: [
      'Single-estate organic tea cupping and plantation walks with planters',
      'Unhurried walks along quiet shola ridges and bird sanctuaries',
      'Respectful cultural engagement with Toda artisan communities',
      'Private scenic drives through Kotagiri and Coonoor backroads'
    ],
    highlights: [
      'Single-estate orthodox tea processing and tasting',
      'Native shola-grassland ecology unique to the Nilgiri biosphere',
      'Peaceful stays away from congested town centers',
      'Temperate mountain weather year-round'
    ],
    suitableFor: 'Couples, quiet leisure travelers, nature photographers, and small groups.'
  },
  {
    id: 'kodaikanal',
    slug: 'kodaikanal',
    title: 'Kodaikanal',
    mainCategory: 'leisure-holiday',
    categoryName: 'Leisure & Holiday',
    category: 'Highland & Pine Trails Journey',
    location: 'Western Ghats • Tamil Nadu',
    tag: 'Pine Trails & Mist',
    coverImage: '/images/kodaikanal-01.jpg',
    heroImage: '/images/kodaikanal-01.jpg',
    heroPosition: 'center 40%',
    gallery: [
      '/images/kodaikanal-02.jpg',
      '/images/kodaikanal-03.jpg',
      '/images/kodaikanal-04.avif'
    ],
    images: [
      '/images/kodaikanal-01.jpg',
      '/images/kodaikanal-02.jpg',
      '/images/kodaikanal-03.jpg',
      '/images/kodaikanal-04.avif'
    ],
    description: 'Quiet forest walks, serene lake mornings, and unhurried viewpoints away from crowded thoroughfares.',
    about: 'Set upon the Palani Hills of Dindigul district, Kodaikanal combines dense pine woods, dramatic cloud-filled valleys, and secluded highland fruit orchards. Transit Story coordinates private highland transit, serene stays, and bespoke nature walks tailored directly to your requirements.',
    experiences: [
      'Sunrise vantage walks overlooking deep cloud-filled valleys',
      'Canopy walking under century-old pine and eucalyptus forests',
      'Visits to quiet organic orchards and local artisanal producers',
      'Unhurried evening lakeside pauses in crisp mountain air'
    ],
    highlights: [
      'Scenic high-altitude lake trails and forested paths',
      'Vast panoramic views toward the southern plains',
      'Cool highland microclimate with frequent rolling mist',
      'Curated quiet stays in historic stone cottages and hillside retreats'
    ],
    suitableFor: 'Highland walkers, family vacations, and unhurried retreats.'
  },
  {
    id: 'kochi-alappuzha',
    slug: 'kochi-alappuzha',
    title: 'Kochi & Alappuzha',
    mainCategory: 'leisure-holiday',
    categoryName: 'Leisure & Holiday',
    category: 'Coast & Waters Journey',
    location: 'Coast & Waters • Kerala',
    tag: 'Backwaters & Spice Port',
    coverImage: '/images/kochi-alappuzha-banner.jpg',
    heroImage: '/images/kochi-alappuzha-banner.jpg',
    heroPosition: 'center 45%',
    gallery: [
      '/images/kochi-alappuzha-01.jpg',
      '/images/kochi-alappuzha-02.webp',
      '/images/kochi-alappuzha-03.png'
    ],
    images: [
      '/images/kochi-alappuzha-banner.jpg',
      '/images/kochi-alappuzha-01.jpg',
      '/images/kochi-alappuzha-02.webp',
      '/images/kochi-alappuzha-03.png'
    ],
    description: 'Historic colonial maritime quarters, quiet backwater canals, and curated coastal pacing arranged around your preferences.',
    about: 'Combining the historic spice warehouses and colonial art streets of Fort Kochi with the tranquil canal networks of Alappuzha, this journey brings together seafaring history and slow backwater life. Transit Story coordinates private transfers, verified boutique stays, and leisurely water exploration tailored entirely to your group.',
    experiences: [
      'Heritage walking through Fort Kochi, Mattancherry spice lanes, and colonial avenues',
      'Private day or sunset canal cruises through the unhurried waterways of Alappuzha',
      'Local culinary stops featuring authentic regional coastal cooking',
      'Traditional performance arts and historic architectural visits'
    ],
    highlights: [
      'Centuries-old spice trading alleys, churches, and maritime history',
      'Palm-fringed lagoons and interconnected rural waterways',
      'Curated private vehicle transit between Kochi and Alappuzha',
      'Flexible pacing with custom accommodation choices'
    ],
    suitableFor: 'Culture enthusiasts, slow travelers, couples, and family holidays.'
  },
  {
    id: 'wonderla-kochi',
    slug: 'wonderla-kochi',
    title: 'Wonderla Kochi',
    mainCategory: 'group-custom',
    categoryName: 'Group & Custom',
    category: 'Recreation & Group Escapes',
    location: 'Kochi • Kerala',
    tag: 'Recreation & Adventure',
    coverImage: '/images/wonderla-group-escapes-01.jpg',
    heroImage: '/images/wonderla-group-escapes-01.jpg',
    heroPosition: 'center 45%',
    gallery: [
      '/images/wonderla-group-escapes-02.avif',
      '/images/wonderla-group-escapes-03.webp',
      '/images/wonderla-group-escapes-04.avif'
    ],
    images: [
      '/images/wonderla-group-escapes-01.jpg',
      '/images/wonderla-group-escapes-02.avif',
      '/images/wonderla-group-escapes-03.webp',
      '/images/wonderla-group-escapes-04.avif'
    ],
    description: 'High-energy recreation, curated group transit, and structured leisure arrangements designed for student batches and family gatherings.',
    about: 'Situated on the scenic outskirts of Kochi, Wonderla provides expansive recreation zones, water attractions, and open-air entertainment. Transit Story arranges comfortable group transit, verified stays, and flexible pacing tailored directly around your requirements.',
    experiences: [
      'Coordinated private group transport with flexible departure timings',
      'Full-day leisure access across aquatic and adventure recreation zones',
      'Reserved group dining coordination and dedicated team assembly points',
      'Optional extensions to nearby Fort Kochi heritage quarters or coastal spots'
    ],
    highlights: [
      'Expansive world-class recreation park on the outskirts of Kochi',
      'Structured group logistics tailored for students, friends, and family reunions',
      'Safety-verified private bus or coach transport options',
      'Seamless travel arrangements without fixed packages or rigid schedules'
    ],
    suitableFor: 'Student cohorts, youth groups, department trips, and active family holidays.'
  },
  {
    id: 'nellaiyappar-temple',
    slug: 'nellaiyappar-temple',
    title: 'Nellaiyappar Temple',
    mainCategory: 'cultural-heritage',
    categoryName: 'Cultural & Heritage',
    category: 'Cultural & Heritage Journey',
    location: 'Tirunelveli • Tamil Nadu',
    tag: 'Sacred Dravidian Heritage',
    coverImage: '/images/nellaiyappar-temple-02.jpg',
    heroImage: '/images/nellaiyappar-temple-02.jpg',
    heroPosition: 'center 25%',
    gallery: [
      '/images/nellaiyappar-temple-03.jpg',
      '/images/nellaiyappar-temple-01.jpg',
      '/images/nellaiyappar-temple-04.jpg'
    ],
    images: [
      '/images/nellaiyappar-temple-02.jpg',
      '/images/nellaiyappar-temple-03.jpg',
      '/images/nellaiyappar-temple-01.jpg',
      '/images/nellaiyappar-temple-04.jpg'
    ],
    description: 'Centuries of Dravidian sacred architecture, soaring stone gopurams, musical pillars, and classical legends.',
    about: 'Standing majestically in the heart of Tirunelveli along the northern banks of the Thamirabarani River, Nellaiappar Temple is an architectural masterpiece celebrated for its intricate pillared halls, musical stone columns, and profound Pandyan-era heritage. The temple complex is one of the largest in Tamil Nadu, preserving centuries of sacred sculpture, ancient bronze iconography, and living ritual traditions.',
    experiences: [
      'Acoustical marvel of the hand-carved musical stone pillars vibrating at distinct pitches',
      'Guided study of the thousand-pillar mandapam and classical Pandyan stone inscriptions',
      'Morning quiet walks along the sacred banks of the Thamirabarani River',
      'Tasting authentic Tirunelveli halwa and discovering regional southern culinary crafts'
    ],
    highlights: [
      'Towering stone gopurams defining the Tirunelveli skyline across centuries',
      'Elaborate pillared halls reflecting the height of classical Dravidian stone carving',
      'Living temple heritage with deep spiritual and community traditions',
      'Central cultural anchor connecting southern Tamil Nadu heritage itineraries'
    ],
    suitableFor: 'Heritage enthusiasts, cultural travelers, architecture scholars, and family journeys.'
  },
  {
    id: 'thirumalai-kovil',
    slug: 'thirumalai-kovil',
    title: 'Thirumalai Kovil',
    mainCategory: 'cultural-heritage',
    categoryName: 'Cultural & Heritage',
    category: 'Cultural & Heritage Journey',
    location: 'Panpoli • Tenkasi',
    tag: 'Hill Sanctum & Vistas',
    coverImage: '/images/thirumalai-kovil-02.jpg',
    heroImage: '/images/thirumalai-kovil-02.jpg',
    heroPosition: 'center 45%',
    gallery: [
      '/images/thirumalai-kovil-01.jpg',
      '/images/thirumalai-kovil-03.jpg',
      '/images/thirumalai-kovil-04.jpg'
    ],
    images: [
      '/images/thirumalai-kovil-02.jpg',
      '/images/thirumalai-kovil-01.jpg',
      '/images/thirumalai-kovil-03.jpg',
      '/images/thirumalai-kovil-04.jpg'
    ],
    description: 'A peaceful hillside temple perched above emerald coconut groves with sweeping views toward the Western Ghats.',
    about: 'Perched atop a gentle rocky hillock in Panpoli near Tenkasi, Thirumalai Kovil commands 360-degree panoramic vistas across emerald green paddy fields, coconut palms, and the majestic ridgelines of the Western Ghats. The hill is caressed by cool mountain breezes flowing through the gaps of the ghats, creating a serene, contemplation-rich sanctuary.',
    experiences: [
      'Scenic climb or drive up the winding hill road with widening vistas at every curve',
      'Unhurried pause at the wind-swept hilltop sanctum surrounded by birds and greenery',
      'Panoramic landscape photography across coconut plains and Western Ghats spurs',
      'Connecting easily with nearby Courtallam cascades and Tenkasi heritage shrines'
    ],
    highlights: [
      'Breathtaking 360-degree panorama of southern agrarian landscapes and mountain spurs',
      'Tranquil mountain atmosphere far removed from bustling highway routes',
      'Perennial mountain breezes flowing through the surrounding Western Ghats gap',
      'Natural harmony between sacred hill architecture and surrounding farmland'
    ],
    suitableFor: 'Peaceful day visits, scenic nature photography, and family heritage excursions.'
  }
];

import { EDUCATIONAL_TOURS, getEducationalTourBySlug } from './educationalTours.js';

/**
 * Clean editorial category navigation definitions for /tours
 */
export const TOUR_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'cultural-heritage', label: 'Cultural & Heritage' },
  { id: 'college-educational', label: 'College & Educational' },
  { id: 'leisure-holiday', label: 'Leisure & Holiday' },
  { id: 'group-custom', label: 'Group & Custom' },
];

/**
 * Returns all available destinations across the platform for /tours directory.
 * Future admin panel compatibility: newly added destinations in the database/array
 * will automatically appear here under their assigned category without affecting homepage curation.
 */
export function getAllTours() {
  const eduMapped = (EDUCATIONAL_TOURS || []).map((t) => ({
    ...t,
    mainCategory: 'college-educational',
    categoryName: 'College & Educational',
    route: `/tours/${t.slug}`,
  }));

  const destsMapped = DESTINATIONS.map((d) => ({
    ...d,
    route: `/tours/${d.slug}`,
  }));

  return [...destsMapped, ...eduMapped];
}

/**
 * Robust category matcher supporting strict IDs, slugs, numeric IDs, and category objects
 */
export function matchesTourCategory(tour, categoryId) {
  if (!tour) return false;
  if (!categoryId || categoryId === 'all') return true;

  // 1. Extract raw category identifier if an object was passed
  let rawId = categoryId;
  if (typeof categoryId === 'object' && categoryId !== null) {
    rawId = categoryId.slug || categoryId.id || categoryId.name || '';
  }

  // If identifier is empty or 'all', matches everything
  if (!rawId || rawId === 'all') return true;

  // 2. Handle direct numeric ID matching (e.g. categoryId = 1 or "1")
  const numericId = Number(rawId);
  const isNumeric = !isNaN(numericId) && String(rawId).trim() !== '';

  if (
    isNumeric &&
    tour.categoryId !== undefined &&
    tour.categoryId !== null &&
    Number(tour.categoryId) === numericId
  ) {
    return true;
  }

  // Canonical mapping between database numeric IDs and category slugs
  const ID_TO_SLUG = {
    '1': 'cultural-heritage',
    '2': 'college-educational',
    '3': 'leisure-holiday',
    '4': 'group-custom'
  };

  const SLUG_TO_ID = {
    'cultural-heritage': 1,
    'college-educational': 2,
    'leisure-holiday': 3,
    'group-custom': 4
  };

  // 3. Normalize string identifier safely
  const candidate = isNumeric && ID_TO_SLUG[String(numericId)] ? ID_TO_SLUG[String(numericId)] : rawId;
  const cleanId = String(candidate).toLowerCase().trim().replace(/\s+/g, '-');

  if (!cleanId || cleanId === 'all') return true;

  // 4. Match against tour.mainCategory slug
  if (tour.mainCategory && String(tour.mainCategory).toLowerCase().trim() === cleanId) {
    return true;
  }

  // 5. Match against tour.categoryId via SLUG_TO_ID mapping
  if (
    SLUG_TO_ID[cleanId] !== undefined &&
    tour.categoryId !== undefined &&
    tour.categoryId !== null &&
    Number(tour.categoryId) === SLUG_TO_ID[cleanId]
  ) {
    return true;
  }

  // 6. Match against descriptive category text
  const cat = String(tour.category || '').toLowerCase();
  const catName = String(tour.categoryName || '').toLowerCase();
  const allText = `${cat} ${catName}`;

  if (cleanId === 'cultural-heritage' && (allText.includes('cultural') || allText.includes('heritage'))) return true;
  if (cleanId === 'college-educational' && (tour.isEducational || allText.includes('college') || allText.includes('educational') || allText.includes('curriculum') || allText.includes('industrial'))) return true;
  if (cleanId === 'leisure-holiday' && (allText.includes('leisure') || allText.includes('holiday') || allText.includes('nature') || allText.includes('highland') || allText.includes('coast') || allText.includes('pine') || allText.includes('shola') || allText.includes('plantation'))) return true;
  if (cleanId === 'group-custom' && (allText.includes('group') || allText.includes('custom') || allText.includes('recreation') || allText.includes('escape'))) return true;

  return false;
}

/**
 * Robust slug lookup supporting multiple common aliases:
 * - /tours/nellaiyappar-temple, /tours/nellaiyappar-kovil, /tours/nellaiyappar
 * - /tours/thirumalai-kovil, /tours/thirumalai
 * - /tours/kutralam, /tours/courtallam
 * - /tours/munnar
 * - /tours/ooty, /tours/nilgiris, /tours/ooty-nilgiris
 * - /tours/kodaikanal, /tours/kodai
 * - /tours/alappuzha, /tours/kochi, /tours/alleppey, /tours/kochi-alappuzha
 * - /tours/wonderla, /tours/wonderla-kochi, /tours/wonderla-group-escapes
 * - /services/kerala-arts-and-science
 * - /services/koodankulam-nuclear-plant
 */
export function getDestinationBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();

  // Check educational tours first if matching
  const eduTour = getEducationalTourBySlug(cleanSlug);
  if (eduTour) return eduTour;

  const aliases = {
    'nellaiyappar': 'nellaiyappar-temple',
    'nellaiyappar-temple': 'nellaiyappar-temple',
    'nellaiyappar-kovil': 'nellaiyappar-temple',
    'nellaiyappar-kovil2': 'nellaiyappar-temple',
    'thirumalai': 'thirumalai-kovil',
    'thirumalai-kovil': 'thirumalai-kovil',
    'kutralam': 'courtallam',
    'courtallam': 'courtallam',
    'munnar': 'munnar',
    'ooty': 'ooty-nilgiris',
    'nilgiris': 'ooty-nilgiris',
    'ooty-nilgiris': 'ooty-nilgiris',
    'kodaikanal': 'kodaikanal',
    'kodai': 'kodaikanal',
    'kochi': 'kochi-alappuzha',
    'alappuzha': 'kochi-alappuzha',
    'alleppey': 'kochi-alappuzha',
    'kochi-alappuzha': 'kochi-alappuzha',
    'wonderla': 'wonderla-kochi',
    'wonderla-kochi': 'wonderla-kochi',
    'wonderla-group-escapes': 'wonderla-kochi',
  };

  const targetId = aliases[cleanSlug] || cleanSlug;

  return (
    DESTINATIONS.find((d) => d.id === targetId || d.slug === targetId) ||
    DESTINATIONS.find((d) => d.slug.toLowerCase() === cleanSlug) ||
    DESTINATIONS.find((d) => d.id.toLowerCase() === cleanSlug) ||
    DESTINATIONS.find(
      (d) =>
        d.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') === cleanSlug
    )
  );
}
