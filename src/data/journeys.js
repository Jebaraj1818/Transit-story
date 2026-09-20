/**
 * ============================================================================
 * FICTIONAL PLACEHOLDER DATA ONLY
 * ============================================================================
 * IMPORTANT NOTE FOR CLIENT/DEVELOPERS:
 * The data below represents fictional placeholder content for testing, layout,
 * and routing verification during Phase 1 development.
 * 
 * DO NOT present these fictional journeys as real client offerings.
 * This file MUST be replaced with actual client-curated journeys and verified
 * itinerary details before production launch or dynamic REST API integration.
 * ============================================================================
 */

export const SAMPLE_JOURNEYS = [
  {
    id: "journey-1",
    slug: "chettinad-mansions-and-culinary-heritage",
    title: "Chettinad Mansions & Culinary Heritage",
    category: "Cultural Immersion",
    location: "Karaikudi & Kanadukathan, Tamil Nadu",
    duration: "4 Days / 3 Nights",
    description: "An intimate exploration of palatial 19th-century merchant mansions, age-old Athangudi tile-making crafts, and hand-ground spice culinary traditions.",
    highlights: [
      "Private walk through ancestral limestone mansions",
      "Traditional Athangudi tile-casting workshop with master artisans",
      "Interactive culinary session with local Chettiar home cooks",
      "Heritage cycling trails across rural village settlements"
    ],
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    theme: "Heritage & Living History"
  },
  {
    id: "journey-2",
    slug: "nilgiri-ancient-tea-and-toda-trails",
    title: "Nilgiri Mist, Tea Terroirs & Indigenous Lore",
    category: "Offbeat Experiences",
    location: "Kotagiri & Ooty Highlands, Tamil Nadu",
    duration: "5 Days / 4 Nights",
    description: "Venture beyond the commercial hill stations into quiet shola forests, single-estate organic tea gardens, and indigenous Toda tribal settlements.",
    highlights: [
      "Guided shola ecology walks led by local naturalists",
      "Specialty tea cupping with fourth-generation tea estate planters",
      "Respectful cultural exchange at Toda barrel-vaulted sacred hamlets",
      "Birdwatching through the western mist-covered ridgelines"
    ],
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    theme: "Highland Ecology & Native Wisdom"
  },
  {
    id: "journey-3",
    slug: "tanjore-chola-architecture-and-bronze-casting",
    title: "The Chola Horizon: Bronze, Stone & Carnatic Roots",
    category: "Intellectual Voyages",
    location: "Thanjavur & Kumbakonam, Tamil Nadu",
    duration: "4 Days / 3 Nights",
    description: "A scholarly voyage traversing the Great Living Chola Temples, lost-wax bronze casting studios of Swamimalai, and classical musical sanctuaries.",
    highlights: [
      "Architectural deep dive at Brihadisvara Temple with a temple historian",
      "Observation of the ancient lost-wax bronze casting method",
      "Veena craftspeople studio visit in Thanjavur old town",
      "Evenings with regional Carnatic instrumental recitals"
    ],
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    theme: "Classical Arts & Sacred Architecture"
  },
  {
    id: "journey-4",
    slug: "coromandel-weaving-and-maritime-villages",
    title: "Coromandel Loomways & Coastal Maritime Tales",
    category: "Economic Growth & Craft",
    location: "Kanchipuram & Pondicherry Coast, Tamil Nadu",
    duration: "3 Days / 2 Nights",
    description: "Connecting directly with cooperative silk weavers and coastal fisherfolk communities to witness sustained artisanal micro-economies.",
    highlights: [
      "Hands-on jacquard and pure mulberry silk loom sessions",
      "Maritime storytelling with traditional catamaran fishermen",
      "Exploration of Indo-French architectural preservation quarters",
      "Community dinner supporting local sustainable fishing initiatives"
    ],
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    theme: "Artisanal Economics & Coastal Life"
  }
];

import { getDestinationBySlug } from './destinations';

export function getJourneyBySlug(slug) {
  const found = SAMPLE_JOURNEYS.find((j) => j.slug === slug);
  if (found) return found;
  return getDestinationBySlug(slug);
}
