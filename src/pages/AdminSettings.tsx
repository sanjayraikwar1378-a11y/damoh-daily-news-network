import React, { useState, useEffect, useRef } from "react"
import { Save, CheckCircle, Globe, Phone, Mail, Share2, Shield, Coins, RefreshCw, AlertCircle, Upload, Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { INITIAL_MARKET_RATES } from "@/data/mock"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function AdminSettings() {
  const { siteSettings, updateSiteSettings, marketRates, updateMarketRates } = useNews()
  const [form, setForm] = useState(siteSettings)
  const [ratesForm, setRatesForm] = useState(marketRates)
  const [saved, setSaved] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const isSettingsLoadedRef = useRef(false)
  const isRatesLoadedRef = useRef(false)

  // Keep form in sync when siteSettings or marketRates arrive from Firestore
  useEffect(() => {
    if (siteSettings && !isSettingsLoadedRef.current) {
      isSettingsLoadedRef.current = true
      setForm(siteSettings)
    }
  }, [siteSettings])

  useEffect(() => {
    if (marketRates && !isRatesLoadedRef.current) {
      isRatesLoadedRef.current = true
      setRatesForm(marketRates)
    }
  }, [marketRates])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploadingLogo(true)
      try {
        const res = await uploadToCloudinary(file, 'logos')
        setForm(prev => ({ ...prev, [targetField]: res.url }))
      } catch (err) {
        console.error("Cloudinary logo upload failed:", err)
      } finally {
        setIsUploadingLogo(false)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setRatesForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setRatesForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const setCurrentTimestamp = () => {
    const now = new Date()
    const formattedDate = now.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + `, ${now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}`
    setRatesForm(prev => ({ ...prev, lastUpdated: formattedDate }))
  }

  const resetToBenchmark = () => {
    setRatesForm(INITIAL_MARKET_RATES)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateSiteSettings(form)
    updateMarketRates(ratesForm)
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Portal Settings</h1>
          <p className="text-sm text-zinc-500">Configure portal identity, contact channels, and social media handles.</p>
        </div>
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white font-bold">
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5" /> Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 text-red-600" /> General Site Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Website Name</label>
                <Input name="siteName" value={form.siteName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Tagline / Slogan</label>
                <Input name="tagline" value={form.tagline} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Logo Image URL</label>
                <Input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Favicon Image URL</label>
                <Input name="faviconUrl" value={form.faviconUrl} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Damoh Local Market & Fuel Rates Management Card */}
        <Card className="border-amber-500/30 dark:border-amber-500/20 shadow-sm">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Coins className="h-5 w-5 text-amber-600" /> दमोह बाजार व ईंधन दरें प्रबंधन (Damoh Live Rates)
                </CardTitle>
                <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  दमोह (मध्य प्रदेश) की सोना, चांदी, पेट्रोल एवं डीजल दरों को यहां से लाइव अपडेट करें।
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={setCurrentTimestamp}
                  className="text-xs font-bold gap-1 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> समय अपडेट करें
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetToBenchmark}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  डिफ़ॉल्ट दरें
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            
            {/* Widget Status & Location Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">लोकेशन (Location)</label>
                <Input 
                  name="location" 
                  value={ratesForm.location} 
                  onChange={handleRateChange} 
                  placeholder="दमोह (म.प्र.)" 
                  className="bg-white dark:bg-zinc-950 font-bold"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300">स्थिति लेबल (Status Tag / Badge)</label>
                <Input 
                  name="statusText" 
                  value={ratesForm.statusText} 
                  onChange={handleRateChange} 
                  placeholder="Latest available price" 
                  className="bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={ratesForm.isAvailable}
                    onChange={handleRateChange}
                    className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="isAvailable" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    विजेट सक्रिय है (Widget Active) — अनचेक करने पर &quot;नवीनतम दरें अस्थायी रूप से उपलब्ध नहीं हैं&quot; प्रदर्शित होगा
                  </label>
                </div>
              </div>
            </div>

            {/* Price Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Gold Rate */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">सोना दर (Gold 24K)</label>
                  <span className="text-[10px] text-zinc-500">दमोह स्थानीय बाजार</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    name="gold" 
                    value={ratesForm.gold} 
                    onChange={handleRateChange} 
                    placeholder="₹73,450" 
                    className="font-bold text-amber-700 dark:text-amber-400 bg-white dark:bg-zinc-900"
                  />
                  <Input 
                    name="goldUnit" 
                    value={ratesForm.goldUnit} 
                    onChange={handleRateChange} 
                    placeholder="10 ग्राम (24K)" 
                    className="text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Silver Rate */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300">चांदी दर (Silver 1kg)</label>
                  <span className="text-[10px] text-zinc-500">दमोह स्थानीय बाजार</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    name="silver" 
                    value={ratesForm.silver} 
                    onChange={handleRateChange} 
                    placeholder="₹86,100" 
                    className="font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  />
                  <Input 
                    name="silverUnit" 
                    value={ratesForm.silverUnit} 
                    onChange={handleRateChange} 
                    placeholder="1 किलोग्राम" 
                    className="text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Petrol Rate */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">पेट्रोल दर (Petrol)</label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">दमोह शहर</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    name="petrol" 
                    value={ratesForm.petrol} 
                    onChange={handleRateChange} 
                    placeholder="₹108.65" 
                    className="font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900"
                  />
                  <Input 
                    name="petrolUnit" 
                    value={ratesForm.petrolUnit} 
                    onChange={handleRateChange} 
                    placeholder="प्रति लीटर" 
                    className="text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              {/* Diesel Rate */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">डीजल दर (Diesel)</label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-500 font-bold">दमोह शहर</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    name="diesel" 
                    value={ratesForm.diesel} 
                    onChange={handleRateChange} 
                    placeholder="₹93.90" 
                    className="font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-zinc-900"
                  />
                  <Input 
                    name="dieselUnit" 
                    value={ratesForm.dieselUnit} 
                    onChange={handleRateChange} 
                    placeholder="प्रति लीटर" 
                    className="text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

            </div>

            {/* Last Updated Timestamp Input */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                <span>अंतिम अपडेट समय (Last Updated Date &amp; Time)</span>
                <span className="text-[10px] text-zinc-400 normal-case">वेबसाइट पर प्रदर्शित होने वाली तारीख/समय</span>
              </label>
              <Input 
                name="lastUpdated" 
                value={ratesForm.lastUpdated} 
                onChange={handleRateChange} 
                placeholder="28 जुलाई 2026, 11:00 AM" 
              />
            </div>

          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" /> Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Contact Email</label>
                <Input name="contactEmail" value={form.contactEmail} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Contact Phone Number</label>
                <Input name="contactPhone" value={form.contactPhone} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500">Office Address</label>
              <textarea name="contactAddress" value={form.contactAddress} onChange={handleChange} rows={2} className="w-full p-2 border rounded-md text-sm bg-background" />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-600" /> Social Links & WhatsApp Hotline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Facebook Page URL</label>
                <Input name="facebookUrl" value={form.facebookUrl} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Twitter / X URL</label>
                <Input name="twitterUrl" value={form.twitterUrl} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">YouTube Channel URL</label>
                <Input name="youtubeUrl" value={form.youtubeUrl || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">WhatsApp News Tip Hotline</label>
                <Input name="whatsappNumber" value={form.whatsappNumber || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Instagram Profile URL</label>
                <Input name="instagramUrl" value={form.instagramUrl || ''} onChange={handleChange} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Telegram Channel URL</label>
                <Input name="telegramUrl" value={form.telegramUrl || ''} onChange={handleChange} placeholder="https://t.me/..." />
              </div>
            </div>
          </CardContent>
        </Card>

      </form>
    </motion.div>
  )
}
