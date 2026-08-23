import { useNews } from "@/context/NewsContext"
import { 
  Mail, 
  MapPin, 
  Send, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Building, 
  ShieldCheck,
  Clock,
  ExternalLink,
  MessageSquare
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
            {siteSettings.siteName || 'दमोह डेली न्यूज़ नेटवर्क'} की संपादकीय टीम से जुड़ें, समाचार सुझाव भेजें या आधिकारिक संवाद के लिए सीधे ईमेल के माध्यम से संपर्क करें।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Email Contact Section */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-red-600" />
              आधिकारिक ईमेल संपर्क (Official Email Contact)
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              For news, press releases, corrections, business inquiries, or general communication, contact us at:
            </p>
          </div>

          {/* Primary Clickable Mailto Card */}
          <div className="p-6 bg-red-50/70 dark:bg-red-950/30 rounded-xl border border-red-200/80 dark:border-red-900/40 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600 text-white rounded-xl shadow-md shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-xs font-bold uppercase text-red-600 dark:text-red-400 tracking-wider">
                  Editorial & Official Email
                </span>
                <p className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white break-all">
                  {editorialEmail}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  समाचार, प्रेस विज्ञप्ति, सुधार और विज्ञापन पूछताछ
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a 
                href={`mailto:${editorialEmail}`}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md text-sm"
              >
                <Mail className="h-4 w-4" />
                <span>ईमेल भेजें (Send Email Now)</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80 ml-1" />
              </a>
            </div>
          </div>

          {/* Guidelines for News Submissions */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-red-600" />
              समाचार सुझाव या प्रेस विज्ञप्ति भेजने के निर्देश (Guidelines)
            </h3>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside">
              <li>घटना या समाचार का स्पष्ट विवरण, स्थान और समय का उल्लेख करें।</li>
              <li>संबंधित फोटो अथवा वीडियो दस्तावेज़ ईमेल अटैचमेंट के रूप में संलग्न करें।</li>
              <li>सत्यापन हेतु अपना नाम व संपर्क नंबर अवश्य लिखें।</li>
              <li>संपादकीय टीम द्वारा तथ्यों की पुष्टि के उपरांत समाचार प्रकाशित किया जाएगा।</li>
            </ul>
          </div>
        </div>

        {/* Contact Info & Office Details */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b pb-3 border-zinc-200 dark:border-zinc-800">
            <Building className="h-5 w-5 text-red-600" /> आधिकारिक संपादकीय विवरण
          </h2>

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
              प्राप्त समाचार सुझावों व ईमेल संदेशों की समीक्षा हमारी वरिष्ठ संपादकीय टीम द्वारा प्राथमिकता के आधार पर की जाती है।
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

      </div>
    </motion.div>
  )
}
