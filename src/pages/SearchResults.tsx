import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { useNews } from "@/context/NewsContext"
import { motion } from "motion/react"
import { Clock, ChevronDown, Search, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { FirestoreErrorBanner } from "@/components/FirestoreErrorBanner"
import { ResponsiveImage } from "@/components/ResponsiveImage"
import { PrefetchLink } from "@/components/PrefetchLink"
import { Button } from "@/components/ui/button"

export function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const { articles, searchArticlesRemote, hasArticlesLoaded, isSyncingFirestore, firestoreSyncError, retryFirestoreSync } = useNews()
  const [visibleCount, setVisibleCount] = useState(6)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  // Remote Search on query change
  useEffect(() => {
    setVisibleCount(6)
    if (query.trim()) {
      document.title = `खोज: ${query.trim()} | दमोह Daily News`
      setIsSearching(true)
      searchArticlesRemote(query.trim()).finally(() => {
        setIsSearching(false)
      })
    } else {
      document.title = "समाचार खोजें | दमोह Daily News"
      setIsSearching(false)
    }
  }, [query, searchArticlesRemote])

  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    return articles.filter(a => {
      if (!a || (a.status || 'published') !== 'published') return false
      const titleMatch = (a.title || "").toLowerCase().includes(q)
      const excerptMatch = (a.excerpt || "").toLowerCase().includes(q)
      const contentMatch = (a.content || "").toLowerCase().includes(q)
      return titleMatch || excerptMatch || contentMatch
    }).sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
  }, [articles, query])

  const visibleResults = useMemo(() => searchResults.slice(0, visibleCount), [searchResults, visibleCount])

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < searchResults.length) {
          setVisibleCount(prev => Math.min(prev + 6, searchResults.length))
        }
      },
      { threshold: 0.2 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [visibleCount, searchResults.length])

  // 1. Error state if Firestore sync failed and no articles in memory
  if (firestoreSyncError && searchResults.length === 0 && !hasArticlesLoaded) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  // 2. Loading State: Search request or initial data sync is still in progress
  // NEVER show "0 results" / "कोई परिणाम नहीं मिला" while searching!
  const isLoading = (isSearching || (!hasArticlesLoaded && isSyncingFirestore)) && searchResults.length === 0

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 space-y-2.5">
          <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
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
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="container mx-auto px-4 py-8 max-w-7xl space-y-8"
    >
      {/* Search Header */}
      <div className="border-b-2 border-red-600 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Search className="h-6 w-6 text-red-600" />
            <span>खोज परिणाम (Search Results)</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            {query.trim() ? (
              <>
                "{query}" के लिए <span className="font-bold text-zinc-900 dark:text-white">{searchResults.length}</span> परिणाम मिले
              </>
            ) : (
              "कृपया खोजने के लिए कोई शब्द दर्ज करें"
            )}
          </p>
        </div>
      </div>
      
      {/* 3. Empty State: ONLY when query has returned and truly 0 items exist */}
      {searchResults.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-8 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {query.trim() ? "कोई परिणाम नहीं मिला" : "कोई खोज शब्द नहीं दिया गया"}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {query.trim() 
              ? `आपके खोज शब्द "${query}" से मेल खाता हुआ कोई समाचार नहीं मिला। कृपया वर्तनी जांचें या अन्य शब्दों से खोजें।`
              : "ताज़ा और प्रासंगिक समाचार देखने के लिए सर्च बार में शब्द दर्ज करें।"}
          </p>
          <Link to="/">
            <Button variant="outline" size="sm" className="text-xs font-bold mt-2">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> मुख्य पृष्ठ देखें
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* 4. Loaded with Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleResults.map((article, idx) => (
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
          {visibleCount < searchResults.length && (
            <div ref={loaderRef} className="text-center pt-8">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(prev => Math.min(prev + 6, searchResults.length))}
                className="px-6 py-2.5 font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                <span>और परिणाम लोड करें (Load More)</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
