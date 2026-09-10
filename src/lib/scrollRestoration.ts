/**
 * Scroll Restoration Utility for Damoh Daily News
 * Manages reliable scroll position persistence across SPA browser history navigations (Back/Forward).
 */

const STORAGE_KEY = 'damoh_scroll_restoration_v1';

// In-memory cache for instant synchronous access during route lifecycle
const memoryPositions = new Map<string, number>();

// Set of section IDs that have already been revealed in this session.
// Once a section is loaded, it remains pre-revealed on back navigation
// so the DOM height matches the previously scrolled page without layout shifts.
const revealedSectionIds = new Set<string>();

function loadSessionPositions(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistSessionPositions(data: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or private browsing restriction
  }
}

/**
 * Record a scroll position associated with a history key or route pathname.
 */
export function saveScrollPosition(key: string, y: number): void {
  if (!key) return;
  const safeY = Math.max(0, Math.round(y));
  memoryPositions.set(key, safeY);

  const existing = loadSessionPositions();
  existing[key] = safeY;
  persistSessionPositions(existing);
}

/**
 * Retrieve a previously saved scroll position for a key or route pathname.
 */
export function getSavedScrollPosition(key: string): number | undefined {
  if (!key) return undefined;
  if (memoryPositions.has(key)) {
    return memoryPositions.get(key);
  }
  const existing = loadSessionPositions();
  if (typeof existing[key] === 'number') {
    memoryPositions.set(key, existing[key]);
    return existing[key];
  }
  return undefined;
}

/**
 * Mark a section as already revealed/intersected in this browsing session.
 */
export function markSectionRevealed(id?: string): void {
  if (id) {
    revealedSectionIds.add(id);
  }
}

/**
 * Check if a section was already revealed in this browsing session.
 */
export function isSectionRevealed(id?: string): boolean {
  if (!id) return false;
  return revealedSectionIds.has(id);
}
