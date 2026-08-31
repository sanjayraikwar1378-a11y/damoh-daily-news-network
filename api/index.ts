import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// ============================================================================
// CONSTANTS & CATEGORIES
// ============================================================================

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

const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "damoh-nashe-se-doori-hai-zaruri-2-awareness-program-radhika-palace-a1785337946908-a1785337946908": "damoh-nashe-se-doori-hai-zaruri-2-awareness-program-radhika-palace-a1785337946908",
  "damoh-200-year-old-peepal-tree-fell-near-rani-durgavati-school-a1785339206714-a1785339206714": "damoh-200-year-old-peepal-tree-fell-near-rani-durgavati-school-a1785339206714",
  "rajya-sabha-public-examinations-amendment-bill-2026-ram-temple-donation-issue-a1785407567753-a1785407567753-a1785407567753": "rajya-sabha-public-examinations-amendment-bill-2026-ram-temple-donation-issue-a1785407567753"
};

// ============================================================================
// LAZY SHARP INITIALIZER (Prevents Top-Level Module Crash on Serverless)
// ============================================================================

let sharpModule: any = null;
let sharpAttempted = false;

async function getSharp(): Promise<any> {
  if (sharpAttempted) return sharpModule;
  sharpAttempted = true;
  try {
    const loaded = await import("sharp");
    sharpModule = loaded.default || loaded;
  } catch (err) {
    console.warn("[Server Image] sharp native addon not available in this environment. Falling back to passthrough.", err);
    sharpModule = null;
  }
  return sharpModule;
}

// ============================================================================
// FIRESTORE PARSING & HELPERS
// ============================================================================

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
    } else if ('mapValue' in val) {
      result[key] = parseFirestoreFields(val.mapValue.fields || {});
    }
  }

  return result;
}

function stripServerGeneratedSuffixes(slug: string): string {
  if (!slug) return '';
  return slug
    .replace(/-a\d{6,}(?:-a\d{6,})*$/i, '')
    .replace(/-l\d{6,}(?:-l\d{6,})*$/i, '')
    .trim();
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

  const hostHeader = (req.headers["x-forwarded-host"] as string) || req.headers.host || (process.env.VERCEL_URL ? `${process.env.VERCEL_URL}` : "www.damohdailynewsnetwork.in");
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

// In-memory caches for fast responses
const serverArticleCache = new Map<string, { data: Record<string, any>; timestamp: number }>();
const SERVER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

let feedArticlesCache: { data: Array<Record<string, any>>; timestamp: number } | null = null;
const FEED_CACHE_TTL = 3 * 60 * 1000; // 3 minutes TTL

async function getAllArticlesForFeed(): Promise<Array<Record<string, any>>> {
  const now = Date.now();
  if (feedArticlesCache && (now - feedArticlesCache.timestamp < FEED_CACHE_TTL)) {
    return feedArticlesCache.data;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";

  try {
    const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles?pageSize=100`;
    const response = await fetch(listUrl, { signal: AbortSignal.timeout(6000) });

    if (response.ok) {
      const data = await response.json();
      const docs = data.documents || [];
      const articles: Array<Record<string, any>> = [];

      for (const doc of docs) {
        if (!doc || !doc.fields) continue;
        const parsed = parseFirestoreFields(doc.fields);
        const nameParts = (doc.name || "").split("/");
        const docId = nameParts[nameParts.length - 1];
        if (!parsed.id && docId) parsed.id = docId;

        if (parsed.title || parsed.slug) {
          articles.push(parsed);
        }
      }

      if (articles.length > 0) {
        articles.sort((a, b) => {
          const tA = new Date(a.publishedAt || a.createdAt || 0).getTime();
          const tB = new Date(b.publishedAt || b.createdAt || 0).getTime();
          return tB - tA;
        });

        feedArticlesCache = { data: articles, timestamp: now };
        return articles;
      }
    }
  } catch (err) {
    console.warn("Could not fetch articles collection from Firestore for feed:", err);
  }

  return MOCK_ARTICLES_FALLBACK;
}

async function getArticleBySlug(slug: string): Promise<Record<string, any> | null> {
  if (!slug) return null;

  const rawClean = slug.trim().split('?')[0].split('#')[0].replace(/\.jpg$/i, "");
  let decodedSlug = rawClean;
  try {
    decodedSlug = decodeURIComponent(rawClean);
  } catch {}

  const cleanSlug = rawClean;
  const strippedSlug = stripServerGeneratedSuffixes(cleanSlug);

  const cacheKey = cleanSlug.toLowerCase();
  const cached = serverArticleCache.get(cacheKey) || serverArticleCache.get(decodedSlug.toLowerCase()) || serverArticleCache.get(strippedSlug.toLowerCase());
  if (cached && (Date.now() - cached.timestamp < SERVER_CACHE_TTL)) {
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
        }),
        signal: AbortSignal.timeout(5000)
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
      const docRes = await fetch(docUrl, { signal: AbortSignal.timeout(5000) });
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

    // Attempt 3: Match from loaded/cached feed articles
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
    console.warn("Error querying Firestore for article:", err);
  }

  const mockMatch = MOCK_ARTICLES_FALLBACK.find(
    a => (a.slug && a.slug === cleanSlug) || 
         (a.id && a.id === cleanSlug) || 
         (a.slug && a.slug === decodedSlug) ||
         (a.slug && a.slug === strippedSlug)
  );
  if (mockMatch) return mockMatch;

  return null;
}

// ============================================================================
// IMAGE PROCESSING & SOCIAL PREVIEW
// ============================================================================

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
      const sharp = await getSharp();
      if (sharp) {
        defaultShareImageBuffer = await sharp(rawLogo)
          .rotate()
          .resize(1200, 630, {
            fit: 'contain',
            background: { r: 24, g: 24, b: 27, alpha: 1 }
          })
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();

        return defaultShareImageBuffer;
      } else {
        defaultShareImageBuffer = rawLogo;
        return defaultShareImageBuffer;
      }
    } catch (e) {
      if (fs.existsSync(logoPath)) {
        defaultShareImageBuffer = fs.readFileSync(logoPath);
        return defaultShareImageBuffer;
      }
    }
  }

  return Buffer.from("");
}

async function createResizedImageBuffer(inputBuffer: Buffer, _targetMime: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<Buffer> {
  try {
    if (!inputBuffer || inputBuffer.length === 0) {
      return await getDefaultShareImageBuffer();
    }

    const sharp = await getSharp();
    if (!sharp) {
      return inputBuffer;
    }

    // Preserve the complete original image in its natural aspect ratio
    // Auto-rotate for EXIF orientation, constrain max dimension to 1200px without enlargement,
    // and encode as a high-quality clean progressive JPEG.
    // Strictly NO blurred background, NO duplicate image, NO artificial cropping.
    return await sharp(inputBuffer)
      .rotate()
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 88,
        mozjpeg: true,
        progressive: true
      })
      .toBuffer();
  } catch (err) {
    console.warn("sharp image processing warning, returning raw buffer:", err);
    return inputBuffer;
  }
}

function getArticleImageUrl(article: Record<string, any> | null, slug: string, baseUrl: string): string {
  if (!article) {
    return `${baseUrl}/social-preview.jpg`;
  }

  const rawSlug = article.slug || slug || article.id || "article";
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {}

  const safeSlug = encodeURIComponent(decodedSlug);
  return `${baseUrl}/api/article-image/${safeSlug}.jpg`;
}

function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Allow: /api/article-image/
Allow: /article-image/
Allow: /social-preview.jpg
Disallow: /admin/
Disallow: /api/

User-agent: facebookexternalhit
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: TelegramBot
Allow: /

User-agent: Googlebot-Image
Allow: /

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
  </body>
</html>`;
}

function injectArticleMetaTags(
  html: string,
  article: Record<string, any>,
  fullUrl: string,
  baseUrl: string,
  requestedSlug: string
): string {
  const rawTitle = article.title || "Damoh Daily News";
  const cleanTitle = escapeHtml(rawTitle);
  const rawDesc = stripTags(article.excerpt || article.content || "दमोह जिले और मध्य प्रदेश की ताज़ा और प्रमाणित खबरें।");
  const description = escapeHtml(rawDesc.slice(0, 200));

  const safeSlug = article.slug || requestedSlug || article.id || "article";
  const canonicalUrl = `${baseUrl}/article/${safeSlug}`;
  const imageUrl = getArticleImageUrl(article, safeSlug, baseUrl);

  const publishedTime = article.publishedAt || article.createdAt || new Date().toISOString();
  const modifiedTime = article.updatedAt || publishedTime;
  const author = escapeHtml(article.authorName || "Damoh Daily News");
  const rawContentFormatted = formatArticleBodyForSSR(article.content || '', article.excerpt || '');

  const jsonLdNewsArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": rawTitle,
    "description": rawDesc.slice(0, 200),
    "image": [
      imageUrl,
      ...(article.imageUrl ? [article.imageUrl] : [])
    ],
    "datePublished": publishedTime,
    "dateModified": modifiedTime,
    "author": {
      "@type": "Person",
      "name": article.authorName || "Damoh Daily News",
      "jobTitle": "News Reporter"
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
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
        "name": "होम",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": article.category || "समाचार",
        "item": `${baseUrl}/category/${encodeURIComponent(article.categorySlug || 'news')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": rawTitle,
        "item": canonicalUrl
      }
    ]
  };

  const metaTagsHtml = `
    <!-- Essential Meta Tags -->
    <title>${cleanTitle} | Damoh Daily News</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook / WhatsApp / Telegram / LinkedIn -->
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

  if (cleanHtml.includes('<head>')) {
    return cleanHtml.replace('<head>', `<head>\n${metaTagsHtml}`);
  }
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
    <!-- Default Site Meta Tags (High Priority for Crawlers) -->
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

  if (cleanHtml.includes('<head>')) {
    return cleanHtml.replace('<head>', `<head>\n${metaTagsHtml}`);
  }
  return cleanHtml.replace('</head>', `${metaTagsHtml}\n</head>`);
}

// ============================================================================
// LIVE UPDATES CLEANUP HELPERS (Self-Contained & Crash-Proof)
// ============================================================================

function extractCloudinaryPublicId(urlOrId?: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://') && !urlOrId.startsWith('data:')) {
    if (urlOrId.includes('/')) return urlOrId;
    return null;
  }
  if (!urlOrId.includes('res.cloudinary.com')) return null;

  try {
    const cleanUrl = urlOrId.split('?')[0].split('#')[0];
    const uploadMatch = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (uploadMatch && uploadMatch[1]) {
      return uploadMatch[1];
    }
  } catch (e) {}
  return null;
}

async function destroyCloudinaryImage(publicId: string): Promise<boolean> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) return false;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const body = new URLSearchParams({
      public_id: publicId,
      timestamp,
      api_key: apiKey,
      signature
    });

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000)
    });

    return res.ok;
  } catch (err) {
    console.warn(`[LiveUpdates Cleanup] Error destroying Cloudinary image ${publicId}:`, err);
    return false;
  }
}

async function performLiveUpdatesCleanup(): Promise<any> {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const cutoffTime = Date.now() - SEVEN_DAYS_MS;
  const cutoffIso = new Date(cutoffTime).toISOString();

  let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";
  let apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "";

  try {
    const queryUrl = apiKey 
      ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`
      : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const res = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "live_updates" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "timestamp" },
              op: "LESS_THAN",
              value: { timestampValue: cutoffIso }
            }
          },
          limit: 100
        }
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      return { success: false, deletedCount: 0 };
    }

    const results = await res.json();
    let deletedCount = 0;
    for (const item of results) {
      if (item.document && item.document.name) {
        const docName = item.document.name;
        const delUrl = apiKey ? `https://firestore.googleapis.com/v1/${docName}?key=${apiKey}` : `https://firestore.googleapis.com/v1/${docName}`;
        await fetch(delUrl, { method: "DELETE" }).catch(() => {});
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  } catch (err) {
    console.warn("[LiveUpdates Cleanup] Error in automated retention cleanup:", err);
    return { success: false, deletedCount: 0, error: String(err) };
  }
}

// ============================================================================
// FCM PUSH DISPATCH HELPERS (Self-Contained & Crash-Proof)
// ============================================================================

interface FCMPushPayload {
  id?: string;
  title: string;
  body: string;
  priority?: "normal" | "breaking" | "important" | "urgent";
  category?: "breaking" | "important" | "local" | "live_update";
  articleId?: string;
  articleSlug?: string;
  liveUpdateId?: string;
  targetUrl?: string;
  imageUrl?: string;
}

function parseServiceAccount(raw: string | undefined): any | null {
  if (!raw) return null;
  try {
    let clean = raw.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1);
    }
    if (clean.startsWith("{")) {
      const parsed = JSON.parse(clean);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    }
    // Try base64
    const decoded = Buffer.from(clean, "base64").toString("utf-8");
    if (decoded.trim().startsWith("{")) {
      const parsed = JSON.parse(decoded);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    }
  } catch (e) {
    console.warn("[FCM Server] Service account parsing failed safely:", e);
  }
  return null;
}

let cachedOAuthToken: { token: string; expiresAt: number } | null = null;

async function getFCMAccessToken(serviceAccountJson: any): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedOAuthToken && cachedOAuthToken.expiresAt > now + 60) {
    return cachedOAuthToken.token;
  }

  try {
    const clientEmail = serviceAccountJson.client_email;
    const privateKey = serviceAccountJson.private_key;

    if (!clientEmail || !privateKey) {
      return null;
    }

    const header = { alg: "RS256", typ: "JWT" };
    const claim = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedClaim = Buffer.from(JSON.stringify(claim)).toString("base64url");
    const unsignedToken = `${encodedHeader}.${encodedClaim}`;

    const signer = crypto.createSign("RSA-SHA256");
    signer.update(unsignedToken);
    const signature = signer.sign(privateKey, "base64url");
    const signedJwt = `${unsignedToken}.${signature}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedJwt
      }).toString(),
      signal: AbortSignal.timeout(6000)
    });

    if (!tokenRes.ok) {
      return null;
    }

    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      cachedOAuthToken = {
        token: tokenData.access_token,
        expiresAt: now + (tokenData.expires_in || 3600)
      };
      return tokenData.access_token;
    }
  } catch (err) {
    console.warn("[FCM Server] Error generating OAuth2 access token:", err);
  }

  return null;
}

async function fetchRegisteredFCMTokens(projectId: string, apiKey: string): Promise<any[]> {
  const tokens: any[] = [];
  try {
    const queryUrl = apiKey 
      ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fcm_tokens?pageSize=300&key=${apiKey}`
      : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fcm_tokens?pageSize=300`;

    const res = await fetch(queryUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return tokens;

    const data = await res.json();
    const docs = data.documents || [];

    for (const doc of docs) {
      const docName = doc.name || "";
      const docId = docName.split("/fcm_tokens/")[1] || "";
      const fields = doc.fields || {};

      const token = fields.token?.stringValue || "";
      const active = fields.active ? fields.active.booleanValue !== false : true;
      const platform = fields.platform?.stringValue || "web";

      if (token && token.length > 20 && active) {
        tokens.push({ docName, docId, token, platform, active });
      }
    }
  } catch (err) {
    console.warn("[FCM Server] Error retrieving registered tokens from Firestore:", err);
  }
  return tokens;
}

async function dispatchFCMPushNotification(payload: FCMPushPayload): Promise<any> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "";

  const tokenRecords = await fetchRegisteredFCMTokens(projectId, apiKey);
  const uniqueTokensMap = new Map<string, any>();
  for (const rec of tokenRecords) {
    if (!uniqueTokensMap.has(rec.token)) {
      uniqueTokensMap.set(rec.token, rec);
    }
  }
  const uniqueRecords = Array.from(uniqueTokensMap.values());

  if (uniqueRecords.length === 0) {
    return {
      success: true,
      totalTokens: 0,
      sentCount: 0,
      failedCount: 0,
      invalidTokensRemoved: 0,
      method: "no_tokens",
      message: "No registered device tokens found to receive push notifications."
    };
  }

  const formattedTitle = payload.priority === "urgent"
    ? `🚨 ${payload.title}`
    : payload.priority === "breaking"
    ? `🔴 ब्रेकिंग: ${payload.title}`
    : payload.title;

  const targetUrl = payload.targetUrl || (payload.articleSlug ? `/article/${payload.articleSlug}` : "/");
  const notificationTag = `ddn-${payload.id || Date.now()}`;

  let serviceAccountJson: any = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (serviceAccountJson) {
    const accessToken = await getFCMAccessToken(serviceAccountJson);
    if (accessToken) {
      const fcmV1Endpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccountJson.project_id || projectId}/messages:send`;
      let sentCount = 0;
      let failedCount = 0;
      let invalidTokensRemoved = 0;

      await Promise.all(uniqueRecords.map(async (record) => {
        try {
          const messagePayload: any = {
            message: {
              token: record.token,
              notification: {
                title: formattedTitle,
                body: payload.body,
                ...(payload.imageUrl ? { image: payload.imageUrl } : {})
              },
              data: {
                id: String(payload.id || notificationTag),
                title: String(formattedTitle),
                body: String(payload.body),
                url: String(targetUrl),
                targetUrl: String(targetUrl),
                tag: String(notificationTag),
                priority: String(payload.priority || "normal"),
                category: String(payload.category || "breaking"),
                articleId: String(payload.articleId || ""),
                articleSlug: String(payload.articleSlug || ""),
                liveUpdateId: String(payload.liveUpdateId || ""),
                imageUrl: String(payload.imageUrl || ""),
                icon: "/icon-192-v2.png",
                badge: "/favicon-32x32-v2.png",
                timestamp: String(Date.now())
              },
              webpush: {
                headers: {
                  Urgency: payload.priority === "urgent" || payload.priority === "breaking" ? "high" : "normal",
                  TTL: "86400"
                },
                fcm_options: {
                  link: targetUrl
                },
                notification: {
                  icon: "/icon-192-v2.png",
                  badge: "/favicon-32x32-v2.png",
                  tag: notificationTag,
                  renotify: true,
                  requireInteraction: payload.priority === "urgent" || payload.priority === "breaking",
                  ...(payload.imageUrl ? { image: payload.imageUrl } : {})
                }
              }
            }
          };

          const sendRes = await fetch(fcmV1Endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(messagePayload),
            signal: AbortSignal.timeout(8000)
          });

          if (sendRes.ok) {
            sentCount++;
          } else {
            failedCount++;
            const errData = await sendRes.json().catch(() => null);
            const errCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;
            if (errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
              const delUrl = apiKey ? `https://firestore.googleapis.com/v1/${record.docName}?key=${apiKey}` : `https://firestore.googleapis.com/v1/${record.docName}`;
              await fetch(delUrl, { method: "DELETE" }).catch(() => {});
              invalidTokensRemoved++;
            }
          }
        } catch (dispatchErr) {
          failedCount++;
        }
      }));

      return {
        success: sentCount > 0,
        totalTokens: uniqueRecords.length,
        sentCount,
        failedCount,
        invalidTokensRemoved,
        method: "fcm_v1",
        message: `Dispatched to ${sentCount}/${uniqueRecords.length} device(s) via FCM HTTP v1.`
      };
    }
  }

  return {
    success: false,
    totalTokens: uniqueRecords.length,
    sentCount: 0,
    failedCount: uniqueRecords.length,
    invalidTokensRemoved: 0,
    method: "unconfigured",
    message: "FCM credentials not configured on server."
  };
}

// ============================================================================
// EXPRESS APP FACTORY
// ============================================================================

export function createExpressApp() {
  const app = express();

  // Basic Security & Compatibility Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    next();
  });

  // Simple in-memory rate limiter for API endpoints (exempting social crawler image requests)
  const ipRequests = new Map<string, { count: number; resetTime: number }>();
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/article-image")) {
      return next();
    }

    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const limit = 300;

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
      console.warn("Cloudinary sign error:", err);
      res.status(500).json({ signed: false, error: err?.message || "Failed to generate Cloudinary signature" });
    }
  });

  // Automated 7-Day Live Updates Cleanup Endpoint
  app.all("/api/live-updates/cleanup", async (_req, res) => {
    try {
      const result = await performLiveUpdatesCleanup();
      return res.status(200).json(result);
    } catch (err: any) {
      console.warn("[LiveUpdates Cleanup] Manual execution error:", err);
      return res.status(200).json({ success: false, error: err?.message || "Failed to execute cleanup" });
    }
  });

  // Associated Live Update Image Deletion Endpoint
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
      return res.status(200).json({ success: false, error: err?.message });
    }
  });

  // Server-Side Firebase Cloud Messaging (FCM) Push Broadcast Endpoint
  app.post("/api/send-push", async (req, res) => {
    try {
      const { 
        id, 
        title, 
        body, 
        priority, 
        category, 
        articleId, 
        articleSlug, 
        liveUpdateId, 
        targetUrl, 
        imageUrl 
      } = req.body || {};

      if (!title || !body) {
        return res.status(400).json({ 
          success: false, 
          error: "Push notification requires 'title' and 'body' fields." 
        });
      }

      const result = await dispatchFCMPushNotification({
        id,
        title,
        body,
        priority,
        category,
        articleId,
        articleSlug,
        liveUpdateId,
        targetUrl,
        imageUrl
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.warn("[FCM Server] Send push error:", err);
      return res.status(200).json({ 
        success: false, 
        error: err?.message || "Failed to dispatch push notification" 
      });
    }
  });

  // Diagnostic Endpoint for FCM Token Registration & Server Status
  app.get("/api/fcm/status", async (_req, res) => {
    try {
      let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";
      let apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "";
      const tokens = await fetchRegisteredFCMTokens(projectId, apiKey);
      
      const hasServiceAccount = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);

      return res.status(200).json({
        status: "ok",
        projectId,
        registeredTokensCount: tokens.length,
        devicesBreakdown: {
          android: tokens.filter(t => t.platform === "android").length,
          ios: tokens.filter(t => t.platform === "ios").length,
          web: tokens.filter(t => t.platform === "web").length
        },
        hasServiceAccount,
        supportedMethods: [
          hasServiceAccount ? "FCM HTTP v1 (OAuth2)" : null
        ].filter(Boolean)
      });
    } catch (err: any) {
      return res.status(200).json({ status: "error", error: err?.message });
    }
  });

  // Live Damoh Weather Proxy API
  let weatherCache: { data: any; timestamp: number } | null = null;
  const WEATHER_CACHE_TTL = 10 * 60 * 1000;

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
    } catch (err) {
      console.warn("Error fetching live Damoh weather:", err);
      if (weatherCache) {
        return res.json(weatherCache.data);
      }
      return res.json({
        current: {
          temperature_2m: 28,
          relative_humidity_2m: 65,
          apparent_temperature: 29,
          is_day: 1,
          weather_code: 1,
          wind_speed_10m: 10,
          visibility: 10000
        },
        daily: {
          temperature_2m_max: [32],
          temperature_2m_min: [22],
          sunrise: ["2026-08-31T05:55"],
          sunset: ["2026-08-31T18:35"]
        }
      });
    }
  });

  // Real-Time 1200x630 JPEG Social Share Image Generation Endpoint
  app.get(["/api/article-image/:slug.jpg", "/api/article-image/:slug", "/article-image/:slug.jpg", "/article-image/:slug"], async (req, res) => {
    try {
      const rawParam = req.params.slug || "article";
      const cleanSlug = rawParam.split('?')[0].split('#')[0].replace(/\.jpg$/i, "");
      const cleanCacheKey = cleanSlug.toLowerCase();

      // Check In-Memory Buffer Cache
      const cached = serverImageBufferCache.get(cleanCacheKey);
      if (cached && (Date.now() - cached.timestamp < SERVER_IMAGE_CACHE_TTL)) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Length", cached.buffer.length);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
        return res.status(200).send(cached.buffer);
      }

      const article = await getArticleBySlug(cleanSlug);
      if (article) {
        const rawImage = article.imageUrl || article.image;

        // Case A: Cloudinary URL
        if (rawImage && typeof rawImage === "string" && rawImage.includes("res.cloudinary.com")) {
          const cleanUrl = rawImage.split('?')[0].split('#')[0];
          let directTransformUrl = cleanUrl.replace(
            /\/image\/upload\/(?:v\d+\/)?/,
            '/image/upload/c_limit,w_1200,h_1200,f_jpg,q_auto:good/'
          );
          if (!directTransformUrl.toLowerCase().endsWith('.jpg') && !directTransformUrl.toLowerCase().endsWith('.jpeg')) {
            directTransformUrl = directTransformUrl.replace(/\.[a-zA-Z0-9]+$/, '') + '.jpg';
          }

          try {
            const fetchRes = await fetch(directTransformUrl, { signal: AbortSignal.timeout(7000) });
            if (fetchRes.ok) {
              const arrayBuf = await fetchRes.arrayBuffer();
              const rawBuffer = Buffer.from(arrayBuf);
              if (rawBuffer && rawBuffer.length > 0) {
                const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
                const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
                serverImageBufferCache.set(cleanCacheKey, entry);

                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Content-Length", optimizedBuffer.length);
                res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
                return res.status(200).send(optimizedBuffer);
              }
            }
          } catch (cloudErr) {
            console.warn("Direct Cloudinary transformation failed, falling back to raw image download:", cloudErr);
          }
        }

        // Case B: Base64 Data URL
        if (rawImage && typeof rawImage === "string" && rawImage.startsWith("data:image/")) {
          try {
            const base64Data = rawImage.split(",")[1];
            if (base64Data) {
              const rawBuffer = Buffer.from(base64Data, "base64");
              const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
              const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
              serverImageBufferCache.set(cleanCacheKey, entry);

              res.setHeader("Content-Type", "image/jpeg");
              res.setHeader("Content-Length", optimizedBuffer.length);
              res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
              return res.status(200).send(optimizedBuffer);
            }
          } catch (b64Err) {
            console.warn("Base64 image buffer generation failed:", b64Err);
          }
        }

        // Case C: Remote HTTPS URL
        if (rawImage && typeof rawImage === "string" && rawImage.trim() && !rawImage.toLowerCase().startsWith("data:")) {
          let url = rawImage.trim();
          if (url.startsWith("//")) url = `https:${url}`;
          if (url.startsWith("http://")) url = `https://${url.slice(7)}`;
          if (url.startsWith("https://")) {
            try {
              const fetchRes = await fetch(url, { 
                headers: { 
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
                },
                signal: AbortSignal.timeout(8000)
              });
              if (fetchRes.ok) {
                const arrayBuf = await fetchRes.arrayBuffer();
                const rawBuffer = Buffer.from(arrayBuf);
                if (rawBuffer && rawBuffer.length > 0) {
                  const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
                  const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
                  serverImageBufferCache.set(cleanCacheKey, entry);

                  res.setHeader("Content-Type", "image/jpeg");
                  res.setHeader("Content-Length", optimizedBuffer.length);
                  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
                  return res.status(200).send(optimizedBuffer);
                }
              }
            } catch (fetchErr) {
              console.warn("Error fetching remote article image on proxy:", fetchErr);
            }
          }
        }

        // Case D: YouTube Thumbnail
        const videoSource = article.youtubeUrl || article.videoUrl;
        if (videoSource && typeof videoSource === "string") {
          const ytMatch = videoSource.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/);
          if (ytMatch && ytMatch[1]) {
            const ytThumbUrls = [
              `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
              `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
              `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg`
            ];
            for (const ytUrl of ytThumbUrls) {
              try {
                const ytRes = await fetch(ytUrl, { 
                  headers: { "User-Agent": "Mozilla/5.0" },
                  signal: AbortSignal.timeout(5000) 
                });
                if (ytRes.ok) {
                  const arrayBuf = await ytRes.arrayBuffer();
                  const rawBuffer = Buffer.from(arrayBuf);
                  if (rawBuffer && rawBuffer.length > 1000) {
                    const optimizedBuffer = await createResizedImageBuffer(rawBuffer, "image/jpeg");
                    const entry = { buffer: optimizedBuffer, contentType: "image/jpeg", timestamp: Date.now() };
                    serverImageBufferCache.set(cleanCacheKey, entry);

                    res.setHeader("Content-Type", "image/jpeg");
                    res.setHeader("Content-Length", optimizedBuffer.length);
                    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
                    return res.status(200).send(optimizedBuffer);
                  }
                }
              } catch (ytErr) {}
            }
          }
        }
      }

      // Default fallback: Always return HTTP 200 with the binary default share image
      const fallbackBuf = await getDefaultShareImageBuffer();
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", fallbackBuf.length);
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.status(200).send(fallbackBuf);
    } catch (err) {
      console.warn("Error serving article image:", err);
      const fallbackBuf = await getDefaultShareImageBuffer();
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", fallbackBuf.length);
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).send(fallbackBuf);
    }
  });

  // Direct Social Share Image Fallback
  app.get("/social-preview.jpg", async (_req, res) => {
    try {
      const buf = await getDefaultShareImageBuffer();
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", buf.length);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
      return res.status(200).send(buf);
    } catch (e) {
      return res.status(200).send(Buffer.from(""));
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const robots = generateRobotsTxt(baseUrl);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).send(robots);
    } catch (e) {
      return res.status(200).send("User-agent: *\nAllow: /\n");
    }
  });

  // Sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateSitemapXml(baseUrl);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating sitemap.xml:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc></url></urlset>`);
    }
  });

  // RSS Feed
  app.get(["/rss.xml", "/feed.xml", "/rss"], async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateRssFeedXml(baseUrl);
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating RSS feed:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Damoh Daily News</title><link>${baseUrl}</link></channel></rss>`);
    }
  });

  // Intercept /article/:slug for dynamic Open Graph & SEO meta tags and 301 redirects
  app.get(["/article/:slug", "/article/:slug/*"], async (req, res) => {
    try {
      const slug = req.params.slug || "";
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
      console.warn("Error serving article SSR meta tags:", err);
      const rawHtml = getHtmlTemplate();
      const baseUrl = getBaseUrl(req);
      const fallbackHtml = injectDefaultMetaTags(rawHtml, `${baseUrl}${req.path}`, baseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(fallbackHtml);
    }
  });

  return app;
}

export {
  getArticleBySlug,
  getAllArticlesForFeed,
  createResizedImageBuffer,
  injectArticleMetaTags,
  injectDefaultMetaTags,
  dispatchFCMPushNotification,
  performLiveUpdatesCleanup
};

const app = createExpressApp();

export default app;
