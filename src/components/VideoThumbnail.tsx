import React, { useState, memo } from "react";
import { extractYouTubeId } from "@/lib/youtube";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

interface VideoThumbnailProps {
  youtubeUrl?: string | null;
  imageUrl?: string | null;
  title: string;
  className?: string;
}

export const VideoThumbnail = memo(function VideoThumbnail({ youtubeUrl, imageUrl, title, className }: VideoThumbnailProps) {
  const videoId = extractYouTubeId(youtubeUrl);
  
  // Quality stage progression: 'hqdefault' -> 'mqdefault' -> 'fallback_image'
  const [stage, setStage] = useState<'hqdefault' | 'mqdefault' | 'fallback_image'>('hqdefault');

  let src: string | undefined = undefined;

  // 1. Always prioritize YouTube thumbnail if a valid YouTube URL/ID exists
  if (videoId && stage !== 'fallback_image') {
    src = `https://img.youtube.com/vi/${videoId}/${stage}.jpg`;
  } else {
    // 2. Only use article featured image if there is no YouTube URL or all YouTube thumbnails failed
    src = getOptimizedImageUrl(imageUrl, 500) || imageUrl || undefined;
  }

  const handleError = () => {
    if (stage === 'hqdefault') {
      setStage('mqdefault');
    } else if (stage === 'mqdefault') {
      setStage('fallback_image');
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    // YouTube returns a 120x90 image (naturalWidth === 120) when default thumbnail is missing
    if (videoId && stage === 'hqdefault' && img.naturalWidth === 120) {
      handleError();
    }
  };

  return (
    <img
      src={src}
      alt={title}
      width={480}
      height={270}
      loading="lazy"
      decoding="async"
      onError={handleError}
      onLoad={handleLoad}
      className={className || "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"}
    />
  );
});
