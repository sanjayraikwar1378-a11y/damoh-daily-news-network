import React, { useState, useEffect, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { 
  Clock, 
  ThumbsUp, 
  MessageCircle, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  Eye, 
  AlertCircle,
  Youtube
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { getYouTubeEmbedUrl } from "@/lib/youtube"
import { ArticleShareBar } from "@/components/ArticleShareBar"

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { 
    articles, 
    reporters, 
    categories, 
    comments, 
    addComment, 
    incrementViews, 
    toggleLike, 
    bookmarks, 
    toggleBookmark, 
    addToHistory,
    adSettings 
  } = useNews()

  const [commentName, setCommentName] = useState("")
  const [commentEmail, setCommentEmail] = useState("")
  const [commentText, setCommentText] = useState("")
  const [commentSubmitted, setCommentSubmitted] = useState(false)

  const [hasLiked, setHasLiked] = useState(() => {
    try {
      return localStorage.getItem(`liked_${slug}`) === 'true'
    } catch {
      return false
    }
  })

  const handleLikeClick = () => {
    if (article) {
      toggleLike(article.id)
      const nextState = !hasLiked
      setHasLiked(nextState)
      try {
        localStorage.setItem(`liked_${slug}`, String(nextState))
      } catch {}
    }
  }

  // Safely decode slug without throwing URIError
  const decodedSlug = useMemo(() => {
    if (!slug) return ""
    try {
      return decodeURIComponent(slug)
    } catch {
      return slug
    }
  }, [slug])

  // Extremely robust article matching logic
  const article = useMemo(() => {
    if (!slug && !decodedSlug) return undefined

    return articles.find(a => {
      if (!a) return false
      const aSlug = a.slug || ""
      const aId = a.id || ""

      // Exact slug or decoded slug match
      if (aSlug === slug || aSlug === decodedSlug) return true

      // Exact ID match
      if (aId === slug || aId === decodedSlug) return true

      // Ends with -ID or _ID
      if (aId && (slug.endsWith(`-${aId}`) || decodedSlug.endsWith(`-${aId}`))) return true
      if (aId && (slug.endsWith(`_${aId}`) || decodedSlug.endsWith(`_${aId}`))) return true

      // Encoded slug match
      try {
        if (encodeURIComponent(aSlug) === slug) return true
      } catch {}

      // Normalize match (remove special characters and compare)
      const normSlug = slug.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '')
      const normASlug = aSlug.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '')
      if (normSlug && normASlug && (normSlug === normASlug || normASlug.includes(normSlug))) return true

      return false
    })
  }, [articles, slug, decodedSlug])

  // Track views and history safely and scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
    if (article?.id) {
      try {
        incrementViews(article.id)
        addToHistory(article.id)
      } catch (err) {
        console.error("Error updating article metrics:", err)
      }
    }
  }, [slug, article?.id])

  // Helper for safe date formatting
  const formatDateAgo = (dateStr?: string) => {
    if (!dateStr) return "हाल ही में"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return "हाल ही में"
      return `${formatDistanceToNow(d)} ago`
    } catch {
      return "हाल ही में"
    }
  }

  // 404 Page if article is not found or trashed
  if (!article || article.status === 'trash') {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-6xl font-black text-red-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          खबर उपलब्ध नहीं है (Article Not Found)
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">
          आप जिस खबर की तलाश कर रहे हैं वह हटा दी गई है, अप्रकाशित है या लिंक गलत है।
        </p>
        <Link to="/">
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
            <ChevronLeft className="h-4 w-4 mr-2" /> मुख्य पृष्ठ पर जाएं (Back to Home)
          </Button>
        </Link>
      </div>
    )
  }

  // Safe reporter resolution
  const reporter = reporters.find(r => r.id === article.reporterId) || reporters[0] || {
    id: "r1",
    name: "SANJAY RAIKWAR (संजय रैकवार)",
    role: "Chief Editor / मुख्य संपादक",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"
  }

  // Safe category filter
  const articleCategories = categories.filter(c => c && c.id && article.categoryIds?.includes(c.id))
  const isBookmarked = bookmarks.includes(article.id)
  
  // Safe comments filter
  const articleComments = comments.filter(c => c && c.articleId === article.id && c.status === 'approved')

  // Related articles filter
  const relatedArticles = articles
    .filter(a => a && a.id !== article.id && (a.status || 'published') === 'published' && a.categoryIds?.some(id => article.categoryIds?.includes(id)))
    .slice(0, 3)

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentName.trim() || !commentText.trim()) return

    addComment({
      articleId: article.id,
      articleTitle: article.title,
      userName: commentName.trim(),
      userEmail: commentEmail.trim() || 'anonymous@damohdaily.com',
      content: commentText.trim()
    })

    setCommentText("")
    setCommentSubmitted(true)
    setTimeout(() => setCommentSubmitted(false), 4000)
  }

  const articleImageUrl = article.imageUrl || "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?w=800&h=500&fit=crop"

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
        <span>/</span>
        {articleCategories[0] && (
          <>
            <Link to={`/category/${articleCategories[0].slug}`} className="hover:text-red-600 text-red-600 transition-colors">
              {articleCategories[0].name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-400 line-clamp-1">{article.title}</span>
      </div>

      <article className="space-y-6">
        {/* Categories Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {articleCategories.map(c => (
            <Link key={c.id} to={`/category/${c.slug}`}>
              <span className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-sm transition-colors">
                {c.name}
              </span>
            </Link>
          ))}
          {article.isBreaking && (
            <span className="bg-amber-500 text-black text-xs font-black px-3 py-1 rounded-sm animate-pulse">
              BREAKING
            </span>
          )}
          {article.status && article.status !== 'published' && (
            <span className="bg-zinc-800 text-amber-400 border border-amber-500/50 text-xs font-bold px-2.5 py-0.5 rounded-sm uppercase">
              {article.status} preview
            </span>
          )}
        </div>

        {/* Article Title */}
        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed border-l-4 border-red-600 pl-4 py-1">
            {article.excerpt}
          </p>
        )}

        {/* Metadata & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <img 
              src={reporter.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"} 
              alt={reporter.name} 
              className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100" 
            />
            <div>
              <div className="font-bold text-sm text-zinc-900 dark:text-white">{reporter.name}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateAgo(article.publishedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={hasLiked ? "default" : "outline"} 
              size="sm" 
              onClick={handleLikeClick}
              className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' : 'text-zinc-700 dark:text-zinc-300 hover:text-red-600'}`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{hasLiked ? 'Liked' : 'Like'}</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toggleBookmark(article.id)}
              className={`flex items-center gap-1 ${isBookmarked ? 'text-red-600 border-red-600' : 'text-zinc-700 dark:text-zinc-300'}`}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
              <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </Button>

            <div className="pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <ArticleShareBar 
                title={article.title} 
                imageUrl={articleImageUrl} 
                variant="compact" 
              />
            </div>
          </div>
        </div>

        {/* Feature Image */}
        <figure>
          <img 
            src={articleImageUrl || undefined} 
            alt={article.title}
            className="w-full rounded-xl shadow-sm object-cover max-h-[520px] bg-zinc-100 dark:bg-zinc-900"
          />
        </figure>

        {/* Article Body Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed py-4 text-base md:text-lg">
          {article.content || article.excerpt || "कोई विस्तृत सामग्री उपलब्ध नहीं है।"}
        </div>

        {/* Embedded YouTube Video Player (Responsive) */}
        {article.youtubeUrl && getYouTubeEmbedUrl(article.youtubeUrl) && (
          <div className="my-8 space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white border-l-4 border-red-600 pl-3">
              <Youtube className="h-5 w-5 text-red-600" />
              <span>विशेष वीडियो रिपोर्ट (Video Coverage)</span>
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md border border-zinc-200 dark:border-zinc-800">
              <iframe
                src={getYouTubeEmbedUrl(article.youtubeUrl) || undefined}
                title={`${article.title} - Video Report`}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* In-Article Ad Banner */}
        {Boolean(adSettings?.articleAd?.enabled) && Boolean(adSettings?.articleAd?.imageUrl?.trim()) && (
          <div className="my-8 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Advertisement</span>
            <a href={adSettings.articleAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
              <img src={adSettings.articleAd.imageUrl || undefined} alt="Ad" className="mx-auto rounded max-h-40 object-cover" />
            </a>
          </div>
        )}

        {/* Tags */}
        {articleCategories.length > 0 && (
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase">Tags:</span>
            {articleCategories.map(c => (
              <Link to={`/category/${c.slug}`} key={c.id}>
                <span className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-700 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors">
                  #{c.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Dedicated Social Sharing Section */}
        <ArticleShareBar 
          title={article.title} 
          imageUrl={articleImageUrl} 
          variant="full" 
        />

        {/* Comments Section */}
        <div className="pt-10 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-red-600" /> टिप्पणियां (Comments) ({articleComments.length})
          </h3>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">अपनी राय व्यक्त करें (Post a Comment)</h4>
            
            {commentSubmitted && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
                आपकी टिप्पणी सबमिट कर दी गई है। समीक्षा के बाद प्रकाशित की जाएगी।
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="आपका नाम (Your Name) *" 
                required
                value={commentName}
                onChange={e => setCommentName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <input 
                type="email" 
                placeholder="ईमेल (Email Optional)" 
                value={commentEmail}
                onChange={e => setCommentEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <textarea 
              rows={3} 
              placeholder="आपकी टिप्पणी (Your Comment) *" 
              required
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold">
              टिप्पणी भेजें (Submit Comment)
            </Button>
          </form>

          {/* Existing Approved Comments */}
          <div className="space-y-4">
            {articleComments.map(c => (
              <div key={c.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">{c.userName}</span>
                  <span className="text-xs text-zinc-400">{formatDateAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{c.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related News */}
        {relatedArticles.length > 0 && (
          <div className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
              संबंधित खबरें (Related News)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map(rel => (
                <Link to={`/article/${rel.slug}`} key={rel.id} className="group flex flex-col gap-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <img 
                      src={rel.imageUrl || "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?w=800&h=500&fit=crop"} 
                      alt={rel.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="font-bold text-sm leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  <span className="text-xs text-zinc-400">
                    {formatDateAgo(rel.publishedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </motion.div>
  )
}
