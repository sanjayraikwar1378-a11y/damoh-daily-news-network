import React, { memo } from 'react';
import { getOptimizedImageUrl, getOptimizedSrcSet } from '@/lib/cloudinary';

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  widths?: number[];
  sizes?: string;
  defaultWidth?: number;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  mode?: 'card' | 'article';
  type?: 'card' | 'article';
}

export const ResponsiveImage = memo(function ResponsiveImage({
  src,
  alt,
  widths = [360, 480, 720, 1080],
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  defaultWidth = 600,
  loading = 'lazy',
  fetchPriority,
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
  mode,
  type,
  ...props
}: ResponsiveImageProps) {
  const imageUrl = src || fallbackSrc;
  const displayMode = mode || type || 'card';
  const isCard = displayMode === 'card';

  // For card mode, use AI smart crop fill + g_auto. For article mode, use natural aspect ratio (limit).
  const optimizedDefaultSrc = getOptimizedImageUrl(imageUrl, { 
    width: defaultWidth,
    crop: isCard ? 'fill' : 'limit'
  });
  const srcSetString = getOptimizedSrcSet(imageUrl, widths, isCard ? 'fill' : 'limit');

  if (displayMode === 'article') {
    // Article mode: Pure natural image sitting directly in article layout without any wrapper, dark background, or forced max-height
    return (
      <img
        src={optimizedDefaultSrc || undefined}
        srcSet={srcSetString || undefined}
        sizes={sizes}
        alt={alt}
        loading={loading}
        // @ts-ignore fetchPriority is supported in modern browsers
        fetchPriority={fetchPriority}
        decoding="async"
        className={`w-full h-auto rounded-xl sm:rounded-2xl ${className}`.trim()}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== fallbackSrc) {
            target.srcset = '';
            target.src = fallbackSrc;
          }
        }}
        {...props}
      />
    );
  }

  // Card Mode (Default): Homepage cards, categories, trending, search, related news
  let finalClassName = className;
  if (!finalClassName.includes('object-cover') && !finalClassName.includes('object-contain')) {
    finalClassName += ' object-cover object-center';
  }
  if (!finalClassName.includes('h-full') && !finalClassName.includes('h-auto') && !finalClassName.includes('h-')) {
    finalClassName += ' h-full';
  }
  if (!finalClassName.includes('w-full') && !finalClassName.includes('w-')) {
    finalClassName += ' w-full';
  }

  return (
    <img
      src={optimizedDefaultSrc || undefined}
      srcSet={srcSetString || undefined}
      sizes={sizes}
      alt={alt}
      loading={loading}
      // @ts-ignore fetchPriority is supported in modern browsers
      fetchPriority={fetchPriority}
      decoding="async"
      className={finalClassName.trim()}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== fallbackSrc) {
          target.srcset = '';
          target.src = fallbackSrc;
        }
      }}
      {...props}
    />
  );
});
