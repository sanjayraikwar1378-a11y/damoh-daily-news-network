import { Article } from '@/data/mock';
import { db, collection, query, where, getDocs, doc, getDoc, limit } from '@/lib/firebase';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface CacheEntry {
  article: Article;
  timestamp: number;
}

const articleCache = new Map<string, CacheEntry>();
const prefetchedImages = new Set<string>();

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache validity

export function normalizeSlug(slug: string | undefined | null): string {
  if (!slug) return '';
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return String(slug).trim().toLowerCase();
  }
}

export function getSSRArticle(): Article | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Check window object
    if ((window as any).__INITIAL_ARTICLE__) {
      const art = (window as any).__INITIAL_ARTICLE__ as Article;
      if (art && (art.id || art.slug)) {
        saveArticleToCache(art);
        return art;
      }
    }
    // 2. Check script tag in DOM
    const scriptEl = document.getElementById('__INITIAL_ARTICLE__');
    if (scriptEl && scriptEl.textContent) {
      const art = JSON.parse(scriptEl.textContent) as Article;
      if (art && (art.id || art.slug)) {
        (window as any).__INITIAL_ARTICLE__ = art;
        saveArticleToCache(art);
        return art;
      }
    }
  } catch (err) {
    console.warn("getSSRArticle parse notice:", err);
  }
  return null;
}

// Auto-seed in-memory cache with SSR article only if present
if (typeof window !== 'undefined') {
  try {
    const ssr = getSSRArticle();
    if (ssr) {
      saveArticleToCache(ssr);
    }
  } catch {}
}

export function isMatchingArticle(a: Article | null | undefined, targetKey: string): boolean {
  if (!a || !targetKey) return false;
  const aSlug = a.slug || "";
  const aId = a.id || "";
  const targetLower = targetKey.trim().toLowerCase();
  const aSlugLower = aSlug.trim().toLowerCase();
  const aIdLower = aId.trim().toLowerCase();

  // 1. Exact slug or ID match
  if (aSlug === targetKey || aId === targetKey || aSlugLower === targetLower || aIdLower === targetLower) {
    return true;
  }

  // 2. Decoded slug match
  const decodedTarget = normalizeSlug(targetKey);
  const decodedASlug = normalizeSlug(aSlug);
  if (decodedASlug && decodedASlug === decodedTarget) {
    return true;
  }
  if (aIdLower && decodedTarget === aIdLower) {
    return true;
  }

  // 3. Match if slug ends with -ID or _ID (e.g. "some-news-title-a1786033009616" matching id "a1786033009616")
  if (aId && (targetLower.endsWith(`-${aIdLower}`) || targetLower.endsWith(`_${aIdLower}`))) {
    return true;
  }
  if (aId && (decodedTarget.endsWith(`-${aIdLower}`) || decodedTarget.endsWith(`_${aIdLower}`))) {
    return true;
  }

  return false;
}

export function getCachedArticle(slugOrId: string): Article | undefined {
  if (!slugOrId) return undefined;
  
  const target = slugOrId.trim();
  const targetLower = target.toLowerCase();

  // 1. Direct key lookup in Map
  const entry = articleCache.get(target) || articleCache.get(targetLower);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    if (isMatchingArticle(entry.article, target)) {
      return entry.article;
    }
  }

  // 2. Check SSR Article if not in map
  const ssr = getSSRArticle();
  if (ssr && isMatchingArticle(ssr, target)) {
    return ssr;
  }

  // 3. Linear lookup for slug/id match across cached articles
  for (const item of articleCache.values()) {
    if (Date.now() - item.timestamp >= CACHE_TTL_MS) continue;
    const a = item.article;
    if (isMatchingArticle(a, target)) {
      return a;
    }
  }

  // NOTE: STRICTLY NEVER FALLBACK TO MOCK/SAMPLE/DEMO ARTICLES FOR A SPECIFIC SLUG
  return undefined;
}

export function saveArticleToCache(article: Article): void {
  if (!article || (!article.id && !article.slug)) return;
  const entry: CacheEntry = { article, timestamp: Date.now() };
  if (article.id) {
    articleCache.set(article.id, entry);
    articleCache.set(article.id.toLowerCase(), entry);
  }
  if (article.slug) {
    articleCache.set(article.slug, entry);
    articleCache.set(article.slug.toLowerCase(), entry);
    const norm = normalizeSlug(article.slug);
    if (norm) articleCache.set(norm, entry);
  }
}

export function saveArticlesToCache(articles: Article[]): void {
  if (!Array.isArray(articles)) return;
  articles.forEach(saveArticleToCache);
}

const ARTICLES_LIST_STORAGE_KEY = 'damoh_cached_articles_v1';

export function getStoredArticlesList(): Article[] {
  try {
    const raw = localStorage.getItem(ARTICLES_LIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Re-populate in-memory articleCache
        parsed.forEach(saveArticleToCache);
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveArticlesListToStorage(articles: Article[]): void {
  try {
    if (Array.isArray(articles) && articles.length > 0) {
      localStorage.setItem(ARTICLES_LIST_STORAGE_KEY, JSON.stringify(articles.slice(0, 50)));
    }
  } catch {}
}

const pendingFetches = new Map<string, Promise<Article | null>>();

export async function fetchArticleBySlugOrId(slugOrId: string): Promise<Article | null> {
  if (!slugOrId) return null;
  const target = slugOrId.trim();

  // 1. Check in-memory cache
  const cached = getCachedArticle(target);
  if (cached) return cached;

  // 2. Prevent duplicate concurrent fetches for the same target
  if (pendingFetches.has(target)) {
    return pendingFetches.get(target)!;
  }

  const fetchPromise = (async () => {
    try {
      // Fast Path 1: Check if target is directly a document ID (e.g., a1786033009616 or similar)
      if (/^a\d+$/.test(target)) {
        const docRef = await getDoc(doc(db, "articles", target));
        if (docRef.exists()) {
          const art = docRef.data() as Article;
          saveArticleToCache(art);
          return art;
        }
      }

      // Fast Path 2: Check for trailing document ID in slug (e.g. "...-a1786033009616" or "..._a1786033009616")
      const idMatch = target.match(/[-_](a\d+)$/);
      if (idMatch && idMatch[1]) {
        const docRef = await getDoc(doc(db, "articles", idMatch[1]));
        if (docRef.exists()) {
          const art = docRef.data() as Article;
          saveArticleToCache(art);
          return art;
        }
      }

      // Query by slug field
      const q = query(collection(db, "articles"), where("slug", "==", target), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const art = snap.docs[0].data() as Article;
        saveArticleToCache(art);
        return art;
      }

      // Decoded slug query if URI encoded
      try {
        const decoded = decodeURIComponent(target);
        if (decoded !== target) {
          const qDec = query(collection(db, "articles"), where("slug", "==", decoded), limit(1));
          const snapDec = await getDocs(qDec);
          if (!snapDec.empty) {
            const art = snapDec.docs[0].data() as Article;
            saveArticleToCache(art);
            return art;
          }
        }
      } catch {}

      // Fallback search by ID document
      const docRef = await getDoc(doc(db, "articles", target));
      if (docRef.exists()) {
        const art = docRef.data() as Article;
        saveArticleToCache(art);
        return art;
      }
    } catch (err) {
      console.warn("fetchArticleBySlugOrId error:", err);
    } finally {
      pendingFetches.delete(target);
    }
    return null;
  })();

  pendingFetches.set(target, fetchPromise);
  return fetchPromise;
}

export function prefetchHeroImage(url?: string): void {
  if (!url || prefetchedImages.has(url)) return;
  prefetchedImages.add(url);
  const optimized = getOptimizedImageUrl(url, { width: 800 });
  const img = new Image();
  img.src = optimized;
}

export function prefetchArticle(slugOrId: string, imageUrl?: string): void {
  if (!slugOrId) return;
  if (imageUrl) {
    prefetchHeroImage(imageUrl);
  }
  fetchArticleBySlugOrId(slugOrId).then(art => {
    if (art?.imageUrl && !imageUrl) {
      prefetchHeroImage(art.imageUrl);
    }
  }).catch(() => {});
}
