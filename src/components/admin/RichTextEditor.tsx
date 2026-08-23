import React, { useEffect, useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Minus,
  Undo,
  Redo,
  RemoveFormatting,
  Sparkles,
  ExternalLink,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { prepareContentForEditor } from "@/lib/sanitize"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  onChooseFromMedia?: () => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "समाचार की विस्तृत रिपोर्ट यहां लिखें... मुख्य शीर्षक, उप-शीर्षक (H2, H3), उद्धरण एवं बिंदुवार विवरण...",
  minHeight = "360px",
  className = "",
  onChooseFromMedia
}: RichTextEditorProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4]
        },
        dropcursor: {
          color: "#dc2626",
          width: 2
        }
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-red-600 dark:text-red-400 underline font-semibold cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer"
        }
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-xl max-w-full my-4 shadow-sm border border-zinc-200 dark:border-zinc-800"
        }
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty"
      })
    ],
    content: prepareContentForEditor(value),
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none px-4 py-3 text-zinc-900 dark:text-zinc-100 font-sans leading-relaxed text-base min-h-[${minHeight}]`
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // If editor is empty (e.g. <p></p>), normalize to empty string
      const isEmpty = editor.isEmpty
      onChange(isEmpty ? "" : html)

      // Update counters
      const text = editor.getText().trim()
      setCharCount(text.length)
      setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
    }
  })

  // Synchronize when value changes externally (e.g., when article is loaded via ID in edit page)
  useEffect(() => {
    if (!editor) return

    const currentHtml = editor.getHTML()
    const incomingPrepared = prepareContentForEditor(value)

    // Only update if fundamentally different to prevent resetting cursor
    if (incomingPrepared !== currentHtml && (incomingPrepared || currentHtml !== "<p></p>")) {
      const isSameContent = editor.getText().trim() === (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      if (!isSameContent) {
        editor.commands.setContent(incomingPrepared || "")
        const text = editor.getText().trim()
        setCharCount(text.length)
        setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0)
      }
    }
  }, [value, editor])

  // Open Link insertion modal
  const handleOpenLinkModal = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href || ""
    setLinkUrl(previousUrl)
    setLinkModalOpen(true)
  }, [editor])

  // Apply Link
  const handleApplyLink = useCallback(() => {
    if (!editor) return
    const trimmed = linkUrl.trim()

    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      let finalUrl = trimmed
      if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl) && !/^tel:/i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: finalUrl }).run()
    }
    setLinkModalOpen(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  // Apply Image
  const handleApplyImage = useCallback(() => {
    if (!editor) return
    const trimmed = imageUrl.trim()
    if (trimmed) {
      editor.chain().focus().setImage({ src: trimmed, alt: imageAlt.trim() || undefined }).run()
    }
    setImageModalOpen(false)
    setImageUrl("")
    setImageAlt("")
  }, [editor, imageUrl, imageAlt])

  // Quick insert Hindi subheading
  const handleInsertQuickHeading = useCallback((title: string) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertContent(`<h2>${title}</h2><p></p>`)
      .run()
  }, [editor])

  if (!editor) {
    return (
      <div className="border border-input rounded-xl p-6 flex items-center justify-center text-sm text-zinc-500 bg-background">
        रिच टेक्स्ट एडिटर लोड हो रहा है (Loading Rich Text Editor)...
      </div>
    )
  }

  const isLinkActive = editor.isActive("link")

  return (
    <div className={`border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-background shadow-xs transition-colors focus-within:ring-2 focus-within:ring-red-600 focus-within:border-transparent ${className}`}>
      
      {/* Top Main Toolbar */}
      <div className="bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 p-1.5 flex flex-wrap items-center gap-1 sticky top-0 z-20">
        
        {/* Headings & Paragraph */}
        <div className="flex items-center gap-0.5 border-r border-zinc-300 dark:border-zinc-700 pr-1.5 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`h-8 px-2 text-xs font-semibold rounded-md ${
              editor.isActive("paragraph") && !editor.isActive("heading")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
            title="Normal Paragraph (सामान्य पैराग्राफ)"
          >
            <Pilcrow className="h-3.5 w-3.5 mr-1" />
            <span>Normal</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 px-2 text-xs font-bold rounded-md ${
              editor.isActive("heading", { level: 2 })
                ? "bg-red-600 text-white hover:bg-red-700 hover:text-white"
                : "text-zinc-700 dark:text-zinc-300 hover:text-red-600"
            }`}
            title="Heading 2 (H2) - मुख्य उप-शीर्षक"
          >
            <Heading2 className="h-4 w-4 mr-0.5" />
            <span>H2</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`h-8 px-2 text-xs font-bold rounded-md ${
              editor.isActive("heading", { level: 3 })
                ? "bg-red-600 text-white hover:bg-red-700 hover:text-white"
                : "text-zinc-700 dark:text-zinc-300 hover:text-red-600"
            }`}
            title="Heading 3 (H3) - अनुभाग शीर्षक"
          >
            <Heading3 className="h-4 w-4 mr-0.5" />
            <span>H3</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={`h-8 px-2 text-xs font-bold rounded-md ${
              editor.isActive("heading", { level: 4 })
                ? "bg-red-600 text-white hover:bg-red-700 hover:text-white"
                : "text-zinc-700 dark:text-zinc-300 hover:text-red-600"
            }`}
            title="Heading 4 (H4) - लघु शीर्षक"
          >
            <Heading4 className="h-3.5 w-3.5 mr-0.5" />
            <span>H4</span>
          </Button>
        </div>

        {/* Inline Formatting (Bold, Italic, Underline) */}
        <div className="flex items-center gap-0.5 border-r border-zinc-300 dark:border-zinc-700 pr-1.5 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("bold")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-black"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Bold (Ctrl+B) - गहरा अक्षर"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("italic")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Italic (Ctrl+I) - तिरछा अक्षर"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("underline")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Underline (Ctrl+U) - रेखांकित अक्षर"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-zinc-300 dark:border-zinc-700 pr-1.5 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("bulletList")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Bullet List - बिंदुवार सूची"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("orderedList")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Numbered List - क्रमांकित सूची"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive("blockquote")
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Blockquote - कथन / बयान उद्धरण"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-zinc-300 dark:border-zinc-700 pr-1.5 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive({ textAlign: "left" })
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Align Left (बाईं ओर संरेखित)"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive({ textAlign: "center" })
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Align Center (मध्य संरेखित)"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`h-8 w-8 p-0 rounded-md ${
              editor.isActive({ textAlign: "right" })
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                : "text-zinc-700 dark:text-zinc-400"
            }`}
            title="Align Right (दाईं ओर संरेखित)"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Links & Divider */}
        <div className="flex items-center gap-0.5 border-r border-zinc-300 dark:border-zinc-700 pr-1.5 mr-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenLinkModal}
            className={`h-8 px-2 text-xs rounded-md ${
              isLinkActive
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold"
                : "text-zinc-700 dark:text-zinc-400 hover:text-blue-600"
            }`}
            title="Insert / Edit Link (वेब लिंक जोड़ें)"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1" />
            <span>Link</span>
          </Button>

          {isLinkActive && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
              title="Remove Link (लिंक हटाएं)"
            >
              <Unlink className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageModalOpen(true)}
            className="h-8 px-2 text-xs rounded-md text-zinc-700 dark:text-zinc-400 hover:text-red-600"
            title="Insert In-Article Image (लेख में फोटो जोड़ें)"
          >
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            <span>Image</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0 text-zinc-700 dark:text-zinc-400 rounded-md"
            title="Horizontal Divider (विभाजक रेखा)"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo, Redo, Clear Formatting */}
        <div className="flex items-center gap-0.5 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 text-zinc-700 dark:text-zinc-400 disabled:opacity-30 rounded-md"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 text-zinc-700 dark:text-zinc-400 disabled:opacity-30 rounded-md"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="h-8 w-8 p-0 text-zinc-600 dark:text-zinc-400 hover:text-red-600 rounded-md"
            title="Clear Formatting (फॉर्मेटिंग हटाएं)"
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick Hindi News Subheadings Toolbar */}
      <div className="bg-zinc-100/80 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-bold text-zinc-500 flex items-center gap-1 mr-1 text-[11px] uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-red-600" />
          Quick H2 Headers:
        </span>
        <button
          type="button"
          onClick={() => handleInsertQuickHeading("घटना कैसे हुई")}
          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer text-[11px]"
        >
          + घटना कैसे हुई
        </button>
        <button
          type="button"
          onClick={() => handleInsertQuickHeading("पुलिस का क्या कहना है")}
          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer text-[11px]"
        >
          + पुलिस का क्या कहना है
        </button>
        <button
          type="button"
          onClick={() => handleInsertQuickHeading("आगे की कार्रवाई")}
          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer text-[11px]"
        >
          + आगे की कार्रवाई
        </button>
        <button
          type="button"
          onClick={() => handleInsertQuickHeading("मुख्य बिंदु (Key Highlights)")}
          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer text-[11px]"
        >
          + मुख्य बिंदु
        </button>
      </div>

      {/* Editor Content Area */}
      <div 
        className="bg-background min-h-[300px] cursor-text"
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.chain().focus().run()
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Bottom Status & Stats Bar */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-3 py-1.5 flex flex-wrap items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} शब्द (Words)</span>
          <span>•</span>
          <span>{charCount} अक्षर (Characters)</span>
        </div>

        <div className="flex items-center gap-2">
          {onChooseFromMedia && (
            <button
              type="button"
              onClick={onChooseFromMedia}
              className="text-red-600 dark:text-red-400 hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
              मीडिया लाइब्रेरी से इमेज जोड़ें
            </button>
          )}
        </div>
      </div>

      {/* Insert Link Modal Dialog */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-red-600" />
                हाइपरलिंक जोड़ें (Insert Link)
              </h3>
              <button 
                type="button" 
                onClick={() => setLinkModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">वेबसाइट URL (Link Destination)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com या https://..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-600 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleApplyLink()
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                यह लिंक पाठक द्वारा क्लिक करने पर नए टैब में सुरक्षित खुलेगा (Open in new tab)।
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkModalOpen(false)}
              >
                रद्द करें (Cancel)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyLink}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <Check className="h-4 w-4 mr-1" />
                लिंक लागू करें (Apply Link)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Insert Image Modal Dialog */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-red-600" />
                लेख में फोटो जोड़ें (Insert Image)
              </h3>
              <button 
                type="button" 
                onClick={() => setImageModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image URL (फोटो लिंक)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (Cloudinary or Web Image URL)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-600 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleApplyImage()
                    }
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Image Caption / Alt Text (विवरण/कैप्शन)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="फोटो का विवरण या कैप्शन लिखें..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {onChooseFromMedia && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImageModalOpen(false)
                      onChooseFromMedia()
                    }}
                    className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    मीडिया लाइब्रेरी से चयन करें
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageModalOpen(false)}
              >
                रद्द करें (Cancel)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyImage}
                disabled={!imageUrl.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <Check className="h-4 w-4 mr-1" />
                फोटो डालें (Insert Image)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
