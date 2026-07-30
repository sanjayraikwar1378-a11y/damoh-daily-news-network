import { Link, useLocation, useNavigate } from "react-router-dom"
import { Search, Menu, Sun, Moon, MapPin, ChevronDown, Bookmark, X, Home as HomeIcon, Shield, Sparkles, ExternalLink, Flame, Newspaper, PhoneCall, Clock, Mail, MessageSquare, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useNews } from "@/context/NewsContext"
import { useWeather } from "@/context/WeatherContext"
import { SearchBar } from "@/components/SearchBar"
import { motion, AnimatePresence } from "motion/react"

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)
  const { categories, adSettings, siteSettings, bookmarks, marketRates } = useNews()
  const { weather, error: weatherError } = useWeather()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [drawerSearchQuery, setDrawerSearchQuery] = useState("")

  useEffect(() => {
    const isDarkModeActive = document.documentElement.classList.contains('dark')
    setIsDark(isDarkModeActive)

    const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    if (!mediaQuery) return

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update automatically if user has not set a manual preference in localStorage
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark')
          setIsDark(true)
        } else {
          document.documentElement.classList.remove('dark')
          setIsDark(false)
        }
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  // Auto-close menu on location change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [mobileMenuOpen])

  const toggleDarkMode = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleDrawerSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (drawerSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(drawerSearchQuery.trim())}`)
      setMobileMenuOpen(false)
      setDrawerSearchQuery("")
    }
  }
  
  const visibleCategories = categories.slice(0, 8)
  const moreCategories = categories.slice(8)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md shadow-sm transition-all">
      {/* Header Ad Slot */}
      {Boolean(adSettings.headerAd.enabled) && Boolean(adSettings.headerAd.imageUrl?.trim()) && (
        <div className="bg-zinc-100 dark:bg-zinc-900 border-b py-2 text-center hidden md:block">
          <div className="container mx-auto px-4 max-w-7xl">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">ADVERTISEMENT</span>
            <a href={adSettings.headerAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
              <img src={adSettings.headerAd.imageUrl || undefined} alt="Header Sponsor" className="mx-auto rounded max-h-16 object-cover" />
            </a>
          </div>
        </div>
      )}

      {/* Top Ticker Bar */}
      <div className="bg-zinc-900 text-zinc-200 text-xs py-1.5 border-b border-zinc-800">
        <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 max-w-full">
            {weather ? (
              <span className="flex items-center gap-1 font-bold text-amber-400 text-[11px] sm:text-xs shrink-0">
                <MapPin className="h-3 w-3 flex-shrink-0 text-red-500" /> Damoh, MP ({weather.temp}°C {weather.conditionHi})
              </span>
            ) : weatherError ? (
              <span className="text-[11px] text-zinc-400 font-medium shrink-0 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-500 shrink-0" /> Damoh: Weather Unavailable
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400 animate-pulse shrink-0 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-500 shrink-0" /> Damoh weather loading...
              </span>
            )}
            <span className="text-zinc-700 shrink-0">|</span>
            {marketRates.isAvailable ? (
              <>
                <span className="text-[11px] sm:text-xs shrink-0">सोना: <strong className="text-amber-400">{marketRates.gold}</strong></span>
                <span className="text-[11px] sm:text-xs shrink-0">चांदी: <strong className="text-zinc-300">{marketRates.silver}</strong></span>
                <span className="text-[11px] sm:text-xs shrink-0">पेट्रोल: <strong className="text-emerald-400">{marketRates.petrol}</strong></span>
                <span className="text-[11px] sm:text-xs shrink-0">डीजल: <strong className="text-blue-400">{marketRates.diesel}</strong></span>
                <span className="text-zinc-700 shrink-0 hidden md:inline">|</span>
                <span className="text-[10px] text-zinc-400 shrink-0 hidden md:flex items-center gap-1" title={`अंतिम अपडेट: ${marketRates.lastUpdated}`}>
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <span>{marketRates.statusText || 'Latest available price'}</span>
                </span>
              </>
            ) : (
              <span className="text-[11px] text-amber-400 font-medium shrink-0">
                नवीनतम दरें अस्थायी रूप से उपलब्ध नहीं हैं (Latest prices temporarily unavailable)
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <Link to="/bookmarks" className="flex items-center gap-1 hover:text-red-400 transition-colors font-medium text-xs">
              <Bookmark className="h-3.5 w-3.5 text-red-500" />
              <span>बुकमार्क ({bookmarks.length})</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <Link to="/admin" className="hover:text-white transition-colors font-bold bg-red-600 hover:bg-red-700 px-2.5 py-0.5 rounded text-white text-[11px]">
              Admin CMS
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Header Bar */}
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl h-16 flex items-center justify-between relative">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Hamburger Menu Toggle button with min 44px touch target */}
          <button 
            type="button"
            className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors shrink-0" 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Drawer"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Full Responsive Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group min-w-0 py-1">
            {siteSettings.logoUrl && siteSettings.logoUrl.trim() ? (
              <img src={siteSettings.logoUrl} alt={siteSettings.siteName || "Logo"} className="h-9 sm:h-10 object-contain" />
            ) : (
              <div className="flex flex-col justify-center leading-none min-w-0 select-none">
                <div className="flex items-center gap-1">
                  <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-red-600 group-hover:text-red-700 transition-colors">
                    DAMOH
                  </span>
                  <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                    DAILY
                  </span>
                </div>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] font-extrabold tracking-[0.14em] xs:tracking-[0.18em] sm:tracking-[0.25em] text-red-600 dark:text-red-500 uppercase mt-0.5 whitespace-nowrap">
                  NEWS NETWORK
                </span>
              </div>
            )}
          </Link>
        </div>
        
        {/* Desktop Category Nav */}
        <nav className="hidden lg:flex items-center gap-1 relative">
          {visibleCategories.map(category => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className={`px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 whitespace-nowrap ${
                location.pathname === `/category/${category.slug}` ? "text-red-600 bg-red-50 dark:bg-red-950/50" : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {category.name.split(' ')[0]}
            </Link>
          ))}

          {moreCategories.length > 0 && (
            <div 
              className="relative" 
              onMouseEnter={() => setShowMoreMenu(true)}
              onMouseLeave={() => setShowMoreMenu(false)}
            >
              <button className="px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                More <ChevronDown className="h-3.5 w-3.5" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute top-full right-0 w-52 py-2 bg-background border rounded-lg shadow-xl z-50 flex flex-col max-h-[60vh] overflow-y-auto">
                  {moreCategories.map(category => (
                    <Link
                      key={category.id}
                      to={`/category/${category.slug}`}
                      onClick={() => setShowMoreMenu(false)}
                      className="px-4 py-2 text-xs font-semibold hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
        
        {/* Right Tools */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <SearchBar />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode} 
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white h-10 w-10 shrink-0"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>

    {/* Motion Slide-out Mobile Navigation Drawer - Placed outside <header> to avoid backdrop-filter CSS containing block restrictions */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 260 }}
            className="relative w-[85%] max-w-[320px] xs:max-w-sm bg-background dark:bg-zinc-950 h-full shadow-2xl flex flex-col z-[101] overflow-hidden border-r border-border"
          >
            
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-border bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex flex-col justify-center leading-none">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black tracking-tight text-red-500">DAMOH</span>
                  <span className="text-xl font-black tracking-tight text-white">DAILY</span>
                </div>
                <span className="text-[9px] font-extrabold tracking-[0.18em] text-red-400 uppercase mt-0.5 whitespace-nowrap">
                  NEWS NETWORK
                </span>
              </div>

              <button 
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                aria-label="Close Navigation Drawer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
              
              {/* Search in Drawer */}
              <form onSubmit={handleDrawerSearch} className="relative">
                <input
                  type="text"
                  value={drawerSearchQuery}
                  onChange={(e) => setDrawerSearchQuery(e.target.value)}
                  placeholder="खबरें खोजें (Search)..."
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Quick Links Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1 mb-1">
                  मुख्य नेविगेशन (Navigation)
                </p>
                
                <Link
                  to="/"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    location.pathname === '/' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <HomeIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                  <span>होम पेज (Home)</span>
                </Link>

                <Link
                  to="/bookmarks"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    location.pathname === '/bookmarks' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Bookmark className="h-4 w-4 text-amber-500" />
                    <span>सहेजी गई खबरें (Bookmarks)</span>
                  </span>
                  <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                    {bookmarks.length}
                  </span>
                </Link>

                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-red-600 transition-colors min-h-[44px]"
                >
                  <Shield className="h-4 w-4 text-red-400" />
                  <span>एडमिन कंट्रोल पैनल (CMS)</span>
                </Link>
              </div>

              {/* News Categories Section */}
              <div className="space-y-1.5 pt-3 border-t border-border">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                  समाचार श्रेणियां (Categories)
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {categories.map(category => {
                    const isActive = location.pathname === `/category/${category.slug}`
                    return (
                      <Link
                        key={category.id}
                        to={`/category/${category.slug}`}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                          isActive
                            ? "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-400 border-l-4 border-red-600"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Newspaper className="h-3.5 w-3.5 text-zinc-400" />
                          {category.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          श्रेणी
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Live Info Section */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    संपादकीय हेल्पलाइन (Helpline)
                  </p>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-[10px] font-bold text-red-500 hover:underline">
                    Contact Us &rarr;
                  </Link>
                </div>

                <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl space-y-2 text-xs">
                  {siteSettings.contactPhone && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Phone className="h-3.5 w-3.5 text-red-500" />
                        <span>फोन:</span>
                      </span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{siteSettings.contactPhone}</strong>
                    </div>
                  )}
                  {siteSettings.whatsappNumber && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                        <span>व्हाट्सएप:</span>
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{siteSettings.whatsappNumber}</strong>
                    </div>
                  )}
                  {siteSettings.contactEmail && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                        <span>ईमेल:</span>
                      </span>
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[150px]">{siteSettings.contactEmail}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center px-1 pt-1">
                  <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    दमोह लाइव दरें व मौसम
                  </p>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {marketRates.location || 'दमोह'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                    <span>मौसम (Weather):</span>
                    {weather ? (
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">{weather.temp}°C {weather.conditionHi}</strong>
                    ) : (
                      <span className="text-zinc-400 text-xs">Weather Unavailable</span>
                    )}
                  </div>

                  {marketRates.isAvailable ? (
                    <>
                      <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                        <span>सोना ({marketRates.goldUnit || '10g'}):</span>
                        <strong className="text-amber-500">{marketRates.gold}</strong>
                      </div>
                      <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                        <span>चांदी ({marketRates.silverUnit || '1kg'}):</span>
                        <strong className="text-zinc-800 dark:text-zinc-200">{marketRates.silver}</strong>
                      </div>
                      <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                        <span>पेट्रोल ({marketRates.petrolUnit || 'लीटर'}):</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{marketRates.petrol}</strong>
                      </div>
                      <div className="flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                        <span>डीजल ({marketRates.dieselUnit || 'लीटर'}):</span>
                        <strong className="text-blue-600 dark:text-blue-400">{marketRates.diesel}</strong>
                      </div>
                      <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>अंतिम अपडेट:</span>
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400">{marketRates.lastUpdated}</span>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] text-center font-medium">
                      नवीनतम दरें अस्थायी रूप से उपलब्ध नहीं हैं। (Latest prices are temporarily unavailable)
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-border bg-zinc-50 dark:bg-zinc-900/50 text-[11px] text-zinc-500 text-center shrink-0">
              &copy; {new Date().getFullYear()} Damoh Daily News Network
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  )
}


