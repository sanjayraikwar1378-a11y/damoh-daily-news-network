import React from "react"
import { useNews } from "@/context/NewsContext"
import {
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  ShieldCheck,
  Clock,
  FileText
} from "lucide-react"
import { motion } from "motion/react"

export function ContactUs() {
  const { siteSettings } = useNews()

  const editorialEmail = siteSettings.contactEmail || "damohdailynewsnetwork@gmail.com"
  const officeAddress = siteSettings.contactAddress || "दमोह (मध्य प्रदेश) - 470661"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8 max-w-4xl space-y-8"
    >
      <div className="bg-gradient-to-r from-zinc-900 via-red-950 to-zinc-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-red-900/30">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Damoh Daily News Network
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">संपर्क करें</h1>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
            समाचार, सुझाव, सुधार या अन्य जानकारी के लिए हमें सीधे ईमेल करें।
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-3 rounded-xl bg-red-600/10 text-red-600">
            <Mail className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">ईमेल से संपर्क करें</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              अपना नाम, संपर्क विवरण और पूरी जानकारी ईमेल में लिखकर भेजें।
            </p>
            <a
              href={`mailto:${editorialEmail}`}
              className="inline-flex mt-5 items-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors break-all"
            >
              <Mail className="h-5 w-5" />
              {editorialEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <MapPin className="h-5 w-5 text-red-600 mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white">कार्यालय</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{officeAddress}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <Clock className="h-5 w-5 text-red-600 mb-3" />
          <h3 className="font-bold text-zinc-900 dark:text-white">संपादकीय डेस्क</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">महत्वपूर्ण समाचार और सुझाव ईमेल के माध्यम से भेजें।</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <FileText className="h-4 w-4 text-red-600" />
        संदेश भेजने का फॉर्म हटा दिया गया है। संपर्क के लिए केवल ईमेल का उपयोग करें।
      </div>
    </motion.div>
  )
}
