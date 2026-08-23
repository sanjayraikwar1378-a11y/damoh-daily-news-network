import React, { useState, useMemo, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { Clock, Search, Filter, User, Bookmark, ChevronRight, Flame, Sparkles, Tag, BookOpen } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useNews } from "@/context/NewsContext"
import { ResponsiveImage } from "@/components/ResponsiveImage"
import { PrefetchLink } from "@/components/PrefetchLink"
import { FirestoreErrorBanner } from "@/components/FirestoreErrorBanner"
import { Button } from "@/components/ui/button"
import { getReadingTime, isWithin2Hours } from "@/lib/utils"

export function LatestNewsPage() {
  const { 
    articles, 
    categories, 
    reporters, 
    bookmarks, 
    toggleBookmark, 
    isSyncingFirestore, 
    firestoreSyncError, 
    retryFirestoreSync,
    hasMoreArticles,
    fetchMoreArticles 
  } = useNews()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [visibleCount, setVisibleCount] = useState<number>(12)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  // SEO effect for title, meta tags, canonical link and Breadcrumb JSON-LD
  useEffect(() => {
    document.title = "लेटेस्ट न्यूज़ (Latest News) | दमोह Daily News"
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', 'दमोह Daily News Network से सभी ताज़ा और नए समाचार निष्पक्षता और विश्वसनीयता के साथ पढ़ें।')

    // Canonical URL
    const fullUrl = `${window.location.origin}/latest-news`
    let canonicalEl = document.querySelector('link[rel="canonical"]')
    if (!canonicalEl) {
      canonicalEl = document.createElement('link')
      canonicalEl.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalEl)
    }
    canonicalEl.setAttribute('href', fullUrl)

    // Breadcrumb JSON-LD schema
    let jsonLd = document.getElementById('latest-news-json-ld')
    if (!jsonLd) {
      jsonLd = document.createElement('script')
      jsonLd.id = 'latest-news-json-ld'
      jsonLd.setAttribute('type', 'application/ld+json')
      document.head.appendChild(jsonLd)
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
        { "@type": "ListItem", "position": 2, "name": "Latest News", "item": fullUrl }
      ]
    })
  }, [])

  // Filter only published articles and sort newest first
  const publishedArticles = useMemo(() => {
    return articles
      .filter(a => (a.status || 'published') === 'published')
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
  }, [articles])

  // Filtered list based on search and category
  const filteredArticles = useMemo(() => {
    return publishedArticles.filter(art => {
      // Category filter
      if (selectedCategory !== "all" && !art.categoryIds?.includes(selectedCategory)) {
        return false
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const titleMatch = art.title.toLowerCase().includes(query)
        const excerptMatch = art.excerpt?.toLowerCase().includes(query)
        const contentMatch = art.content?.toLowerCase().includes(query)
        const reporter = reporters.find(r => r.id === art.reporterId)
        const reporterMatch = reporter?.name.toLowerCase().includes(query)
        if (!titleMatch && !excerptMatch && !contentMatch && !reporterMatch) {
          return false
        }
      }
      return true
    })
  }, [publishedArticles, selectedCategory, searchQuery, reporters])

  const visibleArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount)
  }, [filteredArticles, visibleCount])

  const hasMore = visibleCount < filteredArticles.length || hasMoreArticles

  const handleLoadMore = async () => {
    if (isLoadingMore) return
    if (visibleCount < filteredArticles.length) {
      setVisibleCount(prev => prev + 12)
    } else if (hasMoreArticles) {
      setIsLoadingMore(true)
      await fetchMoreArticles()
      setIsLoadingMore(false)
      setVisibleCount(prev => prev + 12)
    }
  }

  // Infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && (visibleCount < filteredArticles.length || hasMoreArticles)) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [visibleCount, filteredArticles.length, hasMoreArticles, isLoadingMore])

  // Reset pagination when filter or search changes
  useEffect(() => {
    setVisibleCount(12)
  }, [searchQuery, selectedCategory])

  const formatDateAgo = (dateStr?: string) => {
    if (!dateStr) return "हाल ही में"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return "हाल ही में"
      return `${formatDistanceToNow(d)} पहले`
    } catch {
      return "हाल ही में"
    }
  }

  const getReporterName = (reporterId?: string) => {
    if (!reporterId) return "विशेष संवाददाता"
    const found = reporters.find(r => r.id === reporterId)
    return found?.name || "विशेष संवाददाता"
  }

  const getCategoryInfo = (categoryIds?: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return { name: "ताज़ा खबर", slug: "news" }
    const found = categories.find(c => categoryIds.includes(c.id))
    return found ? { name: found.name, slug: found.slug } : { name: "ताज़ा खबर", slug: "news" }
  }

  if (firestoreSyncError && publishedArticles.length === 0) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-3 sm:px-4 md:px-6 py-6 max-w-7xl space-y-8"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-2xl p-6 md:p-8 shadow-lg space-y-4 border border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-1">
                <Flame className="h-4 w-4" /> LIVE UPDATE FEED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              लेटेस्ट न्यूज़ (Latest News)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl font-medium">
              दमोह Daily News Network से सभी ताज़ा और नए समाचार। यह फ़ीड रियल-टाइम में स्वतः अपडेट होता है।
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-800/80 px-4 py-2.5 rounded-xl border border-zinc-700/50">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold uppercase">कुल प्रकाशित समाचार</span>
              <strong className="text-lg font-black text-white">{filteredArticles.length} खबरें</strong>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-6 lg:col-span-7 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="शीर्षक, विवरण या संवाददाता से खोजें..."
              aria-label="खोजें"
              className="w-full bg-zinc-800/90 border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-zinc-400 outline-none focus:ring-2 focus:ring-red-600 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                aria-label="खोज साफ़ करें"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="md:col-span-6 lg:col-span-5 relative flex items-center">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="श्रेणी चुनें"
              className="w-full bg-zinc-800/90 border border-zinc-700 text-white rounded-xl pl-10 pr-8 py-2.5 text-xs outline-none focus:ring-2 focus:ring-red-600 appearance-none transition-all font-semibold cursor-pointer"
            >
              <option value="all">सभी श्रेणियां (All Categories)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Category Pills Quick Filter Scrollbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="श्रेणी फिल्टर्स">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === "all" 
              ? "bg-red-600 text-white shadow-sm" 
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          सब (All)
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id 
                ? "bg-red-600 text-white shadow-sm" 
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Loading Skeleton state */}
      {isSyncingFirestore && publishedArticles.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="border rounded-2xl p-4 bg-card space-y-4 animate-pulse">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty Search / Filter Result */}
      {!isSyncingFirestore && filteredArticles.length === 0 && (
        <div className="text-center py-16 bg-card border rounded-2xl p-8 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">कोई समाचार नहीं मिला</h3>
          <p className="text-xs text-zinc-500">
            आपकी चुनी हुई श्रेणी या खोज '<strong>{searchQuery}</strong>' के तहत कोई प्रकाशित खबर नहीं है।
          </p>
          <Button 
            variant="outline" 
            onClick={() => { setSearchQuery(""); setSelectedCategory("all") }}
            className="text-xs font-bold mt-2"
          >
            फिल्टर हटाएं (Reset Filters)
          </Button>
        </div>
      )}

      {/* Article Cards Responsive Grid */}
      {visibleArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleArticles.map((article, idx) => {
            const categoryInfo = getCategoryInfo(article.categoryIds)
            const reporterName = getReporterName(article.reporterId)
            const pubTime = formatDateAgo(article.publishedAt)
            const readTime = getReadingTime(article.content || article.excerpt)
            const isFresh = isWithin2Hours(article.publishedAt)
            const numberFormatted = String(idx + 1).padStart(2, '0')

            return (
              <div 
                key={article.id} 
                className="group flex flex-col justify-between border border-border rounded-2xl overflow-hidden bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
              >
                <div className="space-y-3 p-4">
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900">
                    <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} className="block w-full h-full">
                      <ResponsiveImage 
                        src={article.imageUrl} 
                        alt={article.title} 
                        type="card" 
                        loading={idx < 2 ? "eager" : "lazy"} 
                        fetchPriority={idx === 0 ? "high" : "auto"}
                        width={480}
                        height={270}
                        aspectRatio="16/9"
                        defaultWidth={480}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      />
                    </PrefetchLink>
                    
                    {/* Category Badge & News Number Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="bg-black/80 text-white text-[10px] font-mono font-black px-2 py-0.5 rounded backdrop-blur-sm border border-white/20">
                        {numberFormatted}
                      </span>
                      <Link 
                        to={`/category/${categoryInfo.slug}`}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider shadow-md transition-colors block"
                      >
                        {categoryInfo.name}
                      </Link>
                    </div>

                    {/* Fresh "NEW" Badge Overlay */}
                    {isFresh && (
                      <div className="absolute bottom-2.5 left-2.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse uppercase tracking-wider">
                        NEW UPDATE
                      </div>
                    )}

                    {/* Bookmark overlay button */}
                    <button 
                      onClick={() => toggleBookmark(article.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-colors"
                      title="सहेजें (Bookmark)"
                      aria-label="समाचार सहेजें"
                    >
                      <Bookmark className={`h-4 w-4 ${bookmarks.includes(article.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Publication Time, Reading Time & Reporter Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{pubTime}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{readTime}</span>
                      </span>
                    </div>

                    <span className="flex items-center gap-1 truncate max-w-[130px]" title={reporterName}>
                      <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{reporterName}</span>
                    </span>
                  </div>

                  {/* Article Headline */}
                  <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl} className="block">
                    <h2 className="font-bold text-base sm:text-lg leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 text-zinc-900 dark:text-white">
                      {article.title}
                    </h2>
                  </PrefetchLink>

                  {/* Article Short Summary (2 lines) */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* Card Footer: Read More Button without Public View/Like Counters */}
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-border flex items-center justify-between mt-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {categoryInfo.name}
                  </span>

                  <PrefetchLink to={`/article/${article.slug}`} articleSlug={article.slug} articleImageUrl={article.imageUrl}>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-1"
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
      )}

      {/* Infinite Scroll trigger element or Load More Button */}
      {hasMore && (
        <div ref={loaderRef} className="py-8 text-center flex flex-col items-center justify-center space-y-3">
          <Button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <span>{isLoadingMore ? "लोड हो रहा है..." : "और खबरें लोड करें (Load More News)"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-[11px] text-zinc-400">
            {visibleArticles.length} articles shown
          </span>
        </div>
      )}
    </motion.div>
  )
}
