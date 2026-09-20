/**
 * ============================================================================
 * THE TRANSIT STORY — REST API CLIENT & FALLBACK SERVICE
 * ============================================================================
 * Connects the frontend to the Flask + MySQL backend (/api/...).
 * If the backend API is unreachable or during offline development,
 * it seamlessly falls back to the in-memory data structures with zero disruption.
 * ============================================================================
 */

import { DESTINATIONS, getAllTours, getDestinationBySlug as getLocalDestBySlug, matchesTourCategory, TOUR_CATEGORY_FILTERS } from '../data/destinations';
import { SERVICES_DATA } from '../data/services';
import { SAMPLE_STORIES, getStoryBySlug as getLocalStoryBySlug } from '../data/stories';
import { SOCIAL_LINKS } from '../config/socialLinks';

const API_BASE = '/api';

/**
 * Helper to perform safe fetch with timeout
 */
async function fetchJson(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(timer);
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Central in-memory cache to guarantee single source of truth across components
let cachedDestinations = null;
let cachedJourneyIdeas = null;
let cachedCategories = null;

/**
 * Categories
 */
export async function getCategories() {
  if (cachedCategories && cachedCategories.length > 0) {
    // Background refresh without blocking
    fetchJson(`${API_BASE}/categories`).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        cachedCategories = normalizeCategories(data);
      }
    }).catch(() => {});
    return cachedCategories;
  }

  try {
    const data = await fetchJson(`${API_BASE}/categories`);
    if (Array.isArray(data) && data.length > 0) {
      cachedCategories = normalizeCategories(data);
      return cachedCategories;
    }
  } catch (err) {
    // Graceful fallback
  }
  return TOUR_CATEGORY_FILTERS;
}

function normalizeCategories(data) {
  const normalized = data
    .filter((c) => c && c.slug !== 'all' && c.id !== 'all')
    .map((c) => ({
      id: c.slug || String(c.id),
      slug: c.slug,
      numericId: c.id,
      label: c.name || c.label || c.slug,
      name: c.name || c.label,
      description: c.description || '',
    }));
  return [{ id: 'all', label: 'All', slug: 'all' }, ...normalized];
}

/**
 * Destinations Catalog (supports category filter)
 */
export async function getDestinations(category = 'all') {
  try {
    const url = category && category !== 'all' 
      ? `${API_BASE}/destinations?category=${encodeURIComponent(category)}`
      : `${API_BASE}/destinations`;
    const data = await fetchJson(url);
    if (Array.isArray(data) && data.length > 0) {
      if (!category || category === 'all') {
        cachedDestinations = data;
      }
      return data;
    }
  } catch (err) {
    // Graceful fallback to cached destinations first
    if (cachedDestinations && cachedDestinations.length > 0) {
      if (!category || category === 'all') return cachedDestinations;
      return cachedDestinations.filter((tour) => matchesTourCategory(tour, category));
    }
  }
  const localAll = getAllTours();
  if (!category || category === 'all') return localAll;
  return localAll.filter((tour) => matchesTourCategory(tour, category));
}

/**
 * Destination Details by Slug
 */
export async function getDestinationBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).toLowerCase().trim();

  try {
    const data = await fetchJson(`${API_BASE}/destinations/${encodeURIComponent(cleanSlug)}`);
    if (data && data.title) {
      // Update cache if present
      if (cachedDestinations) {
        const idx = cachedDestinations.findIndex((d) => d.id === data.id || d.slug === data.slug);
        if (idx >= 0) {
          cachedDestinations[idx] = data;
        } else {
          cachedDestinations.push(data);
        }
      }
      return data;
    }
  } catch (err) {
    // Graceful fallback to cache
    if (cachedDestinations) {
      const match = cachedDestinations.find(
        (d) => d.slug === cleanSlug || (d.previousSlugs && d.previousSlugs.includes(cleanSlug))
      );
      if (match) return match;
    }
  }
  return getLocalDestBySlug(cleanSlug);
}

/**
 * Homepage Curated Journey Ideas
 */
export async function getJourneyIdeas() {
  try {
    const data = await fetchJson(`${API_BASE}/journey-ideas`);
    if (Array.isArray(data) && data.length > 0) {
      cachedJourneyIdeas = data;
      return data;
    }
  } catch (err) {
    if (cachedJourneyIdeas && cachedJourneyIdeas.length > 0) {
      return cachedJourneyIdeas;
    }
  }
  return DESTINATIONS;
}

/**
 * Services
 */
export async function getServices() {
  try {
    const data = await fetchJson(`${API_BASE}/services`);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Graceful fallback
  }
  return SERVICES_DATA;
}

/**
 * FAQs
 */
export async function getFaqs() {
  try {
    const data = await fetchJson(`${API_BASE}/faqs`);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Graceful fallback
  }
  return [
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
}

/**
 * Stories
 */
export async function getStories() {
  try {
    const data = await fetchJson(`${API_BASE}/stories`);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    // Graceful fallback
  }
  return SAMPLE_STORIES;
}

export async function getStoryBySlug(slug) {
  try {
    const data = await fetchJson(`${API_BASE}/stories/${encodeURIComponent(slug)}`);
    if (data && data.title) return data;
  } catch (err) {
    // Graceful fallback
  }
  return getLocalStoryBySlug(slug);
}

/**
 * Site Settings
 */
export async function getSiteSettings() {
  try {
    const data = await fetchJson(`${API_BASE}/site-settings`);
    if (data && Object.keys(data).length > 0) {
      return data;
    }
  } catch (err) {
    // Graceful fallback
  }
  return {
    brand_name: 'The Transit Story',
    tagline: 'Curated Journeys | Crafted Experiences',
    contact_phone: '',
    contact_phone_1: '',
    contact_phone_2: '',
    contact_phone_3: '',
    contact_phone_4: '',
    contact_email: 'transitstory.in@gmail.com',
    whatsapp_url: '#',
    instagram_url: '#',
    linkedin_url: '#'
  };
}

/**
 * Submit Journey Enquiry (Phone is strictly validated both frontend & backend)
 */
export async function submitJourneyEnquiry(formData) {
  return await fetchJson(`${API_BASE}/enquiries`, {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

/**
 * Submit General Contact Message (Phone is strictly validated both frontend & backend)
 */
export async function submitContactMessage(formData) {
  return await fetchJson(`${API_BASE}/contact`, {
    method: 'POST',
    body: JSON.stringify(formData)
  });
}

/**
 * Subscribe Newsletter
 */
export async function subscribeNewsletter(email) {
  return await fetchJson(`${API_BASE}/newsletter`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}
