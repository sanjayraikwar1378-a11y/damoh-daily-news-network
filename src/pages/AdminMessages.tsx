import React, { useState, useEffect } from "react"
import { 
  Inbox, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  MessageSquare, 
  AlertCircle, 
  ExternalLink,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "motion/react"
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "@/lib/firebase"
import { ContactMessage, MessageStatus } from "@/data/mock"
import { formatDistanceToNow } from "date-fns"

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | MessageStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    let isMounted = true

    // 1. Fetch from server API
    const fetchApiMessages = async () => {
      try {
        const resp = await fetch("/api/admin/messages")
        if (resp.ok) {
          const apiData = await resp.json()
          if (isMounted && Array.isArray(apiData)) {
            setMessages(prev => {
              const combined = [...apiData]
              prev.forEach(p => {
                if (!combined.some(c => c.id === p.id)) {
                  combined.push(p)
                }
              })
              return combined
            })
          }
        }
      } catch (err) {
        console.warn("API messages fetch notice:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchApiMessages()

    // 2. Real-time Firestore subscription
    try {
      const q = query(
        collection(db, "messages"),
        orderBy("createdAt", "desc")
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return
          const fetchedMessages: ContactMessage[] = []
          snapshot.forEach((docSnap) => {
            const data = docSnap.data()
            fetchedMessages.push({
              id: docSnap.id,
              fullName: data.fullName || 'Anonymous',
              mobileNumber: data.mobileNumber || '',
              email: data.email || '',
              message: data.message || '',
              createdAt: data.createdAt,
              status: data.status || 'new',
            })
          })
          
          setMessages(prev => {
            const map = new Map<string, ContactMessage>()
            // First add API messages
            prev.forEach(m => map.set(m.id, m))
            // Then overwrite with Firestore realtime snapshot
            fetchedMessages.forEach(m => map.set(m.id, m))
            return Array.from(map.values())
          })
          setLoading(false)
        },
        (err) => {
          console.warn("Firestore messages notice (using API store):", err)
          if (isMounted) setLoading(false)
        }
      )

      return () => {
        isMounted = false
        unsubscribe()
      }
    } catch (err) {
      console.warn("Firestore setup notice:", err)
      if (isMounted) setLoading(false)
      return () => {
        isMounted = false
      }
    }
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: MessageStatus) => {
    // 1. Optimistic UI update
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m))

    // 2. Call server API
    fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    }).catch(() => {})

    // 3. Update Firestore if accessible
    try {
      const msgRef = doc(db, "messages", id)
      await updateDoc(msgRef, { status: newStatus }).catch(() => {})
    } catch {
      // Ignored
    }
  }

  const handleDeleteMessage = async (id: string) => {
    setIsDeleting(true)
    // 1. Optimistic UI delete
    setMessages(prev => prev.filter(m => m.id !== id))
    setDeleteConfirmId(null)

    // 2. Call server API
    fetch(`/api/admin/messages/${id}`, {
      method: "DELETE"
    }).catch(() => {})

    // 3. Delete from Firestore if accessible
    try {
      const msgRef = doc(db, "messages", id)
      await deleteDoc(msgRef).catch(() => {})
    } catch {
      // Ignored
    } finally {
      setIsDeleting(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return { full: "हाल ही में", ago: "Just now" }
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
      if (isNaN(date.getTime())) return { full: "हाल ही में", ago: "Just now" }
      
      const full = date.toLocaleDateString("hi-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
      const ago = formatDistanceToNow(date, { addSuffix: true })
      return { full, ago }
    } catch {
      return { full: "हाल ही में", ago: "Just now" }
    }
  }

  // Filter and search
  const filteredMessages = messages.filter((msg) => {
    const matchesFilter = filter === 'all' || msg.status === filter
    const matchesSearch = 
      searchTerm.trim() === '' ||
      msg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.mobileNumber.includes(searchTerm) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage)
  const paginatedMessages = filteredMessages.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const newCount = messages.filter(m => m.status === 'new').length
  const readCount = messages.filter(m => m.status === 'read').length
  const resolvedCount = messages.filter(m => m.status === 'resolved').length

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 text-red-600 dark:text-red-400 rounded-xl">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                संदेश व समाचार टिप (Messages & News Tips)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                पाठकों और नागरिकों द्वारा भेजे गए संदेशों एवं समाचार सुझावों का प्रबंधन।
              </p>
            </div>
          </div>
        </div>

        {newCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-red-600 text-white shadow-sm animate-pulse">
            {newCount} नए संदेश (Unread)
          </span>
        )}
      </div>

      {/* Stats and Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => { setFilter('all'); setPage(1); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'all'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">कुल संदेश (Total)</span>
          <span className="text-2xl font-black">{messages.length}</span>
        </button>

        <button
          onClick={() => { setFilter('new'); setPage(1); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'new'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-400 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">नए संदेश (New)</span>
          <span className="text-2xl font-black">{newCount}</span>
        </button>

        <button
          onClick={() => { setFilter('read'); setPage(1); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'read'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-400 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">समीक्षित (Read)</span>
          <span className="text-2xl font-black">{readCount}</span>
        </button>

        <button
          onClick={() => { setFilter('resolved'); setPage(1); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            filter === 'resolved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">निपटारे किए गए (Resolved)</span>
          <span className="text-2xl font-black">{resolvedCount}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="नाम, मोबाइल नंबर, ईमेल या संदेश में खोजें..."
            className="pl-10 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p className="text-sm font-medium">संदेश लोड हो रहे हैं...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">कोई संदेश नहीं मिला</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm 
              ? `"${searchTerm}" से संबंधित कोई संदेश नहीं मिला।` 
              : filter !== 'all' 
              ? `इस फ़िल्टर (${filter}) में कोई संदेश उपलब्ध नहीं है।` 
              : 'अभी तक किसी पाठक ने संदेश या समाचार टिप नहीं भेजी है।'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedMessages.map((msg) => {
            const timeInfo = formatTimestamp(msg.createdAt)
            const cleanPhone = msg.mobileNumber.replace(/\D/g, '')

            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  msg.status === 'new'
                    ? 'bg-red-50/40 dark:bg-red-950/15 border-red-200 dark:border-red-900/40 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                  {/* Sender Profile */}
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                      msg.status === 'new'
                        ? 'bg-red-600 text-white'
                        : msg.status === 'resolved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-700 text-white'
                    }`}>
                      {msg.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                          {msg.fullName}
                        </h3>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          msg.status === 'new' 
                            ? 'bg-red-600 text-white animate-pulse'
                            : msg.status === 'read' 
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {msg.status === 'new' ? 'New / नया' : msg.status === 'read' ? 'Read / समीक्षित' : 'Resolved / पूर्ण'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <span>{timeInfo.full}</span>
                        <span className="font-semibold text-zinc-400">({timeInfo.ago})</span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Links */}
                  <div className="flex flex-wrap items-center gap-2">
                    {msg.mobileNumber && (
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        <a 
                          href={`tel:${msg.mobileNumber}`} 
                          className="text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-red-600 dark:hover:text-red-400"
                        >
                          {msg.mobileNumber}
                        </a>
                        <button
                          onClick={() => copyToClipboard(msg.mobileNumber, `phone-${msg.id}`)}
                          className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                          title="Copy Mobile Number"
                        >
                          {copiedId === `phone-${msg.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                        {cleanPhone.length >= 10 && (
                          <a
                            href={`https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-emerald-600 hover:text-emerald-700 p-0.5"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {msg.email && (
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 max-w-full">
                        <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <a 
                          href={`mailto:${msg.email}`} 
                          className="text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[160px] sm:max-w-[200px]"
                        >
                          {msg.email}
                        </a>
                        <button
                          onClick={() => copyToClipboard(msg.email, `email-${msg.id}`)}
                          className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 shrink-0"
                          title="Copy Email"
                        >
                          {copiedId === `email-${msg.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="py-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
                    {msg.message}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 mr-1">स्थिति बदलें (Status):</span>
                    
                    {msg.status !== 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(msg.id, 'new')}
                        className="text-xs h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                      >
                        नया चिन्हित करें (Mark New)
                      </Button>
                    )}

                    {msg.status !== 'read' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(msg.id, 'read')}
                        className="text-xs h-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> समीक्षा की (Mark Read)
                      </Button>
                    )}

                    {msg.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(msg.id, 'resolved')}
                        className="text-xs h-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> पूर्ण / निराकरण (Mark Resolved)
                      </Button>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div>
                    {deleteConfirmId === msg.id ? (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 p-1.5 rounded-lg border border-red-300 dark:border-red-800">
                        <span className="text-xs font-bold text-red-700 dark:text-red-300 px-1">हटाना चाहते हैं?</span>
                        <Button
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-2.5 font-bold"
                        >
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "हाँ, हटाएं"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs h-7 px-2 text-zinc-600 dark:text-zinc-300"
                        >
                          रद्द करें
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(msg.id)}
                        className="text-xs h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> संदेश हटाएं (Delete)
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs font-medium">
              <span className="text-zinc-500">
                पेज {page} of {totalPages} (कुल {filteredMessages.length} संदेश)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="text-xs"
                >
                  पिछला (Previous)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="text-xs"
                >
                  अगला (Next)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
