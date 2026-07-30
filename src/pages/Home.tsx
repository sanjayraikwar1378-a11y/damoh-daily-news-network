import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { Flame, Clock, ChevronRight, Share2, Bookmark, Eye, Play, Image, TrendingUp, Sparkles, Sun, CloudRain, Coins, AlertCircle, Phone, Mail, MessageSquare, Headphones, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from "motion/react"
import { useNews } from '@/context/NewsContext'
import { WeatherWidget } from '@/components/WeatherWidget'
import { getOptimizedImageUrl } from '@/lib/cloudinary'
import { FirestoreErrorBanner } from '@/components/FirestoreErrorBanner'

export function Home() {
  const { articles, categories, adSettings, toggleBookmark, bookmarks, marketRates, siteSettings, isSyncingFirestore, firestoreSyncError, retryFirestoreSync } = useNews()

  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return "हाल ही में"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return "हाल ही में"
      return `${formatDistanceToNow(d)} ago`
    } catch {
      return "हाल ही में"
    }
  }

  // Published articles only
  const publishedArticles = articles.filter(a => (a.status || 'published') === 'published')

  const breakingNews = publishedArticles.filter(a => a.isBreaking)
  const trendingNews = publishedArticles.filter(a => a.isTrending)
  const editorsPick = publishedArticles.filter(a => a.isEditorsPick)
  
  const heroArticle = breakingNews.length > 0 ? breakingNews[0] : publishedArticles[0]
  const topTrending = trendingNews.length > 0 ? trendingNews : publishedArticles.slice(1, 5)

  const damohCategory = categories.find(c => c.slug === 'damoh')
  const damohArticles = publishedArticles.filter(a => damohCategory && a.categoryIds?.includes(damohCategory.id))

  const politicsCategory = categories.find(c => c.slug === 'politics')
  const politicsArticles = publishedArticles.filter(a => politicsCategory && a.categoryIds?.includes(politicsCategory.id))

  const crimeCategory = categories.find(c => c.slug === 'crime')
  const crimeArticles = publishedArticles.filter(a => crimeCategory && a.categoryIds?.includes(crimeCategory.id))

  const mostReadArticles = [...publishedArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)

  const tickerNews = breakingNews.length > 0 ? breakingNews : publishedArticles.slice(0, 5)

  // Calculate constant scrolling speed (~7s per item, min 20s)
  const marqueeDuration = Math.max(20, tickerNews.length * 7)

  // Friendly error state if Firestore sync failed or timed out
  if (firestoreSyncError && publishedArticles.length === 0) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  // Skeleton state while syncing from Firestore
  if (isSyncingFirestore && publishedArticles.length === 0) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl space-y-8">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8 aspect-[16/10] bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="lg:col-span-4 space-y-4">
            <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-2" />
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded bg-red-200 dark:bg-red-950/40 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="space-y-3">
                <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Clean empty state if Firestore sync completed successfully with 0 published articles
  if (!isSyncingFirestore && !firestoreSyncError && publishedArticles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-zinc-400">
          <Flame className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          अभी कोई खबर प्रकाशित नहीं हुई है
        </h2>
        <p className="text-sm text-zinc-500">
          नवीनतम समाचार अपडेट देखने के लिए कृपया बाद में पुनः जांचें या एडमिन पैनल से समाचार प्रकाशित करें।
        </p>
        <Link to="/admin">
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs mt-2">
            एडमिन पैनल पर जाएं (Go to Admin)
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl space-y-6 sm:space-y-8 md:space-y-10 overflow-x-hidden"
    >
      
      {/* Dynamic Breaking News Marquee Ticker */}
      {tickerNews.length > 0 && (
        <div className="flex items-center bg-zinc-900 text-white rounded-xl overflow-hidden shadow-md">
          <div className="bg-red-600 px-2.5 sm:px-4 py-2 sm:py-2.5 font-black flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 z-10 text-[11px] sm:text-xs md:text-sm uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce" /> 
            <span className="hidden xs:inline">{breakingNews.length > 0 ? 'ब्रेकिंग न्यूज़' : 'मुख्य समाचार'}</span>
            <span className="xs:hidden">ब्रेकिंग</span>
          </div>
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 overflow-hidden relative w-full flex">
            <div 
              className="animate-marquee whitespace-nowrap text-xs sm:text-sm font-semibold flex items-center shrink-0 hover:[animation-play-state:paused]"
              style={{ animationDuration: `${marqueeDuration}s` }}
            >
              {tickerNews.map(news => (
                <span key={news.id} className="mr-8 sm:mr-10 inline-flex items-center">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mr-2 animate-pulse shrink-0"></span>
                  <Link to={`/article/${news.slug}`} className="hover:text-red-400 transition-colors">
                    {news.title}
                  </Link>
                </span>
              ))}
              {tickerNews.map(news => (
                <span key={`${news.id}-dup`} className="mr-8 sm:mr-10 inline-flex items-center">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mr-2 animate-pulse shrink-0"></span>
                  <Link to={`/article/${news.slug}`} className="hover:text-red-400 transition-colors">
                    {news.title}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Layout: Top Main Story + Side Trending Items */}
      {heroArticle && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Main Hero Card */}
          <div className="lg:col-span-8 group">
            <Link to={`/article/${heroArticle.slug}`} className="block relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] bg-zinc-900">
              <img 
                src={getOptimizedImageUrl(heroArticle.imageUrl, 1000) || undefined} 
                alt={heroArticle.title}
                loading="eager"
                decoding="async"
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <span className="bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider">
                    प्रमुख खबर (Top Story)
                  </span>
                  {heroArticle.isBreaking && (
                    <span className="bg-amber-500 text-black text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded uppercase tracking-wider">
                      BREAKING
                    </span>
                  )}
                  <span className="text-zinc-300 text-[11px] sm:text-xs flex items-center gap-1 font-medium ml-auto sm:ml-0">
                    <Clock className="h-3 w-3" /> {formatDateSafe(heroArticle.publishedAt)}
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl md:text-4xl font-black text-white leading-snug sm:leading-tight mb-1 sm:mb-3 group-hover:text-red-400 transition-colors line-clamp-3 sm:line-clamp-none">
                  {heroArticle.title}
                </h1>
                <p className="text-zinc-300 text-xs sm:text-sm md:text-base line-clamp-2 hidden sm:block font-medium">
                  {heroArticle.excerpt}
                </p>
              </div>
            </Link>
          </div>

          {/* Trending Sidebar Column */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b-2 border-red-600 pb-2">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-600" />
                ट्रेंडिंग न्यूज़ (Trending)
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {topTrending.slice(0, 4).map((article, idx) => (
                <Link to={`/article/${article.slug}`} key={article.id} className="group flex gap-3 items-start p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  <span className="text-3xl font-black text-red-600 leading-none min-w-[28px]">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span>{formatDateSafe(article.publishedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Sidebar Ad Placement */}
            {Boolean(adSettings.sidebarAd.enabled) && Boolean(adSettings.sidebarAd.imageUrl?.trim()) && (
              <div className="mt-auto pt-4 border-t border-border text-center">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">ADVERTISEMENT</span>
                <a href={adSettings.sidebarAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
                  <img src={getOptimizedImageUrl(adSettings.sidebarAd.imageUrl, 400) || undefined} alt="Sidebar Ad" loading="lazy" decoding="async" className="w-full rounded-xl object-cover max-h-48" />
                </a>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Editor's Pick Banner Section */}
      {editorsPick.length > 0 && (
        <section className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-black flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-amber-400" /> सम्पादक की पसंद (Editor's Pick)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editorsPick.slice(0, 3).map(article => (
              <Link to={`/article/${article.slug}`} key={article.id} className="group space-y-3">
                <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                  <img src={getOptimizedImageUrl(article.imageUrl, 500) || undefined} alt={article.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="font-bold text-base text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Damoh Special & Local Regional Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Columns: Damoh Local + Category Streams */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Damoh Local Section */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-red-600 pb-2 mb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                दमोह खास खबरें (Damoh Local News)
              </h2>
              {damohCategory && (
                <Link to={`/category/${damohCategory.slug}`} className="text-xs font-bold text-red-600 hover:underline flex items-center">
                  सभी देखें <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {damohArticles.slice(0, 4).map(article => (
                <div key={article.id} className="group flex flex-col gap-2 border rounded-xl p-3 bg-card hover:shadow-md transition-shadow">
                  <Link to={`/article/${article.slug}`} className="aspect-video rounded-lg overflow-hidden bg-zinc-100">
                    <img src={getOptimizedImageUrl(article.imageUrl, 450) || undefined} alt={article.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <Link to={`/article/${article.slug}`}>
                    <h3 className="font-bold text-base leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-500 line-clamp-2">{article.excerpt}</p>
                  <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-2 border-t mt-auto">
                    <span>{formatDateSafe(article.publishedAt)}</span>
                    <button 
                      onClick={() => toggleBookmark(article.id)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <Bookmark className={`h-4 w-4 ${bookmarks.includes(article.id) ? 'fill-red-600 text-red-600' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Politics & Crime Split Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            
            {/* Politics */}
            <section className="space-y-4">
              <div className="border-b-2 border-purple-600 pb-2">
                <h3 className="text-lg font-black text-purple-700 dark:text-purple-400">राजनीति (Politics)</h3>
              </div>
              <div className="space-y-4">
                {politicsArticles.slice(0, 3).map(art => (
                  <Link to={`/article/${art.slug}`} key={art.id} className="group block space-y-1 border-b pb-3 last:border-0">
                    <h4 className="font-bold text-sm group-hover:text-purple-600 transition-colors line-clamp-2">{art.title}</h4>
                    <span className="text-[11px] text-zinc-400">{formatDateSafe(art.publishedAt)}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Crime */}
            <section className="space-y-4">
              <div className="border-b-2 border-red-700 pb-2">
                <h3 className="text-lg font-black text-red-700 dark:text-red-400">अपराध (Crime)</h3>
              </div>
              <div className="space-y-4">
                {crimeArticles.slice(0, 3).map(art => (
                  <Link to={`/article/${art.slug}`} key={art.id} className="group block space-y-1 border-b pb-3 last:border-0">
                    <h4 className="font-bold text-sm group-hover:text-red-600 transition-colors line-clamp-2">{art.title}</h4>
                    <span className="text-[11px] text-zinc-400">{formatDateSafe(art.publishedAt)}</span>
                  </Link>
                ))}
              </div>
            </section>

          </div>

        </div>

        {/* Sidebar Widgets: Most Viewed + Market Rates + Weather */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Most Read Widget */}
          <div className="border rounded-2xl p-5 bg-card space-y-4 shadow-sm">
            <h3 className="font-black text-base uppercase tracking-wider flex items-center gap-2 border-b pb-3 text-zinc-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-red-600" /> सबसे ज्यादा पढ़ी गई (Most Read)
            </h3>
            <div className="space-y-4">
              {mostReadArticles.map((art, idx) => (
                <Link to={`/article/${art.slug}`} key={art.id} className="group flex items-start gap-3 border-b pb-3 last:border-0">
                  <span className="text-2xl font-black text-zinc-300 dark:text-zinc-700">#{idx + 1}</span>
                  <div>
                    <h4 className="font-bold text-xs leading-snug group-hover:text-red-600 transition-colors line-clamp-2">{art.title}</h4>
                    <span className="text-[10px] text-zinc-400 font-medium mt-1 block">{formatDateSafe(art.publishedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live Market & Commodity Rates Widget */}
          <div className="border border-zinc-800 rounded-2xl p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <span>{marketRates.location || 'दमोह (म.प्र.)'} बाज़ार व ईंधन दरें</span>
              </h3>
              <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full font-medium">
                {marketRates.statusText || 'Latest available price'}
              </span>
            </div>

            {marketRates.isAvailable ? (
              <>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                    <span className="text-zinc-400 block text-[10px]">सोना ({marketRates.goldUnit || '10g 24K'})</span>
                    <span className="font-extrabold text-amber-400 text-base">{marketRates.gold}</span>
                  </div>
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50 hover:border-zinc-500 transition-colors">
                    <span className="text-zinc-400 block text-[10px]">चांदी ({marketRates.silverUnit || '1kg'})</span>
                    <span className="font-extrabold text-zinc-100 text-base">{marketRates.silver}</span>
                  </div>
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                    <span className="text-zinc-400 block text-[10px]">पेट्रोल ({marketRates.petrolUnit || 'लीटर'})</span>
                    <span className="font-extrabold text-emerald-400 text-base">{marketRates.petrol}</span>
                  </div>
                  <div className="p-3 bg-zinc-800/60 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                    <span className="text-zinc-400 block text-[10px]">डीजल ({marketRates.dieselUnit || 'लीटर'})</span>
                    <span className="font-extrabold text-blue-400 text-base">{marketRates.diesel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Clock className="h-3 w-3 text-amber-400" /> अंतिम अपडेट (Last Updated):
                  </span>
                  <span className="font-semibold text-zinc-300">{marketRates.lastUpdated}</span>
                </div>
              </>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1.5">
                <AlertCircle className="h-5 w-5 text-amber-400 mx-auto" />
                <p className="text-xs text-amber-300 font-semibold">
                  नवीनतम दरें अस्थायी रूप से उपलब्ध नहीं हैं।
                </p>
                <p className="text-[10px] text-zinc-400">
                  Latest prices are temporarily unavailable.
                </p>
              </div>
            )}
          </div>

          {/* Live Weather Widget for Damoh, MP */}
          <WeatherWidget />

        </div>

      </div>

      {/* Video News & Ground Report Gallery Section */}
      <section className="bg-zinc-900 text-white rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-black flex items-center gap-2 text-white">
            <Play className="h-5 w-5 text-red-600 fill-current" /> वीडियो बुलेटिन व ग्राउंड रिपोर्ट (Video News)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publishedArticles.slice(0, 3).map(art => (
            <Link to={`/article/${art.slug}`} key={art.id} className="group relative rounded-xl overflow-hidden aspect-video bg-zinc-800 block">
              <img src={getOptimizedImageUrl(art.imageUrl, 500) || undefined} alt={art.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-between">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg self-center my-auto group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-2">{art.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Photo Gallery Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-white pb-2">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Image className="h-5 w-5 text-purple-600" /> फोटो गैलरी (Photo Gallery)
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {publishedArticles.slice(0, 4).map(art => (
            <Link to={`/article/${art.slug}`} key={art.id} className="group relative rounded-xl overflow-hidden aspect-square block bg-zinc-100">
              <img src={getOptimizedImageUrl(art.imageUrl, 400) || undefined} alt={art.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                <p className="text-xs font-bold text-white line-clamp-2">{art.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial Contact & News Tip Banner */}
      <section className="bg-gradient-to-r from-red-600 via-red-700 to-red-900 text-white rounded-2xl p-6 md:p-8 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-red-500/40 pb-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
              <Headphones className="h-3.5 w-3.5" /> 24x7 समाचार हेल्पलाइन
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white">
              कोई घटना या समाचार टिप हमारे साथ साझा करें
            </h3>
            <p className="text-xs md:text-sm text-red-100 max-w-xl">
              क्या आपके आसपास कोई मुख्य घटना घटी है? फोटो, वीडियो एवं विवरण हमारे संपादक को तुरंत भेजें।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0 w-full md:w-auto">
            {siteSettings.whatsappNumber && (
              <a 
                href={`https://wa.me/${siteSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="h-4 w-4" /> व्हाट्सएप टिप ({siteSettings.whatsappNumber})
              </a>
            )}
            <Link 
              to="/contact"
              className="px-4 py-2.5 bg-white text-red-700 hover:bg-zinc-100 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Phone className="h-4 w-4" />संपर्क विवरण (Contact Us)
            </Link>
          </div>
        </div>

        {/* Live Contact Quick Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {siteSettings.contactPhone && (
            <a href={`tel:${siteSettings.contactPhone}`} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 flex items-center gap-3 transition-colors">
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-red-200 uppercase font-bold block">फ़ोन (Phone)</span>
                <strong className="text-sm font-extrabold text-white truncate block">{siteSettings.contactPhone}</strong>
              </div>
            </a>
          )}

          {siteSettings.whatsappNumber && (
            <a href={`https://wa.me/${siteSettings.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 flex items-center gap-3 transition-colors">
              <div className="p-2 bg-emerald-500/30 rounded-lg shrink-0">
                <MessageSquare className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-200 uppercase font-bold block">व्हाट्सएप (WhatsApp)</span>
                <strong className="text-sm font-extrabold text-white truncate block">{siteSettings.whatsappNumber}</strong>
              </div>
            </a>
          )}

          {siteSettings.contactEmail && (
            <a href={`mailto:${siteSettings.contactEmail}`} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 flex items-center gap-3 transition-colors">
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-red-200 uppercase font-bold block">ईमेल (Email)</span>
                <strong className="text-xs font-bold text-white truncate block">{siteSettings.contactEmail}</strong>
              </div>
            </a>
          )}

          {siteSettings.contactAddress && (
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <MapPin className="h-4 w-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-red-200 uppercase font-bold block">पता (Address)</span>
                <p className="text-xs font-medium text-white line-clamp-1">{siteSettings.contactAddress}</p>
              </div>
            </div>
          )}
        </div>
      </section>

    </motion.div>
  )
}
