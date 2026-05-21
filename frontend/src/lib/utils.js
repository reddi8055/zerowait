import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function cleanImageUrl(url) {
  if (!url) return url;
  try {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    const parsed = new URL(targetUrl);
    if (parsed.hostname.includes('unsplash.com') || parsed.hostname.includes('splash.com')) {
      const pathname = parsed.pathname;
      const photosMatch = pathname.match(/^\/photos\/([a-zA-Z0-9_-]+)/);
      if (photosMatch) {
        const fullSegment = photosMatch[1];
        const parts = fullSegment.split('-');
        const photoId = parts[parts.length - 1];
        return `https://unsplash.com/photos/${photoId}/download?force=true`;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return url;
}
