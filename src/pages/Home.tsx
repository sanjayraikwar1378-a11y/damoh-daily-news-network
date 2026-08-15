import React, { useMemo, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { Flame, Clock, ChevronRight, Share2, Bookmark, Eye, Play, Image, TrendingUp, Sparkles, Sun, CloudRain, Coins, AlertCircle, Phone, Mail, MessageSquare, Headphones, MapPin, User, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNews } from '@/context/NewsContext'
import { WeatherWidget } from '@/components/WeatherWidget'
import { getOptimizedImageUrl, getOptimizedSrcSet } from '@/lib/cloudinary'
import { FirestoreErrorBanner } from '@/components/FirestoreErrorBanner'
import { isValidYouTubeUrl } from '@/lib/youtube'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { CategoryHeader } from '@/components/CategoryHeader'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { LazySection } from '@/components/LazySection'
import { PrefetchLink } from '@/components/PrefetchLink'
import { getReadingTime, isWithin2Hours } from '@/lib/utils'


export function Home() {
  const { articles, categories, reporters, adSettings, toggleBookmark, bookmarks, marketRates, siteSettings, hasArticlesLoaded, isSyncingFirestore, firestoreSyncError, retryFirestoreSync } = useNews()

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

  // Published articles sorted newest first
  const publishedArticles = useMemo(() => {
    return articles
      .filter(a => (a.status || 'published') === 'published')
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
  }, [articles])

  const breakingNews = useMemo(() => publishedArticles.filter(a => a.isBreaking), [publishedArticles])
  const trendingNews = useMemo(() => publishedArticles.filter(a => a.isTrending), [publishedArticles])
  const editorsPick = useMemo(() => publishedArticles.filter(a => a.isEditorsPick), [publishedArticles])
  
  const heroArticle = useMemo(() => breakingNews.length > 0 ? breakingNews[0] : publishedArticles[0], [breakingNews, publishedArticles])
  const topTrending = useMemo(() => trendingNews.length > 0 ? trendingNews : publishedArticles.slice(1, 5), [trendingNews, publishedArticles])

  const damohCategory = useMemo(() => categories.find(c => c.slug === 'damoh'), [categories])
  const damohArticles = useMemo(() => publishedArticles.filter(a => damohCategory && a.categoryIds?.includes(damohCategory.id)), [publishedArticles, damohCategory])

  const politicsCategory = useMemo(() => categories.find(c => c.slug === 'politics'), [categories])
  const politicsArticles = useMemo(() => publishedArticles.filter(a => politicsCategory && a.categoryIds?.includes(politicsCategory.id)), [publishedArticles, politicsCategory])

  const crimeCategory = useMemo(() => categories.find(c => c.slug === 'crime'), [categories])
  const crimeArticles = useMemo(() => publishedArticles.filter(a => crimeCategory && a.categoryIds?.includes(crimeCategory.id)), [publishedArticles, crimeCategory])

  const videoCategory = useMemo(() => categories.find(c => c.slug === 'video' || c.slug === 'videos'), [categories])
  const photoCategory = useMemo(() => categories.find(c => c.slug === 'photo' || c.slug === 'photos' || c.slug === 'gallery'), [categories])

  // Other categories with published articles
  const otherCategorySections = useMemo(() => {
    return categories
      .filter(c => !['damoh', 'politics', 'crime', 'video', 'videos', 'photo', 'photos', 'gallery'].includes((c.slug || '').toLowerCase()))
      .map(cat => ({
        category: cat,
        articles: publishedArticles.filter(a => a.categoryIds?.includes(cat.id))
      }))
      .filter(item => item.articles.length > 0)
  }, [categories, publishedArticles])

  const mostReadArticles = useMemo(() => {
    return [...publishedArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
  }, [publishedArticles])

  // Prioritize articles with valid YouTube URLs for Video News section
  const videoNewsArticles = useMemo(() => {
    const videoArticlesList = publishedArticles.filter(a => a.youtubeUrl && isValidYouTubeUrl(a.youtubeUrl))
    return videoArticlesList.length >= 3 
      ? videoArticlesList.slice(0, 3) 
      : [...videoArticlesList, ...publishedArticles.filter(a => !videoArticlesList.some(va => va.id === a.id))].slice(0, 3)
  }, [publishedArticles])

  // Friendly error state if Firestore sync failed and no articles are available
  if (firestoreSyncError && publishedArticles.length === 0 && !hasArticlesLoaded) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  // State A (Loading): Initial fetch is still in progress and no articles in memory/storage
  if ((!hasArticlesLoaded || isSyncingFirestore) && publishedArticles.length === 0) {
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

  // State C (Empty): Initial Firestore sync has fully finished, no error occurred, and database returned 0 articles
  if (hasArticlesLoaded && !isSyncingFirestore && !firestoreSyncError && publishedArticles.length === 0) {
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
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl space-y-6 sm:space-y-8 md:space-y-10 overflow-x-hidden">
      
      {/* Hero Layout: Top Main Story + Side Trending Items */}
      {heroArticle && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Main Hero Card */}
          <div className="lg:col-span-8 group">
            <PrefetchLink to={`/article/${heroArticle.slug}`} articleSlug={heroArticle.slug} articleImageUrl={heroArticle.imageUrl} className="block relative rounded-2xl overflow-hidden shadow-lg aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] bg-zinc-900">
              <ResponsiveImage 
                src={heroArticle.imageUrl} 
                alt={heroArticle.title}
                type="card"
                loading="lazy"
                fetchPriority="low"
                widths={[360, 480, 720, 1080]}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 800px"
                defaultWidth={720}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8 pointer-events-none">
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
            </PrefetchLink>
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
                <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} key={article.id} className="group flex gap-3 items-start p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
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
                </PrefetchLink>
              ))}
            </div>

            {/* Sidebar Ad Placement */}
            {Boolean(adSettings.sidebarAd.enabled) && Boolean(adSettings.sidebarAd.imageUrl?.trim()) && (
              <div className="mt-auto pt-4 border-t border-border text-center">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">ADVERTISEMENT</span>
                <a href={adSettings.sidebarAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
                  <ResponsiveImage src={adSettings.sidebarAd.imageUrl} alt="Sidebar Ad" loading="lazy" defaultWidth={360} className="w-full rounded-xl object-cover max-h-48" />
                </a>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Editor's Pick Banner Section */}
      {editorsPick.length > 0 && (
        <LazySection minHeight="280px">
          <section className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-black flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-amber-400" /> सम्पादक की पसंद (Editor's Pick)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {editorsPick.slice(0, 3).map(article => (
                <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} key={article.id} className="group space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                    <ResponsiveImage src={article.imageUrl} alt={article.title} type="card" loading="lazy" defaultWidth={480} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-bold text-base text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{article.excerpt}</p>
                </PrefetchLink>
              ))}
            </div>
          </section>
        </LazySection>
      )}

      {/* Latest News (लेटेस्ट न्यूज़) Dedicated Section */}
      {publishedArticles.length > 0 && (
        <LazySection minHeight="380px">
          <section className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-6 shadow-sm">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-red-600 pb-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Flame className="h-6 w-6 text-red-600 fill-current" />
                  <span>लेटेस्ट न्यूज़ (Latest News)</span>
                </h2>
                <span className="hidden sm:inline-block bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ताज़ा समाचार
                </span>
              </div>

              <Link 
                to="/latest-news" 
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 hover:underline transition-all ml-auto sm:ml-0"
              >
                <span>सभी लेटेस्ट न्यूज़ देखें</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* 10 Latest Articles Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {publishedArticles.slice(0, 10).map((article, idx) => {
                const categoryObj = categories.find(c => article.categoryIds?.includes(c.id))
                const categoryName = categoryObj?.name || "ताज़ा खबर"
                const reporterObj = reporters.find(r => r.id === article.reporterId)
                const reporterName = reporterObj?.name || "विशेष संवाददाता"
                const readTime = getReadingTime(article.content || article.excerpt)
                const isFresh = isWithin2Hours(article.publishedAt)
                const numberFormatted = String(idx + 1).padStart(2, '0')

                return (
                  <div 
                    key={article.id}
                    className="group flex flex-col justify-between border border-border rounded-xl p-3 bg-background hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="space-y-2">
                      {/* Image container with Number badge & Category badge */}
                      <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} className="block relative aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <ResponsiveImage 
                          src={article.imageUrl} 
                          alt={article.title} 
                          type="card" 
                          loading="lazy" 
                          defaultWidth={380} 
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="bg-black/80 text-white text-[9px] font-mono font-black px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/20">
                            {numberFormatted}
                          </span>
                          <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                            {categoryName}
                          </span>
                        </div>
                        {isFresh && (
                          <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm animate-pulse uppercase tracking-wider">
                            NEW
                          </span>
                        )}
                      </PrefetchLink>

                      {/* Metadata: Time + Read Time */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-medium flex-wrap gap-1">
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateSafe(article.publishedAt)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400 text-[10px]">
                          <BookOpen className="h-3 w-3" />
                          <span>{readTime}</span>
                        </span>
                      </div>

                      {/* Headline */}
                      <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} className="block">
                        <h3 className="font-bold text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-2 text-zinc-900 dark:text-white">
                          {article.title}
                        </h3>
                      </PrefetchLink>

                      {/* Short Summary (2 lines) */}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    {/* Card Read More Link */}
                    <div className="pt-2.5 mt-2.5 border-t border-border flex items-center justify-between">
                      <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} className="w-full">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="w-full justify-between h-7 px-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <span>पढ़ें (Read More)</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </PrefetchLink>
                    </div>
                  </div>
                )
              })}
            </div>


            {/* Bottom "See All Latest News" Button */}
            <div className="text-center pt-2">
              <Link to="/latest-news">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto">
                  <span>सभी लेटेस्ट न्यूज़ देखें (See All Latest News)</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        </LazySection>
      )}

      {/* Damoh Special & Local Regional Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Columns: Damoh Local + Category Streams */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Damoh Local Section - Loaded initially */}
          <section>
            <CategoryHeader
              title="दमोह खास खबरें (Damoh Local News)"
              categorySlug={damohCategory?.slug}
              articleCount={damohArticles.length}
              icon={<span className="w-3 h-3 rounded-full bg-red-600"></span>}
              borderColorClass="border-red-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {damohArticles.slice(0, 4).map(article => (
                <div key={article.id} className="group flex flex-col gap-2 border rounded-xl p-3 bg-card hover:shadow-md transition-shadow">
                  <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} className="aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <ResponsiveImage src={article.imageUrl} alt={article.title} type="card" loading="lazy" defaultWidth={450} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
                  </PrefetchLink>
                  <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl}>
                    <h3 className="font-bold text-base leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </PrefetchLink>
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
          <LazySection minHeight="240px">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              
              {/* Politics */}
              <section className="space-y-4">
                <CategoryHeader
                  title="राजनीति (Politics)"
                  categorySlug={politicsCategory?.slug}
                  articleCount={politicsArticles.length}
                  borderColorClass="border-purple-600"
                  titleColorClass="text-purple-700 dark:text-purple-400"
                />
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
                <CategoryHeader
                  title="अपराध (Crime)"
                  categorySlug={crimeCategory?.slug}
                  articleCount={crimeArticles.length}
                  borderColorClass="border-red-700"
                  titleColorClass="text-red-700 dark:text-red-400"
                />
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
          </LazySection>

          {/* Other Categories Sections */}
          {otherCategorySections.map(({ category, articles: catArticles }) => (
            <LazySection key={category.id} minHeight="240px">
              <section className="space-y-4">
                <CategoryHeader
                  title={category.name}
                  categorySlug={category.slug}
                  articleCount={catArticles.length}
                  borderColorClass="border-red-600"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {catArticles.slice(0, 4).map(article => (
                    <div key={article.id} className="group flex flex-col gap-2 border rounded-xl p-3 bg-card hover:shadow-md transition-shadow">
                      <Link to={`/article/${article.slug}`} className="aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <ResponsiveImage src={article.imageUrl} alt={article.title} type="card" loading="lazy" defaultWidth={450} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
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
            </LazySection>
          ))}

        </div>

        {/* Sidebar Widgets: Most Viewed + Market Rates + Weather */}
        <div className="lg:col-span-4 space-y-8">
          <LazySection minHeight="300px">
            <div className="space-y-8">
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
          </LazySection>
        </div>

      </div>

      {/* Video News & Ground Report Gallery Section */}
      <LazySection minHeight="280px">
        <section className="bg-zinc-900 text-white rounded-2xl p-6 md:p-8 space-y-6">
          <CategoryHeader
            title="वीडियो बुलेटिन व ग्राउंड रिपोर्ट (Video News)"
            categorySlug={videoCategory?.slug}
            articleCount={videoNewsArticles.length}
            icon={<Play className="h-5 w-5 text-red-600 fill-current" />}
            borderColorClass="border-zinc-800"
            titleColorClass="text-white"
            isDarkBackground={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videoNewsArticles.map(art => (
              <Link to={`/article/${art.slug}`} key={art.id} className="group relative rounded-xl overflow-hidden aspect-video bg-zinc-800 block">
                <VideoThumbnail 
                  youtubeUrl={art.youtubeUrl} 
                  imageUrl={art.imageUrl} 
                  title={art.title} 
                />
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
      </LazySection>

      {/* Photo Gallery Grid */}
      <LazySection minHeight="200px">
        <section className="space-y-4">
          <CategoryHeader
            title="फोटो गैलरी (Photo Gallery)"
            categorySlug={photoCategory?.slug}
            articleCount={publishedArticles.length}
            icon={<Image className="h-5 w-5 text-purple-600" />}
            borderColorClass="border-zinc-900 dark:border-white"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {publishedArticles.slice(0, 4).map(art => (
              <Link to={`/article/${art.slug}`} key={art.id} className="group relative rounded-xl overflow-hidden aspect-square block bg-zinc-100 dark:bg-zinc-800">
                <ResponsiveImage src={art.imageUrl} alt={art.title} type="card" loading="lazy" defaultWidth={400} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                  <p className="text-xs font-bold text-white line-clamp-2">{art.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </LazySection>

      {/* Editorial Contact & News Tip Banner */}
      <LazySection minHeight="200px">
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
      </LazySection>

    </div>
  )
}
