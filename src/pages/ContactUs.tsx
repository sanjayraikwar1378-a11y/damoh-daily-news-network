import React, { useState } from "react"
import { useNews } from "@/context/NewsContext"
import { db, collection, addDoc, serverTimestamp } from "@/lib/firebase"
import { 
  Mail, 
  MapPin, 
  Send, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  CheckCircle2, 
  Building, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "motion/react"

export function ContactUs() {
  const { siteSettings } = useNews()
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" })

  const validateForm = () => {
    const trimmedName = form.name.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("कृपया अपना पूरा नाम (कम से कम 2 अक्षर) दर्ज करें। (Please enter your full name)")
      return false
    }

    // Clean phone number (strip spaces, dashes, +91 if provided)
    let cleanPhone = form.phone.replace(/\D/g, '')
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2)
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
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
      console.error("Error submitting contact message:", err)
      setErrorMessage(err?.message || "संदेश भेजने में त्रुटि हुई। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।")
    } finally {
      setIsSubmitting(false)
    }
  }

  const editorialEmail = siteSettings.contactEmail || "damohdailynewsnetwork@gmail.com"
  const officeAddress = siteSettings.contactAddress || "दमोह (मध्य प्रदेश) - 470661"

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8 max-w-7xl space-y-8"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-red-950 to-zinc-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-red-900/30">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
            24x7 Digital Editorial Desk
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            हमसे संपर्क करें (Contact Us)
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            {siteSettings.siteName || 'दमोह डेली न्यूज़ नेटवर्क'} की संपादकीय टीम से जुड़ें, समाचार सुझाव भेजें या आधिकारिक संवाद के लिए संपर्क करें।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b pb-3 border-zinc-200 dark:border-zinc-800">
            <Building className="h-5 w-5 text-red-600" /> आधिकारिक संपादकीय विवरण
          </h2>

          {/* Email Card */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">ईमेल पता (Editorial Email)</span>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white break-all">{editorialEmail}</p>
              <p className="text-xs text-zinc-500">प्रेस विज्ञप्ति, शिकायतें एवं आधिकारिक पूछताछ</p>
            </div>
            <a 
              href={`mailto:${editorialEmail}`}
              className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-sm"
              title="Send Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>

          {/* Address Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-500" /> कार्यालय पता (Office Address)
            </span>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {officeAddress}
            </p>
          </div>

          {/* Response Hours & Editorial Assurance */}
          <div className="p-4 bg-red-50/60 dark:bg-red-950/20 rounded-xl border border-red-200/60 dark:border-red-900/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
              <Clock className="h-4 w-4" /> संपादकीय प्रतिक्रिया समय
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              प्राप्त समाचार सुझावों व संदेशों की समीक्षा हमारी वरिष्ठ संपादकीय टीम द्वारा प्राथमिकता के आधार पर की जाती है।
            </p>
          </div>

          {/* Social Channels */}
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase text-zinc-500 block">सोशल मीडिया चैनल (Social Handles)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {siteSettings.facebookUrl && (
                <a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600 group-hover:text-white" /> Facebook
                </a>
              )}
              {siteSettings.twitterUrl && (
                <a href={siteSettings.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-sky-500 group-hover:text-white" /> Twitter / X
                </a>
              )}
              {siteSettings.instagramUrl && (
                <a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-pink-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-600 group-hover:text-white" /> Instagram
                </a>
              )}
              {siteSettings.youtubeUrl && (
                <a href={siteSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-600 group-hover:text-white" /> YouTube
                </a>
              )}
              {siteSettings.telegramUrl && (
                <a href={siteSettings.telegramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-sky-600 group-hover:text-white" /> Telegram
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Message / News Tip Form */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              समाचार टिप या संदेश भेजें (Send News Tip / Message)
            </h2>
            <p className="text-xs text-zinc-500">
              यदि आपके पास कोई विशेष समाचार, घटना की सूचना या सुझाव है, तो कृपया नीचे दिए गए फॉर्म को भरें।
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-3 text-xs sm:text-sm">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {submitted ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl space-y-3 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold">आपका संदेश सफलतापूर्वक प्राप्त हो गया है।</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                सहयोग के लिए धन्यवाद। हमारी संपादकीय टीम द्वारा इसकी समीक्षा की जाएगी।
              </p>
              <div className="pt-2">
                <Button 
                  onClick={() => { setSubmitted(false); setErrorMessage(null); }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold"
                >
                  एक और संदेश भेजें (Send Another Message)
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">आपका नाम (Full Name) *</label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                    placeholder="उदा. राहुल शर्मा" 
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">मोबाइल नंबर (Mobile Number) *</label>
                  <Input 
                    type="tel"
                    required
                    maxLength={14}
                    value={form.phone} 
                    onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                    placeholder="10 अंकों का मोबाइल नंबर (उदा. 9876543210)" 
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">ईमेल पता (Email Address) <span className="text-zinc-400 font-normal">(वैकल्पिक / Optional)</span></label>
                <Input 
                  type="email"
                  value={form.email} 
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                  placeholder="अपना ईमेल पता दर्ज करें (उदा. rahul@example.com)" 
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">समाचार टिप / संदेश (Message) *</label>
                <textarea 
                  required
                  rows={5}
                  value={form.message} 
                  onChange={e => { setForm(f => ({ ...f, message: e.target.value })); if (errorMessage) setErrorMessage(null); }}
                  placeholder="अपना संदेश या समाचार विवरण यहां लिखें..." 
                  disabled={isSubmitting}
                  className="w-full p-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background focus:ring-2 focus:ring-red-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>भेज रहे हैं (Submitting)...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>संदेश भेजें (Submit Message)</span>
                  </>
                )}
              </Button>
            </form>
          )}

        </div>

      </div>
    </motion.div>
  )
}
