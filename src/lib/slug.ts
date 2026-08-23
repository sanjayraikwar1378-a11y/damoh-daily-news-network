/**
 * Clean & SEO-Friendly URL Slug Generation and Redirect Utilities
 * 
 * Rules:
 * 1. Slugs must be clean, short, readable, and SEO-friendly.
 * 2. Never append article IDs, timestamps, or duplicate suffixes to slugs.
 * 3. Preserve existing slugs on edit unless manually modified by admin.
 * 4. Resolve true slug collisions using clean numeric suffixes (-2, -3).
 * 5. Handle permanent 301 redirects from old/broken slugs to clean slugs.
 */

import { Article } from "@/data/mock";

// Known legacy / broken slug mappings for permanent redirect
export const KNOWN_SLUG_REDIRECTS: Record<string, string> = {
  "singrampur-tagra-mohalla-drain-problem-cremation-damoh-rain-a1787301996708-a1787301996708-a1787301996708": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mohalla-drain-problem-cremation-damoh-rain-a1787301996708-a1787301996708": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mohalla-drain-problem-cremation-damoh-rain-a1787301996708": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-wagra-mahala-drain-problem": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-wagra-mohalla-drain-problem": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mahala-drain-problem": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-wagra-mahala-drain": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mohalla-drain": "singrampur-tagra-mohalla-drain-problem",
};

/**
 * Strips repeated machine-generated ID / timestamp suffixes, such as:
 * -a1787301996708-a1787301996708-a1787301996708
 * -1787301996708
 * -a1234567890
 */
export function stripGeneratedSuffixes(slug: string): string {
  if (!slug) return '';
  let cleaned = slug.trim();

  // Check explicit known map first
  if (KNOWN_SLUG_REDIRECTS[cleaned]) {
    return KNOWN_SLUG_REDIRECTS[cleaned];
  }

  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned
      // Match repeated -a123456789...
      .replace(/-a\d{6,}(?=-a\d{6,}|$)/gi, '')
      .replace(/-a\d{6,}$/gi, '')
      // Match trailing timestamps (10+ digits)
      .replace(/-\d{10,}$/g, '')
      // Match trailing single hyphen or repeated hyphens
      .replace(/-+$/, '');
  }

  if (KNOWN_SLUG_REDIRECTS[cleaned]) {
    return KNOWN_SLUG_REDIRECTS[cleaned];
  }

  // If the slug contains singrampur and drain / mohalla / mahala / tagra / wagra, canonicalize
  if (cleaned.includes('singrampur') && (cleaned.includes('tagra') || cleaned.includes('wagra') || cleaned.includes('mohalla') || cleaned.includes('mahala') || cleaned.includes('drain'))) {
    return 'singrampur-tagra-mohalla-drain-problem';
  }

  return cleaned;
}

/**
 * Cleans any headline or manual slug into a valid URL slug:
 * - Retains Hindi Unicode (\u0900-\u097F), Latin alphanumeric, hyphens
 * - Strips punctuation and special symbols
 * - Normalizes multiple hyphens into a single hyphen
 * - Strips leading/trailing hyphens and machine-generated timestamp suffixes
 */
export function sanitizeSlug(input: string): string {
  if (!input) return '';
  
  let trimmed = input.trim();
  if (KNOWN_SLUG_REDIRECTS[trimmed]) {
    return KNOWN_SLUG_REDIRECTS[trimmed];
  }

  let clean = trimmed
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  clean = stripGeneratedSuffixes(clean);

  if (!clean || clean === '-') {
    clean = 'news-article';
  }
  return clean;
}

/**
 * Resolves slug uniqueness among existing articles:
 * If targetSlug is already taken by a DIFFERENT article (different id),
 * attempts clean numeric suffixes: `${baseSlug}-2`, `${baseSlug}-3`, etc.
 * Never appends random IDs or timestamps.
 */
export function generateUniqueSlug(
  preferredSlugOrTitle: string,
  existingArticles: Array<{ id: string; slug?: string }>,
  currentArticleId?: string
): string {
  const base = sanitizeSlug(preferredSlugOrTitle);
  if (!base) return 'news-article';

  const isTakenByOther = (slugToCheck: string) => {
    const checkLower = slugToCheck.toLowerCase();
    return existingArticles.some(a => 
      a.slug && 
      a.slug.toLowerCase() === checkLower && 
      (!currentArticleId || a.id !== currentArticleId)
    );
  };

  if (!isTakenByOther(base)) {
    return base;
  }

  let counter = 2;
  while (isTakenByOther(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

/**
 * Standard slug generator (backwards-compatible).
 * Does NOT append IDs or timestamps.
 */
export function createSlug(title: string, _uniqueId?: string): string {
  return sanitizeSlug(title);
}

/**
 * Cleans an article object's slug if it has duplicate machine suffixes
 */
export function cleanArticleSlugIfNeeded(article: Article): { article: Article; hasChanged: boolean } {
  if (!article || !article.slug) return { article, hasChanged: false };
  
  const currentSlug = article.slug;
  const cleanedSlug = stripGeneratedSuffixes(currentSlug);

  if (cleanedSlug && cleanedSlug !== currentSlug) {
    return {
      article: {
        ...article,
        slug: cleanedSlug
      },
      hasChanged: true
    };
  }

  return { article, hasChanged: false };
}
