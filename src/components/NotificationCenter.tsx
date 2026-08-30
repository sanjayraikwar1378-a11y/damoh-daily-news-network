import React, { useState, useRef, useEffect } from "react";
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Sliders, 
  ChevronRight, 
  Flame, 
  AlertTriangle, 
  Zap, 
  MapPin, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "@/context/NotificationContext";
import { formatLiveRelativeTime } from "@/lib/utils";
import { NewsNotification, NotificationPriority, NotificationCategory } from "@/data/mock";

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    preferences,
    permissionStatus,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPushPermission,
    testNotification
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "settings">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | NotificationCategory>("all");
  const [isTesting, setIsTesting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close when clicking outside on desktop
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Lock body scroll on small mobile screens when full modal is active
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Filtered notifications
  const displayedNotifications = notifications.filter((item) => {
    if (activeTab === "unread" && item.isRead) return false;
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    return true;
  });

  const handleNotificationClick = (item: NewsNotification) => {
    markAsRead(item.id);
    setIsOpen(false);

    if (item.targetUrl) {
      if (item.targetUrl.startsWith("http")) {
        window.open(item.targetUrl, "_blank");
      } else {
        navigate(item.targetUrl);
      }
    } else if (item.articleSlug) {
      navigate(`/article/${item.articleSlug}`);
    }
  };

  const handleTestClick = async () => {
    setIsTesting(true);
    try {
      await testNotification();
    } finally {
      setIsTesting(false);
    }
  };

  const getPriorityBadge = (priority: NotificationPriority, category: NotificationCategory) => {
    if (priority === "urgent") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-600/20 text-red-500 border border-red-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          <span>तात्कालिक</span>
        </span>
      );
    }
    if (priority === "breaking" || category === "breaking") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/20">
          <Flame className="h-2.5 w-2.5" />
          <span>ब्रेकिंग</span>
        </span>
      );
    }
    if (category === "live_update") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
          <Zap className="h-2.5 w-2.5" />
          <span>लाइव</span>
        </span>
      );
    }
    if (category === "local") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/20">
          <MapPin className="h-2.5 w-2.5" />
          <span>दमोह</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-700/40 text-zinc-300">
        <span>समाचार</span>
      </span>
    );
  };

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Header Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2 rounded-lg transition-colors flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          isOpen ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" : ""
        }`}
        aria-label="समाचार सूचनाएं (Notifications)"
        title="सूचनाएं (Notifications)"
      >
        <Bell className="h-5 w-5" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-black shadow-sm ring-2 ring-background animate-in fade-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[410px] max-h-[85vh] sm:max-h-[580px] bg-zinc-900 text-zinc-100 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col z-50 overflow-hidden"
          >
            {/* Top Bar Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>सूचनाएं (Notifications)</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                        {unreadCount} नए
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && activeTab !== "settings" && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1"
                    title="सभी पढ़े गए मार्क करें"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden xs:inline">सभी पढ़ें</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => prev === "settings" ? "all" : "settings")}
                  className={`p-1.5 rounded-md transition-colors ${
                    activeTab === "settings" 
                      ? "bg-red-600 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title="प्राथमिकताएं (Notification Preferences)"
                >
                  <Sliders className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label="बंद करें"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (All, Unread, Settings) */}
            <div className="px-3 pt-2.5 pb-2 border-b border-zinc-800/80 bg-zinc-950/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 bg-zinc-800/60 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "all" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  सभी ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("unread")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "unread" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  अनपढ़ी ({unreadCount})
                </button>
              </div>

              {/* Category Quick Filter */}
              {activeTab !== "settings" && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setFilterCategory(prev => prev === "breaking" ? "all" : "breaking")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      filterCategory === "breaking" ? "bg-red-600/30 text-red-400 border border-red-500/40" : "hover:text-zinc-200"
                    }`}
                  >
                    🔴 ब्रेकिंग
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory(prev => prev === "live_update" ? "all" : "live_update")}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      filterCategory === "live_update" ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/40" : "hover:text-zinc-200"
                    }`}
                  >
                    ⚡ लाइव
                  </button>
                </div>
              )}
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 scrollbar-thin scrollbar-thumb-zinc-700">
              {activeTab === "settings" ? (
                /* Notification Preferences Settings Panel */
                <div className="p-4 space-y-4 text-xs">
                  <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-red-500" />
                        <span>ब्राउज़र पुश नोटिफिकेशन (Push)</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        permissionStatus === "granted" 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : permissionStatus === "denied" 
                          ? "bg-red-500/20 text-red-400" 
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {permissionStatus === "granted" ? "सक्रिय (Allowed)" : permissionStatus === "denied" ? "अवरुद्ध (Blocked)" : "अनुमति आवश्यक"}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      वेबसाइट बंद होने पर भी डिवाइस पर महत्वपूर्ण खबरें व ब्रेकिंग अलर्ट प्राप्त करें।
                    </p>

                    {permissionStatus !== "granted" ? (
                      <button
                        type="button"
                        onClick={requestPushPermission}
                        className="w-full mt-2 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>पुश नोटिफिकेशन सक्रिय करें (Enable Push)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleTestClick}
                          disabled={isTesting}
                          className="flex-1 py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
                        >
                          {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 text-red-400" />}
                          <span>टेस्ट नोटिफिकेशन भेजें</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] px-1">
                      सूचना श्रेणियां (Notification Channels)
                    </h4>

                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:bg-zinc-800/40 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🔴</span>
                          <div>
                            <p className="font-bold text-white text-xs">ब्रेकिंग न्यूज़ (Breaking News)</p>
                            <p className="text-[10px] text-zinc-400">अति-महत्वपूर्ण ताज़ा घटनाएं</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.breaking}
                          onChange={(e) => updatePreferences({ breaking: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-600 h-4 w-4 bg-zinc-800 border-zinc-700"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:bg-zinc-800/40 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">📍</span>
                          <div>
                            <p className="font-bold text-white text-xs">दमोह लोकल समाचार (Damoh Local)</p>
                            <p className="text-[10px] text-zinc-400">जिले, तहसील व शहर के समाचार</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.local}
                          onChange={(e) => updatePreferences({ local: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-600 h-4 w-4 bg-zinc-800 border-zinc-700"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:bg-zinc-800/40 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">⚡</span>
                          <div>
                            <p className="font-bold text-white text-xs">लाइव अपडेट्स (Live Updates)</p>
                            <p className="text-[10px] text-zinc-400">त्वरित बुलेटिन और लाइव फीड</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.liveUpdates}
                          onChange={(e) => updatePreferences({ liveUpdates: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-600 h-4 w-4 bg-zinc-800 border-zinc-700"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:bg-zinc-800/40 cursor-pointer transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">📰</span>
                          <div>
                            <p className="font-bold text-white text-xs">प्रमुख समाचार (Important News)</p>
                            <p className="text-[10px] text-zinc-400">संपादकीय व मुख्य खबरें</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.important}
                          onChange={(e) => updatePreferences({ important: e.target.checked })}
                          className="rounded text-red-600 focus:ring-red-600 h-4 w-4 bg-zinc-800 border-zinc-700"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : displayedNotifications.length === 0 ? (
                /* Empty state */
                <div className="p-8 text-center text-zinc-500 space-y-2">
                  <div className="h-12 w-12 rounded-full bg-zinc-800/80 mx-auto flex items-center justify-center text-zinc-400">
                    <Bell className="h-6 w-6 opacity-40" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-400">कोई नई सूचना नहीं है</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    {activeTab === "unread" ? "आपने सभी सूचनाएं पढ़ ली हैं।" : "दमोह डेली न्यूज़ की नई खबरें यहां प्रदर्शित होंगी।"}
                  </p>
                </div>
              ) : (
                /* Notification List Items */
                displayedNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative p-3 sm:p-3.5 hover:bg-zinc-800/50 cursor-pointer transition-all flex items-start gap-3 ${
                      !item.isRead ? "bg-zinc-950/40" : ""
                    }`}
                  >
                    {/* Unread Blue/Red Dot */}
                    <div className="pt-1.5 shrink-0">
                      {!item.isRead ? (
                        <span className="block h-2 w-2 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-zinc-700 opacity-40" />
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityBadge(item.priority, item.category)}
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {formatLiveRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <h4 className={`text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 transition-colors ${
                        !item.isRead ? "text-white" : "text-zinc-300 group-hover:text-white"
                      }`}>
                        {item.title}
                      </h4>

                      {item.body && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.body}
                        </p>
                      )}
                    </div>

                    {/* Optional Thumbnail */}
                    {item.imageUrl && (
                      <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-zinc-800">
                        <img 
                          src={item.imageUrl} 
                          alt="" 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Action button: Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="हटाएं (Remove)"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Footer Action */}
            <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-800 text-center shrink-0 flex items-center justify-between px-4">
              <span className="text-[10px] text-zinc-500 font-medium">
                दमोह डेली न्यूज़ नेटवर्क • रियल-टाइम अलर्ट
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/latest-news");
                }}
                className="text-[11px] font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-0.5"
              >
                <span>सभी खबरें</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
