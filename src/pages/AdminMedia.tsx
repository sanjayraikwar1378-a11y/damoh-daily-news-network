import React, { useState } from "react"
import { Upload, Trash2, Copy, Check, Search, Image as ImageIcon, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function AdminMedia() {
  const { media, addMedia, deleteMedia } = useNews()
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      try {
        const res = await uploadToCloudinary(file, 'gallery')
        addMedia({
          url: res.url,
          title: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        })
      } catch (err) {
        console.error("Cloudinary gallery upload failed:", err)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleAddByUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    addMedia({
      url: newUrl.trim(),
      title: newTitle.trim() || 'Uploaded Image',
      size: 'External URL'
    })
    setNewUrl("")
    setNewTitle("")
  }

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredMedia = media.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Media Library</h1>
        <p className="text-sm text-zinc-500">
          Upload media assets directly to Cloudinary CDN &amp; store metadata securely in Firestore.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Upload Form */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Upload to Cloudinary</span>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                  gallery/
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors relative">
                {isUploading ? (
                  <div className="space-y-2 py-4">
                    <Loader2 className="h-8 w-8 text-red-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-red-600">Uploading to Cloudinary CDN...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-red-600 mb-2" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">Choose Image File</span>
                    <span className="text-xs text-zinc-400 mt-1">PNG, JPG, WEBP (Auto WebP / AVIF)</span>
                  </>
                )}
                <input type="file" accept="image/*" disabled={isUploading} className="hidden" onChange={handleFileUpload} />
              </label>

              <div className="relative border-t pt-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Or Add External Image URL</span>
                <form onSubmit={handleAddByUrl} className="space-y-3">
                  <Input 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="Image Title..." 
                  />
                  <Input 
                    value={newUrl} 
                    onChange={e => setNewUrl(e.target.value)} 
                    placeholder="https://images.unsplash.com/..." 
                  />
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Add to Gallery</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media Grid */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="font-bold text-lg">All Assets ({filteredMedia.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search images..."
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredMedia.map(m => (
              <div key={m.id} className="group border rounded-xl overflow-hidden bg-background relative shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-zinc-100 overflow-hidden relative">
                  <img src={m.url || undefined} alt={m.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(m.url, m.id)}
                      title="Copy URL"
                    >
                      {copiedId === m.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8"
                      onClick={() => deleteMedia(m.id)}
                      title="Delete Image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1">{m.title}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{m.size}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredMedia.length === 0 && (
            <div className="border border-dashed rounded-xl p-12 text-center text-zinc-500 space-y-2">
              <ImageIcon className="h-10 w-10 mx-auto text-zinc-400" />
              <p className="text-sm font-bold">No media assets found</p>
              <p className="text-xs text-zinc-400">Upload new images to Cloudinary or search with a different keyword.</p>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  )
}
