import React, { useCallback } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { prefetchArticle } from '@/lib/articleCache';

interface PrefetchLinkProps extends LinkProps {
  articleSlug?: string;
  articleImageUrl?: string;
}

export const PrefetchLink = React.memo(function PrefetchLink({
  articleSlug,
  articleImageUrl,
  onMouseEnter,
  onTouchStart,
  children,
  ...props
}: PrefetchLinkProps) {

  const handlePrefetch = useCallback(() => {
    if (articleSlug) {
      prefetchArticle(articleSlug, articleImageUrl);
    }
  }, [articleSlug, articleImageUrl]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    handlePrefetch();
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
    handlePrefetch();
    if (onTouchStart) onTouchStart(e);
  };

  return (
    <Link
      {...props}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
    >
      {children}
    </Link>
  );
});
