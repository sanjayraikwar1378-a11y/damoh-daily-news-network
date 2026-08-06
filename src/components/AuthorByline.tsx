import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { Reporter } from '@/data/mock';
import { enrichReporter } from '@/lib/reporterUtils';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

interface AuthorBylineProps {
  reporter?: Partial<Reporter> | null;
  authorNameFallback?: string;
  publishedAt?: string;
  formatDateAgo?: (dateStr?: string) => string;
  variant?: 'header' | 'bio' | 'card' | 'inline';
  className?: string;
}

export function AuthorByline({
  reporter: rawReporter,
  authorNameFallback,
  publishedAt,
  formatDateAgo,
  variant = 'header',
  className = ''
}: AuthorBylineProps) {
  const reporter = enrichReporter(rawReporter, authorNameFallback);
  const avatarUrl = reporter.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop";
  const optimizedAvatar = getOptimizedImageUrl(avatarUrl, 120) || avatarUrl;

  if (variant === 'header') {
    return (
      <div className={`flex items-start gap-3.5 ${className}`}>
        <img 
          src={optimizedAvatar} 
          alt={reporter.name} 
          loading="lazy"
          decoding="async"
          className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5" 
        />
        <div className="flex flex-col justify-center">
          {/* Author Name */}
          <div className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
            {reporter.name}
          </div>
          
          {/* Designation Line 1 (Smaller font than author's name) */}
          {reporter.designation1 && (
            <div className="text-xs font-bold text-red-600 dark:text-red-400 leading-tight mt-0.5">
              {reporter.designation1}
            </div>
          )}

          {/* Designation Line 2 (Personal professional credential - smaller font) */}
          {reporter.designation2 && (
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
              {reporter.designation2}
            </div>
          )}

          {/* Published Time if provided */}
          {publishedAt && formatDateAgo && (
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-1 font-normal">
              <Clock className="h-3 w-3" />
              <span>{formatDateAgo(publishedAt)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'bio') {
    return (
      <div className={`p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 ${className}`}>
        <img 
          src={optimizedAvatar} 
          alt={reporter.name} 
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-red-600 dark:border-red-500 shrink-0 bg-zinc-100 dark:bg-zinc-800 shadow-sm" 
        />
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white leading-snug">
                {reporter.name}
              </h4>
              {reporter.designation1 && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-tight">
                  {reporter.designation1}
                </p>
              )}
              {reporter.designation2 && (
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-tight">
                  {reporter.designation2}
                </p>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-red-600 dark:text-red-400" />
              Author Bio
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-none">
          {reporter.name}
        </span>
        {reporter.designation1 && (
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 leading-tight">
            {reporter.designation1}
          </span>
        )}
        {reporter.designation2 && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
            {reporter.designation2}
          </span>
        )}
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 ${className}`}>
      <div className="flex items-center gap-3">
        <img 
          src={optimizedAvatar} 
          alt={reporter.name} 
          className="w-12 h-12 rounded-full object-cover border border-red-600 shrink-0" 
        />
        <div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{reporter.name}</h4>
          {reporter.designation1 && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{reporter.designation1}</p>}
          {reporter.designation2 && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{reporter.designation2}</p>}
        </div>
      </div>
    </div>
  );
}
