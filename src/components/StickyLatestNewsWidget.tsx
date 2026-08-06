import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChevronRight, Flame, User, BookOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNews } from '@/context/NewsContext'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { PrefetchLink } from '@/components/PrefetchLink'
import { getReadingTime, isWithin2Hours } from '@/lib/utils'

interface StickyLatestNewsWidgetProps {
  currentArticleId?: string
  limit?: number
  className?: string
}

export function StickyLatestNewsWidget({
  currentArticleId,
  limit = 8,
  className = ''
}: StickyLatestNewsWidgetProps) {
  const { articles, categories, reporters } = useNews()

  const latestArticles = useMemo(() => {
    return articles
      .filter(a => (a.status || 'published') === 'published' && a.id !== currentArticleId)
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
      .slice(0, limit)
  }, [articles, currentArticleId, limit])

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

  const getCategoryName = (categoryIds?: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return "ताज़ा खबर"
    const found = categories.find(c => categoryIds.includes(c.id))
    return found ? found.name : "ताज़ा खबर"
  }

  if (latestArticles.length === 0) return null

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${className}`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b-2 border-red-600 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-red-600 fill-current" />
            <span>लेटेस्ट न्यूज़ (Latest News)</span>
          </h3>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
          LIVE
        </span>
      </div>

      {/* Article Feed List */}
      <div className="divide-y divide-border/60">
        {latestArticles.map((article, index) => {
          const categoryName = getCategoryName(article.categoryIds)
          const reporterName = getReporterName(article.reporterId)
          const pubTimeAgo = formatDateAgo(article.publishedAt)
          const readTime = getReadingTime(article.content || article.excerpt)
          const isFresh = isWithin2Hours(article.publishedAt)
          const numberFormatted = String(index + 1).padStart(2, '0')

          return (
            <div key={article.id} className="py-3 first:pt-0 last:pb-0 group">
              <div className="flex items-start gap-3">
                {/* News Numbering Badge */}
                <span className="text-lg font-black text-red-600 dark:text-red-500 font-mono select-none pt-0.5 shrink-0">
                  {numberFormatted}
                </span>

                {/* Article Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                    <span className="text-red-600 dark:text-red-400 uppercase tracking-wider">
                      {categoryName}
                    </span>
                    {isFresh && (
                      <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Headline Link */}
                  <PrefetchLink 
                    to={`/article/${article.slug}`} 
                    articleSlug={article.slug} 
                    articleImageUrl={article.imageUrl}
                    className="block"
                  >
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                  </PrefetchLink>

                  {/* Metadata: Time + Read Time */}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-red-500" />
                      <span>{pubTimeAgo}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-zinc-400" />
                      <span>{readTime}</span>
                    </span>
                  </div>
                </div>

                {/* Small Thumbnail Image */}
                <PrefetchLink 
                  to={`/article/${article.slug}`} 
                  articleSlug={article.slug} 
                  articleImageUrl={article.imageUrl}
                  className="w-16 h-16 sm:w-20 sm:h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0 block relative"
                >
                  <ResponsiveImage
                    src={article.imageUrl}
                    alt={article.title}
                    type="card"
                    loading="lazy"
                    defaultWidth={160}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </PrefetchLink>
              </div>
            </div>
          )
        })}
      </div>

      {/* See All Button */}
      <div className="pt-2 border-t border-border">
        <Link 
          to="/latest-news" 
          className="flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 px-3 py-2 rounded-xl transition-all"
        >
          <span>सभी लेटेस्ट न्यूज़ पढ़ें (See All Latest News)</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
