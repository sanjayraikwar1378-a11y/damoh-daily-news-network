import React, { useState } from "react"
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Tag, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "motion/react"
import { useNews, createSlug } from "@/context/NewsContext"
import { Category } from "@/data/mock"

export function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useNews()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("#dc2626")
  const [editSubs, setEditSubs] = useState("")

  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#dc2626")
  const [newSubs, setNewSubs] = useState("")

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    
    addCategory({
      name: newName.trim(),
      slug: createSlug(newName.trim()),
      color: newColor,
      subCategories: newSubs.split(',').map(s => s.trim()).filter(Boolean)
    })
    setNewName("")
    setNewSubs("")
  }

  const startEdit = (category: Category) => {
    setIsEditing(category.id)
    setEditName(category.name)
    setEditColor(category.color || "#dc2626")
    setEditSubs((category.subCategories || []).join(', '))
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return
    updateCategory(id, { 
      name: editName.trim(),
      slug: createSlug(editName.trim()),
      color: editColor,
      subCategories: editSubs.split(',').map(s => s.trim()).filter(Boolean)
    })
    setIsEditing(null)
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...categories]
    const temp = newOrder[index - 1]
    newOrder[index - 1] = newOrder[index]
    newOrder[index] = temp
    reorderCategories(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return
    const newOrder = [...categories]
    const temp = newOrder[index + 1]
    newOrder[index + 1] = newOrder[index]
    newOrder[index] = temp
    reorderCategories(newOrder)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-12"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Category Management</h1>
        <p className="text-sm text-zinc-500">Create, color-code, organize sub-categories, and reorder news categories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Tag className="h-5 w-5 text-red-600" /> Create New Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Category Name *</label>
                  <Input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. राजनीति (Politics)" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Badge Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={newColor}
                      onChange={e => setNewColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input 
                      value={newColor}
                      onChange={e => setNewColor(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Sub-Categories (Comma Separated)</label>
                  <textarea 
                    value={newSubs}
                    onChange={e => setNewSubs(e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs border rounded bg-background"
                    placeholder="e.g. चुनाव, पार्टियां, भाषण"
                  />
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <div key={category.id} className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                    
                    {isEditing === category.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Category name"
                          />
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={editColor}
                              onChange={e => setEditColor(e.target.value)}
                              className="w-9 h-9 rounded border cursor-pointer"
                            />
                            <Input 
                              value={editColor}
                              onChange={e => setEditColor(e.target.value)}
                              className="font-mono text-xs"
                            />
                          </div>
                        </div>
                        <Input 
                          value={editSubs}
                          onChange={e => setEditSubs(e.target.value)}
                          placeholder="Subcategories (comma separated)"
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(category.id)} className="bg-green-600 hover:bg-green-700">Save Changes</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditing(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: category.color || '#dc2626' }}></div>
                          <div>
                            <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                              {category.name}
                              <span className="text-xs font-normal text-zinc-400 font-mono">/{category.slug}</span>
                            </div>
                            {category.subCategories && category.subCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {category.subCategories.map((s, i) => (
                                  <span key={i} className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveUp(index)} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveDown(index)} disabled={index === categories.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => startEdit(category)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
