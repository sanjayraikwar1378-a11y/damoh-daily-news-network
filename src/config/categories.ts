/**
 * Centralized Category Configuration & Single Source of Truth
 * 
 * Rules:
 * 1. Slugs must be clean, lowercase, URL-safe English identifiers (e.g. 'damoh', 'jobs', 'agriculture').
 * 2. Aliases map legacy, Hindi, or alternate URL slugs to the canonical category.
 * 3. Lookup is deterministic and independent of client-side navigation or fetch state.
 */

export interface CategoryConfig {
  id: string;
  slug: string;
  hindiName: string;
  englishName: string;
  name: string; // Full display name, e.g. "दमोह (Damoh)"
  color: string;
  subCategories: string[];
  description: string;
  aliases: string[];
  keywords?: string[];
  priority: number;
}

/**
 * Priority Order Mapping (Single Source of Truth)
 * 1. होम (Home)
 * 2. लेटेस्ट न्यूज़ (Latest News)
 * 3. दमोह (Damoh)
 * 4. अपराध (Crime)
 * 5. मध्यप्रदेश (Madhya Pradesh)
 * 6. भारत (India)
 * 7. राजनीति (Politics)
 * 8. धर्म (Religion)
 * Followed by remaining categories in priority order:
 * 9. ताजा खबरें
 * 10. ब्रेकिंग न्यूज़
 * 11. व्यापार
 * 12. कृषि
 * 13. शिक्षा
 * 14. नौकरियां
 * 15. खेल
 * 16. मनोरंजन
 * 17. तकनीक
 * 18. स्वास्थ्य
 * 19. मौसम
 * 20. वीडियो
 * 21. फोटो गैलरी
 * 22. फैक्ट चेक
 * 23. अंतर्राष्ट्रीय
 */
export const CATEGORY_PRIORITY_MAP: Record<string, number> = {
  // 1. होम (Home)
  'home': 1,
  '': 1,
  '/': 1,
  'होम': 1,

  // 2. लेटेस्ट न्यूज़ (Latest News)
  'latest-news-page': 2,
  'latest-news': 2,
  'लेटेस्ट न्यूज़': 2,
  'लेटेस्ट-न्यूज़': 2,
  'latest news': 2,

  // 3. दमोह (Damoh)
  'damoh': 3,
  'दमोह': 3,
  'c1': 3,

  // 4. अपराध (Crime)
  'crime': 4,
  'अपराध': 4,
  'c7': 4,

  // 5. मध्यप्रदेश (Madhya Pradesh)
  'madhya-pradesh': 5,
  'मध्यप्रदेश': 5,
  'मध्य-प्रदेश': 5,
  'मध्य प्रदेश': 5,
  'mp': 5,
  'c4': 5,

  // 6. भारत (India)
  'india': 6,
  'भारत': 6,
  'national': 6,
  'c5': 6,

  // 7. राजनीति (Politics)
  'politics': 7,
  'राजनीति': 7,
  'c6': 7,

  // 8. धर्म (Religion)
  'religion': 8,
  'धर्म': 8,
  'c16': 8,

  // 9. ताज़ा खबरें (Fresh News)
  'fresh-news': 9,
  'taaza-khabarein': 9,
  'ताज़ा खबरें': 9,
  'ताजा खबरें': 9,
  'ताजा-खबरें': 9,
  'ताज़ा-समाचार': 9,
  'c3': 9,

  // 10. ब्रेकिंग न्यूज़ (Breaking News)
  'breaking-news': 10,
  'ब्रेकिंग न्यूज़': 10,
  'ब्रेकिंग-न्यूज़': 10,
  'c2': 10,

  // 11. व्यापार (Business)
  'business': 11,
  'व्यापार': 11,
  'बिजनेस': 11,
  'c8': 11,

  // 12. कृषि (Agriculture)
  'agriculture': 12,
  'कृषि': 12,
  'c11': 12,

  // 13. शिक्षा (Education)
  'education': 13,
  'शिक्षा': 13,
  'c9': 13,

  // 14. नौकरियां (Jobs)
  'jobs': 14,
  'नौकरियां': 14,
  'रोजगार': 14,
  'c10': 14,

  // 15. खेल (Sports)
  'sports': 15,
  'खेल': 15,
  'c12': 15,

  // 16. मनोरंजन (Entertainment)
  'entertainment': 16,
  'मनोरंजन': 16,
  'c13': 16,

  // 17. तकनीक (Technology)
  'technology': 17,
  'तकनीक': 17,
  'c14': 17,

  // 18. स्वास्थ्य (Health)
  'health': 18,
  'स्वास्थ्य': 18,
  'c15': 18,

  // 19. मौसम (Weather)
  'weather': 19,
  'मौसम': 19,
  'c17': 19,

  // 20. वीडियो (Videos)
  'videos': 20,
  'वीडियो': 20,
  'c18': 20,

  // 21. फोटो गैलरी (Photo Gallery)
  'photo-gallery': 21,
  'फोटो गैलरी': 21,
  'c19': 21,

  // 22. फैक्ट चेक (Fact Check)
  'fact-check': 22,
  'फैक्ट चेक': 22,
  'c20': 22,

  // 23. अंतर्राष्ट्रीय (International)
  'international': 23,
  'अंतर्राष्ट्रीय': 23,
  'c1786814342801': 23,
};

export const CATEGORIES_CONFIG: CategoryConfig[] = [
  // 3. Damoh
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
    priority: 3
  },
  // 4. अपराध (Crime)
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
    priority: 4
  },
  // 5. मध्यप्रदेश (Madhya Pradesh)
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
    priority: 5
  },
  // 6. भारत (India)
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
    priority: 6
  },
  // 7. राजनीति (Politics)
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
    priority: 7
  },
  // 8. धर्म (Religion)
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
    priority: 8
  },
  // 9. ताज़ा खबरें (Fresh News)
  {
    id: 'c3',
    slug: 'taaza-khabarein',
    hindiName: 'ताज़ा खबरें',
    englishName: 'Fresh News',
    name: 'ताज़ा खबरें (Fresh News)',
    color: '#16a34a',
    subCategories: ['लाइव', 'राष्ट्रीय'],
    description: 'दिन भर की ताज़ा खबरें, महत्वपूर्ण सुर्खियां और मुख्य घटनाक्रम।',
    aliases: ['fresh-news', 'taaza-khabarein', 'ताज़ा-खबरें', 'ताजा-खबरें', 'ताज़ा-समाचार'],
    priority: 9
  },
  // 10. ब्रेकिंग न्यूज़ (Breaking News)
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
    priority: 10
  },
  // 11. व्यापार (Business)
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
    priority: 11
  },
  // 12. कृषि (Agriculture)
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
    priority: 12
  },
  // 13. शिक्षा (Education)
  {
    id: 'c9',
    slug: 'education',
    hindiName: 'शिक्षा',
    englishName: 'Education',
    name: 'शिक्षा (Education)',
    color: '#0284c7',
    subCategories: ['स्कूल', 'कॉलेज', 'रिजल्ट'],
    description: 'शिक्षा जगत, board परीक्षाएं, कॉलेज एडमिशन, करियर मार्गदर्शन और प्रतियोगी परीक्षाओं की जानकारी।',
    aliases: ['education', 'शिक्षा', 'school', 'exam', 'results'],
    priority: 13
  },
  // 14. नौकरियां (Jobs)
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
    priority: 14
  },
  // 15. खेल (Sports)
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
    priority: 15
  },
  // 16. मनोरंजन (Entertainment)
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
    priority: 16
  },
  // 17. तकनीक (Technology)
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
    priority: 17
  },
  // 18. स्वास्थ्य (Health)
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
    priority: 18
  },
  // 19. मौसम (Weather)
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
    priority: 19
  },
  // 20. वीडियो (Videos)
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
    priority: 20
  },
  // 21. फोटो गैलरी (Photo Gallery)
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
    priority: 21
  },
  // 22. फैक्ट चेक (Fact Check)
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
    priority: 22
  },
  // 23. अंतर्राष्ट्रीय (International)
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
    priority: 23
  }
];

/**
 * Returns the exact numeric priority for any category identifier, object, or slug.
 * Home is 0, Damoh is 1, अपराध is 2, मध्यप्रदेश is 3, भारत is 4, राजनीति is 5, धर्म is 6.
 */
export function getCategoryPriority(catOrSlug: any): number {
  if (catOrSlug === null || catOrSlug === undefined) return 999;
  if (typeof catOrSlug === 'number') return catOrSlug;
  
  if (typeof catOrSlug === 'object') {
    const slugKey = String(catOrSlug.slug || '').toLowerCase().trim();
    if (slugKey in CATEGORY_PRIORITY_MAP) return CATEGORY_PRIORITY_MAP[slugKey];
    const idKey = String(catOrSlug.id || '').toLowerCase().trim();
    if (idKey in CATEGORY_PRIORITY_MAP) return CATEGORY_PRIORITY_MAP[idKey];
    const nameKey = String(catOrSlug.hindiName || catOrSlug.name || '').toLowerCase().trim();
    if (nameKey in CATEGORY_PRIORITY_MAP) return CATEGORY_PRIORITY_MAP[nameKey];
    if (typeof catOrSlug.priority === 'number') return catOrSlug.priority;
  }
  
  if (typeof catOrSlug === 'string') {
    const key = catOrSlug.toLowerCase().trim();
    if (key in CATEGORY_PRIORITY_MAP) return CATEGORY_PRIORITY_MAP[key];
    const normalized = normalizeCategorySlug(key);
    if (normalized in CATEGORY_PRIORITY_MAP) return CATEGORY_PRIORITY_MAP[normalized];
  }
  
  return 999;
}

/**
 * Centralized sorting function ensuring the exact priority order everywhere:
 * 1. Damoh
 * 2. अपराध
 * 3. मध्यप्रदेश
 * 4. भारत (India)
 * 5. राजनीति (Politics)
 * 6. धर्म (Religion)
 * Followed by all other categories.
 */
export function sortCategoriesByPriority<T extends { slug?: string; id?: string; priority?: number }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const pA = getCategoryPriority(a);
    const pB = getCategoryPriority(b);
    if (pA !== pB) return pA - pB;
    return 0;
  });
}

export interface HeaderNavItem {
  id: string;
  slug: string;
  path: string;
  name: string;
  hindiName: string;
  englishName: string;
  priority: number;
  isHome?: boolean;
  isLatestNews?: boolean;
  aliases?: string[];
}

export const HOME_NAV_ITEM: HeaderNavItem = {
  id: 'home',
  slug: '',
  path: '/',
  name: 'होम (Home)',
  hindiName: 'होम',
  englishName: 'Home',
  priority: 1,
  isHome: true,
  aliases: ['home', 'index', 'main'],
};

export const LATEST_NEWS_NAV_ITEM: HeaderNavItem = {
  id: 'latest-news-page',
  slug: 'latest-news',
  path: '/latest-news',
  name: 'लेटेस्ट न्यूज़ (Latest News)',
  hindiName: 'लेटेस्ट न्यूज़',
  englishName: 'Latest News',
  priority: 2,
  isLatestNews: true,
  aliases: ['latest-news', 'latest', 'लेटेस्ट-न्यूज़', 'ताज़ा-खबरें'],
};

/**
 * Single source of truth for header category navigation items.
 * Guarantees that mobile, desktop, and More dropdown receive the EXACT same categories in the EXACT same priority order:
 * 1. होम (Home) -> /
 * 2. लेटेस्ट न्यूज़ (Latest News) -> /latest-news
 * 3. दमोह (Damoh) -> /category/damoh
 * 4. अपराध (Crime) -> /category/crime
 * 5. मध्यप्रदेश (Madhya Pradesh) -> /category/madhya-pradesh
 * 6. भारत (India) -> /category/india
 * 7. राजनीति (Politics) -> /category/politics
 * 8. धर्म (Religion) -> /category/religion
 * Followed by all remaining configured categories (ताज़ा खबरें, ब्रेकिंग न्यूज़, व्यापार, कृषि, शिक्षा, नौकरियां, खेल, मनोरंजन, तकनीक, स्वास्थ्य, मौसम, वीडियो, फोटो गैलरी, फैक्ट चेक, अंतर्राष्ट्रीय).
 */
export function getHeaderNavigationItems(allCategories?: Array<any>): HeaderNavItem[] {
  const source = Array.isArray(allCategories) && allCategories.length > 0 
    ? allCategories 
    : CATEGORIES_CONFIG;
  
  const sorted = sortCategoriesByPriority(source);
  
  const categoryNavItems: HeaderNavItem[] = sorted
    .filter(c => {
      const slug = String(c.slug || '').toLowerCase().trim();
      const id = String(c.id || '').toLowerCase().trim();
      // Skip redundant home item and standalone latest news page item from raw categories
      if (id === 'home' || slug === 'home' || slug === '') return false;
      if (id === 'latest-news-page' || slug === 'latest-news') return false;
      return true;
    })
    .map(c => {
      const priority = getCategoryPriority(c);
      const hindiName = c.hindiName || c.name?.split('(')[0]?.trim() || c.name || c.slug;
      const englishName = c.englishName || c.name?.match(/\((.*?)\)/)?.[1]?.trim() || c.slug;
      return {
        id: c.id,
        slug: c.slug,
        path: `/category/${c.slug}`,
        name: c.name || `${hindiName} (${englishName})`,
        hindiName,
        englishName,
        priority,
        isHome: false,
        isLatestNews: false,
        aliases: Array.isArray(c.aliases) ? c.aliases : [],
      };
    });

  return [HOME_NAV_ITEM, LATEST_NEWS_NAV_ITEM, ...categoryNavItems];
}

/**
 * Normalizes a category slug string safely:
 * - Trims whitespace
 * - Strips URL queries and fragments
 * - Safe URI decoding
 * - Lowercases and normalizes Unicode
 */
export function normalizeCategorySlug(rawSlug: string | undefined | null): string {
  if (!rawSlug) return "";
  let clean = String(rawSlug).trim();
  clean = clean.split('?')[0].split('#')[0];
  clean = clean.replace(/^\/+|\/+$/g, '');
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // ignore decode error
  }
  return clean.toLowerCase().trim();
}

/**
 * Deterministically finds a category by its slug, id, english/hindi name, or alias.
 * Operates independently of network state or context loading.
 */
export function findCategoryBySlug(
  rawSlug: string | undefined | null,
  extraCategories?: Array<any>
): CategoryConfig | null {
  if (!rawSlug) return null;
  const normalized = normalizeCategorySlug(rawSlug);
  if (!normalized) return null;

  // 1. Direct match in static canonical config
  const staticFound = CATEGORIES_CONFIG.find(c => {
    if (c.slug.toLowerCase() === normalized) return true;
    if (c.id.toLowerCase() === normalized) return true;
    if (c.englishName.toLowerCase().replace(/\s+/g, '-') === normalized) return true;
    if (c.englishName.toLowerCase() === normalized) return true;
    if (c.hindiName.toLowerCase() === normalized) return true;
    if (c.aliases?.some(a => a.toLowerCase() === normalized)) return true;
    return false;
  });
  if (staticFound) return staticFound;

  // 2. Check dynamic categories if provided (e.g. from Firestore)
  if (Array.isArray(extraCategories)) {
    const dynFound = extraCategories.find(c => {
      if (!c) return false;
      const cSlug = normalizeCategorySlug(c.slug);
      const cId = normalizeCategorySlug(c.id);
      const cName = normalizeCategorySlug(c.name);
      if (cSlug === normalized || cId === normalized || cName === normalized) return true;
      if (c.aliases && Array.isArray(c.aliases) && c.aliases.some((a: string) => normalizeCategorySlug(a) === normalized)) return true;
      return false;
    });
    if (dynFound) {
      return {
        id: dynFound.id || `c-${normalized}`,
        slug: dynFound.slug ? normalizeCategorySlug(dynFound.slug) : normalized,
        hindiName: dynFound.hindiName || dynFound.name?.split('(')[0]?.trim() || dynFound.name || normalized,
        englishName: dynFound.englishName || dynFound.name?.match(/\((.*?)\)/)?.[1]?.trim() || dynFound.name || normalized,
        name: dynFound.name || `${normalized}`,
        color: dynFound.color || '#dc2626',
        subCategories: dynFound.subCategories || [],
        description: dynFound.description || `${dynFound.name || normalized} की ताज़ा और बड़ी ख़बरें - Damoh Daily News Network.`,
        aliases: dynFound.aliases || [normalized],
        priority: getCategoryPriority(dynFound)
      };
    }
  }

  return null;
}

/**
 * Checks if a category slug is valid
 */
export function isValidCategorySlug(rawSlug: string | undefined | null, extraCategories?: Array<any>): boolean {
  return findCategoryBySlug(rawSlug, extraCategories) !== null;
}
