import React, { useState, useMemo } from "react"
import { 
  Radio, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Clock, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Flame, 
  Upload, 
  X, 
  Eye, 
  Calendar,
  Sparkles,
  RefreshCw,
  Share2,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion, AnimatePresence } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { useNotification } from "@/context/NotificationContext"
import { LiveUpdate } from "@/data/mock"
import { isWithin24Hours, formatLiveRelativeTime } from "@/lib/utils"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function AdminLiveUpdates() {
  const { 
    liveUpdates, 
    activeLiveUpdates, 
    addLiveUpdate, 
    updateLiveUpdate, 
    deleteLiveUpdate, 
    toggleLiveUpdateActive 
  } = useNews()

  // Form State
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePublicId, setImagePublicId] = useState("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [sendPush, setSendPush] = useState(false)
  const [authorName, setAuthorName] = useState("Damoh Daily Desk")
  const [publishedAt, setPublishedAt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { sendNotification } = useNotification()
  const lastPushTimestampRef = React.useRef<number>(0)

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<LiveUpdate | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editImagePublicId, setEditImagePublicId] = useState("")
  const [isEditUploadingImage, setIsEditUploadingImage] = useState(false)
  const [editIsUrgent, setEditIsUrgent] = useState(false)
  const [editIsActive, setEditIsActive] = useState(true)
  const [editPublishedAt, setEditPublishedAt] = useState("")
  const [editAuthorName, setEditAuthorName] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "urgent" | "expired" | "inactive">("all")

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Handle local image file upload (uploads to Cloudinary CDN)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.")
      return
    }

    if (isEdit) {
      setIsEditUploadingImage(true)
    } else {
      setIsUploadingImage(true)
    }

    try {
      const res = await uploadToCloudinary(file, 'live_updates')
      if (isEdit) {
        setEditImageUrl(res.url)
        setEditImagePublicId(res.publicId)
      } else {
        setImageUrl(res.url)
        setImagePublicId(res.publicId)
      }
    } catch (err) {
      console.error("Live update image upload error:", err)
      // Fallback to data URL if network upload fails
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        if (isEdit) {
          setEditImageUrl(result)
        } else {
          setImageUrl(result)
        }
      }
      reader.readAsDataURL(file)
    } finally {
      if (isEdit) {
        setIsEditUploadingImage(false)
      } else {
        setIsUploadingImage(false)
      }
    }
  }

  // Handle Submit New Live Update
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!content.trim()) {
      setFormError("कृपया लाइव अपडेट का टेक्स्ट दर्ज करें (Update content is required).")
      return
    }

    setIsSubmitting(true)
    try {
      const publishTimestamp = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString()
      
      const newLiveUpdate = await addLiveUpdate({
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        imagePublicId: imagePublicId.trim() || undefined,
        isUrgent,
        isActive,
        authorName: authorName.trim() || "Damoh Daily Desk",
        publishedAt: publishTimestamp
      })

      // Send Push Notification if requested
      if (sendPush) {
        const now = Date.now()
        // Rate limit: warn if sent within last 45s unless forced
        if (now - lastPushTimestampRef.current < 45000) {
          console.warn("[LiveUpdates] Notification sent rapidly. Proceeding.")
        }
        lastPushTimestampRef.current = now

        try {
          await sendNotification({
            title: isUrgent ? "दमोह तात्कालिक लाइव अपडेट (Urgent Update)" : "दमोह लाइव अपडेट्स (Live Bulletin)",
            body: content.trim().length > 140 ? `${content.trim().slice(0, 137)}...` : content.trim(),
            priority: isUrgent ? "urgent" : "normal",
            category: "live_update",
            liveUpdateId: (newLiveUpdate as any)?.id || undefined,
            targetUrl: "/",
            imageUrl: imageUrl.trim() || undefined
          })
        } catch (pushErr) {
          console.warn("[LiveUpdates] Push notification broadcast error:", pushErr)
        }
      }

      // Reset form
      setContent("")
      setImageUrl("")
      setImagePublicId("")
      setIsUrgent(false)
      setIsActive(true)
      setSendPush(false)
      setPublishedAt("")
      setSuccessMessage("नया लाइव अपडेट सफलतापूर्वक प्रकाशित किया गया (Live update published)!")
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      console.error("Error creating live update:", err)
      setFormError(err.message || "Failed to publish live update.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Start Edit
  const handleStartEdit = (item: LiveUpdate) => {
    setEditingItem(item)
    setEditContent(item.content)
    setEditImageUrl(item.imageUrl || "")
    setEditImagePublicId(item.imagePublicId || "")
    setEditIsUrgent(!!item.isUrgent)
    setEditIsActive(item.isActive !== false)
    setEditAuthorName(item.authorName || "Damoh Daily Desk")
    setEditPublishedAt(item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 16) : "")
  }

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!editContent.trim()) {
      alert("Content cannot be empty.")
      return
    }

    setIsSavingEdit(true)
    try {
      await updateLiveUpdate(editingItem.id, {
        content: editContent.trim(),
        imageUrl: editImageUrl.trim() || undefined,
        imagePublicId: editImagePublicId.trim() || undefined,
        isUrgent: editIsUrgent,
        isActive: editIsActive,
        authorName: editAuthorName.trim() || "Damoh Daily Desk",
        ...(editPublishedAt ? { publishedAt: new Date(editPublishedAt).toISOString() } : {})
      })
      setEditingItem(null)
    } catch (err) {
      console.error("Error updating live update:", err)
      alert("Failed to update.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Filtered live updates
  const filteredUpdates = useMemo(() => {
    return liveUpdates.filter(item => {
      const matchesSearch = searchQuery 
        ? item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (item.authorName && item.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
        : true

      if (!matchesSearch) return false

      const isLiveActive = item.isActive !== false && isWithin24Hours(item.publishedAt || item.createdAt)
      const isExpired = !isWithin24Hours(item.publishedAt || item.createdAt)

      if (statusFilter === "active") return isLiveActive
      if (statusFilter === "urgent") return item.isUrgent
      if (statusFilter === "expired") return isExpired
      if (statusFilter === "inactive") return item.isActive === false

      return true
    })
  }, [liveUpdates, searchQuery, statusFilter])

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold">
              <Radio className="h-5 w-5 animate-pulse text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                Live Updates Manager
                <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-semibold border border-red-200 dark:border-red-800">
                  {activeLiveUpdates.length} Live
                </span>
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Manage short breaking news, traffic alerts, weather updates, and public advisories (24-hour auto-expiry).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg font-medium border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Active (Public): <strong>{activeLiveUpdates.length}</strong></span>
          </div>
          <div className="px-3 py-1.5 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg font-medium border border-zinc-200 dark:border-zinc-700">
            <span>Total History: <strong>{liveUpdates.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Create Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Card (Create New Live Update) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-red-100 dark:border-zinc-800 shadow-md">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Plus className="h-5 w-5 text-red-600" />
                <span>Post New Live Update</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Enter short updates, road blocks, weather alerts, or breaking local incidents.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Content Textarea */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                      Update Content / समाचार विवरण <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-[11px] font-mono ${content.length > 500 ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {content.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="दमोह में आज भारी बारिश के चलते जबलपुर मार्ग पर यातायात धीमी गति से चल रहा है..."
                    className="w-full p-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:outline-none resize-y"
                    required
                  />
                </div>

                {/* Optional Image */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
                    <span>Optional Image / तस्वीर</span>
                    {imageUrl && (
                      <button 
                        type="button" 
                        onClick={() => setImageUrl("")}
                        className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </label>

                  {imageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 h-32 bg-zinc-100 dark:bg-zinc-800">
                      <img src={imageUrl} alt="Update preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        {isUploadingImage ? (
                          <div className="flex items-center gap-2 py-2 text-red-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Upload Image to Cloudinary</span>
                            <span className="text-[10px] text-zinc-400">PNG, JPG, WebP up to 5MB</span>
                          </>
                        )}
                        <input type="file" accept="image/*" disabled={isUploadingImage} className="hidden" onChange={(e) => handleImageFileChange(e, false)} />
                      </label>

                      <div className="relative flex items-center">
                        <Input 
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Or paste direct image URL..."
                          className="text-xs h-8 pl-8"
                        />
                        <ImageIcon className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Options: Urgent & Active */}
                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {/* Urgent Toggle */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isUrgent ? 'bg-red-50/80 border-red-300 dark:bg-red-950/30 dark:border-red-900/60' : 'bg-zinc-50/60 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800'}`}>
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="mt-0.5 rounded text-red-600 focus:ring-red-600 h-4 w-4"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Flame className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-zinc-400'}`} />
                        <span className={`text-xs font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          Mark as Urgent / तात्कालिक चेतावनी
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Shows a high-priority red alert and prominent highlight on the website.
                      </p>
                    </div>
                  </label>

                  {/* Active Toggle */}
                  <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 cursor-pointer">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Publish as Active (लाइव रखें)
                    </span>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-600 h-4 w-4"
                    />
                  </label>

                  {/* Send Push Notification Toggle */}
                  <label className="flex items-start justify-between p-3 rounded-lg border border-red-500/20 bg-red-600/5 cursor-pointer">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">🔔 Send Push Notification</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Send instant broadcast push alert to subscribed readers.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sendPush}
                      onChange={(e) => setSendPush(e.target.checked)}
                      className="mt-0.5 rounded text-red-600 focus:ring-red-600 h-4 w-4"
                    />
                  </label>
                </div>

                {/* Publish Timestamp (Optional Custom Date) */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                    <span>Publish Time (Leave blank for NOW)</span>
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  </label>
                  <Input 
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                {/* Author Desk Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Source / Desk
                  </label>
                  <Input 
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Damoh Daily Desk"
                    className="text-xs h-9"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !content.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Publishing to Live Feed...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" />
                      <span>Publish Live Update</span>
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* List Card (Manage All Live Updates) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">
                  All Live Updates ({liveUpdates.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Active updates under 24 hours are publicly visible on the website.
                </CardDescription>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search updates..."
                  className="text-xs h-8 pl-8"
                />
                <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>

            {/* Filter Tabs */}
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${statusFilter === "all" ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
              >
                All ({liveUpdates.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${statusFilter === "active" ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/50'}`}
              >
                Active Live ({activeLiveUpdates.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("urgent")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${statusFilter === "urgent" ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50'}`}
              >
                Urgent ({liveUpdates.filter(u => u.isUrgent).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("expired")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${statusFilter === "expired" ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/50'}`}
              >
                Expired &gt; 24h ({liveUpdates.filter(u => !isWithin24Hours(u.publishedAt || u.createdAt)).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${statusFilter === "inactive" ? 'bg-zinc-600 text-white' : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
              >
                Inactive ({liveUpdates.filter(u => u.isActive === false).length})
              </button>
            </div>

            {/* Updates Feed */}
            <CardContent className="p-4 sm:p-5 space-y-4 max-h-[720px] overflow-y-auto">
              {filteredUpdates.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <Radio className="h-8 w-8 mx-auto opacity-40 text-zinc-400" />
                  <p className="text-sm font-medium">कोई लाइव अपडेट नहीं मिला (No live updates found)</p>
                  <p className="text-xs text-zinc-500">Create your first live update from the left panel.</p>
                </div>
              ) : (
                filteredUpdates.map((item) => {
                  const isLive = item.isActive !== false && isWithin24Hours(item.publishedAt || item.createdAt)
                  const isExpired = !isWithin24Hours(item.publishedAt || item.createdAt)
                  const pubDate = new Date(item.publishedAt || item.createdAt || 0)

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border transition-all ${
                        item.isUrgent 
                          ? 'border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20' 
                          : isLive
                            ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                            : 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Status Badges Header */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              LIVE
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Clock className="h-3 w-3" />
                              Expired (&gt;24h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              Inactive
                            </span>
                          )}

                          {item.isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
                              <Flame className="h-3 w-3" />
                              Urgent Alert
                            </span>
                          )}

                          <span className="text-[11px] text-zinc-500 font-medium ml-1">
                            {formatLiveRelativeTime(item.publishedAt || item.createdAt)}
                          </span>

                          <span className="text-[10px] text-zinc-400">
                            • {pubDate.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Quick Active/Inactive toggle */}
                          <button
                            type="button"
                            onClick={() => toggleLiveUpdateActive(item.id)}
                            title={item.isActive !== false ? "Disable update" : "Enable update"}
                            className={`p-1.5 rounded-md text-xs transition-colors ${
                              item.isActive !== false 
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50' 
                                : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {item.isActive !== false ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            title="Edit update"
                            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Delete update"
                            className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                      </div>

                      {/* Content Body */}
                      <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start">
                        {item.imageUrl && (
                          <div className="w-full sm:w-28 h-24 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            <img 
                              src={item.imageUrl} 
                              alt="Live update" 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(item.imageUrl, '_blank')}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </p>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 pt-1">
                            <span>Desk: {item.authorName || 'Damoh Daily Desk'}</span>
                            <span>•</span>
                            <span>ID: <code className="font-mono text-[10px]">{item.id}</code></span>
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingItem(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl z-50 border border-zinc-200 dark:border-zinc-800 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-red-600" />
                  Edit Live Update
                </h3>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-300">
                    Content Text *
                  </label>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-300 flex justify-between">
                    <span>Image / तस्वीर (Optional)</span>
                    {editImageUrl && (
                      <button type="button" onClick={() => { setEditImageUrl(""); setEditImagePublicId(""); }} className="text-[11px] text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                  </label>
                  
                  {editImageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 h-28 bg-zinc-100 dark:bg-zinc-800">
                      <img src={editImageUrl} alt="Edit preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <label className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      {isEditUploadingImage ? (
                        <div className="flex items-center gap-1.5 text-xs text-red-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-zinc-400" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300">Upload New Image</span>
                        </>
                      )}
                      <input type="file" accept="image/*" disabled={isEditUploadingImage} className="hidden" onChange={(e) => handleImageFileChange(e, true)} />
                    </label>
                  )}

                  <Input 
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="text-xs mt-1"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editIsUrgent}
                      onChange={(e) => setEditIsUrgent(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-600 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-red-600">Urgent Alert</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-600 h-4 w-4"
                    />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Is Active (Visible)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSavingEdit} className="bg-red-600 hover:bg-red-700 text-white">
                    {isSavingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl z-50 border border-zinc-200 dark:border-zinc-800 space-y-4 text-center"
            >
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Delete Live Update?</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to permanently delete this live update from Firebase?
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    if (deleteConfirmId) {
                      await deleteLiveUpdate(deleteConfirmId)
                      setDeleteConfirmId(null)
                    }
                  }}
                >
                  Delete Permanently
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
