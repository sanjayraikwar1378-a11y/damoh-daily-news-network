import React, { useState } from "react"
import { DollarSign, Save, Layout, Smartphone, CheckCircle, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function AdminAds() {
  const { adSettings, updateAdSettings } = useNews()
  const [form, setForm] = useState(adSettings)
  const [saved, setSaved] = useState(false)

  const handleToggle = (key: keyof Omit<typeof adSettings, 'googleAdsenseId'>) => {
    setForm(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled
      }
    }))
  }

  const handleSlotChange = (key: keyof Omit<typeof adSettings, 'googleAdsenseId'>, field: 'imageUrl' | 'linkUrl' | 'adCode', value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotKey: keyof Omit<typeof adSettings, 'googleAdsenseId'>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadingSlot(slotKey)
      try {
        const res = await uploadToCloudinary(file, 'banners')
        handleSlotChange(slotKey, 'imageUrl', res.url)
      } catch (err) {
        console.error("Cloudinary ad banner upload failed:", err)
      } finally {
        setUploadingSlot(null)
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateAdSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const slots = [
    { key: 'headerAd', name: 'Header Top Banner (728x90)', desc: 'Displays at the top of the header on all pages' },
    { key: 'sidebarAd', name: 'Sidebar Ad Banner (300x250 / 300x600)', desc: 'Displays in homepage and category sidebar' },
    { key: 'articleAd', name: 'In-Article Inline Ad (728x90 / 300x250)', desc: 'Displays inside article reading content' },
    { key: 'footerAd', name: 'Footer Banner Ad (728x90)', desc: 'Displays above the website footer' },
    { key: 'stickyAd', name: 'Sticky Bottom Floating Banner (Mobile)', desc: 'Floats at the bottom on mobile devices' },
  ] as const

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Advertisement Manager</h1>
          <p className="text-sm text-zinc-500">Configure Google AdSense integration, custom banner placements, and ad slots.</p>
        </div>
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white font-bold">
          <Save className="h-4 w-4 mr-2" /> Save Ad Config
        </Button>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5" /> Advertisement settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Google AdSense Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" /> Google AdSense Global Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500">Google AdSense Publisher ID</label>
              <Input 
                value={form.googleAdsenseId}
                onChange={e => setForm(prev => ({ ...prev, googleAdsenseId: e.target.value }))}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Ad Slots */}
        <div className="space-y-6">
          {slots.map(slot => {
            const slotData = form[slot.key]
            return (
              <Card key={slot.key}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base font-bold">{slot.name}</CardTitle>
                      <p className="text-xs text-zinc-500">{slot.desc}</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={slotData.enabled}
                        onChange={() => handleToggle(slot.key)}
                        className="rounded text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {slotData.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </CardHeader>

                {slotData.enabled && (
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-zinc-500">Banner Image URL</label>
                          <label className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1">
                            {uploadingSlot === slot.key ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            Upload to Cloudinary
                            <input 
                              type="file" 
                              accept="image/*" 
                              disabled={uploadingSlot === slot.key} 
                              className="hidden" 
                              onChange={e => handleBannerUpload(e, slot.key)} 
                            />
                          </label>
                        </div>
                        <Input 
                          value={slotData.imageUrl}
                          onChange={e => handleSlotChange(slot.key, 'imageUrl', e.target.value)}
                          placeholder="https://images.unsplash.com/..." 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500">Target Link URL</label>
                        <Input 
                          value={slotData.linkUrl}
                          onChange={e => handleSlotChange(slot.key, 'linkUrl', e.target.value)}
                          placeholder="https://advertiser-website.com" 
                        />
                      </div>
                    </div>

                    {Boolean(slotData.imageUrl?.trim()) && (
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-center">
                        <span className="text-[10px] text-zinc-400 block mb-1">Preview</span>
                        <img src={slotData.imageUrl || undefined} alt="Ad Preview" className="mx-auto rounded max-h-24 object-cover" />
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

      </form>
    </motion.div>
  )
}
