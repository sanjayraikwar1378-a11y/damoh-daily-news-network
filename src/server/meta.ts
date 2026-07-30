import { MOCK_ARTICLES as INITIAL_ARTICLES, CATEGORIES as INITIAL_CATEGORIES } from '../data/mock';

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
  }
  return result;
}

export async function getArticleBySlug(slugInput: string): Promise<Record<string, any> | null> {
  if (!slugInput) return null;
  const cleanSlug = slugInput.trim().split('?')[0].split('#')[0];

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";

  try {
    // 1. Try querying Firestore REST API by exact slug
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
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
              value: { stringValue: cleanSlug }
            }
          },
          limit: 1
        }
      })
    });

    if (response.ok) {
      const results = await response.json();
      if (Array.isArray(results) && results[0]?.document?.fields) {
        return parseFirestoreFields(results[0].document.fields);
      }
    }

    // 2. Fallback: Check if cleanSlug contains document ID pattern (e.g. 'a1728392819')
    const docIdMatch = cleanSlug.match(/a\d+/);
    const docId = docIdMatch ? docIdMatch[0] : cleanSlug;

    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles/${docId}`;
    const docRes = await fetch(docUrl);
    if (docRes.ok) {
      const docData = await docRes.json();
      if (docData?.fields) {
        return parseFirestoreFields(docData.fields);
      }
    }
  } catch (err) {
    console.error("Error fetching article from Firestore REST API:", err);
  }

  // If article not found in Firestore, return null
  return null;
}

export async function getAllArticlesForFeed(): Promise<Array<Record<string, any>>> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";
  const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles?pageSize=100`;

  try {
    const res = await fetch(listUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.documents) && data.documents.length > 0) {
        return data.documents.map((doc: any) => parseFirestoreFields(doc.fields));
      }
    }
  } catch (err) {
    console.error("Error fetching all articles from Firestore REST API:", err);
  }

  return [];
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

export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemaps and Feeds for Google Search Console & Google News
Sitemap: ${baseUrl}/sitemap.xml
`;
}

export async function generateSitemapXml(baseUrl: string): Promise<string> {
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

  // Add Categories
  for (const cat of categories) {
    urlsXml += `
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  // Add Articles with Google News Tags
  for (const art of articles) {
    if (!art.slug && !art.id) continue;
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt || nowIso;
    const title = escapeHtml(art.title || "Damoh News");
    const articleUrl = `${baseUrl}/article/${articleSlug}`;

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
  </url>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}

export async function generateRssFeedXml(baseUrl: string): Promise<string> {
  const articles = await getAllArticlesForFeed();
  const nowRssDate = new Date().toUTCString();

  let itemsXml = "";
  for (const art of articles) {
    if (!art.slug && !art.id) continue;
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt ? new Date(art.publishedAt).toUTCString() : nowRssDate;
    const title = escapeHtml(art.title || "Damoh News");
    const desc = escapeHtml(stripTags(art.excerpt || art.content || title));
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const author = escapeHtml(art.authorName || "Damoh Daily News");
    const image = art.imageUrl ? escapeHtml(art.imageUrl) : "";

    itemsXml += `
    <item>
      <title>${title}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <dc:creator>${author}</dc:creator>
      ${image ? `<enclosure url="${image}" type="image/jpeg" />` : ""}
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

export function injectArticleMetaTags(html: string, article: Record<string, any>, fullUrl: string): string {
  const rawTitle = article.title ? String(article.title).trim() : "Damoh Daily News";
  const title = escapeHtml(`${rawTitle} - Damoh Daily News`);
  const cleanTitle = escapeHtml(rawTitle);

  const rawExcerpt = article.excerpt || article.content || "दमोह और मध्य प्रदेश की ताज़ा और प्रामाणिक ख़बरें";
  const description = escapeHtml(stripTags(rawExcerpt).slice(0, 200));

  const image = article.imageUrl && String(article.imageUrl).trim().length > 0
    ? escapeHtml(String(article.imageUrl).trim())
    : "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop";

  const author = article.authorName ? escapeHtml(String(article.authorName)) : "Damoh Daily News";
  const publishedTime = article.publishedAt || new Date().toISOString();
  const canonicalUrl = escapeHtml(fullUrl);
  const baseUrl = fullUrl.split('/article/')[0] || "https://damoh-daily-news.com";

  const jsonLdNewsArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    },
    "headline": rawTitle,
    "description": stripTags(rawExcerpt).slice(0, 200),
    "image": [image],
    "datePublished": publishedTime,
    "dateModified": article.updatedAt || publishedTime,
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
        "url": `${baseUrl}/icon.png`
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
    <!-- Dynamic Article Meta Tags for WhatsApp, Facebook, Telegram & X -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook / WhatsApp / Telegram -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Damoh Daily News">
    <meta property="og:title" content="${cleanTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="hi_IN">
    <meta property="article:published_time" content="${publishedTime}">
    <meta property="article:author" content="${author}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DamohDailyNews">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">

    <!-- Google Search Console & News Schema.org JSON-LD -->
    <script type="application/ld+json">${JSON.stringify(jsonLdNewsArticle)}</script>
    <script type="application/ld+json">${JSON.stringify(jsonLdBreadcrumbs)}</script>
  `;

  let cleanHtml = html
    .replace(/<title>.*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'].*?>/gi, '')
    .replace(/<meta\s+property=["']og:.*?["'].*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:.*?["'].*?>/gi, '');

  return cleanHtml.replace('</head>', `${metaTagsHtml}\n</head>`);
}

export function injectDefaultMetaTags(html: string, fullUrl: string): string {
  const title = "Damoh Daily News - दमोह और मध्य प्रदेश की ताज़ा ख़बरें";
  const description = "दमोह और मध्य प्रदेश की विश्वसनीय, सटीक और ताज़ा खबरें। राजनीति, अपराध, समाज, मौसम और स्थानीय समाचार।";
  const image = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop";
  const canonicalUrl = escapeHtml(fullUrl);
  const baseUrl = fullUrl.split('?')[0].split('#')[0];

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Damoh Daily News",
    "url": baseUrl,
    "logo": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&h=300&fit=crop",
    "sameAs": [
      "https://facebook.com",
      "https://twitter.com",
      "https://instagram.com"
    ]
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
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="hi_IN">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DamohDailyNews">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">

    <!-- Google Search Console Organization Schema -->
    <script type="application/ld+json">${JSON.stringify(jsonLdOrganization)}</script>
  `;

  let cleanHtml = html
    .replace(/<title>.*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'].*?>/gi, '')
    .replace(/<meta\s+property=["']og:.*?["'].*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:.*?["'].*?>/gi, '');

  return cleanHtml.replace('</head>', `${metaTagsHtml}\n</head>`);
}
