import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { 
  Article, 
  Category, 
  Reporter, 
  Comment, 
  MediaItem, 
  AdSettings, 
  SiteSettings, 
  MarketRates,
  INITIAL_MARKET_RATES,
  CATEGORIES as INITIAL_CATEGORIES, 
  REPORTERS as INITIAL_REPORTERS, 
  MOCK_ADS, 
  MOCK_SITE_SETTINGS,
  ArticleStatus
} from '@/data/mock';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  sanitizeFirestoreData 
} from '@/lib/firebase';
import { isWithin48Hours } from '@/lib/utils';
import { saveArticlesToCache, getStoredArticlesList, saveArticlesListToStorage } from '@/lib/articleCache';
import { sanitizeSlug, generateUniqueSlug, createSlug, stripGeneratedSuffixes, cleanArticleSlugIfNeeded } from '@/lib/slug';

export { createSlug, sanitizeSlug, generateUniqueSlug, stripGeneratedSuffixes };

interface NewsContextType {
  // Articles
  articles: Article[];
  breakingNews: Article[];
  addArticle: (article: Omit<Article, 'id' | 'views' | 'likes' | 'publishedAt'> & { publishedAt?: string }) => Promise<Article>;
  updateArticle: (id: string, article: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => void;
  duplicateArticle: (id: string) => Article | undefined;
  bulkUpdateStatus: (ids: string[], status: ArticleStatus) => void;
  bulkDeleteArticles: (ids: string[]) => void;
  incrementViews: (id: string) => void;
  toggleLike: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;

  // Reporters
  reporters: Reporter[];
  addReporter: (reporter: Omit<Reporter, 'id'>) => void;
  updateReporter: (id: string, reporter: Partial<Reporter>) => void;
  deleteReporter: (id: string) => void;

  // Comments
  comments: Comment[];
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'status'>) => void;
  updateCommentStatus: (id: string, status: Comment['status']) => void;
  deleteComment: (id: string) => void;

  // Media
  media: MediaItem[];
  addMedia: (item: Omit<MediaItem, 'id' | 'uploadedAt'>) => void;
  deleteMedia: (id: string) => void;

  // Ads, Site Settings & Market Rates
  adSettings: AdSettings;
  updateAdSettings: (settings: Partial<AdSettings>) => void;
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  marketRates: MarketRates;
  updateMarketRates: (rates: Partial<MarketRates>) => void;

  // User Features
  bookmarks: string[];
  toggleBookmark: (articleId: string) => void;
  readingHistory: string[];
  addToHistory: (articleId: string) => void;

  // Status & Optimization
  hasArticlesLoaded: boolean;
  isSyncingFirestore: boolean;
  firestoreSyncError: boolean;
  retryFirestoreSync: () => void;
  isAdminDataLoaded: boolean;
  loadAdminData: () => void;
  hasMoreArticles: boolean;
  fetchMoreArticles: () => Promise<Article[]>;
  fetchCategoryArticles: (categoryId: string) => Promise<Article[]>;
  searchArticlesRemote: (queryStr: string) => Promise<Article[]>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function NewsProvider({ children }: { children: ReactNode }) {
  // Initialize articles with local cache if available for instant initial render
  const [articles, setArticles] = useState<Article[]>(() => getStoredArticlesList());
  const [hasArticlesLoaded, setHasArticlesLoaded] = useState<boolean>(() => getStoredArticlesList().length > 0);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [reporters, setReporters] = useState<Reporter[]>(INITIAL_REPORTERS);
  const [comments, setComments] = useState<Comment[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [adSettings, setAdSettings] = useState<AdSettings>(MOCK_ADS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(MOCK_SITE_SETTINGS);
  const [marketRates, setMarketRates] = useState<MarketRates>(INITIAL_MARKET_RATES);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<string[]>([]);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [firestoreSyncError, setFirestoreSyncError] = useState<boolean>(false);
  const [syncRetryCount, setSyncRetryCount] = useState<number>(0);
  const [isAdminDataLoaded, setIsAdminDataLoaded] = useState<boolean>(false);
  const [hasMoreArticles, setHasMoreArticles] = useState<boolean>(true);
  const isFetchingMoreRef = useRef<boolean>(false);

  const retryFirestoreSync = useCallback(() => {
    setIsSyncingFirestore(true);
    setFirestoreSyncError(false);
    setSyncRetryCount(prev => prev + 1);
  }, []);

  // Dynamically ensure browser tab favicon is active and crisp
  useEffect(() => {
    const activeFavicon = siteSettings.faviconUrl || '/favicon-v2.ico';
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    iconLinks.forEach(link => {
      const rel = link.getAttribute('rel') || '';
      const sizes = link.getAttribute('sizes');
      if (sizes === '32x32') {
        link.href = `/favicon-32x32-v2.png?v=2`;
      } else if (sizes === '16x16') {
        link.href = `/favicon-16x16-v2.png?v=2`;
      } else if (sizes === '180x180' || rel.includes('apple-touch-icon')) {
        link.href = `/apple-touch-icon-v2.png?v=2`;
      } else if (link.type === 'image/svg+xml') {
        link.href = `/icon-v2.svg?v=2`;
      } else {
        link.href = `${activeFavicon.includes('?') ? activeFavicon : activeFavicon + '?v=2'}`;
      }
    });
  }, [siteSettings.faviconUrl]);

  // Fetch older articles on demand (for infinite scroll / pagination on Latest News)
  const fetchMoreArticles = useCallback(async (): Promise<Article[]> => {
    if (isFetchingMoreRef.current) return [];
    isFetchingMoreRef.current = true;

    try {
      let q;
      if (articles.length > 0) {
        const oldest = articles[articles.length - 1];
        const oldestDate = oldest.publishedAt || (oldest as any).createdAt || new Date().toISOString();
        q = query(
          collection(db, "articles"),
          orderBy("publishedAt", "desc"),
          where("publishedAt", "<", oldestDate),
          limit(25)
        );
      } else {
        q = query(
          collection(db, "articles"),
          orderBy("publishedAt", "desc"),
          limit(25)
        );
      }

      const snap = await getDocs(q);
      if (snap.empty) {
        setHasMoreArticles(false);
        isFetchingMoreRef.current = false;
        return [];
      }

      const newBatch: Article[] = [];
      snap.forEach(d => {
        newBatch.push(d.data() as Article);
      });

      if (newBatch.length < 25) {
        setHasMoreArticles(false);
      }

      setArticles(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const filtered = newBatch.filter(a => !existingIds.has(a.id));
        if (filtered.length === 0) return prev;
        const merged = [...prev, ...filtered].sort(
          (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
        );
        saveArticlesToCache(merged);
        return merged;
      });

      isFetchingMoreRef.current = false;
      return newBatch;
    } catch (err) {
      console.warn("fetchMoreArticles error, attempting broader fetch fallback:", err);
      try {
        const snap = await getDocs(query(collection(db, "articles"), orderBy("publishedAt", "desc"), limit(100)));
        const all: Article[] = [];
        snap.forEach(d => all.push(d.data() as Article));
        if (all.length > 0) {
          setArticles(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const fresh = all.filter(a => !existingIds.has(a.id));
            if (fresh.length === 0) return prev;
            const merged = [...prev, ...fresh].sort(
              (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
            );
            saveArticlesToCache(merged);
            return merged;
          });
        }
        setHasMoreArticles(false);
      } catch (fallbackErr) {
        console.warn("fetchMoreArticles fallback notice:", fallbackErr);
      }
      isFetchingMoreRef.current = false;
      return [];
    }
  }, [articles]);

  // Fetch all articles for a specific category on demand
  const fetchCategoryArticles = useCallback(async (categoryId: string): Promise<Article[]> => {
    if (!categoryId) return [];
    try {
      const q = query(
        collection(db, "articles"),
        where("categoryIds", "array-contains", categoryId),
        limit(50)
      );
      const snap = await getDocs(q);
      if (snap.empty) return [];
      const catList: Article[] = [];
      snap.forEach(d => catList.push(d.data() as Article));

      setArticles(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const fresh = catList.filter(a => !existingIds.has(a.id));
        if (fresh.length === 0) return prev;
        const merged = [...prev, ...fresh].sort(
          (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
        );
        saveArticlesToCache(merged);
        return merged;
      });
      return catList;
    } catch (err) {
      console.warn("fetchCategoryArticles notice:", err);
      return [];
    }
  }, []);

  // Search remote articles for older news matching query
  const searchArticlesRemote = useCallback(async (queryStr: string): Promise<Article[]> => {
    if (!queryStr || !queryStr.trim()) return [];
    try {
      const snap = await getDocs(query(collection(db, "articles"), orderBy("publishedAt", "desc"), limit(100)));
      const list: Article[] = [];
      snap.forEach(d => list.push(d.data() as Article));
      if (list.length > 0) {
        setArticles(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const fresh = list.filter(a => !existingIds.has(a.id));
          if (fresh.length === 0) return prev;
          const merged = [...prev, ...fresh].sort(
            (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
          );
          saveArticlesToCache(merged);
          return merged;
        });

        const q = queryStr.toLowerCase().trim();
        return list.filter(a => {
          const status = a.status || 'published';
          if (status !== 'published') return false;
          const title = (a.title || '').toLowerCase();
          const excerpt = (a.excerpt || '').toLowerCase();
          const content = (a.content || '').toLowerCase();
          return title.includes(q) || excerpt.includes(q) || content.includes(q);
        });
      }
    } catch (err) {
      console.warn("searchArticlesRemote notice:", err);
    }
    return [];
  }, []);

  // Automatic recovery when internet connection returns
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network online detected: auto-retrying Firestore sync");
      retryFirestoreSync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [retryFirestoreSync]);

  // 1. Lightweight Public Real-time Articles Subscription + Non-blocking Secondary Sync
  useEffect(() => {
    let unsubArticles = () => {};
    let isMounted = true;

    // Safety timeout: reset syncing state after 3s if slow network occurs
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsSyncingFirestore(false);
      }
    }, 3000);

    // Non-blocking fetch for site, ad, and market settings
    const fetchPublicSettings = async () => {
      try {
        const [siteSnap, adsSnap, marketSnap] = await Promise.allSettled([
          getDoc(doc(db, "settings", "site")),
          getDoc(doc(db, "settings", "ads")),
          getDoc(doc(db, "settings", "market"))
        ]);

        if (!isMounted) return;

        if (siteSnap.status === 'fulfilled' && siteSnap.value.exists()) {
          const rawSite = siteSnap.value.data() as SiteSettings;
          setSiteSettings({
            ...rawSite,
            contactPhone: "",
            whatsappNumber: ""
          });
        }
        if (adsSnap.status === 'fulfilled' && adsSnap.value.exists()) {
          setAdSettings(adsSnap.value.data() as AdSettings);
        }
        if (marketSnap.status === 'fulfilled' && marketSnap.value.exists()) {
          setMarketRates(marketSnap.value.data() as MarketRates);
        }
      } catch (err) {
        console.warn("Public settings fetch notice:", err);
      }
    };

    // Non-blocking one-time fetch for Categories & Reporters
    const fetchPublicMetadata = async () => {
      try {
        const [catSnap, repSnap] = await Promise.allSettled([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "reporters"))
        ]);

        if (!isMounted) return;

        if (catSnap.status === 'fulfilled' && !catSnap.value.empty) {
          const list: Category[] = [];
          catSnap.value.forEach(d => list.push(d.data() as Category));
          if (list.length > 0) setCategories(list);
        }

        if (repSnap.status === 'fulfilled' && !repSnap.value.empty) {
          const list: Reporter[] = [];
          repSnap.value.forEach(d => {
            const raw = d.data() as any;
            const photo = raw.avatar || raw.photoUrl || raw.image || raw.photo || '';
            list.push({
              ...raw,
              id: d.id || raw.id,
              avatar: photo,
              photoUrl: photo
            } as Reporter);
          });
          if (list.length > 0) setReporters(list);
        }
      } catch (err) {
        console.warn("Metadata sync notice:", err);
      }
    };

    fetchPublicSettings();
    fetchPublicMetadata();

    try {
      // 1. Articles Sync (Top 25 recent articles for rapid mobile payload)
      const articlesQuery = query(collection(db, "articles"), orderBy("publishedAt", "desc"), limit(25));
      unsubArticles = onSnapshot(articlesQuery, (snap) => {
        if (!isMounted) return;
        const list: Article[] = [];
        snap.forEach((d) => {
          const art = d.data() as Article;
          const { article: cleaned } = cleanArticleSlugIfNeeded(art);
          list.push(cleaned);
        });
        if (list.length > 0) {
          list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
          setArticles(list);
          saveArticlesToCache(list);
          saveArticlesListToStorage(list);
        } else if (!getStoredArticlesList().length) {
          setArticles([]);
        }
        setHasArticlesLoaded(true);
        setIsSyncingFirestore(false);
        setFirestoreSyncError(false);
      }, (err) => {
        console.warn("Articles listener notice:", err);
        if (isMounted) {
          setHasArticlesLoaded(true);
          setIsSyncingFirestore(false);
        }
      });

    } catch (err) {
      console.warn("Public listeners warning:", err);
      if (isMounted) {
        setIsSyncingFirestore(false);
      }
    }

    // LocalStorage user bookmarks and history
    try {
      const savedBookmarks = localStorage.getItem('damoh_news_bookmarks');
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedHistory = localStorage.getItem('damoh_news_history');
      if (savedHistory) setReadingHistory(JSON.parse(savedHistory));
    } catch {}

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubArticles();
    };
  }, [syncRetryCount]);

  // 2. Admin Subscriptions On-Demand (All Articles, Reporters, Comments, Media, Live Settings)
  const loadAdminData = useCallback(() => {
    if (isAdminDataLoaded) return;
    setIsAdminDataLoaded(true);

    // Full articles subscription for Admin CMS to view and manage ALL articles in Firestore
    const unsubAdminArticles = onSnapshot(query(collection(db, "articles"), orderBy("publishedAt", "desc")), (snap) => {
      const list: Article[] = [];
      snap.forEach((d) => {
        const art = d.data() as Article;
        const { article: cleaned } = cleanArticleSlugIfNeeded(art);
        list.push(cleaned);
      });
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        setArticles(list);
        saveArticlesToCache(list);
        saveArticlesListToStorage(list);
      }
    }, (err) => console.warn("Admin articles listener notice:", err));

    const unsubReporters = onSnapshot(collection(db, "reporters"), (snap) => {
      const list: Reporter[] = [];
      snap.forEach((d) => {
        const raw = d.data() as any;
        const photo = raw.avatar || raw.photoUrl || raw.image || raw.photo || '';
        list.push({
          ...raw,
          id: d.id || raw.id,
          avatar: photo,
          photoUrl: photo
        } as Reporter);
      });
      if (list.length > 0) {
        setReporters(list);
      } else {
        setReporters([]);
      }
    }, (err) => console.warn("Reporters listener notice:", err));

    const unsubComments = onSnapshot(collection(db, "comments"), (snap) => {
      const list: Comment[] = [];
      const seen = new Set<string>();
      snap.forEach((d) => {
        const data = d.data() as Comment;
        const commentId = data.id || d.id;
        if (!seen.has(commentId)) {
          seen.add(commentId);
          list.push({ ...data, id: commentId });
        }
      });
      if (list.length > 0) {
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setComments(list);
      } else {
        setComments([]);
      }
    }, (err) => console.warn("Comments listener notice:", err));

    const unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
      const list: MediaItem[] = [];
      const seen = new Set<string>();
      snap.forEach((d) => {
        const data = d.data() as MediaItem;
        const mediaId = data.id || d.id;
        if (!seen.has(mediaId)) {
          seen.add(mediaId);
          list.push({ ...data, id: mediaId });
        }
      });
      setMedia(list.length > 0 ? list : []);
    }, (err) => console.warn("Media listener notice:", err));

    const unsubSettingsSite = onSnapshot(doc(db, "settings", "site"), (snap) => {
      if (snap.exists()) {
        const rawSite = snap.data() as SiteSettings;
        setSiteSettings({
          ...rawSite,
          contactPhone: "",
          whatsappNumber: ""
        });
      }
    }, (err) => console.warn("Site settings listener notice:", err));

    const unsubSettingsAds = onSnapshot(doc(db, "settings", "ads"), (snap) => {
      if (snap.exists()) setAdSettings(snap.data() as AdSettings);
    }, (err) => console.warn("Ad settings listener notice:", err));

    const unsubSettingsMarket = onSnapshot(doc(db, "settings", "market"), (snap) => {
      if (snap.exists()) setMarketRates(snap.data() as MarketRates);
    }, (err) => console.warn("Market rates listener notice:", err));

    return () => {
      unsubAdminArticles();
      unsubReporters();
      unsubComments();
      unsubMedia();
      unsubSettingsSite();
      unsubSettingsAds();
      unsubSettingsMarket();
      setIsAdminDataLoaded(false);
    };
  }, [isAdminDataLoaded]);

  // Auto-load admin collections if URL starts with /admin
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      const cleanup = loadAdminData();
      return () => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }
  }, [loadAdminData]);

  // Save Bookmarks & History to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('damoh_news_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('damoh_news_history', JSON.stringify(readingHistory));
    } catch {}
  }, [readingHistory]);

  // Article Actions
  const addArticle = async (data: Omit<Article, 'id' | 'views' | 'likes' | 'publishedAt'> & { publishedAt?: string }): Promise<Article> => {
    const id = `a${Date.now()}`;
    const preferred = data.slug && data.slug.trim().length > 0 ? data.slug.trim() : data.title;
    const slug = generateUniqueSlug(preferred, articles, id);
    
    const cleanScheduledAt = data.scheduledAt && data.scheduledAt.trim() ? data.scheduledAt.trim() : null;
    const cleanYoutubeUrl = data.youtubeUrl && data.youtubeUrl.trim() ? data.youtubeUrl.trim() : null;
    const cleanSubCategory = data.subCategory && data.subCategory.trim() ? data.subCategory.trim() : null;

    const newArticle: Article = {
      ...data,
      id,
      slug,
      status: data.status || 'published',
      publishedAt: data.publishedAt || new Date().toISOString(),
      views: 0,
      likes: 0,
      scheduledAt: cleanScheduledAt as any,
      youtubeUrl: cleanYoutubeUrl as any,
      subCategory: cleanSubCategory as any,
    };

    const docData = sanitizeFirestoreData(newArticle);

    await setDoc(doc(db, "articles", id), docData);

    setArticles(prev => [newArticle, ...prev.filter(a => a.id !== id)]);
    return newArticle;
  };

  const updateArticle = async (id: string, data: Partial<Article>): Promise<void> => {
    const existing = articles.find(a => a.id === id);

    let finalSlug: string;
    if (data.slug !== undefined && data.slug.trim().length > 0) {
      const cleanCustomSlug = sanitizeSlug(data.slug);
      if (existing && cleanCustomSlug === sanitizeSlug(existing.slug)) {
        finalSlug = sanitizeSlug(existing.slug);
      } else {
        finalSlug = generateUniqueSlug(cleanCustomSlug, articles, id);
      }
    } else if (existing?.slug) {
      finalSlug = sanitizeSlug(existing.slug);
    } else {
      finalSlug = generateUniqueSlug(data.title || existing?.title || 'news-article', articles, id);
    }

    let cleanScheduledAt = data.scheduledAt !== undefined 
      ? (data.scheduledAt && data.scheduledAt.trim() ? data.scheduledAt.trim() : null)
      : existing?.scheduledAt;

    let cleanYoutubeUrl = data.youtubeUrl !== undefined 
      ? (data.youtubeUrl && data.youtubeUrl.trim() ? data.youtubeUrl.trim() : null)
      : existing?.youtubeUrl;

    let cleanSubCategory = data.subCategory !== undefined 
      ? (data.subCategory && data.subCategory.trim() ? data.subCategory.trim() : null)
      : existing?.subCategory;

    const updatedData: Partial<Article> = {
      ...data,
      slug: finalSlug,
      updatedAt: new Date().toISOString(),
      scheduledAt: cleanScheduledAt as any,
      youtubeUrl: cleanYoutubeUrl as any,
      subCategory: cleanSubCategory as any,
    };

    const docData = sanitizeFirestoreData(updatedData);

    await setDoc(doc(db, "articles", id), docData, { merge: true });

    setArticles(prev => prev.map(a => {
      if (a.id !== id) return a;
      return {
        ...a,
        ...updatedData
      } as Article;
    }));
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    deleteDoc(doc(db, "articles", id)).catch(err => {
      console.error("Error deleting article from Firestore:", err);
    });
  };

  const duplicateArticle = (id: string) => {
    const original = articles.find(a => a.id === id);
    if (!original) return undefined;
    const newId = `a${Date.now()}`;
    const baseSlug = `${sanitizeSlug(original.slug || original.title)}-copy`;
    const duplicated: Article = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      slug: generateUniqueSlug(baseSlug, articles, newId),
      publishedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      status: 'draft',
    };

    setArticles(prev => [duplicated, ...prev]);
    setDoc(doc(db, "articles", newId), sanitizeFirestoreData(duplicated)).catch(err => {
      console.error("Error duplicating article in Firestore:", err);
    });

    return duplicated;
  };

  const bulkUpdateStatus = (ids: string[], status: ArticleStatus) => {
    setArticles(prev => prev.map(a => {
      if (ids.includes(a.id)) {
        const updated = { ...a, status };
        setDoc(doc(db, "articles", a.id), sanitizeFirestoreData(updated), { merge: true }).catch(() => {});
        return updated;
      }
      return a;
    }));
  };

  const bulkDeleteArticles = (ids: string[]) => {
    setArticles(prev => prev.filter(a => !ids.includes(a.id)));
    ids.forEach(id => {
      deleteDoc(doc(db, "articles", id)).catch(() => {});
    });
  };

  const incrementViews = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const targetArticle = articles.find(a => a.id === id);
    if (!targetArticle) return;

    const newViews = (targetArticle.views || 0) + 1;
    const currentViewsByDate = targetArticle.viewsByDate || {};
    const updatedViewsByDate = { 
      ...currentViewsByDate, 
      [todayStr]: (currentViewsByDate[todayStr] || 0) + 1 
    };

    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          views: newViews, 
          viewsByDate: updatedViewsByDate, 
          lastViewedAt: nowIso 
        };
      }
      return a;
    }));

    setDoc(doc(db, "articles", id), { 
      views: newViews, 
      viewsByDate: updatedViewsByDate,
      lastViewedAt: nowIso 
    }, { merge: true }).catch(() => {});

    addDoc(collection(db, "analytics_events"), {
      articleId: id,
      type: 'view',
      timestamp: nowIso,
      dateStr: todayStr,
      categoryIds: targetArticle.categoryIds || []
    }).catch(() => {});
  };

  const toggleLike = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const targetArticle = articles.find(a => a.id === id);
    if (!targetArticle) return;

    const newLikes = (targetArticle.likes || 0) + 1;
    const currentLikesByDate = targetArticle.likesByDate || {};
    const updatedLikesByDate = { 
      ...currentLikesByDate, 
      [todayStr]: (currentLikesByDate[todayStr] || 0) + 1 
    };

    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          likes: newLikes, 
          likesByDate: updatedLikesByDate, 
          lastLikedAt: nowIso 
        };
      }
      return a;
    }));

    setDoc(doc(db, "articles", id), { 
      likes: newLikes, 
      likesByDate: updatedLikesByDate,
      lastLikedAt: nowIso 
    }, { merge: true }).catch(() => {});

    addDoc(collection(db, "analytics_events"), {
      articleId: id,
      type: 'like',
      timestamp: nowIso,
      dateStr: todayStr,
      categoryIds: targetArticle.categoryIds || []
    }).catch(() => {});
  };

  // Category Actions
  const addCategory = (category: Omit<Category, 'id'>) => {
    const id = `c${Date.now()}`;
    const slug = category.slug ? createSlug(category.slug) : createSlug(category.name);
    const newCat = { ...category, id, slug };
    setCategories(prev => [...prev, newCat]);
    setDoc(doc(db, "categories", id), sanitizeFirestoreData(newCat)).catch(err => {
      console.error("Error adding category to Firestore:", err);
    });
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...data };
        setDoc(doc(db, "categories", id), sanitizeFirestoreData(updated), { merge: true }).catch(() => {});
        return updated;
      }
      return c;
    }));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, "categories", id)).catch(() => {});
  };

  const reorderCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    newCategories.forEach((cat) => {
      setDoc(doc(db, "categories", cat.id), sanitizeFirestoreData(cat), { merge: true }).catch(() => {});
    });
  };

  // Reporter Actions
  const addReporter = (reporter: Omit<Reporter, 'id'>) => {
    const id = `r${Date.now()}`;
    const newReporter: Reporter = { ...reporter, id };
    setReporters(prev => [...prev, newReporter]);
    setDoc(doc(db, "reporters", id), sanitizeFirestoreData(newReporter)).catch(err => {
      console.error("Error adding reporter to Firestore:", err);
    });
  };

  const updateReporter = (id: string, data: Partial<Reporter>) => {
    setReporters(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...data };
        setDoc(doc(db, "reporters", id), sanitizeFirestoreData(updated), { merge: true }).catch(() => {});
        return updated;
      }
      return r;
    }));
  };

  const deleteReporter = (id: string) => {
    setReporters(prev => prev.filter(r => r.id !== id));
    deleteDoc(doc(db, "reporters", id)).catch(() => {});
  };

  // Comment Actions
  const addComment = (comment: Omit<Comment, 'id' | 'createdAt' | 'status'>) => {
    const id = `cmt${Date.now()}`;
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setComments(prev => [newComment, ...prev]);
    setDoc(doc(db, "comments", id), sanitizeFirestoreData(newComment)).catch(() => {});
  };

  const updateCommentStatus = (id: string, status: Comment['status']) => {
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, status };
        setDoc(doc(db, "comments", id), sanitizeFirestoreData(updated), { merge: true }).catch(() => {});
        return updated;
      }
      return c;
    }));
  };

  const deleteComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, "comments", id)).catch(() => {});
  };

  // Media Actions
  const addMedia = (item: Omit<MediaItem, 'id' | 'uploadedAt'>) => {
    const id = `m${Date.now()}`;
    const newItem: MediaItem = {
      ...item,
      id,
      uploadedAt: new Date().toISOString(),
    };
    setMedia(prev => [newItem, ...prev]);
    setDoc(doc(db, "media", id), sanitizeFirestoreData(newItem)).catch(err => {
      console.error("Error adding media to Firestore:", err);
    });
  };

  const deleteMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
    deleteDoc(doc(db, "media", id)).catch(() => {});
  };

  // Settings Actions
  const updateAdSettings = (settings: Partial<AdSettings>) => {
    setAdSettings(prev => {
      const updated = { ...prev, ...settings };
      setDoc(doc(db, "settings", "ads"), sanitizeFirestoreData(updated)).catch(() => {});
      return updated;
    });
  };

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...settings };
      setDoc(doc(db, "settings", "site"), sanitizeFirestoreData(updated), { merge: true }).catch((err) => {
        console.error("Error updating site settings in Firestore:", err);
      });
      return updated;
    });
  };

  const updateMarketRates = (rates: Partial<MarketRates>) => {
    setMarketRates(prev => {
      const updated = { ...prev, ...rates };
      setDoc(doc(db, "settings", "market"), sanitizeFirestoreData(updated)).catch(() => {});
      return updated;
    });
  };

  // User Feature Actions
  const toggleBookmark = (articleId: string) => {
    setBookmarks(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const addToHistory = (articleId: string) => {
    setReadingHistory(prev => {
      const filtered = prev.filter(id => id !== articleId);
      return [articleId, ...filtered].slice(0, 50);
    });
  };

  // Active breaking news selector: includes ALL published articles from the last 48 hours.
  // Priority: 'isBreaking === true' articles appear FIRST (newest first), followed by remaining published articles (newest first).
  const breakingNews = useMemo(() => {
    const recentArticles = articles.filter(article => {
      const status = article.status || 'published';
      if (status !== 'published') return false;
      const dateVal = article.publishedAt || (article as any).createdAt || (article as any).updatedAt;
      return isWithin48Hours(dateVal);
    });

    const parseTime = (art: Article) => {
      const val = art.publishedAt || (art as any).createdAt || (art as any).updatedAt;
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return new Date(val).getTime() || 0;
      if (typeof val === 'object') {
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if ('seconds' in val && typeof val.seconds === 'number') return val.seconds * 1000;
      }
      return new Date(val).getTime() || 0;
    };

    const breaking: Article[] = [];
    const regular: Article[] = [];

    recentArticles.forEach(art => {
      if (art.isBreaking) {
        breaking.push(art);
      } else {
        regular.push(art);
      }
    });

    breaking.sort((a, b) => parseTime(b) - parseTime(a));
    regular.sort((a, b) => parseTime(b) - parseTime(a));

    return [...breaking, ...regular];
  }, [articles]);

  const contextValue = useMemo(() => ({
    articles,
    breakingNews,
    addArticle,
 updateArticle,
    deleteArticle,
    duplicateArticle,
    bulkUpdateStatus,
    bulkDeleteArticles,
    incrementViews,
    toggleLike,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    reporters,
    addReporter,
    updateReporter,
    deleteReporter,
    comments,
    addComment,
    updateCommentStatus,
    deleteComment,
    media,
    addMedia,
    deleteMedia,
    adSettings,
    updateAdSettings,
    siteSettings,
    updateSiteSettings,
    marketRates,
    updateMarketRates,
    bookmarks,
    toggleBookmark,
    readingHistory,
    addToHistory,
    hasArticlesLoaded,
    isSyncingFirestore,
    firestoreSyncError,
    retryFirestoreSync,
    isAdminDataLoaded,
    loadAdminData,
    hasMoreArticles,
    fetchMoreArticles,
    fetchCategoryArticles,
    searchArticlesRemote
  }), [
    articles,
    breakingNews,
    categories,
    reporters,
    comments,
    media,
    adSettings,
    siteSettings,
    marketRates,
    bookmarks,
    readingHistory,
    hasArticlesLoaded,
    isSyncingFirestore,
    firestoreSyncError,
    retryFirestoreSync,
    isAdminDataLoaded,
    loadAdminData,
    hasMoreArticles,
    fetchMoreArticles,
    fetchCategoryArticles,
    searchArticlesRemote
  ]);

  return (
    <NewsContext.Provider value={contextValue}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
