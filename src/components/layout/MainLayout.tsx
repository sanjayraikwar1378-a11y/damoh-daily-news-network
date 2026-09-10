import { Outlet, Link } from "react-router-dom"
import { Header } from "./Header"
import { useNews } from "@/context/NewsContext"
import { LogoImage } from "@/components/LogoImage"
import { LiveUpdatesWidget } from "@/components/LiveUpdatesWidget"
import { Mail, MapPin, MessageSquare, Facebook, Twitter, Instagram, Youtube, Send, MessageCircle } from "lucide-react"

export function MainLayout() {
  const { categories, siteSettings } = useNews()
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-50 w-full max-w-full">
      <Header />
      <main className="flex-1 w-full min-w-0">
        <Outlet />
      </main>

      {/* Floating Live Updates Widget & Real-time Alerts */}
      <LiveUpdatesWidget />
      
      <footer className="bg-zinc-950 text-zinc-400 py-10 md:py-12 border-t border-zinc-800 mt-auto">
        <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
              <LogoImage 
                src={siteSettings.logoUrl} 
                alt={siteSettings.siteName || "Damoh Daily News Network"} 
                width={3887}
                height={833}
                priority={false}
                className="h-[52px] sm:h-[60px] md:h-[68px] w-auto max-w-[275px] sm:max-w-[330px] max-w-full object-contain object-left select-none" 
              />
            </Link>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-1">
              {siteSettings.tagline || 'दमोह जिले का सबसे विश्वसनीय डिजिटल न्यूज़ प्लेटफॉर्म। सटीक और तेज़ खबरें, सबसे पहले।'}
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {siteSettings.facebookUrl && (
                <a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-blue-600 text-zinc-300 hover:text-white transition-colors" title="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {siteSettings.twitterUrl && (
                <a href={siteSettings.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-sky-500 text-zinc-300 hover:text-white transition-colors" title="X (Twitter)">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {siteSettings.instagramUrl && (
                <a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-pink-600 text-zinc-300 hover:text-white transition-colors" title="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {siteSettings.youtubeUrl && (
                <a href={siteSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors" title="YouTube">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {siteSettings.telegramUrl && (
                <a href={siteSettings.telegramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-sky-600 text-zinc-300 hover:text-white transition-colors" title="Telegram">
                  <Send className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Official WhatsApp Group Card */}
            <div className="pt-2">
              <a 
                href="https://chat.whatsapp.com/JDGzGkpuLHt4TtQ0u3V79C" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold transition-all group max-w-full" 
                title="हमारे आधिकारिक WhatsApp ग्रुप से जुड़ें"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">हमारे WhatsApp ग्रुप से जुड़ें &rarr;</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm sm:text-base mb-3 sm:mb-4 border-b border-zinc-800 pb-2 flex items-center justify-between">
              <span>संपर्क (Contact Us)</span>
              <Link to="/contact" className="text-xs font-normal text-red-500 hover:underline">विस्तार देखें &rarr;</Link>
            </h4>
            <div className="text-xs sm:text-sm space-y-2.5 text-zinc-300">
              <div className="flex items-start gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-1" />
                <div className="space-y-1">
                  <div>
                    <span className="text-zinc-400 text-xs">ईमेल 1: </span>
                    <a href="mailto:contactddnn@gmail.com" className="hover:underline text-white font-medium">contactddnn@gmail.com</a>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-xs">ईमेल 2: </span>
                    <a href={`mailto:${siteSettings.contactEmail || "damohdailynewsnetwork@gmail.com"}`} className="hover:underline text-white font-medium">{siteSettings.contactEmail || "damohdailynewsnetwork@gmail.com"}</a>
                  </div>
                </div>
              </div>
              <p className="flex items-start gap-2 pt-1 text-xs text-zinc-400">
                <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{siteSettings.contactAddress || "दमोह (मध्य प्रदेश) - 470661"}</span>
              </p>
              <div className="pt-1">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  समाचार टिप भेजें &rarr;
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm sm:text-base mb-3 sm:mb-4 border-b border-zinc-800 pb-2">कैटिगरी (Categories)</h4>
            <ul className="text-xs sm:text-sm space-y-2">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-red-500 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm sm:text-base mb-3 sm:mb-4 border-b border-zinc-800 pb-2">लिंक्स (Quick Links)</h4>
            <ul className="text-xs sm:text-sm space-y-2">
              <li><Link to="/" className="hover:text-white transition-colors">Home (मुख्य पृष्ठ)</Link></li>
              <li><Link to="/latest-news" className="hover:text-white transition-colors font-bold text-red-500">Latest News (लेटेस्ट न्यूज़)</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us (हमारे बारे में)</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us (संपर्क करें)</Link></li>
              <li><Link to="/bookmarks" className="hover:text-white transition-colors">Bookmarked Articles</Link></li>
              <li>
                <a 
                  href="https://chat.whatsapp.com/JDGzGkpuLHt4TtQ0u3V79C" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-400 text-emerald-400 font-medium transition-colors flex items-center gap-1.5"
                  title="हमारे आधिकारिक WhatsApp ग्रुप से जुड़ें"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>WhatsApp ग्रुप (Join Us)</span>
                </a>
              </li>
              <li><Link to="/admin" className="hover:text-red-400 transition-colors font-bold text-red-500">Admin CMS Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm sm:text-base mb-3 sm:mb-4 border-b border-zinc-800 pb-2">लीगल नीति (Legal & Policies)</h4>
            <ul className="text-xs space-y-2 text-zinc-400">
              <li><Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link to="/copyright-policy" className="hover:text-white transition-colors">Copyright Policy</Link></li>
              <li><Link to="/corrections-policy" className="hover:text-white transition-colors">Corrections Policy</Link></li>
              <li><Link to="/editorial-policy" className="hover:text-white transition-colors">Editorial Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="container mx-auto px-4 max-w-7xl mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} {siteSettings.siteName || 'Damoh Daily News Network'}. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-zinc-400 text-[11px]">
            <Link to="/about" className="hover:text-white transition-colors font-medium">About Us</Link>
            <span>•</span>
            <Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/copyright-policy" className="hover:text-white transition-colors">Copyright</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Editorial</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
