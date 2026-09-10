import { Link, useLocation, useNavigate } from "react-router-dom"
import { Search, Menu, Sun, Moon, MapPin, ChevronDown, Bookmark, X, Home as HomeIcon, Shield, Sparkles, ExternalLink, Flame, Newspaper, PhoneCall, Clock, Mail, MessageSquare, Phone, Building2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo, useRef } from "react"
import { useNews } from "@/context/NewsContext"
import { useWeather } from "@/context/WeatherContext"
import { SearchBar } from "@/components/SearchBar"
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker"
import { NotificationCenter } from "@/components/NotificationCenter"
import { LogoImage } from "@/components/LogoImage"
import { motion, AnimatePresence } from "motion/react"
import { getHeaderNavigationItems, HeaderNavItem } from "@/config/categories"

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
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    const nextDark = !isCurrentlyDark
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
  
  // Unified navigation items according to priority order:
  // 1. Home, 2. Latest News, 3. Damoh, 4. Crime, 5. MP, 6. India, 7. Politics, 8. Religion, followed by remaining categories
  const navItems = useMemo(() => getHeaderNavigationItems(categories), [categories])

  // Ref to measure available middle horizontal space dynamically in the main header row
  const navContainerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    if (!navContainerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) {
          setContainerWidth(Math.floor(w))
        }
      }
    })
    ro.observe(navContainerRef.current)
    return () => ro.disconnect()
  }, [])

  // The header desktop row displays up to the 8 primary priority items:
  // 1. Home, 2. Latest News, 3. Damoh, 4. Crime, 5. MP, 6. India, 7. Politics, 8. Religion.
  // All remaining categories naturally flow into the "और देखें (More)" dropdown menu.
  const MAX_PRIMARY_ITEMS = 8

  // Calculate how many priority categories fit naturally in the available horizontal space
  const visibleCount = useMemo(() => {
    const ESTIMATED_ITEM_WIDTHS: Record<string, number> = {
      '': 70,
      'home': 70,
      'latest-news': 110,
      'latest-news-page': 110,
      'damoh': 65,
      'crime': 65,
      'madhya-pradesh': 110,
      'india': 65,
      'politics': 78,
      'religion': 65,
      'taaza-khabarein': 85,
      'breaking-news': 110,
      'business': 75,
      'agriculture': 65,
      'education': 70,
      'jobs': 80,
      'sports': 60,
      'entertainment': 90,
      'technology': 80,
      'health': 80,
      'weather': 65,
      'videos': 65,
      'photo-gallery': 95,
      'fact-check': 85,
      'international': 95,
    }
    const MORE_BTN_WIDTH = 115
    const ITEM_GAP = 6

    if (containerWidth > 0) {
      let available = containerWidth - MORE_BTN_WIDTH - ITEM_GAP
      let count = 0
      const limit = Math.min(MAX_PRIMARY_ITEMS, navItems.length)
      for (let i = 0; i < limit; i++) {
        const w = (ESTIMATED_ITEM_WIDTHS[navItems[i].slug] || 75) + ITEM_GAP
        if (available >= w) {
          available -= w
          count++
        } else {
          break
        }
      }
      return Math.max(1, Math.min(MAX_PRIMARY_ITEMS, count))
    }

    if (typeof window !== 'undefined') {
      const w = window.innerWidth
      if (w >= 1440) return 8
      if (w >= 1366) return 7
      if (w >= 1280) return 6
      if (w >= 1024) return 5
      if (w >= 768) return 4
    }
    return 4
  }, [containerWidth, navItems])

  const visibleNavItems = useMemo(() => navItems.slice(0, visibleCount), [navItems, visibleCount])
  const moreNavItems = useMemo(() => navItems.slice(visibleCount), [navItems, visibleCount])

  // Helper to accurately match active status for Home, Latest News, and Categories
  const isItemActive = (item: HeaderNavItem): boolean => {
    if (item.isHome) {
      return location.pathname === '/' || location.pathname === ''
    }
    if (item.isLatestNews || item.path === '/latest-news') {
      return location.pathname === '/latest-news' || location.pathname === '/category/latest-news'
    }
    const currentPath = location.pathname.toLowerCase()
    const targetPath = item.path.toLowerCase()
    if (currentPath === targetPath) return true

    if (currentPath.startsWith('/category/')) {
      const rawSlug = currentPath.replace('/category/', '').split('/')[0].split('?')[0]
      let decodedSlug = rawSlug
      try {
        decodedSlug = decodeURIComponent(rawSlug).toLowerCase()
      } catch {}

      if (item.slug && item.slug.toLowerCase() === decodedSlug) return true
      if (item.englishName && item.englishName.toLowerCase() === decodedSlug) return true
      if (item.hindiName && item.hindiName.toLowerCase() === decodedSlug) return true
      if (item.aliases && item.aliases.some(a => a.toLowerCase() === decodedSlug)) return true
    }
    return false
  }

  const isMoreActive = useMemo(() => {
    return moreNavItems.some(item => isItemActive(item))
  }, [moreNavItems, location.pathname])

  // Refs for mobile scroll & desktop more dropdown
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Smoothly scroll active category into view on mobile
  useEffect(() => {
    if (!mobileScrollRef.current) return
    const activeEl = mobileScrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null
    if (activeEl) {
      const container = mobileScrollRef.current
      const scrollLeft = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2)
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [location.pathname])

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMoreMenu(false)
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showMoreMenu])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md shadow-sm transition-all">
      {/* Header Ad Slot */}
      {Boolean(adSettings.headerAd.enabled) && Boolean(adSettings.headerAd.imageUrl?.trim()) && (
        <div className="bg-zinc-100 dark:bg-zinc-900 border-b py-2 text-center hidden md:block">
          <div className="container mx-auto px-4 max-w-7xl">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">ADVERTISEMENT</span>
            <a href={adSettings.headerAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
              <img 
                src={adSettings.headerAd.imageUrl || undefined} 
                alt="Header Sponsor" 
                loading="lazy"
                decoding="async"
                width={728}
                height={90}
                className="mx-auto rounded max-h-16 object-cover" 
              />
            </a>
          </div>
        </div>
      )}

      {/* Top Ticker Bar */}
      <div className="bg-zinc-900 text-zinc-200 text-xs py-1 border-b border-zinc-800 w-full overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center max-w-7xl w-full">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 min-w-0 flex-1">
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
            <a 
              href="https://chat.whatsapp.com/JDGzGkpuLHt4TtQ0u3V79C" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all font-bold text-xs" 
              title="हमारे आधिकारिक WhatsApp ग्रुप से जुड़ें"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>WhatsApp ग्रुप</span>
            </a>
            <span className="text-zinc-700">|</span>
            <Link to="/bookmarks" className="flex items-center gap-1 hover:text-red-400 transition-colors font-medium text-xs">
              <Bookmark className="h-3.5 w-3.5 text-red-500" />
              <span>बुकमार्क ({bookmarks.length})</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <Link to="/send-news-tip" className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors font-bold text-xs">
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
              <span>समाचार टिप (Send Tip)</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <Link to="/admin" className="hover:text-white transition-colors font-bold bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-white text-[11px]">
              Admin CMS
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Header Bar: [ Logo ] [ Category Navigation in same row ] [ Icons ] */}
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl min-h-[68px] xs:min-h-[74px] sm:min-h-[102px] md:min-h-[110px] lg:min-h-[125px] xl:min-h-[132px] flex items-center justify-between relative gap-1.5 sm:gap-2.5 lg:gap-3 w-full py-0.5">
        {/* Left Section: Mobile Hamburger (< md) + Brand Logo */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 md:flex-initial md:shrink-0">
          {/* Hamburger Menu Toggle button for mobile (< md) */}
          <button 
            type="button"
            className="md:hidden min-h-[38px] min-w-[38px] h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors shrink-0 relative z-20" 
            onClick={(e) => {
              e.stopPropagation()
              setMobileMenuOpen(true)
            }}
            aria-label="Open Navigation Drawer"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Full Responsive Brand Logo - balanced mobile size and 20% enlarged desktop presence */}
          <Link to="/" className="flex items-center group min-w-0 flex-1 md:flex-initial md:shrink-0 py-0 relative z-10 hover:opacity-95 transition-opacity" aria-label="Damoh Daily News Network Home">
            <LogoImage 
              src={siteSettings.logoUrl} 
              alt={siteSettings.siteName || "Damoh Daily News Network"} 
              width={492}
              height={106}
              priority={true}
              className="h-[68px] xs:h-[74px] sm:h-[102px] md:h-[110px] lg:h-[125px] xl:h-[132px] w-auto max-w-[calc(100vw-170px)] sm:max-w-[580px] md:max-w-[660px] lg:max-w-[730px] xl:max-w-[800px] object-contain object-left" 
            />
          </Link>
        </div>

        {/* Middle Section: Desktop Category Navigation In The SAME Main Header Row (>= md) */}
        <div 
          ref={navContainerRef}
          className="hidden md:flex items-center flex-1 min-w-0 mx-1 lg:mx-2 xl:mx-3 overflow-visible"
        >
          <nav 
            id="desktop-category-navigation"
            aria-label="श्रेणी नेविगेशन (Category Navigation)"
            className="flex items-center gap-1 lg:gap-1.5 flex-nowrap whitespace-nowrap overflow-visible w-full"
          >
            <div className="flex items-center gap-1 lg:gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden shrink min-w-0">
              {visibleNavItems.map(item => {
                const active = isItemActive(item)
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    data-active={active}
                    id={`desktop-nav-${item.slug || 'home'}`}
                    className={`px-2 lg:px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none ${
                      active
                        ? "text-white bg-red-600 shadow-xs font-black"
                        : "text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                    }`}
                  >
                    {item.isHome && <HomeIcon className="h-3.5 w-3.5 shrink-0" />}
                    {item.isLatestNews && <Flame className={`h-3.5 w-3.5 shrink-0 fill-current ${active ? 'text-white' : 'text-red-600 animate-pulse'}`} />}
                    <span>{item.hindiName}</span>
                    <span className="sr-only">({item.englishName})</span>
                  </Link>
                )
              })}
            </div>

            {/* MORE Dropdown for remaining categories that do not fit in available space */}
            {moreNavItems.length > 0 && (
              <div 
                ref={moreMenuRef}
                className="relative shrink-0"
                onMouseEnter={() => setShowMoreMenu(true)}
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                <button
                  type="button"
                  id="desktop-nav-more-btn"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowMoreMenu(prev => !prev)
                  }}
                  aria-expanded={showMoreMenu}
                  aria-haspopup="true"
                  className={`px-2 lg:px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap select-none cursor-pointer ${
                    isMoreActive
                      ? "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <span>और देखें (More)</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMoreMenu ? "rotate-180" : ""}`} />
                  {isMoreActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  )}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-1.5 w-64 sm:w-72 py-2 bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-2xl z-50 flex flex-col max-h-[70vh] overflow-y-auto scrollbar-thin"
                    >
                      <div className="px-3.5 py-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-border/80 mb-1 flex items-center justify-between">
                        <span>अन्य श्रेणियां ({moreNavItems.length})</span>
                        <span className="text-[10px] text-zinc-400 font-normal">More Categories</span>
                      </div>
                      {moreNavItems.map(item => {
                        const active = isItemActive(item)
                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            id={`desktop-more-nav-${item.slug}`}
                            onClick={() => setShowMoreMenu(false)}
                            className={`px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between group ${
                              active
                                ? "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-400 font-black"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {item.isLatestNews && <Flame className="h-3.5 w-3.5 text-red-500 fill-current" />}
                              <span className="text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400">{item.hindiName}</span>
                              <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-normal">({item.englishName})</span>
                            </span>
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                            )}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>
        
        {/* Right Tools: Notification Bell, Search & Theme Toggle (Always Visible & Functional) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto relative z-20">
          <NotificationCenter />
          <SearchBar />
          <button 
            type="button"
            id="header-theme-toggle"
            onClick={(e) => {
              e.stopPropagation();
              toggleDarkMode();
            }} 
            className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors shrink-0 relative z-20"
            aria-label={isDark ? "लाइट थीम (Switch to Light Mode)" : "डार्क थीम (Switch to Dark Mode)"}
            title={isDark ? "लाइट मोड (Light Mode)" : "डार्क मोड (Dark Mode)"}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-amber-400 fill-amber-400/20 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-5 w-5 text-zinc-700 dark:text-zinc-300 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile-Only Horizontally Scrollable Category Bar (< md) - Compact & Space-Efficient */}
      <nav 
        id="category-navigation-mobile"
        aria-label="मोबाइल श्रेणी नेविगेशन (Mobile Category Navigation)" 
        className="md:hidden w-full max-w-full bg-white dark:bg-zinc-950 border-b border-border/80 shadow-xs relative z-30 overflow-hidden"
      >
        <div 
          ref={mobileScrollRef}
          className="flex items-center gap-1 overflow-x-auto scrollbar-none px-2 py-1 touch-pan-x select-none flex-nowrap whitespace-nowrap"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {navItems.map(item => {
            const active = isItemActive(item)
            return (
              <Link
                key={item.id}
                to={item.path}
                data-active={active}
                id={`mobile-nav-${item.slug || 'home'}`}
                className={`shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap min-h-[26px] active:scale-95 leading-none ${
                  active
                    ? "bg-red-600 text-white shadow-xs font-black ring-1 ring-red-600/30"
                    : "text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 bg-zinc-100/90 dark:bg-zinc-900/90 hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                }`}
              >
                {item.isHome && <HomeIcon className="h-3 w-3 shrink-0" />}
                {item.isLatestNews && <Flame className={`h-3 w-3 shrink-0 fill-current ${active ? 'text-white' : 'text-red-600 animate-pulse'}`} />}
                <span>{item.hindiName}</span>
                <span className="sr-only">({item.englishName})</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Breaking News Ticker - Stays sticky alongside Header */}
      <BreakingNewsTicker />
    </header>

    {/* Motion Slide-out Mobile Navigation Drawer */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex">
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
            <div className="p-3.5 border-b border-border bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center min-w-0 py-0.5" aria-label="Damoh Daily News Network Home">
                <LogoImage 
                  src={siteSettings.logoUrl} 
                  alt={siteSettings.siteName || "Damoh Daily News Network"} 
                  width={240}
                  height={52}
                  priority={false}
                  className="h-[44px] sm:h-[50px] w-auto max-w-[235px] object-contain object-left" 
                />
              </Link>

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

                {/* Official WhatsApp Group Option in Mobile Drawer */}
                <a
                  href="https://chat.whatsapp.com/JDGzGkpuLHt4TtQ0u3V79C"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-500/30 mb-1.5"
                  title="हमारे आधिकारिक WhatsApp ग्रुप से जुड़ें"
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>WhatsApp ग्रुप (Join Us)</span>
                  </span>
                  <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    JOIN
                  </span>
                </a>
                
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
                  to="/latest-news"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    location.pathname === '/latest-news' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Flame className="h-4 w-4 text-red-500 fill-current" />
                    <span>लेटेस्ट न्यूज़ (Latest News)</span>
                  </span>
                  <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    LIVE
                  </span>
                </Link>

                <Link
                  to="/about"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                    location.pathname === '/about' || location.pathname === '/about-us'
                      ? 'bg-red-600 text-white shadow-sm' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <Building2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span>हमारे बारे में (About Us)</span>
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

                {/* Theme Toggle inside Drawer */}
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 min-h-[44px]"
                  aria-label="Toggle Theme in Drawer"
                >
                  <span className="flex items-center gap-3">
                    {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />}
                    <span>थीम: {isDark ? "डार्क मोड (Dark Mode)" : "लाइट मोड (Light Mode)"}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-border shadow-2xs">
                    {isDark ? "Light करें" : "Dark करें"}
                  </span>
                </button>
              </div>

              {/* News Categories Section */}
              <div className="space-y-1.5 pt-3 border-t border-border">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                  समाचार श्रेणियां (Categories)
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {navItems.filter(item => !item.isHome).map(item => {
                    const isActive = isItemActive(item)
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        id={`drawer-nav-${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                          isActive
                            ? "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-400 border-l-4 border-red-600"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {item.isLatestNews ? (
                            <Flame className="h-3.5 w-3.5 text-red-600 fill-current" />
                          ) : (
                            <Newspaper className={`h-3.5 w-3.5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`} />
                          )}
                          <span>{item.hindiName} ({item.englishName})</span>
                        </span>
                        {item.priority && item.priority <= 8 ? (
                          <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">
                            प्रमुख
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-normal">
                            श्रेणी
                          </span>
                        )}
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
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                      <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>आधिकारिक ईमेल:</span>
                    </div>
                    <div className="flex flex-col gap-1 pl-5">
                      <a href="mailto:contactddnn@gmail.com" className="text-zinc-800 dark:text-zinc-200 font-medium truncate hover:underline">
                        contactddnn@gmail.com
                      </a>
                      <a href={`mailto:${siteSettings.contactEmail || "damohdailynewsnetwork@gmail.com"}`} className="text-zinc-800 dark:text-zinc-200 font-medium truncate hover:underline">
                        {siteSettings.contactEmail || "damohdailynewsnetwork@gmail.com"}
                      </a>
                    </div>
                  </div>
                  <Link 
                    to="/contact" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-center block text-[11px] transition-colors"
                  >
                    समाचार टिप या संदेश भेजें &rarr;
                  </Link>
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


