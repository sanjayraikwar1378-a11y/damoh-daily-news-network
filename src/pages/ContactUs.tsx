import React, { useState } from "react"
import { useNews } from "@/context/NewsContext"
import { Phone, Mail, MapPin, MessageSquare, Send, Facebook, Twitter, Instagram, Youtube, CheckCircle2, Building, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "motion/react"

export function ContactUs() {
  const { siteSettings } = useNews()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.message) return
    setSubmitted(true)
    setForm({ name: "", phone: "", email: "", message: "" })
    setTimeout(() => setSubmitted(false), 5000)
  }

  const cleanWhatsappNumber = (num?: string) => {
    if (!num) return ''
    return num.replace(/[^0-9]/g, '')
  }

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
            24x7 Editorial Helpline
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            हमसे संपर्क करें (Contact Us)
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            {siteSettings.siteName || 'दमोह डेली न्यूज़ नेटवर्क'} की संपादकीय टीम से जुड़ें, समाचार सुझाव भेजें या विज्ञापन संबंधी पूछताछ के लिए संपर्क करें।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b pb-3 border-zinc-200 dark:border-zinc-800">
            <Building className="h-5 w-5 text-red-600" /> आधिकारिक संपर्क विवरण
          </h2>

          {/* Phone Card */}
          {siteSettings.contactPhone && (
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">फ़ोन हेल्पलाइन (Mobile)</span>
                <p className="text-base font-extrabold text-zinc-900 dark:text-white">{siteSettings.contactPhone}</p>
                <p className="text-xs text-zinc-500">संपादकीय एवं समाचार संवाद</p>
              </div>
              <a 
                href={`tel:${siteSettings.contactPhone}`}
                className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Call Now"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* WhatsApp Card */}
          {siteSettings.whatsappNumber && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">व्हाट्सएप न्यूज़ टिप (WhatsApp)</span>
                <p className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">{siteSettings.whatsappNumber}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">फोटो/वीडियो एवं समाचार व्हाट्सएप करें</p>
              </div>
              <a 
                href={`https://wa.me/${cleanWhatsappNumber(siteSettings.whatsappNumber)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Open WhatsApp"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Email Card */}
          {siteSettings.contactEmail && (
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">ईमेल पता (Editorial Email)</span>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-white break-all">{siteSettings.contactEmail}</p>
                <p className="text-xs text-zinc-500">प्रेस विज्ञप्ति एवं शिकायतें</p>
              </div>
              <a 
                href={`mailto:${siteSettings.contactEmail}`}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Send Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Address Card */}
          {siteSettings.contactAddress && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-amber-500" /> कार्यालय पता (Office Address)
              </span>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {siteSettings.contactAddress}
              </p>
            </div>
          )}

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

        {/* Message / Tip Form */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">संपादक को संदेश या समाचार टिप भेजें</h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              यदि आपके पास कोई समाचार, घटना की फोटो/जानकारी या सुझाव है तो नीचे फॉर्म भरें।
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl space-y-2 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold">आपका संदेश सफलतापूर्वक भेज दिया गया है!</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                हमारी टीम शीघ्र ही आपसे संपर्क करेगी। सहयोग के लिए धन्यवाद।
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">आपका नाम (Full Name) *</label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="उदा. राहुल शर्मा" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">मोबाइल नंबर (Mobile Number)</label>
                  <Input 
                    type="tel"
                    value={form.phone} 
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 9999999999" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">ईमेल पता (Email Address)</label>
                <Input 
                  type="email"
                  value={form.email} 
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">समाचार टिप / संदेश (Message) *</label>
                <textarea 
                  required
                  rows={5}
                  value={form.message} 
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="अपना संदेश या समाचार विवरण यहां लिखें..." 
                  className="w-full p-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-2.5">
                <Send className="h-4 w-4 mr-2" /> संदेश भेजें (Submit Message)
              </Button>
            </form>
          )}
        </div>

      </div>
    </motion.div>
  )
}
