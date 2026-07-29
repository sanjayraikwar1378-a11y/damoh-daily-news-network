import { useSearchParams, Link } from "react-router-dom"
import { useNews } from "@/context/NewsContext"
import { motion } from "motion/react"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const { articles } = useNews()
  
  const searchResults = articles.filter(a => {
    if (!a) return false
    const q = query.toLowerCase()
    const titleMatch = (a.title || "").toLowerCase().includes(q)
    const excerptMatch = (a.excerpt || "").toLowerCase().includes(q)
    const contentMatch = (a.content || "").toLowerCase().includes(q)
    return titleMatch || excerptMatch || contentMatch
  })
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="mb-8 border-b-2 border-zinc-900 dark:border-white pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Search Results
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found for "{query}"
        </p>
      </div>
      
      {searchResults.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No articles found matching your search. Try different keywords.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map(article => (
            <Link to={`/article/${article.slug}`} key={article.id} className="group flex flex-col gap-3">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-sm">
                <img 
                  src={article.imageUrl || undefined} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
      )}
    </motion.div>
  )
}
