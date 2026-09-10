import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { isSectionRevealed, markSectionRevealed } from '@/lib/scrollRestoration';

interface LazySectionProps {
  children: ReactNode;
  minHeight?: string | number;
  className?: string;
  rootMargin?: string;
  fallback?: ReactNode;
  id?: string;
}

export function LazySection({
  children,
  minHeight = '200px',
  className = '',
  rootMargin = '250px 0px',
  fallback,
  id,
}: LazySectionProps) {
  const [isIntersected, setIsIntersected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (id && isSectionRevealed(id)) return true;
    return false;
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If already intersected or previously revealed, ensure marked and return
    if (isIntersected) {
      if (id) markSectionRevealed(id);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsIntersected(true);
      if (id) markSectionRevealed(id);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
            if (id) markSectionRevealed(id);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isIntersected, rootMargin, id]);

  if (isIntersected) {
    return <div id={id} className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
    >
      {fallback || (
        <div className="w-full h-full bg-zinc-100/50 dark:bg-zinc-900/30 rounded-2xl animate-pulse min-h-[160px]" />
      )}
    </div>
  );
}
