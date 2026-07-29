import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  MOCK_ARTICLES, 
  CATEGORIES as INITIAL_CATEGORIES, 
  REPORTERS as INITIAL_REPORTERS, 
  MOCK_COMMENTS, 
  MOCK_MEDIA, 
  MOCK_ADS, 
  MOCK_SITE_SETTINGS,
  ArticleStatus
} from '@/data/mock';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  sanitizeFirestoreData 
} from '@/lib/firebase';

export function createSlug(title: string, uniqueId?: string): string {
  let clean = title.trim()
    .replace(/[^\w\u0900-\u097F\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
  
  if (!clean || clean === '-') {
    clean = 'news-article';
  }
  if (uniqueId) {
    return `${clean}-${uniqueId}`;
  }
  return clean;
}

interface NewsContextType {
  // Articles
  articles: Article[];
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

  // Status
  isSyncingFirestore: boolean;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [reporters, setReporters] = useState<Reporter[]>(INITIAL_REPORTERS);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [media, setMedia] = useState<MediaItem[]>(MOCK_MEDIA);
  const [adSettings, setAdSettings] = useState<AdSettings>(MOCK_ADS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(MOCK_SITE_SETTINGS);
  const [marketRates, setMarketRates] = useState<MarketRates>(INITIAL_MARKET_RATES);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<string[]>([]);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(true);

  // Firestore Real-time Subscriptions and Migration
  useEffect(() => {
    let unsubArticles: () => void = () => {};
    let unsubCategories: () => void = () => {};
    let unsubReporters: () => void = () => {};
    let unsubComments: () => void = () => {};
    let unsubMedia: () => void = () => {};
    let unsubSettingsSite: () => void = () => {};
    let unsubSettingsAds: () => void = () => {};
    let unsubSettingsMarket: () => void = () => {};

    const setupFirestoreSync = async () => {
      try {
        // 1. Articles Sync & Seeding
        const articlesSnap = await getDocs(collection(db, "articles"));
        if (articlesSnap.empty) {
          // Seed initial articles if Firestore is empty
          for (const item of MOCK_ARTICLES) {
            await setDoc(doc(db, "articles", item.id), item);
          }
        }
        unsubArticles = onSnapshot(collection(db, "articles"), (snap) => {
          const list: Article[] = [];
          snap.forEach((d) => list.push(d.data() as Article));
          if (list.length > 0) {
            // Sort by publishedAt desc
            list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            setArticles(list);
          }
        });

        // 2. Categories Sync & Seeding
        const categoriesSnap = await getDocs(collection(db, "categories"));
        if (categoriesSnap.empty) {
          for (const item of INITIAL_CATEGORIES) {
            await setDoc(doc(db, "categories", item.id), item);
          }
        }
        unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
          const list: Category[] = [];
          snap.forEach((d) => list.push(d.data() as Category));
          if (list.length > 0) setCategories(list);
        });

        // 3. Reporters Sync & Seeding
        const reportersSnap = await getDocs(collection(db, "reporters"));
        if (reportersSnap.empty) {
          for (const item of INITIAL_REPORTERS) {
            await setDoc(doc(db, "reporters", item.id), item);
          }
        }
        unsubReporters = onSnapshot(collection(db, "reporters"), (snap) => {
          const list: Reporter[] = [];
          snap.forEach((d) => list.push(d.data() as Reporter));
          if (list.length > 0) setReporters(list);
        });

        // 4. Comments Sync & Seeding
        const commentsSnap = await getDocs(collection(db, "comments"));
        if (commentsSnap.empty) {
          for (const item of MOCK_COMMENTS) {
            await setDoc(doc(db, "comments", item.id), item);
          }
        }
        unsubComments = onSnapshot(collection(db, "comments"), (snap) => {
          const list: Comment[] = [];
          snap.forEach((d) => list.push(d.data() as Comment));
          if (list.length > 0) {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setComments(list);
          }
        });

        // 5. Media Sync
        const mediaSnap = await getDocs(collection(db, "media"));
        if (mediaSnap.empty) {
          for (const item of MOCK_MEDIA) {
            await setDoc(doc(db, "media", item.id), item);
          }
        }
        unsubMedia = onSnapshot(collection(db, "media"), (snap) => {
          const list: MediaItem[] = [];
          snap.forEach((d) => list.push(d.data() as MediaItem));
          if (list.length > 0) setMedia(list);
        });

        // 6. Settings Sync & Seeding
        unsubSettingsSite = onSnapshot(doc(db, "settings", "site"), (snap) => {
          if (snap.exists()) {
            setSiteSettings(snap.data() as SiteSettings);
          } else {
            setDoc(doc(db, "settings", "site"), MOCK_SITE_SETTINGS);
          }
        });

        unsubSettingsAds = onSnapshot(doc(db, "settings", "ads"), (snap) => {
          if (snap.exists()) {
            setAdSettings(snap.data() as AdSettings);
          } else {
            setDoc(doc(db, "settings", "ads"), MOCK_ADS);
          }
        });

        unsubSettingsMarket = onSnapshot(doc(db, "settings", "market"), (snap) => {
          if (snap.exists()) {
            setMarketRates(snap.data() as MarketRates);
          } else {
            setDoc(doc(db, "settings", "market"), INITIAL_MARKET_RATES);
          }
        });

      } catch (err) {
        console.warn("Firestore initialization notice (using fallback local cache if offline):", err);
      } finally {
        setIsSyncingFirestore(false);
      }
    };

    setupFirestoreSync();

    // LocalStorage user bookmarks and history
    const savedBookmarks = localStorage.getItem('damoh_news_bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    const savedHistory = localStorage.getItem('damoh_news_history');
    if (savedHistory) setReadingHistory(JSON.parse(savedHistory));

    return () => {
      unsubArticles();
      unsubCategories();
      unsubReporters();
      unsubComments();
      unsubMedia();
      unsubSettingsSite();
      unsubSettingsAds();
      unsubSettingsMarket();
    };
  }, []);

  // Save Bookmarks & History to LocalStorage
  useEffect(() => {
    localStorage.setItem('damoh_news_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('damoh_news_history', JSON.stringify(readingHistory));
  }, [readingHistory]);

  // Article Actions
  const addArticle = async (data: Omit<Article, 'id' | 'views' | 'likes' | 'publishedAt'> & { publishedAt?: string }): Promise<Article> => {
    const id = `a${Date.now()}`;
    const slug = data.slug && data.slug.trim().length > 0 ? createSlug(data.slug, id) : createSlug(data.title, id);
    
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

    // Save to Firestore first so errors can be thrown & caught in UI
    await setDoc(doc(db, "articles", id), docData);

    setArticles(prev => [newArticle, ...prev]);
    return newArticle;
  };

  const updateArticle = async (id: string, data: Partial<Article>): Promise<void> => {
    const existing = articles.find(a => a.id === id);
    const updatedSlug = data.slug ? createSlug(data.slug, id) : (data.title ? createSlug(data.title, id) : existing?.slug || id);

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
      slug: updatedSlug,
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
    const duplicated: Article = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      slug: createSlug(`${original.title}-copy`, newId),
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

    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        const newViews = (a.views || 0) + 1;
        const currentViewsByDate = a.viewsByDate || {};
        const updatedViewsByDate = { 
          ...currentViewsByDate, 
          [todayStr]: (currentViewsByDate[todayStr] || 0) + 1 
        };

        // Background update to Firestore article document
        setDoc(doc(db, "articles", id), { 
          views: newViews, 
          viewsByDate: updatedViewsByDate,
          lastViewedAt: nowIso 
        }, { merge: true }).catch(() => {});

        // Background analytics event log in Firestore
        addDoc(collection(db, "analytics_events"), {
          articleId: id,
          type: 'view',
          timestamp: nowIso,
          dateStr: todayStr,
          categoryIds: a.categoryIds || []
        }).catch(() => {});

        return { 
          ...a, 
          views: newViews, 
          viewsByDate: updatedViewsByDate, 
          lastViewedAt: nowIso 
        };
      }
      return a;
    }));
  };

  const toggleLike = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        const newLikes = (a.likes || 0) + 1;
        const currentLikesByDate = a.likesByDate || {};
        const updatedLikesByDate = { 
          ...currentLikesByDate, 
          [todayStr]: (currentLikesByDate[todayStr] || 0) + 1 
        };

        // Background update to Firestore article document
        setDoc(doc(db, "articles", id), { 
          likes: newLikes, 
          likesByDate: updatedLikesByDate,
          lastLikedAt: nowIso 
        }, { merge: true }).catch(() => {});

        // Background analytics event log in Firestore
        addDoc(collection(db, "analytics_events"), {
          articleId: id,
          type: 'like',
          timestamp: nowIso,
          dateStr: todayStr,
          categoryIds: a.categoryIds || []
        }).catch(() => {});

        return { 
          ...a, 
          likes: newLikes, 
          likesByDate: updatedLikesByDate, 
          lastLikedAt: nowIso 
        };
      }
      return a;
    }));
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

  return (
    <NewsContext.Provider value={{
      articles,
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
      isSyncingFirestore
    }}>
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
