import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useNews } from "@/context/NewsContext"
import { motion } from "motion/react"
import { Clock, ChevronDown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { WeatherWidget } from "@/components/WeatherWidget"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { FirestoreErrorBanner } from "@/components/FirestoreErrorBanner"
import { ResponsiveImage } from "@/components/ResponsiveImage"

export function CategoryPage() {
  const { slug } = useParams()
  const { categories, articles, isSyncingFirestore, firestoreSyncError, retryFirestoreSync } = useNews()
  const [visibleCount, setVisibleCount] = useState(6)
  const loaderRef = useRef<HTMLDivElement | null>(null)
  
  const category = useMemo(() => categories.find(c => c.slug === slug), [categories, slug])
  const categoryArticles = useMemo(() => {
    if (!category) return []
    return articles.filter(a => (a.status || 'published') === 'published' && a.categoryIds?.includes(category.id))
  }, [category, articles])
  const visibleArticles = useMemo(() => categoryArticles.slice(0, visibleCount), [categoryArticles, visibleCount])

  // Infinite Scroll Trigger
  useEffect(() => {
    setVisibleCount(6) // Reset on category change
  }, [slug])

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
  
  if (firestoreSyncError && categoryArticles.length === 0) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  if (isSyncingFirestore && categoryArticles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4 space-y-2">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="space-y-3">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
              <div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isWeatherCategory = slug === 'weather' || Boolean(category?.name && (category.name.includes('मौसम') || category.name.toLowerCase().includes('weather')))
  
  if (!category) {
    return (
      <div className="container py-20 text-center font-bold text-zinc-500">
        श्रेणी नहीं मिली (Category not found)
      </div>
    )
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl space-y-8"
    >
      <div className="border-b-2 border-zinc-900 dark:border-white pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {category.name}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {categoryArticles.length} articles in this category
        </p>
      </div>

      {/* Show live Weather Widget if on weather category */}
      {isWeatherCategory && (
        <div className="max-w-2xl">
          <WeatherWidget />
        </div>
      )}
      
      {categoryArticles.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 font-medium">
          इस श्रेणी में अभी कोई समाचार उपलब्ध नहीं है।
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleArticles.map(article => (
              <Link to={`/article/${article.slug}`} key={article.id} className="group flex flex-col gap-3">
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm bg-zinc-100 dark:bg-zinc-800">
                  <ResponsiveImage 
                    src={article.imageUrl} 
                    alt={article.title}
                    type="card"
                    loading="lazy"
                    defaultWidth={480}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-red-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-zinc-500 text-sm line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="text-xs text-zinc-400 mt-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {(() => {
                    try {
                      const d = new Date(article.publishedAt)
                      return isNaN(d.getTime()) ? "recently" : `${formatDistanceToNow(d)} ago`
                    } catch {
                      return "recently"
                    }
                  })()}
                </div>
              </Link>
            ))}
          </div>

          {/* Infinite Scroll loader & Load More trigger */}
          {visibleCount < categoryArticles.length && (
            <div ref={loaderRef} className="text-center pt-8">
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 6, categoryArticles.length))}
                className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                और खबरें लोड करें <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
