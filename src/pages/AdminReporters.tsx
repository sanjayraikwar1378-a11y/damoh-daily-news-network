import React, { useState } from "react"
import { Plus, Trash2, Edit2, UserCheck, Shield, BarChart2, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews } from "@/context/NewsContext"
import { Reporter } from "@/data/mock"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function AdminReporters() {
  const { reporters, articles, addReporter, updateReporter, deleteReporter } = useNews()
  
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [editEmail, setEditEmail] = useState("")

  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState("संवाददाता (Reporter)")
  const [newAvatar, setNewAvatar] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploadingAvatar(true)
      setUploadStatus("Uploading profile photo...")
      setUploadError(null)
      try {
        const res = await uploadToCloudinary(file, 'reporters')
        if (isEditMode) {
          setEditAvatar(res.url)
        } else {
          setNewAvatar(res.url)
        }
        setUploadStatus("Photo uploaded successfully!")
        setTimeout(() => setUploadStatus(null), 3000)
      } catch (err: any) {
        console.error("Cloudinary reporter avatar upload failed:", err)
        setUploadError("Failed to upload image. Please check file format or try again.")
      } finally {
        setIsUploadingAvatar(false)
      }
    }
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    addReporter({
      name: newName.trim(),
      role: newRole,
      avatar: newAvatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      email: newEmail.trim()
    })

    setNewName("")
    setNewAvatar("")
    setNewEmail("")
  }

  const startEdit = (r: Reporter) => {
    setIsEditing(r.id)
    setEditName(r.name)
    setEditRole(r.role || "")
    setEditAvatar(r.avatar || "")
    setEditEmail(r.email || "")
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return
    updateReporter(id, {
      name: editName.trim(),
      role: editRole,
      avatar: editAvatar,
      email: editEmail
    })
    setIsEditing(null)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Reporter & Journalist Management</h1>
        <p className="text-sm text-zinc-500">Add correspondents, manage profile photos, assign permissions, and review reporter analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Add Reporter Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-red-600" /> Add New Reporter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Reporter Full Name *</label>
                  <Input 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. राहुल वर्मा (Rahul Verma)" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Designation / Role</label>
                  <Input 
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    placeholder="e.g. वरिष्ठ संवाददाता (Senior Reporter)" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Email Address</label>
                  <Input 
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="rahul@damohdaily.com" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Profile Photo</label>
                  <div className="flex items-center gap-3">
                    <img 
                      src={newAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} 
                      alt="Avatar preview" 
                      className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" 
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-2">
                        <Input 
                          value={newAvatar}
                          onChange={e => setNewAvatar(e.target.value)}
                          placeholder="Image URL or upload file" 
                          className="text-xs"
                        />
                        <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-md shrink-0 transition-colors">
                          {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          <input type="file" accept="image/*" onChange={(e) => handleAvatarFileUpload(e, false)} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadStatus && <p className="text-xs text-green-600 font-semibold">{uploadStatus}</p>}
                {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}

                <Button type="submit" disabled={isUploadingAvatar} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} 
                  Add Reporter
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Reporter Cards */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Editorial Team & Reporters ({reporters.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reporters.map(r => {
                const reporterArticles = articles.filter(a => a.reporterId === r.id)
                const totalViews = reporterArticles.reduce((acc, curr) => acc + (curr.views || 0), 0)

                return (
                  <div key={r.id} className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                    {isEditing === r.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full Name" />
                          <Input value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="Role / Designation" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
                          <div className="flex gap-2 items-center">
                            <Input value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="Photo URL" />
                            <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-md shrink-0 transition-colors">
                              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              <input type="file" accept="image/*" onChange={(e) => handleAvatarFileUpload(e, true)} className="hidden" />
                            </label>
                          </div>
                        </div>
                        {editAvatar && (
                          <div className="flex items-center gap-2">
                            <img src={editAvatar} alt="Edit preview" className="w-10 h-10 rounded-full object-cover border" />
                            <span className="text-xs text-zinc-500">New photo selected</span>
                          </div>
                        )}
                        {uploadStatus && <p className="text-xs text-green-600 font-semibold">{uploadStatus}</p>}
                        {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(r.id)} disabled={isUploadingAvatar} className="bg-green-600 hover:bg-green-700">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditing(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img src={r.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"} alt={r.name} className="w-14 h-14 rounded-full object-cover border-2 border-red-600" />
                          <div>
                            <h4 className="font-bold text-base text-zinc-900 dark:text-white">{r.name}</h4>
                            <p className="text-xs font-semibold text-red-600">{r.role || 'Reporter'}</p>
                            <p className="text-xs text-zinc-400">{r.email || 'No email set'}</p>
                          </div>
                        </div>

                        {/* Analytics summary */}
                        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-6">
                          <div className="text-center">
                            <span className="text-xs font-bold uppercase text-zinc-400">Articles</span>
                            <div className="text-lg font-black text-zinc-900 dark:text-white">{reporterArticles.length}</div>
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-bold uppercase text-zinc-400">Total Views</span>
                            <div className="text-lg font-black text-green-600">{totalViews}</div>
                          </div>

                          <div className="flex items-center gap-1 pl-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => startEdit(r)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => deleteReporter(r.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

      </div>
    </motion.div>
  )
}
