export type ArticleStatus = 'published' | 'draft' | 'scheduled' | 'archived' | 'trash';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  subCategories?: string[];
}

export interface Reporter {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  email?: string;
  bio?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  articleTitle?: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
}

export interface MediaItem {
  id: string;
  url: string;
  title: string;
  uploadedAt: string;
  size?: string;
}

export interface AdSettings {
  googleAdsenseId: string;
  headerAd: { enabled: boolean; imageUrl: string; linkUrl: string; adCode: string };
  sidebarAd: { enabled: boolean; imageUrl: string; linkUrl: string; adCode: string };
  articleAd: { enabled: boolean; imageUrl: string; linkUrl: string; adCode: string };
  footerAd: { enabled: boolean; imageUrl: string; linkUrl: string; adCode: string };
  stickyAd: { enabled: boolean; imageUrl: string; linkUrl: string; adCode: string };
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  whatsappNumber: string;
  googleAnalyticsId: string;
  searchConsoleMeta: string;
}

export interface MarketRates {
  location: string;
  gold: string;
  goldUnit: string;
  silver: string;
  silverUnit: string;
  petrol: string;
  petrolUnit: string;
  diesel: string;
  dieselUnit: string;
  lastUpdated: string;
  statusText: string;
  isAvailable: boolean;
  notes?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  youtubeUrl?: string;
  categoryIds: string[];
  subCategory?: string;
  reporterId: string;
  publishedAt: string;
  scheduledAt?: string;
  updatedAt?: string;
  status: ArticleStatus;
  isBreaking: boolean;
  isTrending: boolean;
  isEditorsPick: boolean;
  isPopular?: boolean;
  views: number;
  likes: number;
  viewsByDate?: Record<string, number>;
  likesByDate?: Record<string, number>;
  lastViewedAt?: string;
  lastLikedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'दमोह (Damoh)', slug: 'damoh', color: '#dc2626', subCategories: ['सिटी न्यूज', 'ग्रामीण', 'तहसील'] },
  { id: 'c2', name: 'ब्रेकिंग न्यूज़ (Breaking News)', slug: 'breaking-news', color: '#ea580c', subCategories: ['ताजा अपडेट'] },
  { id: 'c3', name: 'ताज़ा खबरें (Latest News)', slug: 'latest-news', color: '#16a34a', subCategories: ['लाइव', 'राष्ट्रीय'] },
  { id: 'c4', name: 'मध्य प्रदेश (Madhya Pradesh)', slug: 'madhya-pradesh', color: '#2563eb', subCategories: ['भोपाल', 'जबलपुर', 'इंदौर', 'सागर'] },
  { id: 'c5', name: 'भारत (India)', slug: 'india', color: '#4f46e5', subCategories: ['दिल्ली', 'राजनीति', 'विदेश'] },
  { id: 'c6', name: 'राजनीति (Politics)', slug: 'politics', color: '#9333ea', subCategories: ['चुनाव', 'पार्टी', 'बयान'] },
  { id: 'c7', name: 'अपराध (Crime)', slug: 'crime', color: '#b91c1c', subCategories: ['पुलिस', 'कोर्ट', 'हादसा'] },
  { id: 'c8', name: 'व्यापार (Business)', slug: 'business', color: '#0d9488', subCategories: ['मंडी', 'सोना-चांदी', 'बाजार'] },
  { id: 'c9', name: 'शिक्षा (Education)', slug: 'education', color: '#0284c7', subCategories: ['स्कूल', 'कॉलेज', 'रिजल्ट'] },
  { id: 'c10', name: 'नौकरियां (Jobs)', slug: 'jobs', color: '#059669', subCategories: ['सरकारी भर्ती', 'निजी'] },
  { id: 'c11', name: 'कृषि (Agriculture)', slug: 'agriculture', color: '#65a30d', subCategories: ['फसल', 'मौसम', 'किसान योजना'] },
  { id: 'c12', name: 'खेल (Sports)', slug: 'sports', color: '#d97706', subCategories: ['क्रिकेट', 'स्थानीय'] },
  { id: 'c13', name: 'मनोरंजन (Entertainment)', slug: 'entertainment', color: '#db2777', subCategories: ['बॉलीवुड', 'टीवी'] },
  { id: 'c14', name: 'तकनीक (Technology)', slug: 'technology', color: '#0891b2', subCategories: ['मोबाइल', 'इंटरनेट'] },
  { id: 'c15', name: 'स्वास्थ्य (Health)', slug: 'health', color: '#e11d48', subCategories: ['हेल्थ टिप्स', 'अस्पताल'] },
  { id: 'c16', name: 'धर्म (Religion)', slug: 'religion', color: '#ca8a04', subCategories: ['मंदिर', 'त्योहार', 'राशिफल'] },
  { id: 'c17', name: 'मौसम (Weather)', slug: 'weather', color: '#0284c7', subCategories: ['पूर्वानुमान', 'अलर्ट'] },
  { id: 'c18', name: 'वीडियो (Videos)', slug: 'videos', color: '#dc2626', subCategories: ['ग्राउंड रिपोर्ट', 'इंटरव्यू'] },
  { id: 'c19', name: 'फोटो गैलरी (Photo Gallery)', slug: 'photo-gallery', color: '#7c3aed', subCategories: ['कार्यक्रम', 'प्रकृति'] },
  { id: 'c20', name: 'फैक्ट चेक (Fact Check)', slug: 'fact-check', color: '#059669', subCategories: ['वायरल सच'] },
];

export const REPORTERS: Reporter[] = [
  { id: 'r1', name: 'SANJAY RAIKWAR (संजय रैकवार)', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', role: 'मुख्य संपादक (Chief Editor)', email: 'sanjay@damohdaily.com', bio: 'वरिष्ठ पत्रकार, 15 वर्षों का अनुभव' },
  { id: 'r2', name: 'अमित कुमार (Amit Kumar)', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', role: 'विशेष संवाददाता (Special Correspondent)', email: 'amit@damohdaily.com', bio: 'क्राइम एवं पॉलिटिकल रिपोर्टिंग विशेषज्ञ' },
  { id: 'r3', name: 'प्रिया शर्मा (Priya Sharma)', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', role: 'सब एडिटर (Sub Editor)', email: 'priya@damohdaily.com', bio: 'शिक्षा एवं संस्कृति डेस्क प्रभारी' }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'दमोह में भारी बारिश से जनजीवन अस्त-व्यस्त, कई निचले इलाकों में भरा पानी',
    slug: 'heavy-rain-in-damoh-waterlogging-in-low-lying-areas-a1',
    excerpt: 'पिछले 24 घंटों से लगातार हो रही बारिश ने दमोह शहर की रफ्तार रोक दी है। मौसम विभाग ने रेड अलर्ट जारी किया है।',
    content: `दमोह शहर और ग्रामीण अंचलों में पिछले 24 घंटों से रुक-रुक कर हो रही तेज बारिश के कारण जनजीवन पूरी तरह प्रभावित हुआ है। नदी-नाले उफान पर हैं और कई निचले रिहाइशी इलाकों में 2 से 3 फीट तक पानी भर गया है।\n\nकलेक्टर ने आपातकालीन बैठक बुलाकर अधिकारियों को राहत एवं बचाव कार्य में जुटने के निर्देश दिए हैं। होमगार्ड एवं SDRF की टीमों को मुस्तैद रखा गया है। नागालैंड और मारुताल पुलिया पर पानी आने से आवागमन बाधित हो गया है।\n\nनागरिकों से अपील की गई है कि वे जलभराव वाले क्षेत्रों में जाने से बचें तथा आपात स्थिति में कंट्रोल रूम नंबर 07812-222100 पर संपर्क करें।`,
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&h=500&fit=crop',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    categoryIds: ['c1', 'c17', 'c2'],
    reporterId: 'r1',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'published',
    isBreaking: true,
    isTrending: true,
    isEditorsPick: false,
    isPopular: true,
    views: 1250,
    likes: 142,
    metaTitle: 'दमोह में भारी बारिश - जलभराव से जनजीवन अस्त व्यस्त',
    metaDescription: 'दमोह में भारी बारिश से जलभराव की स्थिति उत्पन्न हुई है। मौसम विभाग ने रेड अलर्ट जारी किया है।',
    keywords: 'दमोह बारिश, Damoh news, Damoh rain alert, Madhya Pradesh news',
  },
  {
    id: 'a2',
    title: 'विधानसभा क्षेत्र में विकास कार्यों की समीक्षा बैठक, कलेक्टर ने दिए कड़े निर्देश',
    slug: 'assembly-elections-political-activities-intensify-in-damoh-a2',
    excerpt: 'जिला पंचायत सभागार में आयोजित अंतर-विभागीय समीक्षा बैठक में लंबित सड़कों एवं स्वास्थ्य योजनाओं पर तुरंत कार्य पूरा करने के आदेश।',
    content: `दमोह जिला मुख्यालय में जिला कलेक्टर द्वारा सभी विकास विभागों के अधिकारियों की मैराथन बैठक ली गई। बैठक में विशेष रूप से प्रधानमंत्री ग्राम सड़क योजना, जल जीवन मिशन एवं मुख्यमंत्री संजीवनी क्लिनिक निर्माण की समीक्षा की गई।\n\nलापरवाही बरतने वाले 3 ठेकेदारों को नोटिस जारी किया गया है। कलेक्टर ने स्पष्ट कहा कि गुणवत्ता से समझौता करने वालों पर FIR दर्ज की जाएगी।`,
    imageUrl: 'https://images.unsplash.com/photo-1541872526-2db6d97c0fdb?w=800&h=500&fit=crop',
    categoryIds: ['c1', 'c6'],
    reporterId: 'r1',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'published',
    isBreaking: false,
    isTrending: false,
    isEditorsPick: true,
    isPopular: false,
    views: 890,
    likes: 65,
    metaTitle: 'दमोह जिला कलेक्टर बैठक निर्देश',
    metaDescription: 'दमोह विकास कार्यों पर कड़े निर्देश जारी किए गए।',
  },
  {
    id: 'a3',
    title: 'पुलिस ने किया अंतराज्यीय चोर गिरोह का भंडाफोड़, 5 गिरफ्तार व ₹15 लाख के जेवर बरामद',
    slug: 'police-bust-interstate-gang-of-thieves-5-arrested-a3',
    excerpt: 'दमोह एसपी के मार्गदर्शन में गठित साइबर व क्राइम टीम ने राजस्थान से जुड़े शातिर चोर गिरोह के 5 सदस्यों को धर दबोचा।',
    content: `दमोह पुलिस को बड़ी सफलता हाथ लगी है। पिछले 3 महीनों से जिले के विभिन्न थाना क्षेत्रों में सूने मकानों को निशाना बनाने वाले अंतराज्यीय गिरोह का पर्दाफाश किया गया है।\n\nपकड़े गए आरोपियों के पास से सोने-चांदी के आभूषण तथा 2 चार पहिया वाहन जब्त किए गए हैं। आरोपियों को न्यायालय में पेश कर पुलिस रिमांड पर लिया गया है।`,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=500&fit=crop',
    categoryIds: ['c1', 'c7', 'c2'],
    reporterId: 'r2',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    status: 'published',
    isBreaking: true,
    isTrending: true,
    isEditorsPick: false,
    isPopular: true,
    views: 2100,
    likes: 230,
  },
  {
    id: 'a4',
    title: 'व्यापारियों की हड़ताल खत्म, प्रशासन के आश्वासन के बाद खुलीं सभी दुकानें',
    slug: 'merchants-strike-ends-shops-open-after-administrations-assurance-a4',
    excerpt: 'स्थानीय व्यापार मंडल और जिला प्रशासन के बीच हुई सफल वार्ता के उपरांत सर्राफा एवं कपड़ा बाजार पुनः गुलजार।',
    content: `दमोह व्यापारी महासंघ द्वारा टैक्स संबंधी मांगों को लेकर बुलाई गई दो दिवसीय हड़ताल शनिवार को वापस ले ली गई। अपर कलेक्टर एवं एसडीएम के साथ हुई सकारात्मक वार्ता के बाद बाजार की व्यवस्था सामान्य हो गई है।`,
    imageUrl: 'https://images.unsplash.com/photo-1533619043865-1c2e1f42d634?w=800&h=500&fit=crop',
    categoryIds: ['c1', 'c8'],
    reporterId: 'r1',
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
    status: 'published',
    isBreaking: false,
    isTrending: false,
    isEditorsPick: false,
    views: 650,
    likes: 41,
  },
  {
    id: 'a5',
    title: 'दमोह कृषि विज्ञान केंद्र द्वारा किसान मेला आयोजित, नई तकनीकों का प्रदर्शन',
    slug: 'damoh-krishi-vigyan-kendra-farmers-fair-a5',
    excerpt: 'कृषि वैज्ञानिकों ने उन्नत बीजों, ड्रिप सिंचाई और जैविक खेती के फायदों के बारे में किसानों को प्रशिक्षित किया।',
    content: `दमोह स्थित कृषि विज्ञान केंद्र में आयोजित विशाल किसान मेले में जिले भर से 1000 से अधिक किसानों ने सहभागिता की। वैज्ञानिकों ने सोयाबीन एवं धान की फसलों को कीटों से बचाने हेतु जैविक दवाओं के प्रयोग की सलाह दी।`,
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=500&fit=crop',
    categoryIds: ['c1', 'c11'],
    reporterId: 'r3',
    publishedAt: new Date(Date.now() - 43200000).toISOString(),
    status: 'published',
    isBreaking: false,
    isTrending: true,
    isEditorsPick: true,
    views: 1120,
    likes: 88,
  },
  {
    id: 'a6',
    title: 'दमोह के होनहार छात्र ने राज्यस्तरीय साइंस ओलंपियाड में हासिल किया प्रथम स्थान',
    slug: 'damoh-student-first-in-state-science-olympiad-a6',
    excerpt: 'उत्कृष्ट विद्यालय के छात्र आर्यन दीक्षित ने संपूर्ण मध्य प्रदेश में दमोह का नाम रोशन किया।',
    content: `शासकीय उत्कृष्ट विद्यालय दमोह के कक्षा 11वीं के छात्र आर्यन दीक्षित ने भोपाल में आयोजित राज्यस्तरीय साइंस ओलंपियाड में गोल्ड मेडल हासिल किया है। इस उपलब्धि पर जिला शिक्षा अधिकारी एवं प्राचार्या ने आर्यन को सम्मानित किया।`,
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=500&fit=crop',
    categoryIds: ['c1', 'c9'],
    reporterId: 'r3',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'published',
    isBreaking: false,
    isTrending: false,
    isEditorsPick: true,
    views: 1540,
    likes: 195,
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'cm1',
    articleId: 'a1',
    articleTitle: 'दमोह में भारी बारिश से जनजीवन अस्त-व्यस्त',
    userName: 'विकास पटेल',
    userEmail: 'vikas@gmail.com',
    content: 'हमारे क्षेत्र मारुताल रोड पर बहुत पानी भरा हुआ है, कृपया नगर पालिका ध्यान दे।',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'approved',
  },
  {
    id: 'cm2',
    articleId: 'a3',
    articleTitle: 'पुलिस ने किया अंतराज्यीय चोर गिरोह का भंडाफोड़',
    userName: 'राकेश शर्मा',
    userEmail: 'rakesh@gmail.com',
    content: 'दमोह पुलिस को इस शानदार कार्रवाई के लिए बहुत-बहुत बधाई!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'approved',
  },
  {
    id: 'cm3',
    articleId: 'a1',
    articleTitle: 'दमोह में भारी बारिश से जनजीवन अस्त-व्यस्त',
    userName: 'सुनील जैन',
    userEmail: 'sunil@gmail.com',
    content: 'प्रशासन को नालियों की सफाई पहले ही करवानी चाहिए थी।',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    status: 'pending',
  }
];

export const MOCK_MEDIA: MediaItem[] = [
  { id: 'm1', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&h=500&fit=crop', title: 'Damoh Rain Waterlogging', uploadedAt: new Date().toISOString(), size: '1.2 MB' },
  { id: 'm2', url: 'https://images.unsplash.com/photo-1541872526-2db6d97c0fdb?w=800&h=500&fit=crop', title: 'Collector Meeting', uploadedAt: new Date().toISOString(), size: '850 KB' },
  { id: 'm3', url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=500&fit=crop', title: 'Police Crime Bust', uploadedAt: new Date().toISOString(), size: '1.5 MB' },
  { id: 'm4', url: 'https://images.unsplash.com/photo-1533619043865-1c2e1f42d634?w=800&h=500&fit=crop', title: 'Market Shops Open', uploadedAt: new Date().toISOString(), size: '920 KB' },
  { id: 'm5', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=500&fit=crop', title: 'Farmer Fair', uploadedAt: new Date().toISOString(), size: '1.1 MB' },
];

export const MOCK_ADS: AdSettings = {
  googleAdsenseId: 'pub-9876543210123456',
  headerAd: {
    enabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&h=120&fit=crop',
    linkUrl: 'https://example.com/banner-sponsor',
    adCode: ''
  },
  sidebarAd: {
    enabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=500&fit=crop',
    linkUrl: 'https://example.com/sidebar-offer',
    adCode: ''
  },
  articleAd: {
    enabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=200&fit=crop',
    linkUrl: 'https://example.com/in-article-ad',
    adCode: ''
  },
  footerAd: {
    enabled: true,
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1000&h=100&fit=crop',
    linkUrl: 'https://example.com/footer-sponsor',
    adCode: ''
  },
  stickyAd: {
    enabled: false,
    imageUrl: '',
    linkUrl: '',
    adCode: ''
  }
};

export const MOCK_SITE_SETTINGS: SiteSettings = {
  siteName: 'Damoh Daily News Network',
  tagline: 'दमोह एवं मध्य प्रदेश की निष्पक्ष व सटीक खबरें',
  logoUrl: '',
  faviconUrl: '',
  contactEmail: 'contact@damohdaily.com',
  contactPhone: '+91 9999999999',
  contactAddress: 'स्टेशन रोड, दमोह (मध्य प्रदेश) - 470661',
  facebookUrl: 'https://facebook.com/damohdaily',
  twitterUrl: 'https://twitter.com/damohdaily',
  instagramUrl: 'https://instagram.com/damohdaily',
  youtubeUrl: 'https://youtube.com/damohdaily',
  telegramUrl: 'https://t.me/damohdaily',
  whatsappNumber: '+919999999999',
  googleAnalyticsId: 'G-1234567890',
  searchConsoleMeta: 'google-site-verification=abcdef123456'
};

export const MOCK_WEATHER = {
  temp: 28,
  condition: 'Rainy',
  humidity: 85
};

export const INITIAL_MARKET_RATES: MarketRates = {
  location: 'दमोह (म.प्र.)',
  gold: '₹73,450',
  goldUnit: '10 ग्राम (24K)',
  silver: '₹86,100',
  silverUnit: '1 किग्रा',
  petrol: '₹108.65',
  petrolUnit: 'लीटर',
  diesel: '₹93.90',
  dieselUnit: 'लीटर',
  lastUpdated: '28 जुलाई 2026, 11:00 AM',
  statusText: 'नवीनतम स्थानीय दरें (Latest available price)',
  isAvailable: true,
  notes: 'दमोह स्थानीय सराफा एवं ईंधन दरें'
};

export const MOCK_MARKET = {
  gold: '₹73,450',
  silver: '₹86,100',
  petrol: '₹108.65',
  diesel: '₹93.90'
};
