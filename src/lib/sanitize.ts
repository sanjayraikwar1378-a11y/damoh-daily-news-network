import DOMPurify from "dompurify"

/**
 * Sanitizes HTML content using DOMPurify with safe tags allowed for news articles.
 */
export function sanitizeArticleHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== "string") return ""
  
  if (typeof window !== "undefined" && DOMPurify.isSupported) {
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: [
        "p", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "strike",
        "blockquote", "ul", "ol", "li", "a", "hr", "br", "span", "div", "sub", "sup"
      ],
      ALLOWED_ATTR: [
        "href", "target", "rel", "class", "style", "title", "dir"
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ["target", "rel"],
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"]
    })
  }

  // Fallback for non-DOM environments: strip dangerous tags
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
}

/**
 * Detects if a string is HTML or plain text, and formats it for clean article display.
 * Converts old plain text articles (with newlines) into semantic HTML paragraphs.
 */
export function formatArticleContentForDisplay(rawContent: string): string {
  if (!rawContent || typeof rawContent !== "string") return ""
  
  const trimmed = rawContent.trim()
  if (!trimmed) return ""

  // Check if string contains common HTML tags
  const hasHtmlTags = /<\s*(p|h[1-6]|ul|ol|li|blockquote|div|hr|br|strong|em|u|a)\b[^>]*>/i.test(trimmed)
  
  if (hasHtmlTags) {
    return sanitizeArticleHtml(trimmed)
  }
  
  // Format legacy plain text: split into paragraphs by double line breaks
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map(p => {
      const line = p.trim().replace(/\n/g, "<br />")
      return line ? `<p>${line}</p>` : ""
    })
    .filter(Boolean)
    .join("")

  return sanitizeArticleHtml(paragraphs)
}

/**
 * Helper to prepare initial content for the Rich Text Editor.
 * If old plain text is passed, wraps paragraphs into <p> tags so the editor loads it cleanly.
 */
export function prepareContentForEditor(rawContent: string): string {
  if (!rawContent || typeof rawContent !== "string") return ""
  const trimmed = rawContent.trim()
  if (!trimmed) return ""

  const hasHtmlTags = /<\s*(p|h[1-6]|ul|ol|li|blockquote|div|hr|br)\b[^>]*>/i.test(trimmed)
  if (hasHtmlTags) {
    return trimmed
  }

  return trimmed
    .split(/\n{2,}/)
    .map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
    .join("")
}
