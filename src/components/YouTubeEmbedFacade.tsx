import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { extractYouTubeId } from '@/lib/youtube';
import { VideoThumbnail } from './VideoThumbnail';

interface YouTubeEmbedFacadeProps {
  youtubeUrl: string;
  title: string;
  imageUrl?: string | null;
  className?: string;
}

export function YouTubeEmbedFacade({ youtubeUrl, title, imageUrl, className }: YouTubeEmbedFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = extractYouTubeId(youtubeUrl);

  if (!videoId) return null;

  if (isPlaying) {
    return (
      <div className={className || "relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md border border-zinc-200 dark:border-zinc-800"}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={`${title} - Video Report`}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsPlaying(true)}
      className={className || "relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md border border-zinc-200 dark:border-zinc-800 cursor-pointer group"}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
      aria-label={`Play video: ${title}`}
    >
      <VideoThumbnail
        youtubeUrl={youtubeUrl}
        imageUrl={imageUrl}
        title={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
      />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
          <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-current ml-1" />
        </div>
      </div>
    </div>
  );
}
