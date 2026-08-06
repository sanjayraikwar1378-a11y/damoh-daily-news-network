import React, { useState, useEffect, useRef, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  minHeight?: string | number;
  className?: string;
  rootMargin?: string;
  fallback?: ReactNode;
}

export function LazySection({
  children,
  minHeight = '200px',
  className = '',
  rootMargin = '250px 0px',
  fallback,
}: LazySectionProps) {
  const [isIntersected, setIsIntersected] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If already intersected or no window support, reveal immediately
    if (isIntersected || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsIntersected(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
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
  }, [isIntersected, rootMargin]);

  if (isIntersected) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }}
    >
      {fallback || (
        <div className="w-full h-full bg-zinc-100/50 dark:bg-zinc-900/30 rounded-2xl animate-pulse min-h-[160px]" />
      )}
    </div>
  );
}
