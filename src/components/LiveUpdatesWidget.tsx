import { useState, useEffect, useMemo } from "react"
import { 
  Radio, 
  X, 
  Flame, 
  Clock, 
  Share2, 
  Check, 
  RefreshCw, 
  ChevronRight, 
  Maximize2,
  ExternalLink,
  BellRing
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { LiveUpdate } from "@/data/mock"
import { formatLiveRelativeTime } from "@/lib/utils"

export function LiveUpdatesWidget() {
  const { activeLiveUpdates, hasLiveUpdatesLoaded } = useNews()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [dismissedUrgentId, setDismissedUrgentId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Find latest active urgent update within last 2 hours for one-time banner
  const latestUrgentUpdate = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    return activeLiveUpdates.find(u => {
      if (!u.isUrgent) return false
      const pubTime = new Date(u.publishedAt || u.createdAt || 0).getTime()
      return pubTime >= twoHoursAgo
    })
  }, [activeLiveUpdates])

  // Check if urgent update was already dismissed in localStorage
  const showUrgentBanner = useMemo(() => {
    if (!latestUrgentUpdate || isOpen) return false
    if (dismissedUrgentId === latestUrgentUpdate.id) return false
    try {
      if (typeof window !== 'undefined') {
        return !localStorage.getItem(`dismissed_urgent_${latestUrgentUpdate.id}`)
      }
    } catch {}
    return true
  }, [latestUrgentUpdate, dismissedUrgentId, isOpen])

  const handleDismissUrgent = () => {
    if (latestUrgentUpdate) {
      try {
        localStorage.setItem(`dismissed_urgent_${latestUrgentUpdate.id}`, 'true')
      } catch {}
      setDismissedUrgentId(latestUrgentUpdate.id)
    }
  }

  // Keyboard escape listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedImage) {
          setSelectedImage(null)
        } else if (isOpen) {
          setIsOpen(false)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, selectedImage])

  // Body scroll lock when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Refresh visual animation
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  // Share Live Update to WhatsApp or Web Share
  const handleShare = async (update: LiveUpdate) => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://damohdailynews.com'
    const shareText = `🔴 *लाइव अपडेट | Damoh Daily News*\n\n${update.content}\n\n🕒 ${formatLiveRelativeTime(update.publishedAt || update.createdAt)}\n👉 ताज़ा स्थानीय खबरों के लिए देखें: ${portalUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Damoh Daily Live Update",
          text: shareText,
          url: portalUrl,
        })
        return
      } catch (err) {
        // Fallback to WhatsApp or clipboard
      }
    }

    // Direct WhatsApp share
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(whatsappUrl, '_blank')
  }

  // Copy update text to clipboard
  const handleCopy = (update: LiveUpdate) => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://damohdailynews.com'
    const shareText = `🔴 लाइव अपडेट (Damoh Daily News): ${update.content}\n\nविस्तार: ${portalUrl}`
    navigator.clipboard.writeText(shareText)
    setCopiedId(update.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <>
      {/* 1. Urgent Breaking Notification Banner (Editorial News Bulletin Style) */}
      <AnimatePresence>
        {showUrgentBanner && latestUrgentUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => {
              handleDismissUrgent()
              setIsOpen(true)
            }}
            className="fixed top-20 sm:top-24 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 group cursor-pointer bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-100 p-3 sm:p-3.5 rounded-xl shadow-xl border border-zinc-800 hover:border-zinc-700 transition-all"
            role="button"
            tabIndex={0}
            aria-label="ताज़ा ब्रेकिंग अपडेट खोलें"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                  </span>
                  <span className="text-[11px] font-bold tracking-wide uppercase text-red-500">
                    {latestUrgentUpdate.isUrgent ? 'तात्कालिक अलर्ट' : 'LIVE अपडेट'}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-500 text-xs">•</span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {formatLiveRelativeTime(latestUrgentUpdate.publishedAt || latestUrgentUpdate.createdAt)}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                  {latestUrgentUpdate.content}
                </p>
              </div>

              {/* Right controls: chevron indicator & close icon */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <div className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all p-1">
                  <ChevronRight className="h-4 w-4" />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDismissUrgent()
                  }}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  aria-label="अलर्ट बंद करें (Close)"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Live Updates Indicator (Compact Newsroom Bulletin Style) */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-40">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-900 text-zinc-100 hover:text-white px-3.5 py-2 rounded-full shadow-lg border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-md transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/30"
          aria-label="दमोह लाइव अपडेट्स खोलें"
        >
          {/* Pulsing Red Dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>

          <span className="tracking-wide">लाइव अपडेट्स</span>

          {/* Compact Notification Count Badge */}
          {activeLiveUpdates.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold rounded-full bg-red-600 text-white">
              {activeLiveUpdates.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* 3. Live Updates Slide-over / Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full sm:w-[480px] h-full bg-zinc-50 dark:bg-zinc-950 shadow-2xl flex flex-col z-50 border-l border-zinc-200 dark:border-zinc-800"
            >
              
              {/* Drawer Top Header */}
              <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center font-bold shrink-0">
                    <Radio className="h-5 w-5 animate-pulse text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                      दमोह लाइव अपडेट्स
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      24 घंटे के त्वरित समाचार एवं अलर्ट्स
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    title="ताज़ा करें (Refresh)"
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Close Live Updates Drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status Info Bar */}
              <div className="px-4 py-2 bg-red-50/80 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between text-xs text-red-800 dark:text-red-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-red-600" />
                  <span>लाइव फीड (नया अपडेट सबसे ऊपर)</span>
                </div>
                <span className="font-bold text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full">
                  {activeLiveUpdates.length} सक्रिय
                </span>
              </div>

              {/* Feed Content List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!hasLiveUpdatesLoaded && activeLiveUpdates.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 space-y-3 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                          <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-5 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                    ))}
                  </div>
                ) : activeLiveUpdates.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 space-y-3">
                    <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <Radio className="h-8 w-8 opacity-40" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                        इस समय कोई नया लाइव अपडेट नहीं है
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-xs">
                        दमोह जिले के ताज़ा घटनाक्रम, ट्रैफिक, मौसम और त्वरित समाचार आते ही यहाँ दिखाई देंगे।
                      </p>
                    </div>
                  </div>
                ) : (
                  activeLiveUpdates.map((update, idx) => {
                    const pubDate = new Date(update.publishedAt || update.createdAt || 0)

                    return (
                      <motion.article
                        key={update.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`rounded-2xl border transition-all p-4 shadow-sm ${
                          update.isUrgent
                            ? 'bg-red-50/90 border-red-300 dark:bg-red-950/40 dark:border-red-800/80 ring-1 ring-red-500/20'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        
                        {/* Update Header */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {update.isUrgent ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white uppercase tracking-wider shadow-sm">
                                <Flame className="h-3 w-3" />
                                तात्कालिक (Urgent)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                                लाइव अपडेट
                              </span>
                            )}

                            <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                              {formatLiveRelativeTime(update.publishedAt || update.createdAt)}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-zinc-400">
                            {pubDate.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Image Preview (Optional) */}
                        {update.imageUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden relative group bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                            <img
                              src={update.imageUrl}
                              alt="Live update visual"
                              className="w-full h-44 object-cover cursor-pointer group-hover:scale-102 transition-transform duration-300"
                              onClick={() => setSelectedImage(update.imageUrl || null)}
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedImage(update.imageUrl || null)}
                              className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm text-xs flex items-center gap-1"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                              <span className="text-[10px]">बड़ा देखें</span>
                            </button>
                          </div>
                        )}

                        {/* Update Content Text */}
                        <div className="mt-3">
                          <p className="text-sm font-normal text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                            {update.content}
                          </p>
                        </div>

                        {/* Footer & Share Actions */}
                        <div className="mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            स्रोत: {update.authorName || 'Damoh Daily News Desk'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopy(update)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-[11px]"
                              title="कॉपी करें (Copy)"
                            >
                              {copiedId === update.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Share2 className="h-3.5 w-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {copiedId === update.id ? "कॉपी हुआ" : "शेयर"}
                              </span>
                            </button>

                            {/* WhatsApp Direct Share */}
                            <button
                              type="button"
                              onClick={() => handleShare(update)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1 transition-colors"
                              title="WhatsApp पर भेजें"
                            >
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>

                      </motion.article>
                    )
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-[11px] text-zinc-400">
                  दमोह डेली न्यूज़ नेटवर्क • त्वरित स्थानीय समाचार सेवा
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Full Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh] z-[70] p-2"
            >
              <img
                src={selectedImage}
                alt="Enlarged live update"
                className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
