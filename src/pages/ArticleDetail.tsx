import React, { useState, useEffect, useMemo, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { 
  Clock, 
  ThumbsUp, 
  MessageCircle, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  AlertCircle,
  Youtube,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { getYouTubeEmbedUrl } from "@/lib/youtube"
import { YouTubeEmbedFacade } from "@/components/YouTubeEmbedFacade"
import { ArticleShareBar } from "@/components/ArticleShareBar"
import { db, collection, query, where, getDocs, doc, getDoc } from "@/lib/firebase"
import { Comment, Article } from "@/data/mock"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { FirestoreErrorBanner } from "@/components/FirestoreErrorBanner"
import { ResponsiveImage } from "@/components/ResponsiveImage"
import { LazySection } from "@/components/LazySection"
import { getCachedArticle, fetchArticleBySlugOrId, saveArticleToCache, getSSRArticle, isMatchingArticle, normalizeSlug } from "@/lib/articleCache"
import { AuthorByline } from "@/components/AuthorByline"
import { StickyLatestNewsWidget } from "@/components/StickyLatestNewsWidget"
import { ArticleTextToSpeech } from "@/components/ArticleTextToSpeech"
import { getReadingTime } from "@/lib/utils"
import { formatArticleContentForDisplay } from "@/lib/sanitize"

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
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
    adSettings,
    isSyncingFirestore,
    firestoreSyncError,
    retryFirestoreSync
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
  const contextArticle = useMemo(() => {
    if (!slug && !decodedSlug) return undefined
    const key = decodedSlug || slug || ""
    return articles.find(a => isMatchingArticle(a, key))
  }, [articles, slug, decodedSlug])

  // Target key (slug or ID)
  const targetKey = decodedSlug || slug || ""

  // Synchronously resolve initial article from context, SSR script tag, or in-memory cache
  const initialArticle = useMemo(() => {
    if (contextArticle && isMatchingArticle(contextArticle, targetKey)) return contextArticle
    if (!targetKey) return null
    const cached = getCachedArticle(targetKey)
    if (cached && isMatchingArticle(cached, targetKey)) return cached
    const ssr = getSSRArticle()
    if (ssr && isMatchingArticle(ssr, targetKey)) return ssr
    return null
  }, [contextArticle, targetKey])

  // Direct article state to store loaded article data without ever clearing to null
  const [directArticle, setDirectArticle] = useState<Article | null>(() => initialArticle)
  const [isArticleFetchDone, setIsArticleFetchDone] = useState<boolean>(() => Boolean(initialArticle))

  // Background fetch to synchronize data from Firestore without showing loading screen
  useEffect(() => {
    if (!targetKey) {
      setIsArticleFetchDone(true)
      return
    }

    if (contextArticle && isMatchingArticle(contextArticle, targetKey)) {
      setDirectArticle(contextArticle)
      saveArticleToCache(contextArticle)
      setIsArticleFetchDone(true)
      return
    }

    let isMounted = true

    // Background fetch - NEVER clears existing article state
    fetchArticleBySlugOrId(targetKey)
      .then((art) => {
        if (isMounted) {
          if (art && isMatchingArticle(art, targetKey)) {
            setDirectArticle(art)
            saveArticleToCache(art)
          }
          setIsArticleFetchDone(true)
        }
      })
      .catch((err) => {
        console.warn("Background article sync notice:", err)
        if (isMounted) {
          setIsArticleFetchDone(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [targetKey, contextArticle?.id])

  // Active article: prefer context -> direct state -> cache -> SSR, ensuring targetKey matches strictly
  const rawArticle = contextArticle || directArticle || getCachedArticle(targetKey) || getSSRArticle() || null
  const article = (rawArticle && isMatchingArticle(rawArticle, targetKey)) ? rawArticle : null

  // Strict production assertion to guarantee no mismatched or demo article is rendered
  useEffect(() => {
    if (rawArticle && targetKey && !isMatchingArticle(rawArticle, targetKey)) {
      console.warn("Prevented mismatched article render", {
        requestedSlug: targetKey,
        receivedSlug: rawArticle.slug,
        receivedId: rawArticle.id
      })
    }
  }, [rawArticle, targetKey])

  // Canonical slug auto-redirect on client (e.g. from old broken links with duplicate ID suffixes)
  useEffect(() => {
    if (article && article.slug && slug) {
      const current = decodedSlug || slug;
      if (current !== article.slug && isMatchingArticle(article, current)) {
        navigate(`/article/${encodeURIComponent(article.slug)}`, { replace: true });
      }
    }
  }, [article?.slug, slug, decodedSlug, navigate])

  // Ref to prevent multiple view counts on re-renders for the same article ID
  const trackedArticleIdRef = useRef<string | null>(null)

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
  }, [slug])

  // Track views and history ONCE per article ID
  const articleId = article?.id
  useEffect(() => {
    if (articleId && trackedArticleIdRef.current !== articleId) {
      trackedArticleIdRef.current = articleId
      try {
        incrementViews(articleId)
        addToHistory(articleId)
      } catch (err) {
        console.error("Error updating article metrics:", err)
      }
    }
  }, [articleId])

  // Dynamic meta tags on client side for single page navigation
  useEffect(() => {
    if (article) {
      document.title = `${article.title} - Damoh Daily News`

      const updateMetaTag = (attrName: string, attrVal: string, content: string) => {
        let el = document.querySelector(`meta[${attrName}="${attrVal}"]`)
        if (!el) {
          el = document.createElement('meta')
          el.setAttribute(attrName, attrVal)
          document.head.appendChild(el)
        }
        el.setAttribute('content', content)
      }

      const cleanSlug = article.slug || article.id || slug || ""
      const isLocalOrPreview = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' || 
        window.location.hostname.includes('ais-') ||
        window.location.hostname.includes('127.0.0.1')
      )
      const canonicalOrigin = isLocalOrPreview ? window.location.origin : 'https://damoh-daily-news-network.vercel.app'
      const canonicalUrl = `${canonicalOrigin}/article/${cleanSlug}`
      const desc = article.excerpt || article.title
      const img = article.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop"

      const authorName = (article as any).authorName || reporter?.name || 'Damoh Daily News'
      updateMetaTag('name', 'description', desc)
      updateMetaTag('property', 'og:type', 'article')
      updateMetaTag('property', 'og:site_name', 'Damoh Daily News')
      updateMetaTag('property', 'og:title', article.title)
      updateMetaTag('property', 'og:description', desc)
      updateMetaTag('property', 'og:image', img)
      updateMetaTag('property', 'og:image:secure_url', img)
      updateMetaTag('property', 'og:url', canonicalUrl)
      updateMetaTag('property', 'article:published_time', article.publishedAt || new Date().toISOString())
      updateMetaTag('property', 'article:author', authorName)

      updateMetaTag('name', 'twitter:card', 'summary_large_image')
      updateMetaTag('name', 'twitter:site', '@DamohDailyNews')
      updateMetaTag('name', 'twitter:title', article.title)
      updateMetaTag('name', 'twitter:description', desc)
      updateMetaTag('name', 'twitter:image', img)

      // Canonical link tag update
      let canonicalEl = document.querySelector('link[rel="canonical"]')
      if (!canonicalEl) {
        canonicalEl = document.createElement('link')
        canonicalEl.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalEl)
      }
      canonicalEl.setAttribute('href', canonicalUrl)

      // JSON-LD NewsArticle schema tag update
      let jsonLdEl = document.getElementById('article-json-ld')
      if (!jsonLdEl) {
        jsonLdEl = document.createElement('script')
        jsonLdEl.id = 'article-json-ld'
        jsonLdEl.setAttribute('type', 'application/ld+json')
        document.head.appendChild(jsonLdEl)
      }
      const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
        "headline": article.title,
        "description": desc,
        "articleBody": (article.content ? article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : desc),
        "image": [img],
        "datePublished": article.publishedAt || new Date().toISOString(),
        "dateModified": article.updatedAt || article.publishedAt || new Date().toISOString(),
        "author": { "@type": "Person", "name": authorName },
        "publisher": {
          "@type": "Organization",
          "name": "Damoh Daily News",
          "url": window.location.origin
        }
      }
      jsonLdEl.textContent = JSON.stringify(jsonLdData)
    }
  }, [article?.id, article?.title, article?.excerpt, article?.imageUrl])

  // On-demand fetch for approved comments
  const [fetchedComments, setFetchedComments] = useState<Comment[]>([])

  useEffect(() => {
    if (article?.id) {
      const q = query(
        collection(db, "comments"),
        where("articleId", "==", article.id),
        where("status", "==", "approved")
      )
      getDocs(q).then((snap) => {
        const list: Comment[] = []
        const seen = new Set<string>()
        snap.forEach(d => {
          const data = d.data() as Comment
          const cid = data.id || d.id
          if (!seen.has(cid)) {
            seen.add(cid)
            list.push({ ...data, id: cid })
          }
        })
        setFetchedComments(list)
      }).catch(() => {})
    }
  }, [article?.id])

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

  // Friendly error banner if both direct fetch and Firestore sync failed
  if (!article && isArticleFetchDone && firestoreSyncError) {
    return <FirestoreErrorBanner onRetry={retryFirestoreSync} />
  }

  // Loading Skeleton while requested article document is loading
  if (!article && !isArticleFetchDone) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-24 bg-red-200 dark:bg-red-950/60 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-9 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center justify-between py-4 border-y border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="w-full aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        <div className="space-y-3 py-4">
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // 404 Page if article is not found or trashed (after sync finishes)
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
  const reporter = reporters.find(r => r.id === article.reporterId) 
    || reporters.find(r => r.name === (article as any).authorName) 
    || reporters.find(r => r.name === (article as any).reporterName) 
    || reporters[0] 
    || {
      id: "r1",
      name: "SANJAY RAIKWAR (संजय रैकवार)",
      role: "Chief Editor / मुख्य संपादक",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"
    }

  const reporterAvatarUrl = reporter.avatar || (reporter as any).photoUrl || (reporter as any).image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop"

  // Safe category filter
  const articleCategories = categories.filter(c => c && c.id && article.categoryIds?.includes(c.id))
  const isBookmarked = bookmarks.includes(article.id)
  
  // Safe comments filter
  const contextArticleComments = comments.filter(c => c && c.articleId === article?.id && c.status === 'approved')
  const articleComments = contextArticleComments.length > 0 ? contextArticleComments : fetchedComments

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
      userEmail: commentEmail.trim() || '',
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
      className="container mx-auto px-2.5 sm:px-4 py-3 sm:py-8 max-w-7xl"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-zinc-500 mb-2 sm:mb-6 flex-wrap">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Main Article Content */}
        <article className="lg:col-span-8 space-y-3 sm:space-y-6">

        {/* Categories Badges */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
          {articleCategories.map(c => (
            <Link key={c.id} to={`/category/${c.slug}`}>
              <span className="bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-sm transition-colors">
                {c.name}
              </span>
            </Link>
          ))}
          {article.isBreaking && (
            <span className="bg-amber-500 text-black text-[11px] sm:text-xs font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-sm animate-pulse">
              BREAKING
            </span>
          )}
          {article.status && article.status !== 'published' && (
            <span className="bg-zinc-800 text-amber-400 border border-amber-500/50 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm uppercase">
              {article.status} preview
            </span>
          )}
        </div>

        {/* Article Title */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-snug sm:leading-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed border-l-4 border-red-600 pl-3 sm:pl-4 py-0.5 sm:py-1 my-1.5 sm:my-3">
            {article.excerpt}
          </p>
        )}

        {/* Mobile Author Byline & TTS (Immediately below title/excerpt) */}
        <div className="md:hidden py-2 border-y border-zinc-200 dark:border-zinc-800 my-1 flex flex-wrap items-center justify-between gap-2">
          <AuthorByline 
            reporter={reporter} 
            authorNameFallback={(article as any).authorName || (article as any).reporterName}
            publishedAt={article.publishedAt} 
            formatDateAgo={formatDateAgo} 
            variant="header" 
          />
          <ArticleTextToSpeech article={article} />
        </div>

        {/* Desktop Metadata & Actions Bar (Unchanged for Desktop) */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-4 py-4 border-y border-zinc-200 dark:border-zinc-800">
          <AuthorByline 
            reporter={reporter} 
            authorNameFallback={(article as any).authorName || (article as any).reporterName}
            publishedAt={article.publishedAt} 
            formatDateAgo={formatDateAgo} 
            variant="header" 
          />

          <div className="flex items-center gap-2">
            <ArticleTextToSpeech article={article} />

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
        <figure className="w-full my-1 sm:my-3">
          <ResponsiveImage 
            src={articleImageUrl} 
            alt={article.title}
            type="article"
            loading="eager"
            fetchPriority="high"
            width={800}
            widths={[360, 480, 720, 1080]}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
            defaultWidth={800}
          />
        </figure>

        {/* Mobile Action Buttons (BELOW Image) */}
        <div className="md:hidden flex items-center justify-between gap-1.5 py-2 px-0.5 border-b border-zinc-200 dark:border-zinc-800 my-1">
          <div className="flex items-center gap-1.5">
            <Button 
              variant={hasLiked ? "default" : "outline"} 
              size="sm" 
              onClick={handleLikeClick}
              className={`h-8 text-xs px-2.5 rounded-full flex items-center gap-1 transition-colors ${hasLiked ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' : 'text-zinc-700 dark:text-zinc-300 hover:text-red-600'}`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{hasLiked ? 'Liked' : 'Like'}</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toggleBookmark(article.id)}
              className={`h-8 text-xs px-2.5 rounded-full flex items-center gap-1 ${isBookmarked ? 'text-red-600 border-red-600' : 'text-zinc-700 dark:text-zinc-300'}`}
            >
              {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5 fill-current" /> : <Bookmark className="h-3.5 w-3.5" />}
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <ArticleShareBar 
              title={article.title} 
              imageUrl={articleImageUrl} 
              variant="compact" 
            />
          </div>
        </div>

        {/* Article Body Content */}
        <div 
          className="article-rich-content max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed py-1.5 sm:py-4 text-base md:text-lg"
          dangerouslySetInnerHTML={{
            __html: formatArticleContentForDisplay(article.content || article.excerpt || "कोई विस्तृत सामग्री उपलब्ध नहीं है।")
          }}
        />

        {/* Embedded YouTube Video Player (Lazy-loaded Facade) */}
        {article.youtubeUrl && getYouTubeEmbedUrl(article.youtubeUrl) && (
          <div className="my-8 space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white border-l-4 border-red-600 pl-3">
              <Youtube className="h-5 w-5 text-red-600" />
              <span>विशेष वीडियो रिपोर्ट (Video Coverage)</span>
            </div>
            <YouTubeEmbedFacade
              youtubeUrl={article.youtubeUrl}
              title={article.title}
              imageUrl={article.imageUrl}
            />
          </div>
        )}

        {/* In-Article Ad Banner */}
        {Boolean(adSettings?.articleAd?.enabled) && Boolean(adSettings?.articleAd?.imageUrl?.trim()) && (
          <div className="my-8 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Advertisement</span>
            <a href={adSettings.articleAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
              <img 
                src={adSettings.articleAd.imageUrl || undefined} 
                alt="Ad" 
                loading="lazy"
                decoding="async"
                width={728}
                height={160}
                className="mx-auto rounded max-h-40 object-cover" 
              />
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

        {/* Author Bio Section */}
        <AuthorByline 
          reporter={reporter} 
          authorNameFallback={(article as any).authorName || (article as any).reporterName} 
          variant="bio" 
          className="my-8" 
        />

        {/* Comments Section */}
        <LazySection minHeight="250px">
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
        </LazySection>

        {/* Related News */}
        {relatedArticles.length > 0 && (
          <LazySection minHeight="250px">
            <div className="pt-12 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                संबंधित खबरें (Related News)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map(rel => (
                  <Link to={`/article/${rel.slug}`} key={rel.id} className="group flex flex-col gap-2">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
                      <ResponsiveImage 
                        src={rel.imageUrl} 
                        alt={rel.title}
                        type="card"
                        loading="lazy"
                        defaultWidth={400}
                        className="w-full h-full object-cover object-center rounded-lg transition-transform duration-500 group-hover:scale-105"
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
          </LazySection>
        )}

      </article>

        {/* Sticky Latest News Sidebar (Desktop) / Bottom Feed (Mobile) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-36">
            <StickyLatestNewsWidget currentArticleId={article.id} limit={8} />
          </div>
        </aside>
      </div>
    </motion.div>

  )
}
