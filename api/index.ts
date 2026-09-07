import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { performLiveUpdatesCleanup as executeCanonicalLiveUpdatesCleanup } from "./liveUpdatesCleanup.js";
import { requireAdmin } from "./auth.js";

// ============================================================================
// INDEXNOW CONSTANTS & HELPERS (Self-Contained for Vercel Serverless Function)
// ============================================================================
const INDEXNOW_KEY = "2710f5ce0d40420ca1296b880592e549";
const INDEXNOW_HOST = "www.damohdailynewsnetwork.in";
const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

interface IndexNowSubmitResult {
  success: boolean;
  urls: string[];
  statusCode?: number;
  response?: string;
  endpoints?: { endpoint: string; status: number; message?: string }[];
  error?: string;
}

function normalizeIndexNowUrl(urlOrSlug: string, defaultHost = INDEXNOW_HOST): string {
  if (!urlOrSlug) return `https://${defaultHost}/`;
  const clean = urlOrSlug.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    if (clean.includes("localhost") || clean.includes("127.0.0.1") || clean.includes("run.app") || clean.includes("vercel.app")) {
      try {
        const parsed = new URL(clean);
        return `https://${defaultHost}${parsed.pathname}${parsed.search}`;
      } catch {
        return `https://${defaultHost}/`;
      }
    }
    return clean;
  }
  if (clean.startsWith("/")) {
    return `https://${defaultHost}${clean}`;
  }
  if (clean.startsWith("article/")) {
    return `https://${defaultHost}/${clean}`;
  }
  return `https://${defaultHost}/article/${clean}`;
}

async function submitToIndexNow(
  urls: string | string[],
  customHost?: string
): Promise<IndexNowSubmitResult> {
  let host = customHost || INDEXNOW_HOST;
  if (!host || host.includes("localhost") || host.includes("127.0.0.1") || host.includes("run.app") || host.includes("vercel.app")) {
    host = INDEXNOW_HOST;
  }

  const rawList = Array.isArray(urls) ? urls : [urls];
  const urlList = Array.from(
    new Set(
      rawList
        .filter(Boolean)
        .map(u => normalizeIndexNowUrl(u, host))
    )
  );

  if (urlList.length === 0) {
    return {
      success: true,
      urls: [],
      error: "No valid URLs provided for IndexNow submission"
    };
  }

  const payload: Record<string, any> = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow"
  ];

  const results: { endpoint: string; status: number; message?: string }[] = [];
  let atLeastOneSuccess = false;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const status = res.status;
      let text = "";
      try {
        text = await res.text();
      } catch {}

      if (status === 200 || status === 202) {
        atLeastOneSuccess = true;
      }

      results.push({
        endpoint,
        status,
        message: text || (status === 200 || status === 202 ? "Accepted" : `HTTP ${status}`)
      });
    } catch (err: any) {
      console.warn(`[IndexNow] Error submitting to ${endpoint}:`, err?.message || err);
      results.push({
        endpoint,
        status: 0,
        message: err?.message || "Network request failed"
      });
    }
  }

  return {
    success: atLeastOneSuccess,
    urls: urlList,
    endpoints: results
  };
}

// ============================================================================
// CONSTANTS & CATEGORIES (Single Source of Truth)
// ============================================================================

export interface CategoryItem {
  id: string;
  slug: string;
  hindiName: string;
  englishName: string;
  name: string;
  color: string;
  subCategories: string[];
  description: string;
  aliases: string[];
  priority?: number;
}

const CATEGORIES_CONFIG: CategoryItem[] = [
  // 1. Damoh
  {
    id: 'c1',
    slug: 'damoh',
    hindiName: 'दमोह',
    englishName: 'Damoh',
    name: 'दमोह (Damoh)',
    color: '#dc2626',
    subCategories: ['सिटी न्यूज', 'ग्रामीण', 'तहसील'],
    description: 'दमोह जिले की ताज़ा ख़बरें, स्थानीय समाचार, ग्रामीण और शहरी अंचलों के पल-पल के अपडेट्स।',
    aliases: ['damoh', 'दमोह', 'दमोह-damoh', 'damoh-news', 'damoh-city'],
    priority: 1
  },
  // 2. अपराध (Crime)
  {
    id: 'c7',
    slug: 'crime',
    hindiName: 'अपराध',
    englishName: 'Crime',
    name: 'अपराध (Crime)',
    color: '#b91c1c',
    subCategories: ['पुलिस', 'कोर्ट', 'हादसा'],
    description: 'क्राइम न्यूज़, पुलिस कार्रवाई, दुर्घटनाएं, कोर्ट-कचहरी और सुरक्षा से जुड़ी ख़बरें।',
    aliases: ['crime', 'अपराध', 'क्राइम', 'police', 'court'],
    priority: 2
  },
  // 3. मध्यप्रदेश (Madhya Pradesh)
  {
    id: 'c4',
    slug: 'madhya-pradesh',
    hindiName: 'मध्यप्रदेश',
    englishName: 'Madhya Pradesh',
    name: 'मध्यप्रदेश (Madhya Pradesh)',
    color: '#2563eb',
    subCategories: ['भोपाल', 'जबलपुर', 'इंदौर', 'सागर'],
    description: 'मध्य प्रदेश की राजनीति, विकास, प्रशासनिक और जनहित से जुड़ी बड़ी खबरें।',
    aliases: ['madhya-pradesh', 'mp', 'मध्य-प्रदेश', 'मध्य प्रदेश', 'मध्यप्रदेश', 'मध्यप्रदेश-madhya-pradesh', 'mp-news'],
    priority: 3
  },
  // 4. भारत (India)
  {
    id: 'c5',
    slug: 'india',
    hindiName: 'भारत',
    englishName: 'India',
    name: 'भारत (India)',
    color: '#4f46e5',
    subCategories: ['दिल्ली', 'राजनीति', 'विदेश'],
    description: 'देश भर की राष्ट्रीय खबरें, प्रमुख सरकारी फैसले, नीतिगत बदलाव और समसामयिक मुद्दे।',
    aliases: ['india', 'भारत', 'national', 'national-news', 'देश'],
    priority: 4
  },
  // 5. राजनीति (Politics)
  {
    id: 'c6',
    slug: 'politics',
    hindiName: 'राजनीति',
    englishName: 'Politics',
    name: 'राजनीति (Politics)',
    color: '#9333ea',
    subCategories: ['चुनाव', 'पार्टी', 'बयान'],
    description: 'दमोह और मध्य प्रदेश सहित देश की राजनीतिक हलचलें, चुनावी खबरें और नेताओं के बयान।',
    aliases: ['politics', 'राजनीति', 'political', 'chunav', 'elections'],
    priority: 5
  },
  // 6. धर्म (Religion)
  {
    id: 'c16',
    slug: 'religion',
    hindiName: 'धर्म',
    englishName: 'Religion',
    name: 'धर्म (Religion)',
    color: '#ca8a04',
    subCategories: ['मंदिर', 'त्योहार', 'राशिफल'],
    description: 'दमोह के प्रमुख धार्मिक स्थल, व्रत-त्योहार, धर्म-संस्कृति, ज्योतिष और दैनिक राशिफल।',
    aliases: ['religion', 'धर्म', 'dharm', 'mandir', 'jyotish'],
    priority: 6
  },
  // 7. ताज़ा खबरें (Latest News)
  {
    id: 'c3',
    slug: 'latest-news',
    hindiName: 'ताज़ा खबरें',
    englishName: 'Latest News',
    name: 'ताज़ा खबरें (Latest News)',
    color: '#16a34a',
    subCategories: ['लाइव', 'राष्ट्रीय'],
    description: 'दिन भर की ताज़ा खबरें, महत्वपूर्ण सुर्खियां और मुख्य घटनाक्रम।',
    aliases: ['latest-news', 'latest', 'ताज़ा-खबरें', 'ताजा-खबरें', 'ताज़ा-समाचार'],
    priority: 7
  },
  // 8. ब्रेकिंग न्यूज़ (Breaking News)
  {
    id: 'c2',
    slug: 'breaking-news',
    hindiName: 'ब्रेकिंग न्यूज़',
    englishName: 'Breaking News',
    name: 'ब्रेकिंग न्यूज़ (Breaking News)',
    color: '#ea580c',
    subCategories: ['ताजा अपडेट', 'लाइव'],
    description: 'दमोह, मध्य प्रदेश और देश-विदेश की ताज़ा ब्रेकिंग न्यूज़ और पल-पल के अहम समाचार।',
    aliases: ['breaking-news', 'breaking', 'ब्रेकिंग-न्यूज़', 'ब्रेकिंग'],
    priority: 8
  },
  // 9. व्यापार (Business)
  {
    id: 'c8',
    slug: 'business',
    hindiName: 'व्यापार',
    englishName: 'Business',
    name: 'व्यापार (Business)',
    color: '#0d9488',
    subCategories: ['मंडी', 'सोना-चांदी', 'बाजार'],
    description: 'दमोह मंडी भाव, सोना-चांदी के दाम, व्यापार, शेयर बाजार और अर्थव्यवस्था के समाचार।',
    aliases: ['business', 'व्यापार', 'बिजनेस', 'mandi', 'market'],
    priority: 9
  },
  // 10. कृषि (Agriculture)
  {
    id: 'c11',
    slug: 'agriculture',
    hindiName: 'कृषि',
    englishName: 'Agriculture',
    name: 'कृषि (Agriculture)',
    color: '#65a30d',
    subCategories: ['फसल', 'मौसम', 'किसान योजना'],
    description: 'किसान भाइयों के लिए कृषि सलाह, फसल रोग नियंत्रण, मंडी दरें और सरकारी किसान योजनाएं।',
    aliases: ['agriculture', 'कृषि', 'krishi', 'kisan', 'farming'],
    priority: 10
  },
  // 11. शिक्षा (Education)
  {
    id: 'c9',
    slug: 'education',
    hindiName: 'शिक्षा',
    englishName: 'Education',
    name: 'शिक्षा (Education)',
    color: '#0284c7',
    subCategories: ['स्कूल', 'कॉलेज', 'रिजल्ट'],
    description: 'शिक्षा जगत, बोर्ड परीक्षाएं, कॉलेज एडमिशन, करियर मार्गदर्शन और प्रतियोगी परीक्षाओं की जानकारी।',
    aliases: ['education', 'शिक्षा', 'school', 'exam', 'results'],
    priority: 11
  },
  // 12. नौकरियां (Jobs)
  {
    id: 'c10',
    slug: 'jobs',
    hindiName: 'नौकरियां',
    englishName: 'Jobs',
    name: 'नौकरियां (Jobs)',
    color: '#059669',
    subCategories: ['सरकारी भर्ती', 'निजी'],
    description: 'मध्य प्रदेश व केंद्र सरकार की सरकारी नौकरियां, रोजगार अवसर और भर्ती सूचनाएं।',
    aliases: ['jobs', 'नौकरियां', 'job', 'naukri', 'recruitment', 'bharti', 'रोजगार'],
    priority: 12
  },
  // 13. खेल (Sports)
  {
    id: 'c12',
    slug: 'sports',
    hindiName: 'खेल',
    englishName: 'Sports',
    name: 'खेल (Sports)',
    color: '#d97706',
    subCategories: ['क्रिकेट', 'स्थानीय'],
    description: 'स्थानीय खेल प्रतियोगिताएं, क्रिकेट, हॉकी, फुटबॉल और राष्ट्रीय खेल जगत की ताज़ा ख़बरें।',
    aliases: ['sports', 'खेल', 'khel', 'cricket', 'sport'],
    priority: 13
  },
  // 14. मनोरंजन (Entertainment)
  {
    id: 'c13',
    slug: 'entertainment',
    hindiName: 'मनोरंजन',
    englishName: 'Entertainment',
    name: 'मनोरंजन (Entertainment)',
    color: '#db2777',
    subCategories: ['बॉलीवुड', 'टीवी'],
    description: 'बॉलीवुड, सिनेमा, वेब सीरीज, टीवी धारावाहिक और सितारों की दुनिया से जुड़ी दिलचस्प खबरें।',
    aliases: ['entertainment', 'मनोरंजन', 'bollywood', 'cinema', 'movies'],
    priority: 14
  },
  // 15. तकनीक (Technology)
  {
    id: 'c14',
    slug: 'technology',
    hindiName: 'तकनीक',
    englishName: 'Technology',
    name: 'तकनीक (Technology)',
    color: '#0891b2',
    subCategories: ['मोबाइल', 'इंटरनेट'],
    description: 'स्मार्टफोन, इंटरनेट, टेक्नोलॉजी गैजेट्स, सोशल मीडिया टिप्स और साइबर सुरक्षा।',
    aliases: ['technology', 'तकनीक', 'tech', 'gadgets', 'mobile'],
    priority: 15
  },
  // 16. स्वास्थ्य (Health)
  {
    id: 'c15',
    slug: 'health',
    hindiName: 'स्वास्थ्य',
    englishName: 'Health',
    name: 'स्वास्थ्य (Health)',
    color: '#e11d48',
    subCategories: ['हेल्थ टिप्स', 'अस्पताल'],
    description: 'स्वास्थ्य सुरक्षा, घरेलू नुस्खे, विशेषज्ञ डॉक्टरों की सलाह और चिकित्सा सुविधाएं।',
    aliases: ['health', 'स्वास्थ्य', 'sehat', 'medical'],
    priority: 16
  },
  // 17. मौसम (Weather)
  {
    id: 'c17',
    slug: 'weather',
    hindiName: 'मौसम',
    englishName: 'Weather',
    name: 'मौसम (Weather)',
    color: '#0284c7',
    subCategories: ['पूर्वानुमान', 'अलर्ट'],
    description: 'दमोह और मध्य प्रदेश का दैनिक मौसम पूर्वानुमान, बारिश, तापमान और मौसम विभाग के अलर्ट।',
    aliases: ['weather', 'मौसम', 'mausam', 'rain', 'barish'],
    priority: 17
  },
  // 18. वीडियो (Videos)
  {
    id: 'c18',
    slug: 'videos',
    hindiName: 'वीडियो',
    englishName: 'Videos',
    name: 'वीडियो (Videos)',
    color: '#dc2626',
    subCategories: ['ग्राउंड रिपोर्ट', 'इंटरव्यू'],
    description: 'ग्राउंड रिपोर्ट, खास इंटरव्यू और दमोह की खबरों के वीडियो कवरेज।',
    aliases: ['videos', 'वीडियो', 'video'],
    priority: 18
  },
  // 19. फोटो गैलरी (Photo Gallery)
  {
    id: 'c19',
    slug: 'photo-gallery',
    hindiName: 'फोटो गैलरी',
    englishName: 'Photo Gallery',
    name: 'फोटो गैलरी (Photo Gallery)',
    color: '#7c3aed',
    subCategories: ['कार्यक्रम', 'प्रकृति'],
    description: 'दमोह शहर और जिले के विशेष कार्यक्रमों, प्राकृतिक सुंदरता और खास पलों की तस्वीरें।',
    aliases: ['photo-gallery', 'gallery', 'फोटो-गैलरी', 'photos', 'फोटो'],
    priority: 19
  },
  // 20. फैक्ट चेक (Fact Check)
  {
    id: 'c20',
    slug: 'fact-check',
    hindiName: 'फैक्ट चेक',
    englishName: 'Fact Check',
    name: 'फैक्ट चेक (Fact Check)',
    color: '#059669',
    subCategories: ['वायरल सच'],
    description: 'सोशल मीडिया पर वायरल हो रहे दावों का सच, भ्रामक संदेशों की पड़ताल और तथ्य जांच।',
    aliases: ['fact-check', 'फैक्ट-चेक', 'factcheck'],
    priority: 20
  },
  // 21. अंतर्राष्ट्रीय (International)
  {
    id: 'c1786814342801',
    slug: 'international',
    hindiName: 'अंतर्राष्ट्रीय',
    englishName: 'International',
    name: 'अंतर्राष्ट्रीय (International)',
    color: '#2cacb0',
    subCategories: ['वैश्विक', 'विदेश'],
    description: 'दुनिया भर की बड़ी अंतर्राष्ट्रीय खबरें, वैश्विक कूटनीति और महत्वपूर्ण घटनाएं।',
    aliases: ['international', 'अंतर्राष्ट्रीय', 'अंतर्राष्ट्रीय-international', 'world'],
    priority: 21
  }
];

const INITIAL_CATEGORIES = CATEGORIES_CONFIG;

function normalizeCategorySlug(rawSlug: string | undefined | null): string {
  if (!rawSlug) return "";
  let clean = String(rawSlug).trim();
  clean = clean.split('?')[0].split('#')[0];
  clean = clean.replace(/^\/+|\/+$/g, '');
  try {
    clean = decodeURIComponent(clean);
  } catch {}
  return clean.toLowerCase().trim();
}

function findCategoryBySlug(rawSlug: string | undefined | null): CategoryItem | null {
  if (!rawSlug) return null;
  const normalized = normalizeCategorySlug(rawSlug);
  if (!normalized) return null;

  return CATEGORIES_CONFIG.find(c => {
    if (c.slug.toLowerCase() === normalized) return true;
    if (c.id.toLowerCase() === normalized) return true;
    if (c.englishName.toLowerCase().replace(/\s+/g, '-') === normalized) return true;
    if (c.englishName.toLowerCase() === normalized) return true;
    if (c.hindiName.toLowerCase() === normalized) return true;
    if (c.aliases?.some(a => a.toLowerCase() === normalized)) return true;
    return false;
  }) || null;
}

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

  // Consistent canonical domain enforcement
  if (host === "damohdailynewsnetwork.in" || host === "www.damohdailynewsnetwork.in") {
    return "https://www.damohdailynewsnetwork.in";
  }

  let proto = (req.headers["x-forwarded-proto"] as string) || (req.headers["x-forwarded-ssl"] === "on" ? "https" : "");
  if (proto) {
    proto = proto.split(",")[0].trim();
  }
  if (!proto) {
    proto = (host.startsWith("localhost") || host.startsWith("127.0.0.1")) ? "http" : "https";
  }
  return `${proto}://${host}`;
}

// In-memory caches for fast responses with instant invalidation capability
const serverArticleCache = new Map<string, { data: Record<string, any>; timestamp: number }>();
const SERVER_CACHE_TTL = 3 * 60 * 1000; // 3 minutes fallback TTL

let feedArticlesCache: { data: Array<Record<string, any>>; timestamp: number } | null = null;
const FEED_CACHE_TTL = 30 * 1000; // 30 seconds fallback TTL for rapid indexing freshness

let lastPurgeTime = 0;
const PURGE_THROTTLE_MS = 3000; // Minimum 3s between actual cache wipes to prevent thrashing

function invalidateFeedArticlesCache(): boolean {
  const now = Date.now();
  if (now - lastPurgeTime < PURGE_THROTTLE_MS) {
    // Throttled: Cache was already purged moments ago
    return false;
  }
  lastPurgeTime = now;
  feedArticlesCache = null;
  homepageSsrCache = null;
  serverArticleCache.clear();
  return true;
}

async function getAllArticlesForFeed(forceRefresh = false): Promise<Array<Record<string, any>>> {
  const now = Date.now();
  if (!forceRefresh && feedArticlesCache && (now - feedArticlesCache.timestamp < FEED_CACHE_TTL)) {
    return feedArticlesCache.data;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";

  try {
    const articles: Array<Record<string, any>> = [];
    let pageToken = "";
    let hasMore = true;
    let iterations = 0;
    const maxIterations = 20; // Allows up to 6,000 documents across Firestore pages without memory bottleneck

    while (hasMore && iterations < maxIterations) {
      iterations++;
      let listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles?pageSize=300`;
      if (pageToken) {
        listUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const response = await fetch(listUrl, { signal: AbortSignal.timeout(8000) });

      if (!response.ok) {
        break;
      }

      const data = await response.json();
      const docs = data.documents || [];

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

      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
      } else {
        hasMore = false;
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
  } catch (err) {
    console.warn("Could not fetch articles collection from Firestore for feed:", err);
  }

  if (feedArticlesCache && feedArticlesCache.data.length > 0) {
    return feedArticlesCache.data;
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
    return `${baseUrl}/logo.png`;
  }

  // Use the REAL article image whenever available for lightning-fast, zero-timeout WhatsApp & social previews
  const rawImg = (article.imageUrl || article.image || article.featuredImage || article.thumbnailUrl || "").trim();
  if (rawImg && !rawImg.startsWith("data:")) {
    if (rawImg.startsWith("http://") || rawImg.startsWith("https://")) {
      // If Cloudinary URL, ensure it is optimized for Open Graph 1200x630 JPEG
      if (rawImg.includes("res.cloudinary.com") && rawImg.includes("/upload/")) {
        return rawImg.replace(/\/upload\/(?:[^\/]+\/)?/, "/upload/c_fill,w_1200,h_630,q_auto,f_jpg/");
      }
      return rawImg;
    }
    if (rawImg.startsWith("/")) {
      return `${baseUrl}${rawImg}`;
    }
    return `${baseUrl}/${rawImg}`;
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

User-agent: Googlebot
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: TelegramBot
Allow: /

# Sitemaps for Google Search Console, Google News, and Bing
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-news.xml
Sitemap: ${baseUrl}/sitemap-articles.xml
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

// 1. Google News Specific Sitemap (Strictly compliant with Google's 48-hour news window)
async function generateGoogleNewsSitemapXml(baseUrl: string): Promise<string> {
  const allArticles = await getAllArticlesForFeed();
  const now = Date.now();
  const twoDaysAgo = now - (48 * 60 * 60 * 1000); // Official Google News 2-day threshold

  const eligibleArticles = allArticles.filter(art => {
    if (!art.slug && !art.id) return false;
    if (!isPubliclyPublishedArticle(art)) return false;
    const pubTime = new Date(art.publishedAt || art.createdAt || 0).getTime();
    return pubTime >= twoDaysAgo;
  });

  // Safe fallback if no articles were published within the last 48 hours: include latest 10
  const feedList = eligibleArticles.length > 0
    ? eligibleArticles
    : allArticles.filter(isPubliclyPublishedArticle).slice(0, 10);

  let urlsXml = "";
  for (const art of feedList) {
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt || new Date().toISOString();
    const title = escapeHtml(art.title || "Damoh Daily News Network");
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const image = getArticleImageUrl(art, articleSlug, baseUrl);

    urlsXml += `
  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${art.updatedAt || pubDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <news:news>
      <news:publication>
        <news:name>Damoh Daily News Network</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${new Date(pubDate).toISOString()}</news:publication_date>
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

// 2. Categories & Core Pages Sitemap
async function generateCategoriesSitemapXml(baseUrl: string): Promise<string> {
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

  // Essential institutional & editorial pages
  const staticPages = [
    { path: '/latest-news', changefreq: 'always', priority: '0.9' },
    { path: '/about', changefreq: 'weekly', priority: '0.6' },
    { path: '/contact', changefreq: 'weekly', priority: '0.6' },
    { path: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
    { path: '/terms', changefreq: 'monthly', priority: '0.5' },
    { path: '/editorial-policy', changefreq: 'monthly', priority: '0.5' }
  ];

  for (const page of staticPages) {
    urlsXml += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
}

// 3. Paginated Articles Archive Sitemap (Supports unlimited published articles beyond 100)
async function generateArticlesSitemapXml(baseUrl: string, page = 1, pageSize = 1000): Promise<string> {
  const allArticles = await getAllArticlesForFeed();
  const published = allArticles.filter(isPubliclyPublishedArticle);

  const startIndex = Math.max(0, (page - 1) * pageSize);
  const pageArticles = published.slice(startIndex, startIndex + pageSize);

  let urlsXml = "";
  for (const art of pageArticles) {
    if (!art.slug && !art.id) continue;
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt || new Date().toISOString();
    const title = escapeHtml(art.title || "Damoh News");
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const image = getArticleImageUrl(art, articleSlug, baseUrl);

    urlsXml += `
  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${art.updatedAt || pubDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${image ? `<image:image>
      <image:loc>${escapeHtml(image)}</image:loc>
      <image:title>${title}</image:title>
    </image:image>` : ''}
  </url>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}

// 4. Primary Sitemap (`/sitemap.xml` - Intelligent unified sitemap or sitemapindex based on archive scale)
async function generateSitemapXml(baseUrl: string): Promise<string> {
  const allArticles = await getAllArticlesForFeed();
  const published = allArticles.filter(isPubliclyPublishedArticle);

  // If archive size is over 1,000 articles, deliver a clean Google Sitemap Index
  if (published.length > 1000) {
    const totalPages = Math.ceil(published.length / 1000);
    const nowIso = new Date().toISOString();

    let sitemapsXml = `
  <sitemap>
    <loc>${baseUrl}/sitemap-news.xml</loc>
    <lastmod>${nowIso}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${nowIso}</lastmod>
  </sitemap>`;

    for (let p = 1; p <= totalPages; p++) {
      sitemapsXml += `
  <sitemap>
    <loc>${baseUrl}/sitemap-articles-${p}.xml</loc>
    <lastmod>${published[0]?.updatedAt || published[0]?.publishedAt || nowIso}</lastmod>
  </sitemap>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXml}
</sitemapindex>`;
  }

  // Unified complete sitemap for standard scale: Includes core pages + Google News for recent 48h + all articles
  const categories = INITIAL_CATEGORIES;
  const nowIso = new Date().toISOString();
  const now = Date.now();
  const twoDaysAgo = now - (48 * 60 * 60 * 1000);

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

  const staticPages = [
    { path: '/latest-news', changefreq: 'always', priority: '0.9' },
    { path: '/about', changefreq: 'weekly', priority: '0.6' },
    { path: '/contact', changefreq: 'weekly', priority: '0.6' },
    { path: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
    { path: '/terms', changefreq: 'monthly', priority: '0.5' },
    { path: '/editorial-policy', changefreq: 'monthly', priority: '0.5' }
  ];

  for (const page of staticPages) {
    urlsXml += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  for (const art of published) {
    if (!art.slug && !art.id) continue;
    const articleSlug = art.slug || art.id;
    const pubDate = art.publishedAt || nowIso;
    const title = escapeHtml(art.title || "Damoh Daily News Network");
    const articleUrl = `${baseUrl}/article/${articleSlug}`;
    const image = getArticleImageUrl(art, articleSlug, baseUrl);
    const pubTime = new Date(art.publishedAt || art.createdAt || 0).getTime();
    const isRecentGoogleNews = pubTime >= twoDaysAgo;

    urlsXml += `
  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${art.updatedAt || pubDate}</lastmod>
    <changefreq>${isRecentGoogleNews ? 'hourly' : 'weekly'}</changefreq>
    <priority>${isRecentGoogleNews ? '0.9' : '0.8'}</priority>
    ${isRecentGoogleNews ? `<news:news>
      <news:publication>
        <news:name>Damoh Daily News Network</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${new Date(pubDate).toISOString()}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>` : ''}
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
      ...(article.imageUrl && !article.imageUrl.startsWith('data:') && article.imageUrl !== imageUrl ? [article.imageUrl] : [])
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
      "name": "Damoh Daily News Network",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 1024,
        "height": 512
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
    "name": "Damoh Daily News Network",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`,
      "width": 1024,
      "height": 512
    }
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

function injectCategoryMetaTags(
  html: string,
  category: CategoryItem,
  fullUrl: string,
  baseUrl: string,
  _requestedSlug: string
): string {
  const cleanTitle = escapeHtml(`${category.name} | ताज़ा ख़बरें और लाइव अपडेट्स - Damoh Daily News Network`);
  const rawDesc = category.description || `${category.name} की सभी ताज़ा, सटीक और बड़ी ख़बरें - Damoh Daily News Network.`;
  const description = escapeHtml(rawDesc.slice(0, 200));

  const canonicalUrl = `${baseUrl}/category/${category.slug}`;
  const defaultShareImage = DEFAULT_SHARE_IMAGE;

  const jsonLdCollectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": `${category.name} समाचार`,
    "description": rawDesc.slice(0, 200),
    "url": canonicalUrl,
    "inLanguage": "hi-IN",
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Damoh Daily News Network",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 1024,
        "height": 512
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
        "name": category.name,
        "item": canonicalUrl
      }
    ]
  };

  const metaTagsHtml = `
    <!-- Essential Meta Tags -->
    <title>${cleanTitle}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook / WhatsApp / Telegram / LinkedIn -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Damoh Daily News Network">
    <meta property="og:title" content="${cleanTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${defaultShareImage}">
    <meta property="og:image:secure_url" content="${defaultShareImage}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${cleanTitle}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="hi_IN">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DamohDailyNews">
    <meta name="twitter:creator" content="@DamohDailyNews">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${defaultShareImage}">
    <meta name="twitter:image:alt" content="${cleanTitle}">

    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">${JSON.stringify(jsonLdCollectionPage)}</script>
    <script type="application/ld+json">${JSON.stringify(jsonLdBreadcrumbs)}</script>

    <!-- Initial Category Data for Client Hydration -->
    <script id="__INITIAL_CATEGORY__" type="application/json">${JSON.stringify(category).replace(/</g, '\\u003c')}</script>
    <script>
      try {
        var rawCatEl = document.getElementById('__INITIAL_CATEGORY__');
        if (rawCatEl && rawCatEl.textContent) {
          window.__INITIAL_CATEGORY__ = JSON.parse(rawCatEl.textContent);
        }
      } catch(e) {}
    </script>
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
// HOMEPAGE SSR PRERENDERING & METATAGS INJECTION
// ============================================================================

let homepageSsrCache: { html: string; timestamp: number; baseUrl: string } | null = null;
const HOMEPAGE_SSR_CACHE_TTL = 30 * 1000; // 30 seconds cache to ensure ultra-fast TTFB without stale lag

function injectHomepageMetaTagsAndBody(
  html: string,
  baseUrl: string,
  allArticles: Array<Record<string, any>>
): string {
  const published = allArticles.filter(isPubliclyPublishedArticle);
  const recentArticles = published.slice(0, 16);
  const breakingNews = published.filter(a => a.isBreaking);
  const heroArticle = breakingNews.length > 0 ? breakingNews[0] : (recentArticles[0] || null);

  const trendingArticles = published.filter(a => a.isTrending && a.id !== heroArticle?.id).slice(0, 4);
  const otherTrending = trendingArticles.length >= 2
    ? trendingArticles
    : recentArticles.filter(a => a.id !== heroArticle?.id).slice(0, 4);

  const heroAndTrendingIds = new Set<string>();
  if (heroArticle?.id) heroAndTrendingIds.add(heroArticle.id);
  otherTrending.forEach(t => { if (t.id) heroAndTrendingIds.add(t.id); });

  const latestArticles = recentArticles.filter(a => !heroAndTrendingIds.has(a.id)).slice(0, 9);

  const title = "Damoh Daily News - दमोह और मध्य प्रदेश की ताज़ा ख़बरें एवं लाइव अपडेट्स";
  const description = "दमोह और मध्य प्रदेश की विश्वसनीय, सटीक और सबसे तेज़ ख़बरें। राजनीति, अपराध, समाज, शिक्षा, मौसम और स्थानीय समाचार सबसे पहले।";
  const canonicalUrl = `${baseUrl}/`;
  const shareImageUrl = `${baseUrl}/social-preview.jpg`;

  // Schemas
  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Damoh Daily News Network",
    "alternateName": "Damoh Daily News",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`,
      "width": 1024,
      "height": 512
    },
    "sameAs": [
      "https://twitter.com/DamohDailyNews"
    ]
  };

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Damoh Daily News Network",
    "alternateName": "Damoh Daily News",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const jsonLdItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ताज़ा ख़बरें - Damoh Daily News Network",
    "itemListElement": recentArticles.slice(0, 10).map((art, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `${baseUrl}/article/${encodeURIComponent(art.slug || art.id)}`,
      "name": art.title || "Damoh News"
    }))
  };

  // Top navigation categories from canonical config
  const topCategories = CATEGORIES_CONFIG.slice(0, 10);
  const categoryPillsHtml = topCategories.map(cat => 
    `<a href="${baseUrl}/category/${cat.slug}" class="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors">${escapeHtml(cat.name)}</a>`
  ).join("\n");

  // Hero article HTML matching Home.tsx structure & Tailwind classes
  let heroArticleHtml = "";
  if (heroArticle) {
    const heroSlug = encodeURIComponent(heroArticle.slug || heroArticle.id);
    const heroUrl = `${baseUrl}/article/${heroSlug}`;
    const heroImg = getArticleImageUrl(heroArticle, heroArticle.slug || heroArticle.id, baseUrl);
    const heroExcerpt = stripTags(heroArticle.excerpt || heroArticle.content || "").slice(0, 240);
    const heroDate = (heroArticle.publishedAt || heroArticle.createdAt || "").slice(0, 10);

    heroArticleHtml = `
      <div class="lg:col-span-8 group">
        <a href="${heroUrl}" class="block relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] bg-zinc-900">
          ${heroImg ? `
            <img src="${heroImg}" alt="${escapeHtml(heroArticle.title)}" class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-90" width="800" height="500" loading="eager" fetchpriority="high" />
          ` : ''}
          <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span class="bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider">
                प्रमुख खबर (Top Story)
              </span>
              <span class="text-zinc-300 text-[11px] sm:text-xs">${heroDate}</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2 group-hover:text-red-100 transition-colors">
              ${escapeHtml(heroArticle.title)}
            </h1>
            ${heroExcerpt ? `<p class="text-xs sm:text-sm md:text-base text-zinc-300 line-clamp-2 sm:line-clamp-3">${escapeHtml(heroExcerpt)}</p>` : ''}
          </div>
        </a>
      </div>
    `;
  }

  // Trending side list matching Home.tsx (lg:col-span-4)
  let trendingColumnHtml = "";
  if (otherTrending.length > 0) {
    const trendingItemsHtml = otherTrending.map((art, idx) => {
      const slug = encodeURIComponent(art.slug || art.id);
      const url = `${baseUrl}/article/${slug}`;
      const img = getArticleImageUrl(art, art.slug || art.id, baseUrl);
      const date = (art.publishedAt || art.createdAt || "").slice(0, 10);

      return `
        <article class="flex gap-3 items-center group/item p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
          <span class="flex-shrink-0 w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black flex items-center justify-center">${idx + 1}</span>
          ${img ? `
            <a href="${url}" class="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-zinc-800">
              <img src="${img}" alt="${escapeHtml(art.title)}" class="w-full h-full object-cover" width="80" height="64" loading="lazy" />
            </a>
          ` : ''}
          <div class="flex-1 min-w-0">
            <h3 class="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover/item:text-red-600 transition-colors">
              <a href="${url}">${escapeHtml(art.title)}</a>
            </h3>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">${date}</span>
          </div>
        </article>
      `;
    }).join("\n");

    trendingColumnHtml = `
      <div class="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
        <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 class="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            ट्रेंडिंग और प्रमुख ख़बरें
          </h2>
        </div>
        ${trendingItemsHtml}
      </div>
    `;
  }

  // Latest news grid matching Home.tsx
  let latestNewsSectionHtml = "";
  if (latestArticles.length > 0) {
    const latestCardsHtml = latestArticles.map(art => {
      const slug = encodeURIComponent(art.slug || art.id);
      const url = `${baseUrl}/article/${slug}`;
      const img = getArticleImageUrl(art, art.slug || art.id, baseUrl);
      const excerpt = stripTags(art.excerpt || art.content || "").slice(0, 120);
      const date = (art.publishedAt || art.createdAt || "").slice(0, 10);

      return `
        <article class="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col group">
          ${img ? `
            <a href="${url}" class="block aspect-video overflow-hidden bg-zinc-800">
              <img src="${img}" alt="${escapeHtml(art.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" width="320" height="180" loading="lazy" />
            </a>
          ` : ''}
          <div class="p-3 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 block">${date}</span>
              <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-red-600 transition-colors">
                <a href="${url}">${escapeHtml(art.title)}</a>
              </h3>
              ${excerpt ? `<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">${escapeHtml(excerpt)}</p>` : ''}
            </div>
            <div class="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
              <a href="${url}" class="text-red-600 font-bold hover:underline">पूरी ख़बर पढ़ें &rarr;</a>
            </div>
          </div>
        </article>
      `;
    }).join("\n");

    latestNewsSectionHtml = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 class="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">ताज़ा समाचार (Latest Stories)</h2>
          <a href="${baseUrl}/latest-news" class="text-xs sm:text-sm font-bold text-red-600 hover:text-red-700">सभी देखें &rarr;</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${latestCardsHtml}
        </div>
      </div>
    `;
  }

  const metaTagsHtml = `
    <!-- Homepage SEO & Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Damoh Daily News Network">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${shareImageUrl}">
    <meta property="og:image:secure_url" content="${shareImageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:locale" content="hi_IN">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@DamohDailyNews">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${shareImageUrl}">

    <!-- Structured Data (Schema.org) -->
    <script type="application/ld+json">${JSON.stringify(jsonLdOrganization)}</script>
    <script type="application/ld+json">${JSON.stringify(jsonLdWebSite)}</script>
    <script type="application/ld+json">${JSON.stringify(jsonLdItemList)}</script>

    <!-- Initial Homepage Articles for React Hydration (Lightweight card data, no heavy content blobs) -->
    <script id="__INITIAL_HOMEPAGE_ARTICLES__" type="application/json">${JSON.stringify(published.slice(0, 30).map(art => ({
      id: art.id,
      slug: art.slug,
      title: art.title,
      excerpt: art.excerpt || (art.content ? stripTags(art.content).slice(0, 200) : ""),
      imageUrl: getArticleImageUrl(art, art.slug || art.id, baseUrl),
      categoryIds: art.categoryIds || [],
      authorName: art.authorName || "दमोह डेली न्यूज़",
      publishedAt: art.publishedAt || art.createdAt || "",
      createdAt: art.createdAt || "",
      status: art.status || "published",
      views: typeof art.views === 'number' ? art.views : 0,
      likes: typeof art.likes === 'number' ? art.likes : 0,
      isBreaking: Boolean(art.isBreaking),
      isTrending: Boolean(art.isTrending),
      isEditorsPick: Boolean(art.isEditorsPick),
      videoUrl: art.videoUrl || undefined,
      galleryImages: Array.isArray(art.galleryImages)
        ? art.galleryImages.filter((img: any) => typeof img === 'string' && !img.startsWith('data:')).slice(0, 4)
        : undefined
    }))).replace(/</g, '\\u003c')}</script>
    <script>
      try {
        var rawHpEl = document.getElementById('__INITIAL_HOMEPAGE_ARTICLES__');
        if (rawHpEl && rawHpEl.textContent) {
          window.__INITIAL_HOMEPAGE_ARTICLES__ = JSON.parse(rawHpEl.textContent);
        }
      } catch(e) {}
    </script>
  `;

  // Semantic, crawlable initial HTML that matches the exact Tailwind classes and DOM structure of MainLayout & Home
  const serverRenderedBody = `<div id="root">
    <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-50">
      <main class="flex-1">
        <div class="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl space-y-6 sm:space-y-8 md:space-y-10 overflow-x-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            ${heroArticleHtml}
            ${trendingColumnHtml}
          </div>
          ${latestNewsSectionHtml}
          <nav class="pt-4 border-t border-zinc-200 dark:border-zinc-800" aria-label="मुख्य श्रेणियां">
            <div class="flex flex-wrap items-center gap-2">
              ${categoryPillsHtml}
            </div>
          </nav>
        </div>
      </main>
    </div>
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

let homepageArticlesCache: { data: Array<Record<string, any>>; timestamp: number } | null = null;
const HOMEPAGE_ARTICLES_CACHE_TTL = 90 * 1000; // 90 seconds cache

async function getHomepageArticlesForSsr(): Promise<Array<Record<string, any>>> {
  const now = Date.now();
  if (homepageArticlesCache && (now - homepageArticlesCache.timestamp < HOMEPAGE_ARTICLES_CACHE_TTL)) {
    return homepageArticlesCache.data;
  }

  // Fast path: if feedArticlesCache is warm, slice top 30 instantly
  if (feedArticlesCache && feedArticlesCache.data.length > 0) {
    return feedArticlesCache.data.slice(0, 30);
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "damoh-daily-news";

  try {
    const listUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/articles?pageSize=30`;
    const response = await fetch(listUrl, { signal: AbortSignal.timeout(3000) });

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
        homepageArticlesCache = { data: articles, timestamp: now };
        return articles;
      }
    }
  } catch (err) {
    console.warn("Fast homepage SSR query notice:", err);
  }

  return [];
}

async function generateHomepageSsrHtml(baseUrl: string, forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && homepageSsrCache && homepageSsrCache.baseUrl === baseUrl && (now - homepageSsrCache.timestamp < HOMEPAGE_SSR_CACHE_TTL)) {
    return homepageSsrCache.html;
  }

  const articles = await getHomepageArticlesForSsr();
  const htmlTemplate = getHtmlTemplate();
  const rendered = injectHomepageMetaTagsAndBody(htmlTemplate, baseUrl, articles);

  homepageSsrCache = { html: rendered, timestamp: now, baseUrl };
  return rendered;
}

function isCrawlerRequest(req: express.Request): boolean {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const botKeywords = [
    "googlebot", "bingbot", "yandex", "baiduspider", "duckduckbot",
    "slurp", "twitterbot", "facebookexternalhit", "facebot", "whatsapp",
    "telegrambot", "pinterest", "linkedinbot", "embedly", "quora link preview",
    "rogerbot", "screaming frog", "crawl", "spider", "bot", "curl", "wget"
  ];
  if (req.query.ssr === "1" || req.query.ssr === "true" || req.query.raw === "1") {
    return true;
  }
  return botKeywords.some(keyword => ua.includes(keyword));
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
  try {
    return await executeCanonicalLiveUpdatesCleanup();
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
      scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore",
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
              await fetch(delUrl, { 
                method: "DELETE",
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
              }).catch(() => {});
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

  // Canonical Domain Enforcement (Redirect naked root domain to preferred www domain)
  app.use((req, res, next) => {
    const hostHeader = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
    const host = hostHeader.split(",")[0].trim().toLowerCase();
    if (host === "damohdailynewsnetwork.in") {
      return res.redirect(301, `https://www.damohdailynewsnetwork.in${req.originalUrl}`);
    }
    next();
  });

  // Basic Security & Compatibility Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
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

  // API Route for Cloudinary Signed Uploads (Admin Authorized Only)
  app.post("/api/cloudinary-sign", requireAdmin, (req, res) => {
    try {
      const { folder, upload_preset, timestamp } = req.body || {};
      const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || "";
      const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || "damoh-daily-news";

      // Input Validation
      if (folder && (typeof folder !== "string" || folder.includes("..") || folder.length > 150 || !/^[a-zA-Z0-9_\-\/]+$/.test(folder))) {
        return res.status(400).json({ success: false, signed: false, error: "Invalid folder parameter" });
      }

      if (upload_preset && (typeof upload_preset !== "string" || upload_preset.length > 100 || !/^[a-zA-Z0-9_\-]+$/.test(upload_preset))) {
        return res.status(400).json({ success: false, signed: false, error: "Invalid upload_preset parameter" });
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const parsedTs = Number(timestamp);
      if (!timestamp || isNaN(parsedTs) || Math.abs(nowSec - parsedTs) > 900) {
        return res.status(400).json({ success: false, signed: false, error: "Invalid or expired timestamp" });
      }

      if (!apiSecret) {
        return res.status(500).json({ 
          success: false,
          signed: false, 
          error: "CLOUDINARY_API_SECRET is required on server for secure signed uploads." 
        });
      }

      const paramsToSign: Record<string, string> = {};
      if (folder) paramsToSign.folder = folder;
      paramsToSign.timestamp = String(parsedTs);
      if (upload_preset) paramsToSign.upload_preset = upload_preset;

      const sortedKeys = Object.keys(paramsToSign).sort();
      const stringToSign = sortedKeys.map(key => `${key}=${paramsToSign[key]}`).join("&") + apiSecret;

      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

      res.status(200).json({
        success: true,
        signed: true,
        signature,
        timestamp: parsedTs,
        apiKey,
        cloudName,
        uploadPreset: upload_preset
      });
    } catch (err: any) {
      console.warn("[Cloudinary Sign Error]:", err?.message || err);
      res.status(500).json({ success: false, signed: false, error: "Failed to generate Cloudinary signature" });
    }
  });

  app.all("/api/cloudinary-sign", (_req, res) => {
    res.status(405).json({ success: false, error: "Method not allowed. Only POST is accepted." });
  });

  // Automated 7-Day Live Updates Cleanup Endpoint (Admin Authorized Only)
  app.post("/api/live-updates/cleanup", requireAdmin, async (_req, res) => {
    try {
      const result = await executeCanonicalLiveUpdatesCleanup();
      return res.status(200).json(result);
    } catch (err: any) {
      console.warn("[LiveUpdates Cleanup] Manual execution error:", err?.message || err);
      return res.status(500).json({ success: false, error: "Failed to execute cleanup" });
    }
  });

  app.all("/api/live-updates/cleanup", (_req, res) => {
    res.status(405).json({ success: false, error: "Method not allowed. Only POST is accepted." });
  });

  // Associated Live Update Image Deletion Endpoint (Admin Authorized Only)
  app.post("/api/live-updates/delete-image", requireAdmin, async (req, res) => {
    try {
      const { publicId, imageUrl } = req.body || {};
      const rawPublicId = publicId || extractCloudinaryPublicId(imageUrl);
      if (!rawPublicId || typeof rawPublicId !== "string") {
        return res.status(400).json({ success: false, error: "Missing or invalid publicId/imageUrl" });
      }

      // Sanitize publicId
      const targetPublicId = rawPublicId.trim();
      if (
        targetPublicId.includes("..") ||
        targetPublicId.startsWith("/") ||
        targetPublicId.length > 250 ||
        !/^[a-zA-Z0-9_\-\/]+$/.test(targetPublicId)
      ) {
        return res.status(400).json({ success: false, error: "Invalid publicId format" });
      }

      const success = await destroyCloudinaryImage(targetPublicId);
      return res.status(200).json({ success, publicId: targetPublicId });
    } catch (err: any) {
      console.warn("[LiveUpdates Cleanup] Error deleting image asset:", err?.message || err);
      return res.status(500).json({ success: false, error: "Failed to delete image asset" });
    }
  });

  app.all("/api/live-updates/delete-image", (_req, res) => {
    res.status(405).json({ success: false, error: "Method not allowed. Only POST is accepted." });
  });

  // Server-Side Firebase Cloud Messaging (FCM) Push Broadcast Endpoint (Admin Authorized Only)
  app.post("/api/send-push", requireAdmin, async (req, res) => {
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

      // Input Validation
      if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 250) {
        return res.status(400).json({ 
          success: false, 
          error: "Push notification requires a valid non-empty 'title' (max 250 characters)." 
        });
      }

      if (!body || typeof body !== "string" || body.trim().length === 0 || body.length > 1000) {
        return res.status(400).json({ 
          success: false, 
          error: "Push notification requires a valid non-empty 'body' (max 1000 characters)." 
        });
      }

      if (targetUrl && (typeof targetUrl !== "string" || targetUrl.length > 500)) {
        return res.status(400).json({
          success: false,
          error: "Invalid targetUrl (max 500 characters)."
        });
      }

      if (imageUrl && (typeof imageUrl !== "string" || imageUrl.length > 1000)) {
        return res.status(400).json({
          success: false,
          error: "Invalid imageUrl (max 1000 characters)."
        });
      }

      const allowedPriorities = ["normal", "breaking", "important", "urgent"];
      if (priority && !allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: `Invalid priority. Allowed values: ${allowedPriorities.join(", ")}`
        });
      }

      if (category && (typeof category !== "string" || category.length > 50)) {
        return res.status(400).json({
          success: false,
          error: "Invalid category parameter"
        });
      }

      const result = await dispatchFCMPushNotification({
        id: typeof id === "string" ? id.substring(0, 100) : undefined,
        title: title.trim(),
        body: body.trim(),
        priority: priority || "normal",
        category: category || "breaking",
        articleId: typeof articleId === "string" ? articleId.substring(0, 100) : undefined,
        articleSlug: typeof articleSlug === "string" ? articleSlug.substring(0, 200) : undefined,
        liveUpdateId: typeof liveUpdateId === "string" ? liveUpdateId.substring(0, 100) : undefined,
        targetUrl: typeof targetUrl === "string" ? targetUrl.trim() : "/",
        imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : undefined
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.warn("[FCM Server] Send push error:", err?.message || err);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to dispatch push notification" 
      });
    }
  });

  app.all("/api/send-push", (_req, res) => {
    res.status(405).json({ success: false, error: "Method not allowed. Only POST is accepted." });
  });

  // Diagnostic Endpoint for FCM Token Registration & Server Status (Admin Authorized Only)
  app.get("/api/fcm/status", requireAdmin, async (_req, res) => {
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
      return res.status(500).json({ status: "error", error: "Failed to retrieve FCM status" });
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

  // IndexNow API Key Verification File Route (Directly serves the 32-char key file)
  app.get(["/2710f5ce0d40420ca1296b880592e549.txt", "/:key([a-f0-9]{32}).txt"], (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(INDEXNOW_KEY);
  });

  // IndexNow Instant Search Engine Indexing Endpoint
  app.all(["/api/indexnow", "/api/indexnow/submit"], async (req, res) => {
    // CORS support
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method === "GET") {
      return res.status(200).json({
        service: "IndexNow Submitter",
        host: INDEXNOW_HOST,
        keyLocation: INDEXNOW_KEY_LOCATION,
        status: "active"
      });
    }

    if (req.method === "POST") {
      try {
        const { urls, url, slug, urlList } = req.body || {};
        const targetList = urls || urlList || url || slug || [];
        const baseUrl = getBaseUrl(req);
        const host = baseUrl.replace(/^https?:\/\//, '').split('/')[0] || INDEXNOW_HOST;
        const result = await submitToIndexNow(targetList, host);
        return res.status(result.success ? 200 : 207).json(result);
      } catch (err: any) {
        console.warn("[IndexNow Express Route] Error:", err);
        return res.status(200).json({ success: false, error: err?.message || "IndexNow submission failed" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
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

  // Cache Invalidation & Instant Purge Endpoint (Admin Authorized Only)
  app.post(["/api/cache/purge", "/api/cache/invalidate", "/api/invalidate-feed-cache"], requireAdmin, (_req, res) => {
    try {
      const purged = invalidateFeedArticlesCache();
      return res.status(200).json({
        success: true,
        status: purged ? "purged" : "throttled",
        message: purged ? "Feed & article cache successfully invalidated." : "Cache already refreshed recently."
      });
    } catch (err: any) {
      console.warn("[Cache Purge Error]:", err?.message || err);
      return res.status(500).json({ success: false, error: "Cache purge failed" });
    }
  });

  app.all(["/api/cache/purge", "/api/cache/invalidate", "/api/invalidate-feed-cache"], (_req, res) => {
    res.status(405).json({ success: false, error: "Method not allowed. Only POST is accepted." });
  });

  // Sitemap.xml (Master Sitemap or Sitemap Index)
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateSitemapXml(baseUrl);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating sitemap.xml:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc></url></urlset>`);
    }
  });

  // Google News Sitemap
  app.get(["/sitemap-news.xml", "/news-sitemap.xml"], async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateGoogleNewsSitemapXml(baseUrl);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating sitemap-news.xml:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc></url></urlset>`);
    }
  });

  // Categories & Static Pages Sitemap
  app.get("/sitemap-categories.xml", async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateCategoriesSitemapXml(baseUrl);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=1200");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating sitemap-categories.xml:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc></url></urlset>`);
    }
  });

  // Paginated Articles Sitemaps (/sitemap-articles.xml, /sitemap-articles-1.xml, etc.)
  app.get(["/sitemap-articles.xml", "/sitemap-articles-:page.xml"], async (req, res) => {
    try {
      const page = parseInt(req.params.page || "1", 10) || 1;
      const baseUrl = getBaseUrl(req);
      const xml = await generateArticlesSitemapXml(baseUrl, page, 1000);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=300");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating sitemap-articles.xml:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/</loc></url></urlset>`);
    }
  });

  // RSS Feed (Instant fresh news feed)
  app.get(["/rss.xml", "/feed.xml", "/rss"], async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const xml = await generateRssFeedXml(baseUrl);
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120");
      return res.status(200).send(xml);
    } catch (err) {
      console.warn("Error generating RSS feed:", err);
      const baseUrl = getBaseUrl(req);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Damoh Daily News Network</title><link>${baseUrl}</link></channel></rss>`);
    }
  });

  // Intercept "/" and "/index.html" (Homepage) for high-performance semantic SSR prerendering
  app.get(["/", "/index.html"], async (req, res, next) => {
    // In development mode, if a normal browser requests the page (e.g. AI Studio preview),
    // let Vite dev server handle it so that live React HMR, Tailwind JIT, and dev tools run seamlessly!
    if (process.env.NODE_ENV !== "production" && !isCrawlerRequest(req)) {
      return next();
    }

    try {
      const baseUrl = getBaseUrl(req);
      const html = await generateHomepageSsrHtml(baseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=180, stale-while-revalidate=300");
      return res.status(200).send(html);
    } catch (err) {
      console.warn("Error generating homepage SSR HTML:", err);
      const rawHtml = getHtmlTemplate();
      const baseUrl = getBaseUrl(req);
      const fallbackHtml = injectDefaultMetaTags(rawHtml, baseUrl, baseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(fallbackHtml);
    }
  });

  // Intercept /category/:slug for dynamic Open Graph & SEO meta tags, canonical URL & direct access
  app.get(["/category/:slug", "/category/:slug/*"], async (req, res) => {
    try {
      const rawSlug = req.params.slug || "";
      const baseUrl = getBaseUrl(req);

      const rawClean = rawSlug.trim().split('?')[0].split('#')[0];
      let decodedSlug = rawClean;
      try {
        decodedSlug = decodeURIComponent(rawClean);
      } catch {}

      // Find category using centralized canonical configuration
      const category = findCategoryBySlug(decodedSlug) || findCategoryBySlug(rawClean);

      if (!category) {
        // Category not recognized: serve default template so client app renders "Category not found" state
        const htmlTemplate = getHtmlTemplate();
        const fallbackHtml = injectDefaultMetaTags(htmlTemplate, `${baseUrl}/category/${encodeURIComponent(rawClean)}`, baseUrl);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(fallbackHtml);
      }

      // If user requested an alias, Hindi slug, or legacy path, permanently redirect (301) to canonical lowercase English slug
      const normalizedReq = rawClean.toLowerCase();
      if (normalizedReq !== category.slug && (category.aliases.includes(rawClean) || category.aliases.includes(decodedSlug))) {
        return res.redirect(301, `/category/${category.slug}`);
      }

      const fullUrl = `${baseUrl}/category/${category.slug}`;
      const htmlTemplate = getHtmlTemplate();
      const finalHtml = injectCategoryMetaTags(htmlTemplate, category, fullUrl, baseUrl, category.slug);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.status(200).send(finalHtml);
    } catch (err) {
      console.warn("Error serving category SSR meta tags:", err);
      const rawHtml = getHtmlTemplate();
      const baseUrl = getBaseUrl(req);
      const fallbackHtml = injectDefaultMetaTags(rawHtml, `${baseUrl}${req.path}`, baseUrl);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(fallbackHtml);
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
  invalidateFeedArticlesCache,
  createResizedImageBuffer,
  injectArticleMetaTags,
  injectCategoryMetaTags,
  injectDefaultMetaTags,
  injectHomepageMetaTagsAndBody,
  generateHomepageSsrHtml,
  findCategoryBySlug,
  normalizeCategorySlug,
  CATEGORIES_CONFIG,
  dispatchFCMPushNotification,
  performLiveUpdatesCleanup
};

const app = createExpressApp();

export default app;
