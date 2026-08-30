import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { getServiceWorkerRegistration } from "@/lib/serviceWorker";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  doc, 
  setDoc 
} from "firebase/firestore";
import { NewsNotification, NotificationPreferences, NotificationPriority, NotificationCategory } from "@/data/mock";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  breaking: true,
  important: true,
  local: true,
  liveUpdates: true,
  browserPush: false,
};

const INITIAL_LOCAL_NOTIFICATIONS: NewsNotification[] = [
  {
    id: "notif-init-1",
    title: "दमोह: जिले में विकास कार्यों को मिली स्वीकृति",
    body: "कलेक्टर कार्यालय द्वारा शहर के प्रमुख चौराहों व मार्गों के सौंदर्यीकरण हेतु नए बजट को मंजूरी।",
    priority: "important",
    category: "local",
    targetUrl: "/category/damoh",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: "notif-init-2",
    title: "मौसम अपडेट: दमोह संभाग में आंशिक बादल",
    body: "अगले 24 घंटों में हल्की बारिश और तेज हवाओं की संभावना, किसान रखें सावधानी।",
    priority: "normal",
    category: "local",
    targetUrl: "/category/madhya-pradesh",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true
  }
];

interface NotificationContextType {
  notifications: NewsNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  permissionStatus: NotificationPermission | "unsupported";
  showPromptCard: boolean;
  isSubscribing: boolean;
  requestPushPermission: () => Promise<boolean>;
  dismissPromptCard: () => void;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  sendNotification: (payload: {
    title: string;
    body: string;
    priority: NotificationPriority;
    category: NotificationCategory;
    articleId?: string;
    articleSlug?: string;
    liveUpdateId?: string;
    targetUrl?: string;
    imageUrl?: string;
  }) => Promise<string | null>;
  testNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const PREFS_STORAGE_KEY = "ddn_notif_prefs_v1";
const READ_IDS_STORAGE_KEY = "ddn_notif_read_ids_v1";
const DELETED_IDS_STORAGE_KEY = "ddn_notif_deleted_ids_v1";
const PROMPT_DISMISSED_KEY = "ddn_notif_prompt_dismissed_v1";
const DISMISSED_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NewsNotification[]>(INITIAL_LOCAL_NOTIFICATIONS);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(READ_IDS_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set(["notif-init-2"]);
    } catch {
      return new Set();
    }
  });

  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const [showPromptCard, setShowPromptCard] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const hasInitializedRef = useRef(false);
  const initialMountTimeRef = useRef(Date.now());

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences]);

  // Save read IDs
  useEffect(() => {
    try {
      localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch {
      // ignore
    }
  }, [readIds]);

  // Save deleted IDs
  useEffect(() => {
    try {
      localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(Array.from(deletedIds)));
    } catch {
      // ignore
    }
  }, [deletedIds]);

  // Consume Canonical Service Worker registration on mount
  useEffect(() => {
    getServiceWorkerRegistration()
      .then((reg) => {
        if (reg) {
          swRegistrationRef.current = reg;
        }
      })
      .catch((err) => {
        console.warn("[Notifications] Failed to obtain SW registration:", err);
      });

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === "granted") {
        setPreferences(prev => ({ ...prev, browserPush: true }));
      }
    }
  }, []);

  // Sync Notifications from Firestore (Deferred non-blocking to prevent initial mount congestion on mobile)
  useEffect(() => {
    let unsubscribe = () => {};
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startNotifSync = () => {
      try {
        const notifQuery = query(
          collection(db, "notifications"),
          orderBy("createdAt", "desc"),
          limit(40)
        );

        unsubscribe = onSnapshot(notifQuery, (snapshot) => {
          const firestoreList: NewsNotification[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            firestoreList.push({
              id: docSnap.id,
              title: data.title || "दमोह डेली न्यूज़",
              body: data.body || "",
              priority: (data.priority as NotificationPriority) || "normal",
              category: (data.category as NotificationCategory) || "local",
              articleId: data.articleId || undefined,
              articleSlug: data.articleSlug || undefined,
              liveUpdateId: data.liveUpdateId || undefined,
              targetUrl: data.targetUrl || (data.articleSlug ? `/article/${data.articleSlug}` : "/"),
              imageUrl: data.imageUrl || undefined,
              createdAt: data.createdAt || new Date().toISOString()
            });
          });

          // Merge with initial fallback if firestore is empty
          const merged = firestoreList.length > 0 ? firestoreList : INITIAL_LOCAL_NOTIFICATIONS;
          
          // Trigger incoming browser notification for fresh messages
          if (hasInitializedRef.current && firestoreList.length > 0) {
            const newest = firestoreList[0];
            const notifTime = new Date(newest.createdAt).getTime();
            const isFresh = (Date.now() - notifTime) < 90000; // < 1.5 minutes old
            const isAfterMount = notifTime > initialMountTimeRef.current;

            if (isFresh && isAfterMount && !readIds.has(newest.id) && !deletedIds.has(newest.id)) {
              dispatchBrowserNotification(newest, preferences);
            }
          }

          hasInitializedRef.current = true;
          setNotifications(merged);
        }, (error) => {
          console.warn("[Notifications] Firestore onSnapshot warning:", error);
        });
      } catch (err) {
        console.warn("[Notifications] Firestore initialization error:", err);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        timer = setTimeout(startNotifSync, 200);
      }, { timeout: 1200 });
    } else {
      timer = setTimeout(startNotifSync, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [preferences, readIds, deletedIds]);

  // Dispatch Browser Notification helper
  const dispatchBrowserNotification = useCallback((item: NewsNotification, currentPrefs: NotificationPreferences) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!currentPrefs.browserPush) return;

    // Check category preferences
    if (item.category === "breaking" && !currentPrefs.breaking) return;
    if (item.category === "important" && !currentPrefs.important) return;
    if (item.category === "local" && !currentPrefs.local) return;
    if (item.category === "live_update" && !currentPrefs.liveUpdates) return;

    const notifTitle = item.priority === "urgent" 
      ? `🚨 ${item.title}`
      : item.priority === "breaking" 
      ? `🔴 ब्रेकिंग: ${item.title}` 
      : item.title;

    const options: any = {
      body: item.body,
      icon: "/icon-192-v2.png",
      badge: "/favicon-32x32-v2.png",
      image: item.imageUrl || undefined,
      tag: `news-${item.id}`,
      data: { url: item.targetUrl || "/" }
    };

    if (swRegistrationRef.current && "showNotification" in swRegistrationRef.current) {
      swRegistrationRef.current.showNotification(notifTitle, options).catch(() => {
        try {
          new Notification(notifTitle, options);
        } catch {
          // ignore
        }
      });
    } else {
      try {
        new Notification(notifTitle, options);
      } catch {
        // ignore
      }
    }
  }, []);

  // In-Site Permission Card: Show politely after user engagement (10s delay or user interaction)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    // Check if dismissed recently
    try {
      const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
      if (dismissedAt) {
        const timePassed = Date.now() - parseInt(dismissedAt, 10);
        if (timePassed < DISMISSED_TTL_MS) {
          return;
        }
      }
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      setShowPromptCard(true);
    }, 9000); // 9 seconds of comfortable browsing time

    return () => clearTimeout(timer);
  }, []);

  // Request Push Permission
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("आपके ब्राउज़र में पुश नोटिफिकेशन समर्थित नहीं है (Notifications not supported).");
      return false;
    }

    setIsSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);

      if (perm === "granted") {
        setPreferences(prev => ({ ...prev, browserPush: true }));
        setShowPromptCard(false);

        // Store client push registration record to Firestore
        try {
          const userAgent = navigator.userAgent;
          const tokenDocId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          await setDoc(doc(db, "fcm_tokens", tokenDocId), {
            token: tokenDocId,
            userAgent,
            subscribedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("[Notifications] Token storage warning:", e);
        }

        // Show welcome confirmation notification
        if (swRegistrationRef.current && "showNotification" in swRegistrationRef.current) {
          swRegistrationRef.current.showNotification("दमोह डेली न्यूज़ नेटवर्क", {
            body: "धन्यवाद! अब आपको दमोह और मध्य प्रदेश की ताज़ा व ब्रेकिंग खबरें तुरंत प्राप्त होंगी।",
            icon: "/icon-192-v2.png",
            badge: "/favicon-32x32-v2.png",
            data: { url: "/" }
          }).catch(() => {});
        }

        setIsSubscribing(false);
        return true;
      } else {
        setShowPromptCard(false);
        setIsSubscribing(false);
        return false;
      }
    } catch (err) {
      console.error("[Notifications] Permission request error:", err);
      setIsSubscribing(false);
      return false;
    }
  }, []);

  // Dismiss prompt card
  const dismissPromptCard = useCallback(() => {
    setShowPromptCard(false);
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const updated = new Set(prev);
      notifications.forEach(n => updated.add(n.id));
      return updated;
    });
  }, [notifications]);

  // Delete notification locally
  const deleteNotification = useCallback((id: string) => {
    setDeletedIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  }, []);

  // Send Notification (Admin CMS action)
  const sendNotification = useCallback(async (payload: {
    title: string;
    body: string;
    priority: NotificationPriority;
    category: NotificationCategory;
    articleId?: string;
    articleSlug?: string;
    liveUpdateId?: string;
    targetUrl?: string;
    imageUrl?: string;
  }): Promise<string | null> => {
    try {
      const docData = {
        title: payload.title.trim(),
        body: payload.body.trim(),
        priority: payload.priority || "normal",
        category: payload.category || "local",
        articleId: payload.articleId || null,
        articleSlug: payload.articleSlug || null,
        liveUpdateId: payload.liveUpdateId || null,
        targetUrl: payload.targetUrl || (payload.articleSlug ? `/article/${payload.articleSlug}` : "/"),
        imageUrl: payload.imageUrl || null,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "notifications"), docData);
      console.log(`[Notifications] Broadcast notification published successfully: ${docRef.id}`);
      return docRef.id;
    } catch (err: any) {
      console.error("[Notifications] Error publishing notification to Firestore:", err);
      throw err;
    }
  }, []);

  // Test Notification
  const testNotification = useCallback(async () => {
    const testItem: NewsNotification = {
      id: `test-${Date.now()}`,
      title: "परीक्षण सूचना (Test Notification)",
      body: "यह दमोह डेली न्यूज़ का लाइव टेस्ट नोटिफिकेशन है। आपका सिस्टम सफलतापूर्वक सक्रिय है।",
      priority: "breaking",
      category: "breaking",
      targetUrl: "/",
      createdAt: new Date().toISOString(),
      isRead: false
    };

    if (Notification.permission === "granted") {
      dispatchBrowserNotification(testItem, preferences);
    } else {
      await requestPushPermission();
    }
  }, [preferences, dispatchBrowserNotification, requestPushPermission]);

  // Filter visible notifications for user
  const visibleNotifications = notifications
    .filter(n => !deletedIds.has(n.id))
    .map(n => ({
      ...n,
      isRead: readIds.has(n.id) || n.isRead
    }));

  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: visibleNotifications,
        unreadCount,
        preferences,
        permissionStatus,
        showPromptCard,
        isSubscribing,
        requestPushPermission,
        dismissPromptCard,
        updatePreferences,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        sendNotification,
        testNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
