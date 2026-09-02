import React, { useState, useEffect, useRef } from "react"
import { Search, Save, Globe, Code, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"

export function AdminSEO() {
  const { siteSettings, updateSiteSettings } = useNews()
  const [form, setForm] = useState({
    siteName: siteSettings.siteName || '',
    tagline: siteSettings.tagline || '',
    googleAnalyticsId: siteSettings.googleAnalyticsId || '',
    searchConsoleMeta: siteSettings.searchConsoleMeta || ''
  })
  const [saved, setSaved] = useState(false)

  const isLoadedRef = useRef(false)

  useEffect(() => {
    if (siteSettings && !isLoadedRef.current) {
      isLoadedRef.current = true
      setForm({
        siteName: siteSettings.siteName || '',
        tagline: siteSettings.tagline || '',
        googleAnalyticsId: siteSettings.googleAnalyticsId || '',
        searchConsoleMeta: siteSettings.searchConsoleMeta || ''
      })
    }
  }, [siteSettings])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateSiteSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">SEO & Webmaster Tools</h1>
          <p className="text-sm text-zinc-500">Manage site-wide meta titles, Google Analytics tracking, Search Console verification, and JSON-LD schema.</p>
        </div>
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white font-bold">
          <Save className="h-4 w-4 mr-2" /> Save SEO Settings
        </Button>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5" /> SEO settings updated!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" /> Search Engine Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500">Website Name</label>
              <Input 
                value={form.siteName}
                onChange={e => setForm(prev => ({ ...prev, siteName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500">Default Meta Tagline / Description</label>
              <textarea 
                value={form.tagline}
                onChange={e => setForm(prev => ({ ...prev, tagline: e.target.value }))}
                rows={2}
                className="w-full p-3 border rounded-md text-sm bg-background"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" /> Webmaster Verification & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500">Google Analytics Tracking ID (GA4)</label>
              <Input 
                value={form.googleAnalyticsId}
                onChange={e => setForm(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                placeholder="G-XXXXXXXXXX" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500">Google Search Console Verification Tag</label>
              <Input 
                value={form.searchConsoleMeta}
                onChange={e => setForm(prev => ({ ...prev, searchConsoleMeta: e.target.value }))}
                placeholder="google-site-verification=..." 
              />
            </div>
          </CardContent>
        </Card>

        {/* JSON-LD Schema Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Generated JSON-LD NewsArticle Schema Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-zinc-900 text-green-400 font-mono text-xs rounded-xl overflow-x-auto">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "name": form.siteName,
  "url": window.location.origin,
  "logo": {
    "@type": "ImageObject",
    "url": `${window.location.origin}/logo.png`,
    "width": 1024,
    "height": 512
  },
  "sameAs": [
    siteSettings.facebookUrl,
    siteSettings.twitterUrl,
    siteSettings.youtubeUrl
  ].filter(Boolean)
}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  )
}
