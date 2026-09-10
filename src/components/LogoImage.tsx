import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface LogoImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  src,
  alt = "Damoh Daily News Network",
  className = "",
  style = {},
  width = 3887,
  height = 833,
  priority = true,
  loading,
  decoding,
  ...props
}) => {
  // Determine clean initial source - always use approved raster asset, never broken/tilted logo.svg
  const getCleanSrc = (rawSrc?: string): string => {
    if (!rawSrc || !rawSrc.trim() || rawSrc.trim() === '/logo.svg') return '/logo.png';
    const trimmed = rawSrc.trim();
    if (trimmed.includes('res.cloudinary.com')) {
      return getOptimizedImageUrl(trimmed, { width: 800 });
    }
    return trimmed;
  };

  const initialSrc = getCleanSrc(src);
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [fallbackStage, setFallbackStage] = useState<number>(0);

  // Synchronize when prop changes
  useEffect(() => {
    const nextSrc = getCleanSrc(src);
    setCurrentSrc(nextSrc);
    setFallbackStage(0);
  }, [src]);

  // Robust fallback chain: /logo.png -> /logo.webp -> /logo-sm.webp -> /logo.png (never fallback to distorted /logo.svg)
  const handleError = () => {
    if (fallbackStage === 0 && currentSrc !== '/logo.webp') {
      setFallbackStage(1);
      setCurrentSrc('/logo.webp');
    } else if (fallbackStage <= 1 && currentSrc !== '/logo-sm.webp') {
      setFallbackStage(2);
      setCurrentSrc('/logo-sm.webp');
    } else if (fallbackStage <= 2 && currentSrc !== '/logo.png') {
      setFallbackStage(3);
      setCurrentSrc('/logo.png');
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading || (priority ? "eager" : "lazy")}
      decoding={decoding || (priority ? "sync" : "async")}
      // @ts-ignore fetchPriority
      fetchPriority={priority ? "high" : "auto"}
      onError={handleError}
      style={{
        color: 'transparent', // Suppresses raw browser alt-text glitch during sub-millisecond load
        objectFit: 'contain',
        objectPosition: 'left center',
        imageRendering: 'auto',
        ...style,
        // Enforce the master aspect ratio so external arbitrary ratios cannot squeeze or distort the logo
        aspectRatio: style?.aspectRatio && style.aspectRatio !== '4 / 1' ? style.aspectRatio : '3887 / 833',
      }}
      className={`select-none ${className}`}
      {...props}
    />
  );
};
