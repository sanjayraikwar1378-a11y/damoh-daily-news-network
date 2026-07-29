import React, { useState } from "react"
import { Search as SearchIcon, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery("")
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="absolute inset-y-0 right-0 left-0 sm:left-auto sm:w-96 bg-background z-50 flex items-center px-4 shadow-sm border-b sm:border sm:rounded-md sm:shadow-lg sm:top-2 sm:bottom-auto">
      <form onSubmit={handleSearch} className="flex-1 flex items-center">
        <SearchIcon className="h-4 w-4 text-zinc-400 mr-2" />
        <input 
          autoFocus
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search news..." 
          className="flex-1 bg-transparent border-none outline-none text-sm h-10 px-2"
        />
        <button 
          type="button" 
          onClick={() => setIsOpen(false)}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
