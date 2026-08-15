import { Article } from '@/data/mock';
import { db, collection, query, where, getDocs, doc, getDoc, limit } from '@/lib/firebase';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface CacheEntry {
  article: Article;
  timestamp: number;
}

const articleCache = new Map<string, CacheEntry>();
const prefetchedImages = new Set<string>();

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache validity

export function getCachedArticle(slugOrId: string): Article | undefined {
  if (!slugOrId) return undefined;
  
  const target = slugOrId.trim();
  const targetLower = target.toLowerCase();

  // Direct key lookup
  const entry = articleCache.get(target) || articleCache.get(targetLower);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.article;
  }

  // Linear lookup for slug/id match
  for (const item of articleCache.values()) {
    if (Date.now() - item.timestamp >= CACHE_TTL_MS) continue;
    const a = item.article;
    if (a.id === target || a.slug === target || a.slug?.toLowerCase() === targetLower) {
      return a;
    }
    if (targetLower.endsWith(`-${a.id.toLowerCase()}`) || targetLower.endsWith(`_${a.id.toLowerCase()}`)) {
      return a;
    }
  }

  return undefined;
}

export function saveArticleToCache(article: Article): void {
  if (!article || (!article.id && !article.slug)) return;
  const entry: CacheEntry = { article, timestamp: Date.now() };
  if (article.id) articleCache.set(article.id, entry);
  if (article.slug) {
    articleCache.set(article.slug, entry);
    articleCache.set(article.slug.toLowerCase(), entry);
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Re-populate in-memory articleCache
      parsed.forEach(saveArticleToCache);
      return parsed;
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
