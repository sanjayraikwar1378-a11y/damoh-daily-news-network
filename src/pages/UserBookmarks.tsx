import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Bookmark, Clock, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { formatDistanceToNow } from "date-fns"
import { FirestoreErrorBanner } from "@/components/FirestoreErrorBanner"

export function UserBookmarks() {
  const { articles, bookmarks, toggleBookmark, readingHistory, hasArticlesLoaded, isSyncingFirestore, firestoreSyncError, retryFirestoreSync } = useNews()
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks')

  const bookmarkedArticles = articles.filter(a => bookmarks.includes(a.id))
  const historyArticles = readingHistory
    .map(id => articles.find(a => a.id === id))
    .filter((a): a is typeof articles[0] => Boolean(a))

  const activeList = activeTab === 'bookmarks' ? bookmarkedArticles : historyArticles

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8 max-w-4xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">मेरी सहेजी गई खबरें (My Saved Articles)</h1>
          <p className="text-sm text-zinc-500">बुकमार्क की गई खबरें और हाल में पढ़ी गई खबरों की सूची।</p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'bookmarks' ? 'default' : 'outline'}
            onClick={() => setActiveTab('bookmarks')}
            className={activeTab === 'bookmarks' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Bookmark className="h-4 w-4 mr-2" /> Bookmarks ({bookmarkedArticles.length})
          </Button>

          <Button 
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Clock className="h-4 w-4 mr-2" /> History ({historyArticles.length})
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {firestoreSyncError && activeList.length === 0 && !hasArticlesLoaded ? (
          <FirestoreErrorBanner onRetry={retryFirestoreSync} />
        ) : (!hasArticlesLoaded || isSyncingFirestore) && activeList.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex gap-4 items-center animate-pulse bg-card">
                <div className="w-24 h-16 bg-zinc-200 dark:bg-zinc-800 rounded flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeList.map(article => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex gap-4 items-start sm:items-center flex-1">
                    <img src={getOptimizedImageUrl(article.imageUrl, 200) || undefined} alt={article.title} loading="lazy" decoding="async" className="w-24 h-16 rounded object-cover flex-shrink-0 bg-zinc-100 dark:bg-zinc-800" />
                    <div className="space-y-1">
                      <Link to={`/article/${article.slug}`} className="font-bold text-base text-zinc-900 dark:text-white hover:text-red-600 line-clamp-2 transition-colors">
                        {article.title}
                      </Link>
                      <p className="text-xs text-zinc-400">
                        {(() => {
                          try {
                            const d = new Date(article.publishedAt)
                            return isNaN(d.getTime()) ? "recently" : `${formatDistanceToNow(d)} ago`
                          } catch {
                            return "recently"
                          }
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link to={`/article/${article.slug}`}>
                      <Button size="sm" variant="secondary">
                        <Eye className="h-4 w-4 mr-1" /> Read
                      </Button>
                    </Link>
                    {activeTab === 'bookmarks' && (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => toggleBookmark(article.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasArticlesLoaded && !isSyncingFirestore && !firestoreSyncError && activeList.length === 0 && (
              <div className="text-center py-16 text-zinc-500 border rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                {activeTab === 'bookmarks' ? 'कोई बुकमार्क की गई खबर नहीं है।' : 'कोई पठन इतिहास उपलब्ध नहीं है।'}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
