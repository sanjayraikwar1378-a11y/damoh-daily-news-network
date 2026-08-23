import React, { memo, useState, useCallback, useMemo } from 'react';
import { getOptimizedImageUrl, getOptimizedSrcSet, getLowResPlaceholderUrl } from '@/lib/cloudinary';

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  widths?: number[];
  sizes?: string;
  defaultWidth?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  blurPlaceholder?: boolean;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  mode?: 'card' | 'article';
  type?: 'card' | 'article';
}

export const ResponsiveImage = memo(function ResponsiveImage({
  src,
  alt,
  widths = [320, 480, 720, 1080],
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  defaultWidth = 480,
  width,
  height,
  aspectRatio,
  loading = 'lazy',
  fetchPriority,
  blurPlaceholder = true,
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
  mode,
  type,
  style,
  onLoad,
  onError,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageUrl = src || fallbackSrc;
  const displayMode = mode || type || 'card';
  const isCard = displayMode === 'card';
  const isEager = loading === 'eager';

  // Compute calculated dimensions
  const calcWidth = width || defaultWidth;
  const calcHeight = height;

  // Fetch priority: High for eager/LCP images, auto or specified otherwise
  const effectiveFetchPriority = fetchPriority || (isEager ? 'high' : 'auto');

  // Optimized image URL and responsive srcset
  const optimizedDefaultSrc = useMemo(() => {
    return getOptimizedImageUrl(imageUrl, { 
      width: defaultWidth,
      crop: isCard ? 'fill' : 'limit'
    });
  }, [imageUrl, defaultWidth, isCard]);

  const srcSetString = useMemo(() => {
    return getOptimizedSrcSet(imageUrl, widths, isCard ? 'fill' : 'limit');
  }, [imageUrl, widths, isCard]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (target.src !== fallbackSrc) {
      target.srcset = '';
      target.src = fallbackSrc;
    }
    if (onError) onError(e);
  }, [fallbackSrc, onError]);

  if (displayMode === 'article') {
    // Article mode: Natural responsive image (w-full h-auto) preserving natural aspect ratio without cropping, distortion, or fixed-aspect wrappers
    const blurClass = blurPlaceholder && !isLoaded && !isEager 
      ? 'opacity-85 filter blur-[2px]' 
      : 'opacity-100 filter-none';

    return (
      <img
        src={optimizedDefaultSrc || undefined}
        srcSet={srcSetString || undefined}
        sizes={sizes}
        alt={alt}
        width={calcWidth}
        height={calcHeight}
        loading={loading}
        // @ts-ignore fetchPriority is supported in modern browsers
        fetchPriority={effectiveFetchPriority}
        decoding={isEager ? 'sync' : 'async'}
        style={style}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`w-full h-auto rounded-xl sm:rounded-2xl transition-opacity duration-300 ease-out ${blurClass} ${className}`.trim()}
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

  const cardStyle: React.CSSProperties = {
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style
  };

  const cardBlurClass = blurPlaceholder && !isLoaded && !isEager
    ? 'opacity-80 filter blur-[2px]'
    : 'opacity-100 filter-none';

  return (
    <img
      src={optimizedDefaultSrc || undefined}
      srcSet={srcSetString || undefined}
      sizes={sizes}
      alt={alt}
      width={calcWidth}
      height={calcHeight}
      loading={loading}
      // @ts-ignore fetchPriority is supported in modern browsers
      fetchPriority={effectiveFetchPriority}
      decoding={isEager ? 'sync' : 'async'}
      style={cardStyle}
      onLoad={handleImageLoad}
      onError={handleImageError}
      className={`bg-zinc-100 dark:bg-zinc-800/80 transition-opacity duration-300 ease-out ${cardBlurClass} ${finalClassName}`.trim()}
      {...props}
    />
  );
});
