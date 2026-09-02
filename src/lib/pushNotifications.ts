import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface ArticlePushData {
  id?: string;
  title: string;
  excerpt?: string;
  content?: string;
  slug: string;
  imageUrl?: string;
  isBreaking?: boolean;
  isTrending?: boolean;
  categoryIds?: string[];
}

// In-memory deduplication set with 60-second cooldown per slug/id
const recentlyPushedSlugs = new Map<string, number>();

function cleanHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

/**
 * Automatically dispatches a true server-side Web Push / FCM notification
 * when a news article is published.
 * 
 * Works seamlessly across:
 * 1. Website active / foreground
 * 2. Website running in background / minimized
 * 3. Browser completely closed (delivers via FCM / Service Worker push event)
 */
export async function dispatchArticlePushNotification(article: ArticlePushData): Promise<boolean> {
  if (!article || !article.title || !article.slug) {
    console.warn("[Push] Missing required article data (title/slug) for push notification.");
    return false;
  }

  const slug = article.slug.trim();
  const now = Date.now();

  // Prevent duplicate broadcasts within 60 seconds for the same article
  const lastPushedAt = recentlyPushedSlugs.get(slug) || 0;
  if (now - lastPushedAt < 60000) {
    console.log(`[Push] Skipping duplicate push dispatch for slug: ${slug} (cooldown active)`);
    return false;
  }
  recentlyPushedSlugs.set(slug, now);

  const cleanTitle = article.title.trim();
  const rawBody = article.excerpt?.trim() || cleanHtml(article.content || "") || cleanTitle;
  const cleanBody = rawBody.length > 150 ? `${rawBody.slice(0, 147)}...` : rawBody;
  
  const priority = article.isBreaking ? "breaking" : "normal";
  const category = (article.categoryIds && article.categoryIds[0]) ? article.categoryIds[0] : "local";
  const targetUrl = `/article/${slug}`;
  const imageUrl = article.imageUrl && !article.imageUrl.includes("unsplash.com/photo-1546422904-90eab23c3d7e") ? article.imageUrl : undefined;

  let firestoreNotifId = `art_${slug}_${now}`;

  // 1. Record to Firestore 'notifications' collection for in-app bell & history
  try {
    const notifDocRef = await addDoc(collection(db, "notifications"), {
      title: cleanTitle,
      body: cleanBody,
      priority,
      category,
      articleId: article.id || null,
      articleSlug: slug,
      targetUrl,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp()
    });
    if (notifDocRef && notifDocRef.id) {
      firestoreNotifId = notifDocRef.id;
    }
  } catch (fsErr) {
    console.warn("[Push] Firestore notification history log warning:", fsErr);
  }

  // 2. Dispatch true Server-Side FCM Push Broadcast
  try {
    const payload = {
      id: firestoreNotifId,
      title: cleanTitle,
      body: cleanBody,
      priority,
      category,
      articleId: article.id || undefined,
      articleSlug: slug,
      targetUrl,
      imageUrl
    };

    const res = await fetch("/api/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[Push] Automatic article publish push dispatched successfully (${data.sentCount || 0} devices):`, data);
      return true;
    } else {
      console.warn(`[Push] Server push endpoint returned HTTP ${res.status}`);
      return false;
    }
  } catch (pushErr) {
    console.warn("[Push] Failed to dispatch server push notification:", pushErr);
    return false;
  }
}
