import { Users, FileText, Eye, TrendingUp, Zap, FolderTree, MessageSquare, Plus, Edit, ExternalLink, Image, DollarSign, Settings, BarChart3, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useEffect } from "react"

export function AdminDashboard() {
  const { articles, reporters, categories, comments, loadAdminData } = useNews()

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])
  
  const totalArticles = articles.length
  const publishedCount = articles.filter(a => (a.status || 'published') === 'published').length
  const draftsCount = articles.filter(a => a.status === 'draft').length
  const scheduledCount = articles.filter(a => a.status === 'scheduled').length
  const breakingCount = articles.filter(a => a.isBreaking).length
  const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0)
  const pendingComments = comments.filter(c => c.status === 'pending').length

  const stats = [
    { label: "Total Articles", value: totalArticles, icon: FileText, color: "text-blue-600" },
    { label: "Published", value: publishedCount, icon: FileText, color: "text-green-600" },
    { label: "Drafts", value: draftsCount, icon: FileText, color: "text-amber-600" },
    { label: "Scheduled", value: scheduledCount, icon: FileText, color: "text-purple-600" },
    { label: "Breaking News", value: breakingCount, icon: Zap, color: "text-red-600" },
    { label: "Reporters", value: reporters.length, icon: Users, color: "text-indigo-600" },
    { label: "Categories", value: categories.length, icon: FolderTree, color: "text-teal-600" },
    { label: "Comments", value: comments.length, badge: pendingComments ? `${pendingComments} pending` : null, icon: MessageSquare, color: "text-rose-600" },
    { label: "Total Visitors / Views", value: totalViews, icon: Eye, color: "text-emerald-600" },
  ]

  // Top Most Viewed Articles
  const mostViewedArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Admin News CMS Dashboard</h1>
          <p className="text-sm text-zinc-500">Live operational overview of Damoh Daily News Network portal.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/analytics">
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-bold">
              <BarChart3 className="h-4 w-4 mr-2" /> View Full Analytics
            </Button>
          </Link>

          <Link to="/admin/create">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
              <Plus className="h-4 w-4 mr-2" /> Write New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-zinc-900 dark:text-white">{stat.value}</div>
              {stat.badge && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {stat.badge}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Most Viewed Articles */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" /> Most Viewed Articles
              </span>
              <Link to="/admin/news" className="text-xs font-bold text-red-600 hover:underline">
                View All Articles →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-y">
                  <tr>
                    <th className="p-4 font-semibold">Article Title</th>
                    <th className="p-4 font-semibold">Views</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mostViewedArticles.map(article => (
                    <tr key={article.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="p-4 max-w-sm">
                        <div className="font-bold text-zinc-900 dark:text-white line-clamp-1">{article.title}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{new Date(article.publishedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 font-black text-green-600">
                        {article.views || 0}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Link to={`/admin/edit/${article.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/article/${article.slug}`} target="_blank">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick CMS Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/create" className="flex items-center gap-3 p-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 font-bold text-sm transition-colors">
              <Plus className="h-4 w-4" /> Write New Article
            </Link>

            <Link to="/admin/messages" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <Inbox className="h-4 w-4 text-red-600" /> Messages & News Tips
            </Link>

            <Link to="/admin/news" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <FileText className="h-4 w-4" /> All News Articles
            </Link>

            <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <FolderTree className="h-4 w-4" /> Categories & Subcategories
            </Link>

            <Link to="/admin/reporters" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <Users className="h-4 w-4" /> Reporters & Roles
            </Link>

            <Link to="/admin/media" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <Image className="h-4 w-4" /> Media Asset Library
            </Link>

            <Link to="/admin/comments" className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> Comments</span>
              {pendingComments > 0 && <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingComments}</span>}
            </Link>

            <Link to="/admin/ads" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <DollarSign className="h-4 w-4" /> Ads Manager
            </Link>

            <Link to="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-sm font-medium transition-colors">
              <Settings className="h-4 w-4" /> Portal Settings
            </Link>
          </CardContent>
        </Card>

      </div>
    </motion.div>
  )
}
