/**
 * YouTube Utility Functions for extracting Video IDs, converting links to embed format,
 * and generating official YouTube thumbnail URLs.
 */

/**
 * Extracts the 11-character YouTube Video ID from any standard, short, embed, or shorts YouTube URL.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Raw 11-character video ID
 * Returns null if the URL is invalid or not a recognized YouTube link.
 */
export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
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
 * Returns the official YouTube thumbnail URL for a given video.
 * Qualities:
 * - maxresdefault: 1280x720 (High-res)
 * - hqdefault: 480x360 (High Quality)
 * - mqdefault: 320x180 (Medium Quality)
 */
export function getYouTubeThumbnailUrl(
  url: string | undefined | null,
  quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' = 'maxresdefault'
): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Returns a privacy-enhanced YouTube embed URL for iframe embedding.
 */
export function getYouTubeEmbedUrl(url: string | undefined | null): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

