import { useState, useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3,
  PlusCircle, 
  Settings, 
  Users, 
  FolderTree, 
  Image, 
  MessageSquare, 
  DollarSign, 
  Search, 
  ExternalLink, 
  ArrowLeft,
  Menu,
  X,
  Shield,
  LogOut,
  Sparkles,
  Loader2,
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"
import { auth, onAuthStateChanged, signOut, deleteUser, User } from "@/lib/firebase"
import { AdminLogin } from "@/components/AdminLogin"
import { useNews } from "@/context/NewsContext"

export function AdminLayout() {
  const { loadAdminData } = useNews()
  const location = useLocation()

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null | undefined>(undefined) // undefined = loading
  const [authError, setAuthError] = useState<string | null>(null)
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const creationTime = new Date(currentUser.metadata.creationTime || 0).getTime()
        const lastSignInTime = new Date(currentUser.metadata.lastSignInTime || 0).getTime()
        
        // Check if this Google account was just auto-provisioned (not pre-configured in Firebase Auth)
        const isNewGoogleAccount = 
          currentUser.providerData.some(p => p.providerId === 'google.com') && 
          Math.abs(lastSignInTime - creationTime) < 15000

        if (isNewGoogleAccount) {
          try {
            await deleteUser(currentUser)
          } catch (delErr) {
            console.warn("Could not delete unauthorized Google account:", delErr)
          }
          await signOut(auth)
          setAuthError("Access Denied. You are not authorized to access this Admin Panel.")
          setUser(null)
          return
        }

        setAuthError(null)
        setUser(currentUser)
      } else {
        setUser(null)
      }
    })
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Messages & Tips", path: "/admin/messages", icon: Inbox },
    { label: "Write News", path: "/admin/create", icon: PlusCircle },
    { label: "All News Articles", path: "/admin/news", icon: FileText },
    { label: "Analytics & Traffic", path: "/admin/analytics", icon: BarChart3 },
    { label: "Categories", path: "/admin/categories", icon: FolderTree },
    { label: "Reporters & Roles", path: "/admin/reporters", icon: Users },
    { label: "Media Assets", path: "/admin/media", icon: Image },
    { label: "Comments", path: "/admin/comments", icon: MessageSquare },
    { label: "Ads Manager", path: "/admin/ads", icon: DollarSign },
    { label: "SEO & Meta", path: "/admin/seo", icon: Search },
    { label: "Portal Settings", path: "/admin/settings", icon: Settings },
  ]

  // Close mobile drawer on path change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Body scroll lock
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

  // Show loading indicator while checking auth
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Verifying Firebase Authentication...
        </p>
      </div>
    )
  }

  // If unauthenticated, show Firebase Admin Login screen
  if (user === null) {
    return <AdminLogin initialError={authError} />
  }

  const displayName = user.displayName || user.email?.split('@')[0].toUpperCase() || "ADMIN"
  const email = user.email || ""
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-zinc-900 text-white p-3 border-b border-zinc-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-zinc-800 h-11 w-11 flex items-center justify-center rounded-lg active:bg-zinc-700 transition-colors shrink-0"
            aria-label="Toggle Admin Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link to="/admin" className="flex items-center py-1">
            <img 
              src="/logo.png" 
              alt="Damoh Daily News Network" 
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
              }}
              className="h-8 w-auto max-w-[160px] object-contain" 
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            size="sm" 
            className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1 px-2.5 h-8"
          >
            <LogOut className="h-3.5 w-3.5 text-red-400" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <Link to="/" className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-zinc-800 px-3 py-1.5 rounded-lg active:bg-zinc-700">
            <span>Live Site</span> <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              className="relative w-[85%] max-w-xs bg-zinc-900 text-zinc-300 h-full flex flex-col z-50 shadow-2xl border-r border-zinc-800"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <img 
                    src="/logo.png" 
                    alt="Damoh Daily News Network" 
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
                    }}
                    className="h-8 w-auto max-w-[150px] object-contain" 
                  />
                </Link>
                <button 
                  type="button" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-400 hover:text-white h-11 w-11 flex items-center justify-center rounded-full active:bg-zinc-800 transition-colors"
                  aria-label="Close Admin Drawer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors min-h-[44px] ${
                        isActive ? "bg-red-600 text-white shadow-md" : "hover:bg-zinc-800 hover:text-white text-zinc-400"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 space-y-3">
                <Link to="/" className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300">
                  <ArrowLeft className="h-4 w-4" /> Exit to Public Website
                </Link>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-black text-white text-xs shrink-0">
                      {initial}
                    </div>
                    <div className="text-xs min-w-0">
                      <p className="font-bold text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{email}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-zinc-900 text-zinc-300 flex-col shrink-0 min-h-screen sticky top-0 h-screen">
        <div className="p-5 border-b border-zinc-800 space-y-3">
          <Link to="/" className="flex flex-col items-center group">
            <img 
              src="/logo.png" 
              alt="Damoh Daily News Network" 
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
              }}
              className="h-12 w-auto max-w-[200px] object-contain transition-transform group-hover:scale-[1.02]" 
            />
            <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase mt-2 flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" /> FIREBASE CMS CONTROL
            </span>
          </Link>

          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors pt-2">
            <ArrowLeft className="h-3.5 w-3.5" /> View Live Website <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  isActive ? "bg-red-600 text-white shadow-md" : "hover:bg-zinc-800 hover:text-white text-zinc-400"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-md">
              {initial}
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-zinc-400 truncate">{email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
