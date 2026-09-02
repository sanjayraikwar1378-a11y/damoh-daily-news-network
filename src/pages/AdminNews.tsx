import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  Edit, 
  Trash2, 
  Search, 
  ExternalLink, 
  Copy, 
  Archive, 
  RefreshCw, 
  CheckSquare, 
  Plus, 
  Eye, 
  ArrowUpRight,
  Zap,
  Globe,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { ArticleStatus } from "@/data/mock"
import { notifyIndexNow } from "@/lib/indexnow"

export function AdminNews() {
  const { 
    articles, 
    categories, 
    reporters, 
    updateArticle, 
    deleteArticle, 
    duplicateArticle, 
    bulkUpdateStatus, 
    bulkDeleteArticles,
    loadAdminData
  } = useNews()

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState<ArticleStatus | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkCategory, setBulkCategory] = useState("")
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)

  // Handle IndexNow on-demand submission
  const handleIndexNowSubmit = async (slugs: string | string[]) => {
    setIsIndexing(true)
    setIndexingStatus("Submitting to IndexNow...")
    try {
      const res = await notifyIndexNow(slugs)
      if (res.success) {
        setIndexingStatus(`✓ IndexNow Synced (${Array.isArray(slugs) ? slugs.length : 1} URL)`)
      } else {
        setIndexingStatus("IndexNow request completed")
      }
    } catch {
      setIndexingStatus("IndexNow submitted")
    } finally {
      setIsIndexing(false)
      setTimeout(() => setIndexingStatus(null), 4000)
    }
  }

  // Filter logic
  const filteredArticles = articles.filter(article => {
    // Status filter
    if (activeTab !== 'all') {
      const status = article.status || 'published'
      if (status !== activeTab) return false
    }

    // Category filter
    if (selectedCategory !== 'all' && !article.categoryIds?.includes(selectedCategory)) {
      return false
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const titleMatch = article.title.toLowerCase().includes(q)
      const excerptMatch = article.excerpt?.toLowerCase().includes(q)
      return titleMatch || excerptMatch
    }

    return true
  })

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredArticles.map(a => a.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Bulk Operations
  const handleBulkStatus = (status: ArticleStatus) => {
    if (selectedIds.length === 0) return
    bulkUpdateStatus(selectedIds, status)
    setSelectedIds([])
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected articles?`)) {
      bulkDeleteArticles(selectedIds)
      setSelectedIds([])
    }
  }

  const handleBulkCategoryChange = () => {
    if (!bulkCategory || selectedIds.length === 0) return
    selectedIds.forEach(id => {
      const art = articles.find(a => a.id === id)
      if (art) {
        const existing = art.categoryIds || []
        if (!existing.includes(bulkCategory)) {
          updateArticle(id, { categoryIds: [...existing, bulkCategory] })
        }
      }
    })
    setSelectedIds([])
    setBulkCategory("")
  }

  const statusCounts = {
    all: articles.length,
    published: articles.filter(a => (a.status || 'published') === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    scheduled: articles.filter(a => a.status === 'scheduled').length,
    archived: articles.filter(a => a.status === 'archived').length,
    trash: articles.filter(a => a.status === 'trash').length,
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Article Management</h1>
          <p className="text-sm text-zinc-500">Create, edit, duplicate, schedule, and moderate all news articles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={isIndexing}
            onClick={() => {
              const publishedSlugs = articles.filter(a => (a.status || 'published') === 'published').slice(0, 50).map(a => a.slug).filter(Boolean);
              handleIndexNowSubmit(publishedSlugs);
            }}
            className="text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            title="Submit recent 50 articles directly to IndexNow (Bing, Yandex, Seznam)"
          >
            <Zap className="h-3.5 w-3.5 mr-1 text-amber-500 fill-amber-500" />
            {isIndexing ? "Indexing..." : "IndexNow Sync"}
          </Button>
          <Link to="/admin/create">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
              <Plus className="h-4 w-4 mr-2" /> Write New Article
            </Button>
          </Link>
        </div>
      </div>

      {indexingStatus && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2 animate-in fade-in">
          <Zap className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{indexingStatus}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(['all', 'published', 'draft', 'scheduled', 'archived', 'trash'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSelectedIds([])
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            <span>{tab}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
              {statusCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.length} Articles Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              size="sm" 
              variant="default"
              disabled={isIndexing}
              onClick={() => {
                const selectedSlugs = articles.filter(a => selectedIds.includes(a.id)).map(a => a.slug).filter(Boolean);
                handleIndexNowSubmit(selectedSlugs);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              IndexNow Sync Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus('published')}>
              Bulk Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus('draft')}>
              Bulk Draft
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus('archived')}>
              Bulk Archive
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus('trash')}>
              Move to Trash
            </Button>
            {activeTab === 'trash' && (
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                Delete Permanently
              </Button>
            )}

            <div className="flex items-center gap-1 pl-2 border-l border-red-200 dark:border-red-800">
              <select 
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                className="text-xs p-1.5 border rounded bg-background"
              >
                <option value="">Add to Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button size="sm" variant="secondary" onClick={handleBulkCategoryChange} disabled={!bulkCategory}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls & Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <CardTitle className="text-lg font-bold">
              Articles List ({filteredArticles.length})
            </CardTitle>

            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm border rounded-md bg-background focus:ring-red-600"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search articles..."
                  className="pl-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-y border-border">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={selectedIds.length > 0 && selectedIds.length === filteredArticles.length}
                      className="rounded text-red-600 focus:ring-red-600" 
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Article</th>
                  <th className="px-4 py-3 font-semibold">Categories</th>
                  <th className="px-4 py-3 font-semibold">Reporter</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date / Views</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredArticles.map(article => {
                  const reporter = reporters.find(r => r.id === article.reporterId)
                  const articleCats = categories.filter(c => article.categoryIds?.includes(c.id))
                  const isSelected = selectedIds.includes(article.id)
                  const status = article.status || 'published'

                  return (
                    <tr key={article.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${isSelected ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectOne(article.id)}
                          className="rounded text-red-600 focus:ring-red-600"
                        />
                      </td>

                      <td className="px-4 py-3 max-w-md">
                        <div className="flex gap-3 items-start">
                          <img 
                            src={article.imageUrl || undefined} 
                            alt={article.title} 
                            className="w-16 h-12 rounded object-cover flex-shrink-0 bg-zinc-100 dark:bg-zinc-800" 
                          />
                          <div>
                            <Link to={`/admin/edit/${article.id}`} className="font-bold text-zinc-900 dark:text-white hover:text-red-600 line-clamp-2 transition-colors">
                              {article.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {article.isBreaking && (
                                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">BREAKING</span>
                              )}
                              {article.isTrending && (
                                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">TRENDING</span>
                              )}
                              {article.isEditorsPick && (
                                <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">EDITOR'S PICK</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-zinc-500 max-w-[150px]">
                        {articleCats.map(c => c.name).join(', ') || 'Uncategorized'}
                      </td>

                      <td className="px-4 py-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {reporter?.name || 'Editorial Team'}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                          status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          status === 'archived' ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' :
                          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-zinc-500">
                        <div>{new Date(article.publishedAt).toLocaleDateString()}</div>
                        <div className="font-semibold text-zinc-700 dark:text-zinc-300">{article.views || 0} views</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Instant IndexNow (Bing/Yandex Submission)"
                            onClick={() => handleIndexNowSubmit(article.slug)}
                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          >
                            <Zap className="h-4 w-4 text-amber-500" />
                          </Button>

                          <Link to={`/admin/edit/${article.id}`} title="Edit Article">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Link to={`/article/${article.slug}`} target="_blank" title="View Live Article">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-100">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Duplicate Article"
                            onClick={() => duplicateArticle(article.id)}
                            className="h-8 w-8 text-purple-600 hover:bg-purple-50"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {status === 'trash' ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Restore Article"
                              onClick={() => updateArticle(article.id, { status: 'published' })}
                              className="h-8 w-8 text-green-600 hover:bg-green-50"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Move to Trash"
                              onClick={() => updateArticle(article.id, { status: 'trash' })}
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete Permanently"
                            onClick={() => {
                              if (confirm("Permanently delete this article?")) deleteArticle(article.id)
                            }}
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No articles match your current filter settings.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
