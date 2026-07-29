/**
 * YouTube Utility Functions for extracting Video IDs and converting links to embed format.
 */

/**
 * Extracts the 11-character YouTube Video ID from any standard, short, embed, or shorts YouTube URL.
 * Returns null if the URL is invalid or not a recognized YouTube link.
 */
export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://www.youtube.com/watch?feature=shared&v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  
  const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[\?&].*)?$/i;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // Fallback: Check if user pasted a raw 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Validates if a given string is a valid YouTube URL or Video ID.
 */
export function isValidYouTubeUrl(url: string | undefined | null): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Returns a privacy-enhanced YouTube embed URL for iframe embedding.
 */
export function getYouTubeEmbedUrl(url: string | undefined | null): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}
