import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if a given timestamp or date string is within the last 48 hours (2 days).
 * Uses the user's local timezone / system clock consistently.
 */
export function isWithin48Hours(dateVal: any): boolean {
  if (!dateVal) return false;
  let timeInMs = 0;

  if (typeof dateVal === 'number') {
    timeInMs = dateVal;
  } else if (typeof dateVal === 'string') {
    timeInMs = new Date(dateVal).getTime();
  } else if (dateVal && typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      timeInMs = dateVal.toDate().getTime();
    } else if ('seconds' in dateVal && typeof dateVal.seconds === 'number') {
      timeInMs = dateVal.seconds * 1000;
    } else {
      timeInMs = new Date(dateVal).getTime();
    }
  }

  if (isNaN(timeInMs) || timeInMs <= 0) return false;

  const now = Date.now();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000; // 172,800,000 ms
  const ageInMs = now - timeInMs;

  // Allow up to 5 minutes of future clock drift, and up to 48 hours (172,800,000 ms) in the past
  return ageInMs >= -300000 && ageInMs <= FORTY_EIGHT_HOURS_MS;
}

/**
 * Calculates estimated reading time in minutes for Hindi/English news text.
 */
export function getReadingTime(text?: string): string {
  if (!text) return "1 मिनट पढ़ें";
  const cleanText = text.replace(/<[^>]*>/g, '').trim();
  const words = cleanText ? cleanText.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} मिनट पढ़ें`;
}

/**
 * Checks if article was published within the last 2 hours.
 */
export function isWithin2Hours(dateVal: any): boolean {
  if (!dateVal) return false;
  let timeInMs = new Date(dateVal).getTime();
  if (isNaN(timeInMs)) return false;
  const now = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const ageInMs = now - timeInMs;
  return ageInMs >= -300000 && ageInMs <= TWO_HOURS_MS;
}
