import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useNews } from "@/context/NewsContext"
import { motion } from "motion/react"
import { Clock, ChevronDown, FolderOpen, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { WeatherWidget } from "@/components/WeatherWidget"
import { FirestoreErrorBanner } from "@/components/FirestoreErrorBanner"
import { ResponsiveImage } from "@/components/ResponsiveImage"
import { PrefetchLink } from "@/components/PrefetchLink"
import { Button } from "@/components/ui/button"

export function CategoryPage() {
  const { slug } = useParams()
  const { 
    categories, 
    articles, 
    fetchCategoryArticles, 
    hasArticlesLoaded,
    isSyncingFirestore, 
    firestoreSyncError, 
    retryFirestoreSync 
  } = useNews()
  
  const [visibleCount, setVisibleCount] = useState(6)
  const [isFetchingLocal, setIsFetchingLocal] = useState<boolean>(true)
  const loaderRef = useRef<HTMLDivElement | null>(null)
  
  const category = useMemo(() => categories.find(c => c.slug === slug), [categories, slug])

  // SEO effect for title, meta tags, and canonical URL
  useEffect(() => {
    if (category) {
      document.title = `${category.name} | दमोह Daily News`
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', `${category.name} की सभी ताज़ा और बड़ी ख़बरें - Damoh Daily News Network.`)

      const fullUrl = `${window.location.origin}/category/${slug}`
      let canonicalEl = document.querySelector('link[rel="canonical"]')
      if (!canonicalEl) {
        canonicalEl = document.createElement('link')
        canonicalEl.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalEl)
      }
      canonicalEl.setAttribute('href', fullUrl)
    }
  }, [category, slug])

  // Filter existing in-memory articles matching this category
  const categoryArticles = useMemo(() => {
    if (!category) return []
    return articles
      .filter(a => (a.status || 'published') === 'published' && a.categoryIds?.includes(category.id))
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
  }, [category, articles])

  // Fetch full category articles on demand
  useEffect(() => {
    setVisibleCount(6) // Reset pagination on category change
    if (category?.id) {
      const hasCachedArticles = articles.some(
        a => (a.status || 'published') === 'published' && a.categoryIds?.includes(category.id)
      )
      if (!hasCachedArticles) {
        setIsFetchingLocal(true)
      } else {
        setIsFetchingLocal(false)
      }

      fetchCategoryArticles(category.id).finally(() => {
        setIsFetchingLocal(false)
      })
    } else {
      setIsFetchingLocal(false)
    }
  }, [slug, category?.id, fetchCategoryArticles])

  const visibleArticles = useMemo(() => categoryArticles.slice(0, visibleCount), [categoryArticles, visibleCount])

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < categoryArticles.length) {
          setVisibleCount(prev => Math.min(prev + 6, categoryArticles.length))
        }
      },
      { threshold: 0.2 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [visibleCount, categoryArticles.length])

  // 1. Error state if Firestore sync failed and no articles in memory
  if (firestoreSyncError && categoryArticles.length === 0 && !hasArticlesLoaded) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  // 2. Loading State: Show clean skeletons while request is pending
  // NEVER show "0 News" / "कोई खबर नहीं" while loading!
  const isCategoryLoading = (isFetchingLocal || (!hasArticlesLoaded && isSyncingFirestore)) && categoryArticles.length === 0

  if (isCategoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 space-y-2.5">
          <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="border border-border/60 rounded-2xl p-4 bg-card space-y-3 animate-pulse">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-5 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isWeatherCategory = slug === 'weather' || Boolean(category?.name && (category.name.includes('मौसम') || category.name.toLowerCase().includes('weather')))
  
  if (!category && hasArticlesLoaded) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto">
          <FolderOpen className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">श्रेणी नहीं मिली (Category not found)</h2>
        <p className="text-xs text-zinc-500">आप जिस श्रेणी को खोज रहे हैं वह उपलब्ध नहीं है या हटा दी गई है।</p>
        <Link to="/">
          <Button variant="outline" className="text-xs font-bold mt-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> मुख्य पृष्ठ पर जाएं (Home)
          </Button>
        </Link>
      </div>
    )
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="container mx-auto px-4 py-8 max-w-7xl space-y-8"
    >
      {/* Category Header */}
      <div className="border-b-2 border-red-600 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block shrink-0" />
            <span>{category?.name || "श्रेणी"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            {categoryArticles.length} {categoryArticles.length === 1 ? 'खबर' : 'खबरें'} (Articles)
          </p>
        </div>
      </div>

      {/* Show live Weather Widget if on weather category */}
      {isWeatherCategory && (
        <div className="max-w-2xl">
          <WeatherWidget />
        </div>
      )}
      
      {/* 3. Empty State: ONLY rendered when load is 100% complete and results are truly 0 */}
      {categoryArticles.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-8 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 mx-auto">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            इस श्रेणी में अभी कोई खबर उपलब्ध नहीं है।
          </h3>
          <p className="text-xs text-zinc-500">
            दमोह और आस-पास के क्षेत्रों से नई खबरें जल्द ही इस श्रेणी में जोड़ी जाएंगी।
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="text-xs font-bold mt-2">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> मुख्य पृष्ठ देखें
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* 4. Loaded with Data: Render article grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleArticles.map((article, idx) => (
              <PrefetchLink 
                to={`/article/${article.slug}`} 
                articleSlug={article.slug} 
                articleImageUrl={article.imageUrl}
                key={article.id} 
                className="group flex flex-col gap-3 border border-border rounded-2xl p-3 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm bg-zinc-100 dark:bg-zinc-800">
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
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <h3 className="font-bold text-base sm:text-lg leading-snug group-hover:text-red-600 transition-colors line-clamp-2 text-zinc-900 dark:text-white">
                    {article.title}
                  </h3>
                  <p className="text-zinc-500 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                  <div className="text-[11px] text-zinc-400 mt-auto pt-2 flex items-center gap-1 border-t border-border/50">
                    <Clock className="h-3 w-3 text-red-500" /> 
                    <span>
                      {(() => {
                        try {
                          const d = new Date(article.publishedAt)
                          return isNaN(d.getTime()) ? "हाल ही में" : `${formatDistanceToNow(d)} ago`
                        } catch {
                          return "हाल ही में"
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </PrefetchLink>
            ))}
          </div>

          {/* Infinite Scroll loader & Load More trigger */}
          {visibleCount < categoryArticles.length && (
            <div ref={loaderRef} className="text-center pt-8">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(prev => Math.min(prev + 6, categoryArticles.length))}
                className="px-6 py-2.5 font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                <span>और खबरें लोड करें (Load More)</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
