import React, { useState, useEffect } from "react"
import { Upload, ImageIcon, Save, Eye, ArrowLeft, Calendar, Video, Trash2, CheckCircle2, AlertCircle, Youtube, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArticleStatus } from "@/data/mock"
import { getYouTubeEmbedUrl, isValidYouTubeUrl, extractYouTubeId } from "@/lib/youtube"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function AdminCreateNews() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)

  const { articles, categories, reporters, addArticle, updateArticle, media } = useNews()
  const navigate = useNavigate()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [previewModal, setPreviewModal] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    categoryIds: categories.length > 0 ? [categories[0].id] : [] as string[],
    subCategory: "",
    reporterId: reporters[0]?.id || "r1",
    status: 'published' as ArticleStatus,
    scheduledAt: "",
    isBreaking: false,
    isTrending: false,
    isEditorsPick: false,
    imageUrl: "",
    youtubeUrl: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  })

  // Load article data if editing
  useEffect(() => {
    if (id) {
      const existing = articles.find(a => a.id === id)
      if (existing) {
        setFormData({
          title: existing.title || "",
          slug: existing.slug || "",
          excerpt: existing.excerpt || "",
          content: existing.content || "",
          categoryIds: existing.categoryIds || [],
          subCategory: existing.subCategory || "",
          reporterId: existing.reporterId || (reporters[0]?.id || "r1"),
          status: existing.status || 'published',
          scheduledAt: existing.scheduledAt || "",
          isBreaking: Boolean(existing.isBreaking),
          isTrending: Boolean(existing.isTrending),
          isEditorsPick: Boolean(existing.isEditorsPick),
          imageUrl: existing.imageUrl || "",
          youtubeUrl: existing.youtubeUrl || "",
          metaTitle: existing.metaTitle || "",
          metaDescription: existing.metaDescription || "",
          keywords: existing.keywords || "",
        })
      }
    }
  }, [id, articles])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const isSelected = prev.categoryIds.includes(categoryId)
      if (isSelected) {
        return { ...prev, categoryIds: prev.categoryIds.filter(cid => cid !== categoryId) }
      } else {
        return { ...prev, categoryIds: [...prev.categoryIds, categoryId] }
      }
    })
  }

  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploadingImage(true)
      try {
        const res = await uploadToCloudinary(file, 'news')
        setFormData(prev => ({ ...prev, imageUrl: res.url }))
      } catch (err) {
        console.error("Cloudinary upload failed:", err)
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

  const handleSave = async (targetStatus: ArticleStatus = 'published') => {
    setSaveError(null)

    if (!formData.title.trim()) {
      alert("Please enter an article title.")
      return
    }
    if (formData.categoryIds.length === 0) {
      alert("Please select at least one category.")
      return
    }

    if (formData.youtubeUrl.trim() && !isValidYouTubeUrl(formData.youtubeUrl)) {
      alert("अवैध यूट्यूब वीडियो लिंक! (Invalid YouTube Video URL). कृपया एक सही यूट्यूब लिंक दर्ज करें अथवा फ़ील्ड खाली छोड़ें।")
      return
    }

    if (targetStatus === 'scheduled' && !formData.scheduledAt.trim()) {
      alert("Please select a scheduled date and time for publication.")
      return
    }

    setIsSubmitting(true)

    try {
      const cleanScheduledAt = (targetStatus === 'scheduled' && formData.scheduledAt.trim())
        ? formData.scheduledAt.trim()
        : null;

      const cleanYoutubeUrl = formData.youtubeUrl.trim() ? formData.youtubeUrl.trim() : null;
      const cleanSubCategory = formData.subCategory.trim() ? formData.subCategory.trim() : null;

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        categoryIds: formData.categoryIds,
        subCategory: cleanSubCategory as any,
        reporterId: formData.reporterId,
        status: targetStatus,
        scheduledAt: cleanScheduledAt as any,
        isBreaking: formData.isBreaking,
        isTrending: formData.isTrending,
        isEditorsPick: formData.isEditorsPick,
        imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1546422904-90eab23c3d7e?w=800&h=500&fit=crop",
        youtubeUrl: cleanYoutubeUrl as any,
        metaTitle: formData.metaTitle.trim(),
        metaDescription: formData.metaDescription.trim(),
        keywords: formData.keywords.trim(),
      }

      if (isEditing && id) {
        await updateArticle(id, payload)
      } else {
        await addArticle(payload)
      }

      setIsSubmitting(false)
      navigate('/admin/news')
    } catch (err: any) {
      console.error("Firestore write error when saving article:", err)
      setSaveError(err.message || "Failed to save article to Firebase Firestore.")
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/news">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {isEditing ? "Edit Article" : "Create News Article"}
            </h1>
            <p className="text-sm text-zinc-500">
              {isEditing ? "Update existing news publication." : "Write and publish a new story for Damoh Daily."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewModal(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleSave('draft')} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save Draft
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" size="sm" onClick={() => handleSave('published')} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                <span>Saving...</span>
              </>
            ) : (isEditing ? "Update Article" : "Publish Now")}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Firebase Article Save Error</p>
            <p className="text-xs text-red-500 dark:text-red-300 font-mono leading-relaxed">{saveError}</p>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        
        {/* Main Form Area */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Headline / Title *</label>
                <Input 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter an engaging headline in Hindi or English..." 
                  className="text-lg font-bold h-12" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Custom URL Slug (SEO)</label>
                <Input 
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="e.g. damoh-heavy-rain-alert-news" 
                  className="text-sm font-mono" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Excerpt / Short Summary *</label>
                <textarea 
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Brief 1-2 sentence overview for cards and social sharing..."
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Full Article Content *</label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowMediaPicker(true)} className="text-red-600 hover:text-red-700">
                    <ImageIcon className="h-4 w-4 mr-1" /> Choose from Media Library
                  </Button>
                </div>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={16}
                  className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600 font-sans leading-relaxed"
                  placeholder="Write full detailed story here..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Metadata Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">SEO & Metadata</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Meta Title</label>
                <Input 
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  placeholder="SEO title (leave blank to use main title)" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Meta Description</label>
                <textarea 
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  placeholder="150-160 character description for search engines..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Keywords (Comma Separated)</label>
                <Input 
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="e.g. दमोह, damoh news, madhya pradesh, rain alert" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Publication Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 text-sm border rounded-md bg-background focus:ring-red-600"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {formData.status === 'scheduled' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Schedule Publish Date
                  </label>
                  <Input 
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-semibold uppercase text-zinc-500">Reporter / Author</label>
                <select 
                  name="reporterId"
                  value={formData.reporterId}
                  onChange={handleChange}
                  className="w-full p-2 text-sm border rounded-md bg-background"
                >
                  {reporters.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="text-xs font-semibold uppercase text-zinc-500">Categories *</label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 bg-background">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(c.id)}
                        onChange={() => handleCategoryToggle(c.id)}
                        className="rounded text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span className="text-sm font-medium">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isBreaking"
                    checked={formData.isBreaking}
                    onChange={handleChange}
                    className="rounded text-red-600 focus:ring-red-600 w-4 h-4" 
                  />
                  <span className="text-sm font-semibold text-red-600">Breaking News</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isEditorsPick"
                    checked={formData.isEditorsPick}
                    onChange={handleChange}
                    className="rounded text-red-600 focus:ring-red-600 w-4 h-4" 
                  />
                  <span className="text-sm font-medium">Editor's Pick</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleChange}
                    className="rounded text-red-600 focus:ring-red-600 w-4 h-4" 
                  />
                  <span className="text-sm font-medium">Trending Story</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Featured Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <label className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors relative overflow-hidden min-h-[160px]">
                {Boolean(formData.imageUrl?.trim()) ? (
                  <img src={formData.imageUrl || undefined} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-xs font-medium">Upload Image File</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-500">Or Paste Image URL</label>
                <Input 
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..." 
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* YouTube Video URL Card */}
          <Card className="border-red-100 dark:border-red-950/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-600" />
                  YouTube Video
                </span>
                {formData.youtubeUrl && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFormData(prev => ({ ...prev, youtubeUrl: "" }))}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs h-7 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove Video
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500">YouTube Video URL</label>
                <div className="relative">
                  <Input 
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    placeholder="e.g. https://www.youtube.com/watch?v=... or Shorts" 
                    className={`text-xs ${formData.youtubeUrl ? (isValidYouTubeUrl(formData.youtubeUrl) ? 'border-green-500 pr-8' : 'border-red-500') : ''}`}
                  />
                  {formData.youtubeUrl && isValidYouTubeUrl(formData.youtubeUrl) && (
                    <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Paste YouTube watch link, Shorts, or youtu.be URL.
                </p>
              </div>

              {/* URL Validation Feedback & Live Video Preview */}
              {formData.youtubeUrl.trim() !== "" && (
                isValidYouTubeUrl(formData.youtubeUrl) ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between items-center text-xs font-bold text-green-600">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valid YouTube Link
                      </span>
                      <span className="text-[10px] bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 rounded font-mono">
                        ID: {extractYouTubeId(formData.youtubeUrl)}
                      </span>
                    </div>

                    {/* Small Live Preview in Admin Panel */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <iframe 
                        src={getYouTubeEmbedUrl(formData.youtubeUrl) || undefined} 
                        title="YouTube Video Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>अवैध यूट्यूब लिंक! (Invalid YouTube Link). Please enter a valid YouTube video or Shorts URL.</span>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background border rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold">Select Media Image</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 p-2">
              {media.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, imageUrl: m.url }))
                    setShowMediaPicker(false)
                  }}
                  className="cursor-pointer border rounded-lg overflow-hidden group hover:ring-2 hover:ring-red-600 aspect-video relative"
                >
                  <img src={m.url || undefined} alt={m.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold">
                    Select
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setShowMediaPicker(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-sm font-bold text-red-600">LIVE ARTICLE PREVIEW</span>
              <Button size="sm" variant="ghost" onClick={() => setPreviewModal(false)}>Close Preview</Button>
            </div>
            <h1 className="text-3xl font-black">{formData.title || "Untitled Article"}</h1>
            {formData.excerpt && <p className="text-lg text-zinc-600 border-l-4 border-red-600 pl-3">{formData.excerpt}</p>}
            {Boolean(formData.imageUrl?.trim()) && <img src={formData.imageUrl || undefined} alt="Preview" className="w-full rounded-xl max-h-80 object-cover" />}
            <div className="prose max-w-none text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{formData.content}</div>
            
            {/* YouTube Embed in Preview Modal */}
            {formData.youtubeUrl && isValidYouTubeUrl(formData.youtubeUrl) && (
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white">
                  <Youtube className="h-4 w-4 text-red-600" />
                  <span>Embedded Video Coverage</span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe 
                    src={getYouTubeEmbedUrl(formData.youtubeUrl) || undefined} 
                    title="YouTube Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
