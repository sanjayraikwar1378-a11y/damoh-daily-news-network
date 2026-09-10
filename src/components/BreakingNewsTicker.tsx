import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useNews } from '@/context/NewsContext';

export function BreakingNewsTicker() {
  const { breakingNews } = useNews();

  // If no active breaking news published within the last 48 hours, hide ticker
  if (!breakingNews || breakingNews.length === 0) {
    return null;
  }

  // Calculate constant scrolling duration (~7s per breaking news item, minimum 20s)
  const marqueeDuration = Math.max(20, breakingNews.length * 7);

  return (
    <div className="bg-white dark:bg-zinc-950 border-t border-b border-zinc-200 dark:border-zinc-800/90 py-1 sm:py-2 text-zinc-900 dark:text-zinc-100 transition-colors w-full max-w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-1 sm:px-4 md:px-6">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-lg sm:rounded-xl overflow-hidden shadow-xs sm:shadow-sm border border-zinc-200 dark:border-zinc-800/80 transition-colors w-full min-w-0 max-w-full">
          {/* Breaking Badge */}
          <div className="bg-red-600 px-2 sm:px-4 py-1.5 sm:py-2.5 font-black flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0 z-10 text-[11px] sm:text-xs md:text-sm uppercase tracking-wider text-white shadow-xs select-none">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce text-yellow-300 shrink-0" />
            <span className="hidden xs:inline">ब्रेकिंग न्यूज़</span>
            <span className="xs:hidden">ब्रेकिंग</span>
          </div>

          {/* Marquee Content - Flexes to consume 100% of remaining width */}
          <div className="px-2 sm:px-4 py-1.5 sm:py-2.5 overflow-hidden relative w-full flex-1 min-w-0 flex items-center">
            <div
              className="animate-marquee whitespace-nowrap text-xs sm:text-sm font-semibold flex items-center shrink-0 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
              style={{ animationDuration: `${marqueeDuration}s` }}
            >
              {breakingNews.map((news) => (
                <span key={news.id} className="mr-6 sm:mr-10 inline-flex items-center text-zinc-800 dark:text-zinc-100">
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${news.isBreaking ? 'bg-red-600 dark:bg-yellow-400 animate-ping' : 'bg-red-500 animate-pulse'} mr-2 shrink-0`} />
                  <Link
                    to={`/article/${news.slug}`}
                    className="hover:text-red-600 dark:hover:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:outline-none transition-colors"
                  >
                    {news.isBreaking && <span className="text-red-600 dark:text-yellow-300 font-extrabold mr-1.5">[ब्रेकिंग]</span>}
                    {news.title}
                  </Link>
                </span>
              ))}

              {/* Duplicate loop for seamless infinite scrolling */}
              {breakingNews.map((news) => (
                <span key={`${news.id}-dup`} className="mr-6 sm:mr-10 inline-flex items-center text-zinc-800 dark:text-zinc-100">
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${news.isBreaking ? 'bg-red-600 dark:bg-yellow-400 animate-ping' : 'bg-red-500 animate-pulse'} mr-2 shrink-0`} />
                  <Link
                    to={`/article/${news.slug}`}
                    className="hover:text-red-600 dark:hover:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:outline-none transition-colors"
                  >
                    {news.isBreaking && <span className="text-red-600 dark:text-yellow-300 font-extrabold mr-1.5">[ब्रेकिंग]</span>}
                    {news.title}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
