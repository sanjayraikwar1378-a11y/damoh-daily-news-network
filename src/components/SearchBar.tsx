import React, { useState, useEffect, useRef } from "react"
import { Search as SearchIcon, X, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-focus input whenever search opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Clean outside click and Escape key listeners
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside, { passive: true })

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery("")
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery("")
  }

  if (!isOpen) {
    return (
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-[38px] min-w-[38px] h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors shrink-0"
        aria-label="Search"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-x-0 top-0 h-14 sm:h-16 md:h-[68px] lg:h-[74px] sm:static sm:h-auto z-50 bg-white dark:bg-zinc-900 sm:bg-transparent sm:dark:bg-transparent flex items-center px-3 sm:px-0 shadow-md sm:shadow-none border-b border-border sm:border-none"
    >
      <form 
        onSubmit={handleSearch} 
        className="w-full sm:w-80 md:w-96 flex items-center bg-zinc-100 dark:bg-zinc-800/95 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-sm"
      >
        <button
          type="button"
          onClick={handleClose}
          className="sm:hidden p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 mr-1 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <SearchIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400 mr-2 shrink-0 hidden sm:block" />
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="समाचार खोजें... (Search news)" 
          className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 h-8 px-1 min-w-0"
        />
        {query.trim() && (
          <button 
            type="submit"
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold mr-1 shrink-0 transition-colors"
          >
            खोजें
          </button>
        )}
        <button 
          type="button" 
          onClick={handleClose}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-md shrink-0 ml-0.5"
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

