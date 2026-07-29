import React, { useState } from "react"
import { CheckCircle, XCircle, AlertOctagon, Trash2, MessageCircle, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { formatDistanceToNow } from "date-fns"

export function AdminComments() {
  const { comments, updateCommentStatus, deleteComment } = useNews()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'spam'>('all')

  const filteredComments = comments.filter(c => filter === 'all' || c.status === filter)

  const formatDateAgo = (dateStr?: string) => {
    if (!dateStr) return "recently"
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? "recently" : `${formatDistanceToNow(d)} ago`
    } catch {
      return "recently"
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Comments Moderation</h1>
        <p className="text-sm text-zinc-500">Approve, reject, flag spam, or remove reader comments across articles.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(['all', 'pending', 'approved', 'rejected', 'spam'] as const).map(tab => {
          const count = comments.filter(c => tab === 'all' || c.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                filter === tab 
                  ? 'bg-red-600 text-white' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              <span>{tab}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white">{count}</span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-red-600" /> Comments List ({filteredComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredComments.map(c => (
            <div key={c.id} className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">{c.userName}</span>
                  <span className="text-xs text-zinc-400 ml-2">({c.userEmail})</span>
                  <span className="text-xs text-zinc-500 ml-2">• {formatDateAgo(c.createdAt)}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  c.status === 'approved' ? 'bg-green-100 text-green-700' :
                  c.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {c.status}
                </span>
              </div>

              {c.articleTitle && (
                <p className="text-xs font-semibold text-red-600">Article: {c.articleTitle}</p>
              )}

              <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-background p-3 rounded-md border">{c.content}</p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateCommentStatus(c.id, 'approved')}
                  className="text-xs text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>

                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateCommentStatus(c.id, 'rejected')}
                  className="text-xs text-amber-600 hover:bg-amber-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>

                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateCommentStatus(c.id, 'spam')}
                  className="text-xs text-purple-600 hover:bg-purple-50"
                >
                  <AlertOctagon className="h-3.5 w-3.5 mr-1" /> Mark Spam
                </Button>

                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => deleteComment(c.id)}
                  className="text-xs text-red-600 hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}

          {filteredComments.length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              No comments match the selected status filter.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
