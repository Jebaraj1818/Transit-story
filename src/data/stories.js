/**
 * ============================================================================
 * FICTIONAL PLACEHOLDER DATA ONLY
 * ============================================================================
 * IMPORTANT NOTE FOR CLIENT/DEVELOPERS:
 * The data below represents fictional editorial placeholder content for testing,
 * layout, and routing verification during Phase 1 development.
 * 
 * DO NOT present these fictional stories as real client publications.
 * This file MUST be replaced with actual client-curated editorial essays, oral histories,
 * and field dispatch notes before production launch or dynamic REST API integration.
 * ============================================================================
 */

export const SAMPLE_STORIES = [
  {
    id: "story-1",
    slug: "whispers-of-the-athangudi-tile-makers",
    title: "Whispers of the Athangudi Tile-Makers: Geometry, Sand & Glass",
    category: "Cultural Immersion",
    date: "August 2026",
    readTime: "6 min read",
    excerpt: "In a quiet Chettinad village, artisans pour colored cement through handcrafted brass stencils onto glass panes — a living testament to patience and trade winds.",
    content: "Under terracotta roofs where shadows soften the afternoon heat, the rhythm of Athangudi unfolds. Unlike industrial ceramic tiles fired in massive kilns, each Athangudi tile is poured cold, layer upon layer, using local river sand, colored cement slurry, and fine glass backings. This is travel unhurried: standing beside Murugan, whose hands remember patterns charted two centuries ago.",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    author: "Editorial Field Note"
  },
  {
    id: "story-2",
    slug: "conversations-with-the-mist-of-kotagiri",
    title: "Conversations with the Mist: Sustainable Terroirs in the Blue Mountains",
    category: "Offbeat Experiences",
    date: "July 2026",
    readTime: "8 min read",
    excerpt: "Away from tourist corridors, we sit with third-generation organic tea farmers understanding how microclimates, shade trees, and endemic flora shape true terroir.",
    content: "At 1,800 meters above sea level, the western winds push dense cloud blankets through shola forests. Here, tea is not merely a commodity; it is an ecological balance. When travelers walk with local farmers, conversations shift from sightseeing to deep soil health, native honeybees, and preserving indigenous watershed basins.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    author: "Transit Story Collective"
  },
  {
    id: "story-3",
    slug: "the-rhythm-of-kaveri-swamimalai-bronze",
    title: "The Lost-Wax Flame: How Swamimalai Preserves 1,000 Years of Bronze Art",
    category: "Intellectual Voyages",
    date: "June 2026",
    readTime: "7 min read",
    excerpt: "How ancient proportions laid down in canonical Shilpa Shastras continue to shape the golden-hued sacred bronzes of the Kaveri delta.",
    content: "In the artisan alleys along the Kaveri riverbed, clay mixed with river silt coats beeswax sculpted figures. Once dried, the wax melts away into fire, making room for molten bronze alloy. This lost-wax technique has survived unbroken since the Chola dynasty, linking today's traveler directly to ancient intellectual mastery.",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
    author: "Cultural Heritage Dispatch"
  }
];

export function getStoryBySlug(slug) {
  return SAMPLE_STORIES.find((s) => s.slug === slug);
}
