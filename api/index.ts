import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import sharp from "sharp";
import { 
  startLiveUpdatesCleanupScheduler, 
  performLiveUpdatesCleanup, 
  destroyCloudinaryImage, 
  extractCloudinaryPublicId 
} from "./liveUpdatesCleanup";

const INITIAL_CATEGORIES = [
  { id: 'c1', name: 'दमोह (Damoh)', slug: 'damoh' },
  { id: 'c2', name: 'ब्रेकिंग न्यूज़ (Breaking News)', slug: 'breaking-news' },
  { id: 'c3', name: 'ताज़ा खबरें (Latest News)', slug: 'latest-news' },
  { id: 'c4', name: 'मध्य प्रदेश (Madhya Pradesh)', slug: 'madhya-pradesh' },
  { id: 'c5', name: 'भारत (India)', slug: 'india' },
  { id: 'c6', name: 'राजनीति (Politics)', slug: 'politics' },
  { id: 'c7', name: 'क्राइम (Crime)', slug: 'crime' },
  { id: 'c8', name: 'मनोरंजन (Entertainment)', slug: 'entertainment' },
  { id: 'c9', name: 'धर्म-संस्कृति (Religion)', slug: 'religion' },
  { id: 'c10', name: 'खेल (Sports)', slug: 'sports' },
  { id: 'c11', name: 'बिजनेस (Business)', slug: 'business' },
  { id: 'c12', name: 'फोटो-वीडियो (Gallery)', slug: 'gallery' }
];

const DEFAULT_SHARE_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop";

const MOCK_ARTICLES_FALLBACK: Array<Record<string, any>> = [
  {
    id: 'a1',
    title: 'दमोह में भारी बारिश से जनजीवन अस्त-व्यस्त, कई निचले इलाकों में भरा पानी',
    slug: 'heavy-rain-in-damoh-waterlogging-in-low-lying-areas-a1',
    excerpt: 'पिछले 24 घंटों से लगातार हो रही बारिश ने दमोह शहर की रफ्तार रोक दी है। मौसम विभाग ने रेड अलर्ट जारी किया है।',
    content: 'दमोह शहर और ग्रामीण अंचलों में पिछले 24 घंटों से रुक-रुक कर हो रही तेज बारिश के कारण जनजीवन पूरी तरह प्रभावित हुआ है।',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=1200&h=630&fit=crop',
    publishedAt: new Date().toISOString(),
    authorName: 'SANJAY RAIKWAR (संजय रैकवार)'
  }
];

function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields || typeof fields !== 'object') return result;

  for (const [key, val] of Object.entries(fields)) {
    if (!val || typeof val !== 'object') continue;
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = Number(val.integerValue);
    else if ('doubleValue' in val) result[key] = Number(val.doubleValue);
    else if ('booleanValue' in val) result[key] = val.booleanValue;
    else if ('timestampValue' in val) result[key] = val.timestampValue;
    else if ('nullValue' in val) result[key] = null;
    else if ('arrayValue' in val) {
      result[key] = (val.arrayValue.values || []).map((v: any) => v.stringValue || v);
    }
    else if ('mapValue' in val) {
      result[key] = parseFirestoreFields(val.mapValue.fields || {});
    }
  }
  return result;
}

// Known legacy / broken slug mappings for server-side permanent 301 redirect
const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "singrampur-tagra-mohalla-drain-problem-cremation-damoh-rain-a1787301996708-a1787301996708-a1787301996708": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mohalla-drain-problem-cremation-damoh-rain-a1787301996708-a1787301996708": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mohalla-drain-problem-cremation-damoh-rain-a1787301996708": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-wagra-mahala-drain-problem": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-wagra-mohalla-drain-problem": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mahala-drain-problem": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-wagra-mahala-drain": "singrampur-tagra-mohalla-drain-problem",
  "singrampur-tagra-mohalla-drain": "singrampur-tagra-mohalla-drain-problem",
};

function stripServerGeneratedSuffixes(slug: string): string {
  if (!slug) return '';
  let cleaned = slug.trim();
  if (LEGACY_SLUG_REDIRECTS[cleaned]) return LEGACY_SLUG_REDIRECTS[cleaned];
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned
      .replace(/-a\d{6,}(?=-a\d{6,}|$)/gi, '')
      .replace(/-a\d{6,}$/gi, '')
      .replace(/-\d{10,}$/g, '')
      .replace(/-+$/, '');
  }
  if (LEGACY_SLUG_REDIRECTS[cleaned]) return LEGACY_SLUG_REDIRECTS[cleaned];
  if (cleaned.includes('singrampur') && (cleaned.includes('tagra') || cleaned.includes('wagra') || cleaned.includes('mohalla') || cleaned.includes('mahala') || cleaned.includes('drain'))) {
    return 'singrampur-tagra-mohalla-drain-problem';
  }
  return cleaned;
}

// Server-side in-memory caches to minimize Firestore REST latency for SSR and crawlers
const serverArticleCache = new Map<string, { data: Record<string, any> | null; timestamp: number }>();
const SERVER_ARTICLE_CACHE_TTL = 60 * 1000; // 60 seconds TTL

let serverFeedCache: { data: Array<Record<string, any>>; timestamp: number } | null = null;
const SERVER_FEED_CACHE_TTL = 60 * 1000; // 60 seconds TTL

async function getAllArticlesForFeed(): Promise<Array<Record<string, any>>> {
  const now = Date.now();
  if (serverFeedCache && (now - serverFeedCache.timestamp < SERVER_FEED_CACHE_TTL)) {
    return serverFeedCache.data;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";
  const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

  try {
    const res = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "articles" }],
          orderBy: [{ field: { fieldPath: "publishedAt" }, direction: "DESCENDING" }],
          limit: 1000
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const articles = data
          .map((item: any) => item.document ? parseFirestoreFields(item.document.fields) : null)
          .filter(Boolean);
        if (articles.length > 0) {
          serverFeedCache = { data: articles, timestamp: now };
          return articles;
        }
      }
    }
  } catch (err) {
    console.error("Error fetching all articles from Firestore REST API:", err);
  }

  return MOCK_ARTICLES_FALLBACK;
}

async function getArticleBySlug(slugInput: string): Promise<Record<string, any> | null> {
  if (!slugInput) return null;
  const rawClean = slugInput.trim().split('?')[0].split('#')[0];
  const cleanSlug = rawClean.replace(/\.jpg$/i, "");
  let decodedSlug = cleanSlug;
  try {
    decodedSlug = decodeURIComponent(cleanSlug);
  } catch (e) {
    // ignore decode error
  }

  const strippedSlug = stripServerGeneratedSuffixes(decodedSlug);

  // Check in-memory server cache first
  const cacheKey = cleanSlug.toLowerCase();
  const cached = serverArticleCache.get(cacheKey) || 
                 serverArticleCache.get(decodedSlug.toLowerCase()) ||
                 serverArticleCache.get(strippedSlug.toLowerCase());
  if (cached && (Date.now() - cached.timestamp < SERVER_ARTICLE_CACHE_TTL)) {
    return cached.data;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";

  try {
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    
    // Attempt 1: Match by exact slug, decoded slug, or stripped slug
    const knownRedirect = LEGACY_SLUG_REDIRECTS[cleanSlug] || LEGACY_SLUG_REDIRECTS[decodedSlug] || LEGACY_SLUG_REDIRECTS[strippedSlug];
    const slugsToTry = Array.from(new Set([cleanSlug, decodedSlug, strippedSlug, knownRedirect].filter(Boolean)));
    for (const slugTry of slugsToTry) {
      const response = await fetch(queryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "articles" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slugTry }
              }
            },
            limit: 1
          }
        })
      });

      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results) && results[0]?.document?.fields) {
          const parsed = parseFirestoreFields(results[0].document.fields);
          if (parsed) {
            const entry = { data: parsed, timestamp: Date.now() };
            serverArticleCache.set(cacheKey, entry);
            if (parsed.id) serverArticleCache.set(String(parsed.id).toLowerCase(), entry);
            if (parsed.slug) serverArticleCache.set(String(parsed.slug).toLowerCase(), entry);
            return parsed;
          }
        }
      }
    }

    // Attempt 2: Match by Document ID if slug contains article ID (e.g. a1787301996708)
    const docIdMatch = cleanSlug.match(/a\d+/);
    if (docIdMatch) {
      const docId = docIdMatch[0];
      const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles/${docId}`;
      const docRes = await fetch(docUrl);
      if (docRes.ok) {
        const docData = await docRes.json();
        if (docData?.fields) {
          const parsed = parseFirestoreFields(docData.fields);
          if (parsed) {
            const entry = { data: parsed, timestamp: Date.now() };
            serverArticleCache.set(cacheKey, entry);
            if (parsed.id) serverArticleCache.set(String(parsed.id).toLowerCase(), entry);
            if (parsed.slug) serverArticleCache.set(String(parsed.slug).toLowerCase(), entry);
            return parsed;
          }
        }
      }
    }

    // Attempt 3: Match from loaded/cached feed articles if direct single query returned no doc
    const allArticles = await getAllArticlesForFeed();
    const feedMatch = allArticles.find(a => {
      if (!a) return false;
      const aSlug = String(a.slug || "").toLowerCase();
      const aId = String(a.id || "").toLowerCase();
      const aStripped = stripServerGeneratedSuffixes(aSlug);
      const cleanLower = cleanSlug.toLowerCase();
      const decodedLower = decodedSlug.toLowerCase();
      const strippedLower = strippedSlug.toLowerCase();

      return aSlug === cleanLower ||
             aSlug === decodedLower ||
             aSlug === strippedLower ||
             (knownRedirect && aSlug === knownRedirect.toLowerCase()) ||
             (aId && (cleanLower === aId || cleanLower.includes(aId) || decodedLower.includes(aId))) ||
             (aStripped && (aStripped === strippedLower || aStripped === cleanLower || aStripped === decodedLower));
    });

    if (feedMatch) {
      const entry = { data: feedMatch, timestamp: Date.now() };
      serverArticleCache.set(cacheKey, entry);
      if (feedMatch.id) serverArticleCache.set(String(feedMatch.id).toLowerCase(), entry);
      if (feedMatch.slug) serverArticleCache.set(String(feedMatch.slug).toLowerCase(), entry);
      return feedMatch;
    }
  } catch (err) {
    console.error("Error fetching article from Firestore REST API:", err);
  }

  // Exact match only against mock fallback if firestore returns null and it explicitly matches the requested slug/id
  const mockMatch = MOCK_ARTICLES_FALLBACK.find(
    a => (a.slug && a.slug === cleanSlug) || 
         (a.id && a.id === cleanSlug) || 
         (a.slug && a.slug === decodedSlug) ||
         (a.slug && a.slug === strippedSlug)
  );
  if (mockMatch) return mockMatch;

  return null;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripTags(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

function getBaseUrl(req: express.Request): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, "");

  const hostHeader = (req.headers["x-forwarded-host"] as string) || req.headers.host || (process.env.VERCEL_URL ? `${process.env.VERCEL_URL}` : "localhost:3000");
  const host = hostHeader.split(",")[0].trim();

  let proto = (req.headers["x-forwarded-proto"] as string) || (req.headers["x-forwarded-ssl"] === "on" ? "https" : "");
  if (proto) {
    proto = proto.split(",")[0].trim();
  }
  if (!proto) {
    proto = (host.startsWith("localhost") || host.startsWith("127.0.0.1")) ? "http" : "https";
  }
  return `${proto}://${host}`;
}

const serverImageBufferCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const SERVER_IMAGE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL

let defaultShareImageBuffer: Buffer | null = null;

async function getDefaultShareImageBuffer(): Promise<Buffer> {
  if (defaultShareImageBuffer && defaultShareImageBuffer.length > 0) {
    return defaultShareImageBuffer;
  }

  const logoPath = path.resolve(process.cwd(), "public", "logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const rawLogo = fs.readFileSync(logoPath);
      // Create an optimal 1200x630 Open Graph banner with centered branding on rich background
      defaultShareImageBuffer = await sharp({
        create: {
          width: 1200,
          height: 630,
          channels: 4,
          background: { r: 24, g: 24, b: 27, alpha: 1 }
        }
      })
      .composite([{
        input: await sharp(rawLogo).resize(960, 480, { fit: 'inside' }).toBuffer(),
        gravity: 'center'
      }])
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

      return defaultShareImageBuffer;
    } catch (e) {
      console.warn("sharp composite failed for default share image, falling back to raw logo:", e);
      if (fs.existsSync(logoPath)) {
        defaultShareImageBuffer = fs.readFileSync(logoPath);
        return defaultShareImageBuffer;
      }
    }
  }

  return Buffer.from("");
}

async function createResizedImageBuffer(inputBuffer: Buffer, targetMime: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<Buffer> {
  try {
    if (!inputBuffer || inputBuffer.length === 0) {
      return await getDefaultShareImageBuffer();
    }

    const TARGET_WIDTH = 1200;
    const TARGET_HEIGHT = 630;

    // 1. Create background canvas:
    // Resize input image to 1200x630 with 'cover', apply Gaussian blur and subtle dimming/saturation boost
    // so it forms a seamless, natural extension of the original image with no black/white letterbox bars.
    const backgroundBuffer = await sharp(inputBuffer)
      .rotate() // Automatically orient based on EXIF metadata
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .blur(28) // High quality smooth Gaussian blur
      .modulate({
        brightness: 0.82, // Subtle dimming for focus on foreground
        saturation: 1.15  // Rich matching ambient color palette
      })
      .toBuffer();

    // 2. Create foreground image:
    // Resize original image with 'inside' so 100% of the original image is preserved without any cropping,
    // stretching, zooming, or distortion.
    const foregroundBuffer = await sharp(inputBuffer)
      .rotate() // Automatically orient based on EXIF metadata
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: false
      })
      .toBuffer();

    // 3. Composite foreground centered on top of the blurred background
    return await sharp(backgroundBuffer)
      .composite([
        {
          input: foregroundBuffer,
          gravity: 'center'
        }
      ])
      .jpeg({
        quality: 90,
        mozjpeg: true,
        progressive: true
      })
      .toBuffer();
  } catch (err) {
    console.warn("sharp 1200x630 social image generation warning:", err);
    try {
      return await sharp(inputBuffer)
        .rotate()
        .resize(1200, 630, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    } catch {
      return inputBuffer;
    }
  }
}

function getArticleImageUrl(article: Record<string, any> | null, slug: string, baseUrl: string): string {
  if (!article) {
    return `${baseUrl}/social-preview.jpg`;
  }

  const safeSlug = encodeURIComponent(slug || article.slug || article.id || "article");
  return `${baseUrl}/api/article-image/${safeSlug}.jpg`;
}

function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemaps and Feeds for Google Search Console & Google News
Sitemap: ${baseUrl}/sitemap.xml
`;
}

function formatArticleBodyForSSR(content: string, excerpt: string): string {
  const text = (content || excerpt || "").trim();
  if (!text) return "";

  const hasHtml = /<\s*(p|h[1-6]|ul|ol|li|blockquote|div|hr|br)\b[^>]*>/i.test(text);
  if (hasHtml) {
    return text;
  }

  return text
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin-bottom:1.1rem;font-size:1.125rem;line-height:1.75;color:#27272a;">${escapeHtml(p)}</p>`)
    .join("\n");
}

function isPubliclyPublishedArticle(art: Record<string, any>): boolean {
  if (!art) return false;
  const status = art.status || "published";
  if (status !== "published") return false;
  if (art.scheduledAt) {
    const scheduledTime = new Date(art.scheduledAt).getTime();
    if (!isNaN(scheduledTime) && scheduledTime > Date.now()) {
      return false;
    }
  }
  return true;
}

async function generateSitemapXml(baseUrl: string): Promise<string> {
  const articles = await getAllArticlesForFeed();
  const categories = INITIAL_CATEGORIES;
  const nowIso = new Date().toISOString();

  let urlsXml = `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>`;

  for (const cat of categories) {
    urlsXml += `
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  for (const art of articles) {
    if (!art.slug && !art.id) continue;
    if (!isPubliclyPublishedArticle(art)) continue;
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt || nowIso;
    const title = escapeHtml(art.title || "Damoh News");
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const image = getArticleImageUrl(art, articleSlug, baseUrl);

    urlsXml += `
  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${art.updatedAt || pubDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <news:news>
      <news:publication>
        <news:name>Damoh Daily News</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
    ${image ? `<image:image>
      <image:loc>${escapeHtml(image)}</image:loc>
      <image:title>${title}</image:title>
    </image:image>` : ''}
  </url>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}

async function generateRssFeedXml(baseUrl: string): Promise<string> {
  const articles = await getAllArticlesForFeed();
  const nowRssDate = new Date().toUTCString();

  let itemsXml = "";
  for (const art of articles) {
    if (!art.slug && !art.id) continue;
    if (!isPubliclyPublishedArticle(art)) continue;
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt ? new Date(art.publishedAt).toUTCString() : nowRssDate;
    const title = escapeHtml(art.title || "Damoh News");
    const desc = escapeHtml(stripTags(art.excerpt || art.content || title));
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const author = escapeHtml(art.authorName || "Damoh Daily News");
    const image = getArticleImageUrl(art, articleSlug, baseUrl);

    itemsXml += `
    <item>
      <title>${title}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <dc:creator>${author}</dc:creator>
      <enclosure url="${image}" type="image/jpeg" />
    </item>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Damoh Daily News - दमोह और मध्य प्रदेश की ताज़ा ख़बरें</title>
    <link>${baseUrl}</link>
    <description>दमोह जिले का सबसे विश्वसनीय डिजिटल न्यूज़ प्लेटफॉर्म। सटीक और तेज़ खबरें, सबसे पहले।</description>
    <language>hi-IN</language>
    <lastBuildDate>${nowRssDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

function getHtmlTemplate(): string {
  const possiblePaths = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
    path.resolve(process.cwd(), "dist", "index.html"),
    path.resolve(process.cwd(), "index.html")
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p, "utf-8");
      } catch (e) {
        // Continue to fallback
      }
    }
  }

  return `<!doctype html>
<html lang="hi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Google AdSense Verification & Auto Ads -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2796957315598605" crossorigin="anonymous"></script>
    <title>Damoh Daily News - दमोह और मध्य प्रदेश की ताज़ा ख़बरें</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

function injectArticleMetaTags(html: string, article: Record<string, any>, fullUrl: string, baseUrl: string, slug: string): string {
  const rawTitle = article.title ? String(article.title).trim() : "Damoh Daily News";
  const cleanTitle = escapeHtml(rawTitle);

  const rawExcerpt = article.excerpt || article.content || "दमोह और मध्य प्रदेश की ताज़ा और प्रामाणिक ख़बरें";
  const description = escapeHtml(stripTags(rawExcerpt).slice(0, 200));

  const imageUrl = getArticleImageUrl(article, slug, baseUrl);

  const author = article.authorName ? escapeHtml(String(article.authorName)) : "Damoh Daily News";
  const publishedTime = article.publishedAt || new Date().toISOString();
  const modifiedTime = article.updatedAt || publishedTime;
  const canonicalUrl = escapeHtml(fullUrl);

  const rawContentFormatted = formatArticleBodyForSSR(article.content || "", article.excerpt || "");
  const cleanBodyPlain = stripTags(article.content || article.excerpt || "");

  const jsonLdNewsArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    },
    "headline": rawTitle,
    "description": stripTags(rawExcerpt).slice(0, 200),
    "articleBody": cleanBodyPlain,
    "image": [imageUrl],
    "datePublished": publishedTime,
    "dateModified": modifiedTime,
    "author": {
      "@type": "Person",
      "name": article.authorName || "Damoh Daily News"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Damoh Daily News",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/icon-512.png`
      }
    }
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "मुख्य पृष्ठ",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": rawTitle,
        "item": fullUrl
      }
    ]
  };

  const metaTagsHtml = `
    <!-- Dynamic Article Meta Tags for WhatsApp, Facebook, Telegram, X & Google -->
    <title>${cleanTitle} - Damoh Daily News</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook / WhatsApp / Telegram -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Damoh Daily News">
    <meta property="og:title" content="${cleanTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${cleanTitle}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="hi_IN">
    <meta property="article:published_time" content="${publishedTime}">
    <meta property="article:modified_time" content="${modifiedTime}">
    <meta property="article:author" content="${author}">
    <meta property="article:section" content="News">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DamohDailyNews">
    <meta name="twitter:creator" content="@DamohDailyNews">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="${cleanTitle}">

    <!-- Google Search Console & News Schema.org JSON-LD -->
    <script type="application/ld+json">${JSON.stringify(jsonLdNewsArticle)}</script>
    <script type="application/ld+json">${JSON.stringify(jsonLdBreadcrumbs)}</script>

    <!-- Initial Article SSR Hydration Data for Instant React Mount with Zero Flicker -->
    <script id="__INITIAL_ARTICLE__" type="application/json">${JSON.stringify(article).replace(/</g, '\\u003c')}</script>
    <script>
      try {
        var rawArticleEl = document.getElementById('__INITIAL_ARTICLE__');
        if (rawArticleEl && rawArticleEl.textContent) {
          window.__INITIAL_ARTICLE__ = JSON.parse(rawArticleEl.textContent);
        }
      } catch(e) {}
    </script>
  `;

  const serverRenderedBody = `<div id="root">
    <main style="max-width:800px;margin:0 auto;padding:1.5rem 1rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <article>
        <header style="margin-bottom:1.5rem;">
          <h1 style="font-size:1.875rem;line-height:1.3;font-weight:800;color:#18181b;margin-bottom:0.75rem;">${cleanTitle}</h1>
          ${article.excerpt ? `<p style="font-size:1.125rem;line-height:1.6;color:#52525b;margin-bottom:1rem;font-weight:500;">${escapeHtml(stripTags(article.excerpt))}</p>` : ''}
          <div style="display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:#71717a;border-top:1px solid #e4e4e7;border-bottom:1px solid #e4e4e7;padding:0.5rem 0;">
            <span>लेखक: <strong>${author}</strong></span>
            <span>प्रकाशित: <time datetime="${publishedTime}">${publishedTime.slice(0, 10)}</time></span>
          </div>
        </header>
        ${imageUrl ? `<div style="margin-bottom:1.5rem;"><img src="${imageUrl}" alt="${cleanTitle}" style="width:100%;height:auto;max-height:480px;object-fit:cover;border-radius:0.75rem;" /></div>` : ''}
        <div class="article-body-content">
          ${rawContentFormatted}
        </div>
      </article>
    </main>
  </div>`;

  let cleanHtml = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']og:[\s\S]*?["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']article:[\s\S]*?["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:[\s\S]*?["'][\s\S]*?>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, '');

  cleanHtml = cleanHtml.replace('<div id="root"></div>', serverRenderedBody);

  return cleanHtml.replace('</head>', `${metaTagsHtml}\n</head>`);
}

function injectDefaultMetaTags(html: string, fullUrl: string, baseUrl: string): string {
  const title = "Damoh Daily News - दमोह और मध्य प्रदेश की ताज़ा ख़बरें";
  const description = "दमोह और मध्य प्रदेश की विश्वसनीय, सटीक और ताज़ा खबरें। राजनीति, अपराध, समाज, मौसम और स्थानीय समाचार।";
  const imageUrl = getArticleImageUrl(null, "", baseUrl);
  const canonicalUrl = escapeHtml(fullUrl);

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Damoh Daily News",
    "url": baseUrl,
    "logo": `${baseUrl}/icon-512.png`
  };

  const metaTagsHtml = `
    <!-- Default Site Meta Tags -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook / WhatsApp / Telegram -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Damoh Daily News">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${title}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="hi_IN">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DamohDailyNews">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="${title}">

    <!-- Google Search Console Organization Schema -->
    <script type="application/ld+json">${JSON.stringify(jsonLdOrganization)}</script>
  `;

  let cleanHtml = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']og:[\s\S]*?["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']article:[\s\S]*?["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:[\s\S]*?["'][\s\S]*?>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, '');

  return cleanHtml.replace('</head>', `${metaTagsHtml}\n</head>`);
}

export function createExpressApp() {
  const app = express();

  // Basic Security Headers Middleware
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    next();
  });

  // Simple in-memory rate limiter for API endpoints
  const ipRequests = new Map<string, { count: number; resetTime: number }>();
  app.use("/api", (req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 mins
    const limit = 300; // 300 requests per 15 mins

    const record = ipRequests.get(ip);
    if (!record || now > record.resetTime) {
      ipRequests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ error: "Too many requests, please try again later." });
    }

    record.count++;
    next();
  });

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // API Route for Cloudinary Signed Uploads
  app.post("/api/cloudinary-sign", (req, res) => {
    try {
      const { folder, upload_preset, timestamp } = req.body || {};
      const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";
      const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";

      if (!apiSecret) {
        return res.status(400).json({ 
          signed: false, 
          error: "CLOUDINARY_API_SECRET is required on server for secure signed uploads." 
        });
      }

      const paramsToSign: Record<string, string> = {};
      if (folder) paramsToSign.folder = folder;
      if (timestamp) paramsToSign.timestamp = String(timestamp);
      if (upload_preset) paramsToSign.upload_preset = upload_preset;

      const sortedKeys = Object.keys(paramsToSign).sort();
      const stringToSign = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join("&") + apiSecret;

      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

      res.status(200).json({
        signed: true,
        signature,
        timestamp,
        apiKey,
        cloudName,
        uploadPreset: upload_preset
      });
    } catch (err: any) {
      console.error("Cloudinary sign error:", err);
      res.status(500).json({ signed: false, error: err?.message || "Failed to generate Cloudinary signature" });
    }
  });

  // Automated 7-Day Live Updates Cleanup Endpoint
  app.all("/api/live-updates/cleanup", async (_req, res) => {
    try {
      const result = await performLiveUpdatesCleanup();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("[LiveUpdates Cleanup] Manual execution error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to execute cleanup" });
    }
  });

  // Associated Live Update Image Deletion Endpoint (for immediate admin panel delete)
  app.post("/api/live-updates/delete-image", async (req, res) => {
    try {
      const { publicId, imageUrl } = req.body || {};
      const targetPublicId = publicId || extractCloudinaryPublicId(imageUrl);
      if (!targetPublicId) {
        return res.status(200).json({ success: false, message: "No Cloudinary asset found to destroy" });
      }
      const success = await destroyCloudinaryImage(targetPublicId);
      return res.status(200).json({ success, publicId: targetPublicId });
    } catch (err: any) {
      console.warn("[LiveUpdates Cleanup] Error deleting image asset:", err);
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Live Damoh Weather Proxy API with in-memory caching and fail-safe fallback
  let weatherCache: { data: any; timestamp: number } | null = null;
  const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  app.get("/api/weather", async (_req, res) => {
    try {
      const now = Date.now();
      if (weatherCache && (now - weatherCache.timestamp < WEATHER_CACHE_TTL)) {
        res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
        return res.json(weatherCache.data);
      }

      const DAMOH_LAT = 23.8388;
      const DAMOH_LON = 79.4422;
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${DAMOH_LAT}&longitude=${DAMOH_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,visibility&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia%2FKolkata`;

      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) {
        throw new Error(`Weather API HTTP error: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.current || !data.daily) {
        throw new Error("Invalid weather payload");
      }

      weatherCache = { data, timestamp: now };
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
      return res.json(data);
    } catch (err: any) {
      if (weatherCache) {
        res.setHeader("Cache-Control", "public, max-age=120");
        return res.json(weatherCache.data);
      }

      // Safe local fallback for Damoh if remote API is momentarily unreachable
      const defaultData = {
        current: {
          temperature_2m: 29,
          apparent_temperature: 31,
          weather_code: 1,
          relative_humidity_2m: 72,
          wind_speed_10m: 9,
          visibility: 10000,
          is_day: 1
        },
        daily: {
          temperature_2m_max: [33],
          temperature_2m_min: [24],
          sunrise: [`${new Date().toISOString().split("T")[0]}T05:52`],
          sunset: [`${new Date().toISOString().split("T")[0]}T18:48`]
        }
      };
      res.setHeader("Cache-Control", "public, max-age=120");
      return res.json(defaultData);
    }
  });

  // Serve firebase-applet-config.json explicitly if requested
  app.get("/firebase-applet-config.json", (_req, res) => {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      res.setHeader("Content-Type", "application/json");
      res.sendFile(configPath);
    } else {
      res.status(404).json({ error: "Config not found" });
    }
  });

  // Default fallback social sharing image endpoint (1200x630 binary JPEG)
  app.get("/social-preview.jpg", async (_req, res) => {
    try {
      const buf = await getDefaultShareImageBuffer();
      if (buf && buf.length > 0) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Length", buf.length);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
        return res.status(200).send(buf);
      }
    } catch (err) {
      console.error("Error serving social-preview.jpg:", err);
    }
    const logoPath = path.resolve(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
      return res.status(200).sendFile(logoPath);
    }
    res.status(404).send("Not found");
  });

  // Serve binary article image for social crawlers (WhatsApp, Facebook, Twitter, Telegram)
  app.get(["/api/article-image/:slug", "/api/article-image/:slug.jpg", "/api/article-image/*"], async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    try {
      let rawSlug = req.params.slug || req.params[0] || req.path.replace(/^\/api\/article-image\//, "") || "";
      let slug = rawSlug.replace(/\.jpg$/i, "").replace(/\.png$/i, "").replace(/\.webp$/i, "");
      if (slug.startsWith("article-image/")) {
        slug = slug.replace(/^article-image\//, "");
      }
      try {
        slug = decodeURIComponent(slug);
      } catch {}

      const cleanCacheKey = slug.toLowerCase().trim();

      // 1. Check in-memory buffer cache for ultra-fast instant 200 OK delivery
      const cached = serverImageBufferCache.get(cleanCacheKey);
      if (cached && (Date.now() - cached.timestamp < SERVER_IMAGE_CACHE_TTL)) {
        res.setHeader("Content-Type", cached.contentType);
        res.setHeader("Content-Length", cached.buffer.length);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
        return res.status(200).send(cached.buffer);
      }

      const article = await getArticleBySlug(slug);

      if (article) {
        const rawImage = article.imageUrl || article.ogImage || article.featuredImage || article.image || article.photoUrl;

        // Case A: Base64 Data URI
        if (rawImage && typeof rawImage === "string" && rawImage.toLowerCase().startsWith("data:")) {
          const match = rawImage.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
          if (match) {
            const rawBuffer = Buffer.from(match[2], "base64");
            const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
            const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
            serverImageBufferCache.set(cleanCacheKey, entry);

            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader("Content-Length", optimizedBuffer.length);
            res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
            return res.status(200).send(optimizedBuffer);
          }
        }

        // Case B: Remote HTTPS URL (Cloudinary, Unsplash, Firebase Storage, etc.)
        if (rawImage && typeof rawImage === "string" && rawImage.trim() && !rawImage.toLowerCase().startsWith("data:")) {
          let url = rawImage.trim();
          if (url.startsWith("//")) url = `https:${url}`;
          if (url.startsWith("http://")) url = `https://${url.slice(7)}`;
          if (url.startsWith("https://")) {
            try {
              const fetchRes = await fetch(url, { 
                headers: { "User-Agent": "DamohDailyNews-ImageProxy/1.0" },
                signal: AbortSignal.timeout(6000)
              });
              if (fetchRes.ok) {
                const arrayBuf = await fetchRes.arrayBuffer();
                const rawBuffer = Buffer.from(arrayBuf);
                const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
                const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
                serverImageBufferCache.set(cleanCacheKey, entry);

                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Content-Length", optimizedBuffer.length);
                res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
                return res.status(200).send(optimizedBuffer);
              }
            } catch (fetchErr) {
              console.warn("Error fetching remote article image on proxy:", fetchErr);
            }
          }
        }

        // Case C: YouTube Thumbnail
        if (article.youtubeUrl && typeof article.youtubeUrl === "string") {
          const ytMatch = article.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
          if (ytMatch && ytMatch[1]) {
            try {
              const ytUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
              const ytRes = await fetch(ytUrl, { signal: AbortSignal.timeout(5000) });
              if (ytRes.ok) {
                const arrayBuf = await ytRes.arrayBuffer();
                const rawBuffer = Buffer.from(arrayBuf);
                const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
                const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
                serverImageBufferCache.set(cleanCacheKey, entry);

                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Content-Length", optimizedBuffer.length);
                res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
                return res.status(200).send(optimizedBuffer);
              }
            } catch (ytErr) {
              console.warn("Error fetching YouTube thumbnail:", ytErr);
            }
          }
        }
      }

      // Default fallback: Always return HTTP 200 with the binary default share image (NEVER redirect!)
      const fallbackBuf = await getDefaultShareImageBuffer();
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", fallbackBuf.length);
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.status(200).send(fallbackBuf);
    } catch (err) {
      console.error("Error serving article image:", err);
      const fallbackBuf = await getDefaultShareImageBuffer();
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", fallbackBuf.length);
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).send(fallbackBuf);
    }
  });

  // PWA Service Worker & Manifest Endpoints
  app.get("/sw.js", (_req, res) => {
    const swPath = path.resolve(process.cwd(), "public", "sw.js");
    if (fs.existsSync(swPath)) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Service-Worker-Allowed", "/");
      res.sendFile(swPath);
    } else {
      res.status(404).send("// sw not found");
    }
  });

  app.get("/manifest.json", (_req, res) => {
    const manifestPath = path.resolve(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(manifestPath);
    } else {
      res.status(404).json({ error: "manifest not found" });
    }
  });

  app.get([
    "/favicon.ico",
    "/favicon-v2.ico",
    "/icon.svg", 
    "/icon-v2.svg",
    "/icon.png", 
    "/icon-1024.png",
    "/icon-1024-v2.png",
    "/icon-192.png", 
    "/icon-192-v2.png", 
    "/icon-512.png",
    "/icon-512-v2.png",
    "/icon-192-maskable.png",
    "/icon-192-maskable-v2.png",
    "/icon-512-maskable.png",
    "/icon-512-maskable-v2.png",
    "/apple-touch-icon.png",
    "/apple-touch-icon-v2.png",
    "/favicon.png",
    "/favicon-v2.png",
    "/favicon-48x48.png",
    "/favicon-48x48-v2.png",
    "/favicon-32x32.png",
    "/favicon-32x32-v2.png",
    "/favicon-16x16.png",
    "/favicon-16x16-v2.png"
  ], (req, res) => {
    const filename = req.path.replace(/^\//, '') || 'favicon-v2.ico';
    const iconPath = path.resolve(process.cwd(), "public", filename);
    if (fs.existsSync(iconPath)) {
      if (filename.endsWith('.svg')) {
        res.setHeader("Content-Type", "image/svg+xml");
      } else if (filename.endsWith('.ico')) {
        res.setHeader("Content-Type", "image/x-icon");
      } else if (filename.endsWith('.webp')) {
        res.setHeader("Content-Type", "image/webp");
      } else {
        res.setHeader("Content-Type", "image/png");
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(iconPath);
    } else {
      const fallbackPath = path.resolve(process.cwd(), "public", "favicon-v2.png");
      if (fs.existsSync(fallbackPath)) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(fallbackPath);
      } else {
        res.redirect(302, DEFAULT_SHARE_IMAGE);
      }
    }
  });

  // Google AdSense ads.txt authorization
  app.get("/ads.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).send("google.com, pub-2796957315598605, DIRECT, f08c47fec0942fa0\n");
  });

  // SEO Routes for Google Search Console, Google News, and Web Crawlers
  app.get("/robots.txt", (req, res) => {
    const baseUrl = getBaseUrl(req);
    const text = generateRobotsTxt(baseUrl);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(text);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateSitemapXml(baseUrl);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (err) {
      console.error("Error generating sitemap.xml:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  app.get(["/rss.xml", "/feed.xml", "/rss"], async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateRssFeedXml(baseUrl);
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (err) {
      console.error("Error generating RSS feed:", err);
      res.status(500).send("Error generating RSS feed");
    }
  });

  // Intercept /article/:slug for dynamic Open Graph & SEO meta tags and 301 redirects
  app.get(["/article/:slug", "/article/:slug/*"], async (req, res) => {
    try {
      const slug = req.params.slug;
      const baseUrl = getBaseUrl(req);

      const rawClean = slug.trim().split('?')[0].split('#')[0].replace(/\.jpg$/i, "");
      let decodedSlug = rawClean;
      try {
        decodedSlug = decodeURIComponent(rawClean);
      } catch {}

      // 1. Permanent 301 redirect for known broken or legacy slugs
      if (LEGACY_SLUG_REDIRECTS[rawClean] || LEGACY_SLUG_REDIRECTS[decodedSlug]) {
        const targetClean = LEGACY_SLUG_REDIRECTS[rawClean] || LEGACY_SLUG_REDIRECTS[decodedSlug];
        return res.redirect(301, `/article/${encodeURIComponent(targetClean)}`);
      }

      // 2. Fetch the article
      const article = await getArticleBySlug(slug);

      // 3. Permanent 301 redirect ONLY if user requested an invalid duplicate-chain slug (e.g. -a123-a123) and article has a clean slug
      if (article && article.slug && article.slug !== rawClean && article.slug !== decodedSlug) {
        if (rawClean.match(/-a\d{6,}-a\d{6,}/i) || LEGACY_SLUG_REDIRECTS[rawClean] || LEGACY_SLUG_REDIRECTS[decodedSlug]) {
          return res.redirect(301, `/article/${encodeURIComponent(article.slug)}`);
        }
      }

      const fullUrl = `${baseUrl}/article/${slug}`;
      const htmlTemplate = getHtmlTemplate();
      const finalHtml = article
        ? injectArticleMetaTags(htmlTemplate, article, fullUrl, baseUrl, slug)
        : injectDefaultMetaTags(htmlTemplate, fullUrl, baseUrl);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).send(finalHtml);
    } catch (err) {
      console.error("Error serving article SSR meta tags:", err);
      const rawHtml = getHtmlTemplate();
      const baseUrl = getBaseUrl(req);
      const fallbackHtml = injectDefaultMetaTags(rawHtml, `${baseUrl}${req.path}`, baseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(fallbackHtml);
    }
  });

  return app;
}

const app = createExpressApp();

export default app;
