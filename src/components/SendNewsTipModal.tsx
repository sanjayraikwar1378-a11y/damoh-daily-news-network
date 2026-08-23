import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MessageSquare,
  ShieldCheck,
  Phone,
  User,
  Mail,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { db, collection, addDoc, serverTimestamp } from "@/lib/firebase"

interface SendNewsTipModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SendNewsTipModal({ isOpen, onClose }: SendNewsTipModalProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  const validateForm = () => {
    const trimmedName = form.name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("कृपया अपना पूरा नाम (कम से कम 2 अक्षर) दर्ज करें। (Please enter your full name)")
      return false
    }

    let cleanPhone = form.phone.replace(/\D/g, "")
    if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      cleanPhone = cleanPhone.slice(2)
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.slice(1)
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें। (Please enter a valid 10-digit mobile number)")
      return false
    }

    const trimmedEmail = form.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      setErrorMessage("कृपया एक वैध ईमेल पता दर्ज करें (उदा. example@mail.com)। (Please enter a valid email address)")
      return false
    }

    const trimmedMessage = form.message.trim()
    if (!trimmedMessage || trimmedMessage.length < 5) {
      setErrorMessage("कृपया समाचार टिप या संदेश (कम से कम 5 अक्षर) दर्ज करें। (Please enter a tip/message with at least 5 characters)")
      return false
    }

    return {
      fullName: trimmedName,
      mobileNumber: cleanPhone,
      email: trimmedEmail,
      message: trimmedMessage
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setErrorMessage(null)

    const validatedData = validateForm()
    if (!validatedData) return

    setIsSubmitting(true)

    try {
      // 1. Submit to robust persistent server endpoint
      const resp = await fetch("/api/send-news-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: validatedData.fullName,
          mobileNumber: validatedData.mobileNumber,
          email: validatedData.email,
          message: validatedData.message
        })
      })

      const data = await resp.json().catch(() => ({}))

      if (!resp.ok || data.success === false) {
        throw new Error(data.message || data.error || "संदेश भेजने में त्रुटि हुई। (Failed to submit news tip)")
      }

      // 2. Also attempt direct client write to Firestore (silent if permission restricted)
      try {
        await addDoc(collection(db, "messages"), {
          fullName: validatedData.fullName,
          mobileNumber: validatedData.mobileNumber,
          email: validatedData.email || "",
          message: validatedData.message,
          createdAt: serverTimestamp(),
          status: "new"
        })
      } catch {
        // Ignored; server API already stored message safely
      }

      setSubmitted(true)
      setForm({ name: "", phone: "", email: "", message: "" })
    } catch (err: any) {
      console.error("Error submitting news tip:", err)
      setErrorMessage(err?.message || "संदेश भेजने में त्रुटि हुई। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetAndClose = () => {
    setSubmitted(false)
    setErrorMessage(null)
    setForm({ name: "", phone: "", email: "", message: "" })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleResetAndClose}
          />

          {/* Modal Dialog */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-[111] my-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 via-red-950 to-zinc-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-red-900/30">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/40 text-red-300 border border-red-500/30">
                  <ShieldCheck className="h-3 w-3 text-red-400" />
                  Direct Editorial Hotline
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-red-500" />
                  समाचार टिप भेजें (Send News Tip)
                </h2>
                <p className="text-xs text-zinc-300">
                  दमोह या आसपास की कोई महत्वपूर्ण घटना हमारे संपादक को भेजें।
                </p>
              </div>

              <button 
                type="button"
                onClick={handleResetAndClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {submitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl space-y-3 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-bold">समाचार टिप सफलतापूर्वक प्राप्त हुई!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    आपकी भेजी गई जानकारी हमारे संपादकीय डेस्क को प्राप्त हो गई है। सहयोग के लिए धन्यवाद।
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <Button 
                      onClick={() => { setSubmitted(false); setErrorMessage(null); }}
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold"
                    >
                      एक और टिप भेजें (Send Another)
                    </Button>
                    <Button 
                      onClick={handleResetAndClose}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      बंद करें (Done)
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        <span>आपका नाम *</span>
                      </label>
                      <Input 
                        required 
                        value={form.name} 
                        onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                        placeholder="उदा. राहुल शर्मा" 
                        disabled={isSubmitting}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        <span>मोबाइल नंबर *</span>
                      </label>
                      <Input 
                        type="tel"
                        required
                        maxLength={14}
                        value={form.phone} 
                        onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                        placeholder="10 अंकों का नंबर (उदा. 9876543210)" 
                        disabled={isSubmitting}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <span>ईमेल पता <span className="text-zinc-400 font-normal">(वैकल्पिक)</span></span>
                    </label>
                    <Input 
                      type="email"
                      value={form.email} 
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                      placeholder="उदा. rahul@example.com" 
                      disabled={isSubmitting}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      <span>समाचार टिप / विवरण (News Tip) *</span>
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={form.message} 
                      onChange={e => { setForm(f => ({ ...f, message: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                      placeholder="घटना की जगह, समय और पूरी जानकारी यहां लिखें..." 
                      disabled={isSubmitting}
                      className="w-full p-3 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background focus:ring-2 focus:ring-red-600 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleResetAndClose}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      रद्द करें (Cancel)
                    </Button>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>भेज रहे हैं...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>टिप सबमिट करें (Submit Tip)</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
