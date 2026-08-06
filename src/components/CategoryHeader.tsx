import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface CategoryHeaderProps {
  title: string | React.ReactNode;
  categorySlug?: string;
  articleCount?: number;
  hasArticles?: boolean;
  icon?: React.ReactNode;
  borderColorClass?: string;
  titleColorClass?: string;
  isDarkBackground?: boolean;
  className?: string;
}

export const CategoryHeader = memo(function CategoryHeader({
  title,
  categorySlug,
  articleCount,
  hasArticles = true,
  icon,
  borderColorClass = "border-red-600",
  titleColorClass = "text-zinc-900 dark:text-white",
  isDarkBackground = false,
  className = "",
}: CategoryHeaderProps) {
  // Hide "See All" button only if explicitly 0 articles or hasArticles is false
  const showSeeAll = Boolean(
    categorySlug &&
    hasArticles &&
    (articleCount === undefined || articleCount > 0)
  );

  return (
    <div
      className={`flex items-center justify-between border-b-2 ${borderColorClass} pb-2 mb-6 gap-2 w-full ${className}`}
    >
      <h2 className={`text-base sm:text-xl font-black ${titleColorClass} flex items-center gap-2 min-w-0 truncate`}>
        {icon}
        <span className="truncate">{title}</span>
      </h2>

      {showSeeAll && (
        <Link
          to={`/category/${categorySlug}`}
          aria-label={`सभी ${typeof title === 'string' ? title : ''} खबरें देखें`}
          className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1 group ${
            isDarkBackground
              ? "text-red-400 hover:text-white hover:bg-red-600 bg-zinc-800 border border-zinc-700/60"
              : "text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-800/80"
          }`}
        >
          <span className="whitespace-nowrap">सभी देखें</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 text-red-600 dark:text-red-400 group-hover:text-current" />
        </Link>
      )}
    </div>
  );
});
