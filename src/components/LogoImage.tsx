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
  // Determine clean initial source
  const getCleanSrc = (rawSrc?: string): string => {
    if (!rawSrc || !rawSrc.trim()) return '/logo.png';
    const trimmed = rawSrc.trim();
    if (trimmed.includes('res.cloudinary.com')) {
      return getOptimizedImageUrl(trimmed, { width: 800 });
    }
    return trimmed;
  };

  const initialSrc = getCleanSrc(src);
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [fallbackStage, setFallbackStage] = useState<number>(0); // 0 = original, 1 = /logo.png, 2 = /logo.svg

  // Synchronize when prop changes
  useEffect(() => {
    const nextSrc = getCleanSrc(src);
    setCurrentSrc(nextSrc);
    setFallbackStage(0);
  }, [src]);

  const handleError = () => {
    if (fallbackStage === 0 && currentSrc !== '/logo.png') {
      setFallbackStage(1);
      setCurrentSrc('/logo.png');
    } else if (fallbackStage < 2 && currentSrc !== '/logo.svg') {
      setFallbackStage(2);
      setCurrentSrc('/logo.svg');
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
        ...style
      }}
      className={`select-none ${className}`}
      {...props}
    />
  );
};
