/**
 * ============================================================================
 * CULTURAL & HERITAGE CATEGORY DATA ARCHITECTURE
 * ============================================================================
 * Data-driven structure for Cultural & Heritage Journeys (/tours).
 * Uses ONLY local original project images from public/images/.
 * Allows new journeys (e.g. Courtallam, temples) to be added simply as data objects.
 * ============================================================================
 */

export const CULTURAL_HERITAGE_DATA = {
  slug: 'cultural-heritage',
  eyebrow: 'CULTURAL & HERITAGE',
  heroTitle: 'Cultural & Heritage\nJourneys',
  heroTagline: 'Curated journeys through temples, heritage places, local culture and meaningful destinations.',
  intro: {
    eyebrow: 'CULTURAL & HERITAGE',
    heading: 'Curated journeys through temples, heritage places, local culture and meaningful destinations.',
    description: 'The Transit Story arranges unhurried cultural and heritage journeys tailored around your pacing, interests, and group. You choose the journey; we coordinate the rest.'
  },
  heroSlides: [
    {
      id: 'nellaiyappar-slide',
      temple: 'Nellaiyappar Temple',
      location: 'Tirunelveli • Tamil Nadu',
      tag: 'Sacred Dravidian Sanctum & Musical Pillars',
      image: '/images/nellaiyappar-temple-03.jpg',
      objectPosition: 'center 30%',
      slug: 'nellaiyappar-temple'
    },
    {
      id: 'thirumalai-slide',
      temple: 'Thirumalai Kovil',
      location: 'Panpoli • Tenkasi',
      tag: 'Hill Sanctum & Western Ghats Vistas',
      image: '/images/thirumalai-kovil-01.jpg',
      objectPosition: 'center 20%',
      slug: 'thirumalai-kovil'
    }
  ],
  culturalJourneys: [
    {
      number: '01',
      id: '01',
      slug: 'nellaiyappar-temple',
      title: 'Nellaiyappar Temple',
      location: 'Tirunelveli • Tamil Nadu',
      tag: 'Sacred Dravidian Heritage',
      image: '/images/nellaiyappar-temple-02.jpg',
      objectPosition: 'center 25%',
      description: 'Centuries of Dravidian sacred architecture, soaring stone gopurams, acoustical musical pillars, and classical Pandyan-era legends along the sacred Thamirabarani riverbanks.',
      details: 'Dravidian Architecture • Musical Stone Columns • Riverside Heritage'
    },
    {
      number: '02',
      id: '02',
      slug: 'thirumalai-kovil',
      title: 'Thirumalai Kovil',
      location: 'Panpoli • Tenkasi',
      tag: 'Hilltop Sanctum & Vistas',
      image: '/images/thirumalai-kovil-03.jpg',
      objectPosition: 'center 45%',
      description: 'A peaceful hillside temple perched above emerald coconut groves with sweeping 360-degree views toward the misty ridgelines and passes of the Western Ghats.',
      details: 'Hilltop Sanctum • 360° Western Ghats Vistas • Scenic Mountain Panorama'
    }
  ],
  bottomCta: {
    heading: 'Planning a cultural journey?',
    subheading: "Tell us where you want to go. We'll arrange the journey around your needs.",
    buttonText: 'START AN ENQUIRY →'
  }
};
