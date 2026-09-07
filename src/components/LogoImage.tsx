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
  width = 360,
  height = 70,
  priority = true,
  loading,
  decoding,
  ...props
}) => {
  // Determine clean initial source - prefer crisp SVG vector for infinite sharpness
  const getCleanSrc = (rawSrc?: string): string => {
    if (!rawSrc || !rawSrc.trim()) return '/logo.svg';
    const trimmed = rawSrc.trim();
    // Prefer crisp vector SVG over raster assets to avoid scaling blur
    if (trimmed === '/logo.png' || trimmed === '/logo.webp' || trimmed === 'logo.png' || trimmed === 'logo.webp') {
      return '/logo.svg';
    }
    if (trimmed.includes('res.cloudinary.com')) {
      return getOptimizedImageUrl(trimmed, { width: 800 });
    }
    return trimmed;
  };

  const initialSrc = getCleanSrc(src);
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [fallbackStage, setFallbackStage] = useState<number>(0); // 0 = /logo.svg (vector), 1 = /logo.webp (3887px), 2 = /logo.png (3887px)

  // Synchronize when prop changes
  useEffect(() => {
    const nextSrc = getCleanSrc(src);
    setCurrentSrc(nextSrc);
    setFallbackStage(0);
  }, [src]);

  const handleError = () => {
    if (fallbackStage === 0 && currentSrc !== '/logo.webp') {
      setFallbackStage(1);
      setCurrentSrc('/logo.webp');
    } else if (fallbackStage <= 1 && currentSrc !== '/logo.png') {
      setFallbackStage(2);
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
        aspectRatio: '1166 / 250',
        ...style
      }}
      className={`select-none ${className}`}
      {...props}
    />
  );
};
