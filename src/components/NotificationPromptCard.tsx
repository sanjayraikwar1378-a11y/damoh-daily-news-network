import React from "react";
import { Bell, X, Check, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNotification } from "@/context/NotificationContext";

export function NotificationPromptCard() {
  const { 
    showPromptCard, 
    isSubscribing, 
    requestPushPermission, 
    dismissPromptCard 
  } = useNotification();

  if (!showPromptCard) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-zinc-100 p-4 sm:p-5 rounded-2xl shadow-2xl border border-zinc-800"
        role="dialog"
        aria-labelledby="notif-prompt-title"
      >
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20 mt-0.5">
            <Bell className="h-5 w-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-red-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span>दमोह डेली अलर्ट</span>
              </span>
              <button
                type="button"
                onClick={dismissPromptCard}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors -mr-1 -mt-1"
                aria-label="अलर्ट बंद करें"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 id="notif-prompt-title" className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
              दमोह डेली न्यूज़ नेटवर्क की महत्वपूर्ण खबरें पाएं
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              जिले की ब्रेकिंग न्यूज़, महत्वपूर्ण घोषणाएं और लाइव अपडेट्स सीधे अपने ब्राउज़र पर प्राप्त करें। कोई स्पैम नहीं।
            </p>

            <div className="flex items-center gap-2.5 mt-3.5 pt-1 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={requestPushPermission}
                disabled={isSubscribing}
                className="flex-1 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 disabled:opacity-50"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>सक्रिय हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Allow Notifications (अनुमति दें)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={dismissPromptCard}
                className="px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Not Now (अभी नहीं)
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
