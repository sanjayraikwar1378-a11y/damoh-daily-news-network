/**
 * Central Scroll Restoration Manager for Damoh Daily News
 * - Enforces manual browser scrollRestoration so browser popstate does not fight React mounting
 * - Preserves exact scroll position across history navigations (Back / Forward)
 * - Scrolls cleanly to top on new page visits (PUSH)
 * - Supports anchor hash navigation (#comments, etc.)
 * - Zero ongoing polling or heavy listeners; uses lightweight passive events and requestAnimationFrame
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import {
  saveScrollPosition,
  getSavedScrollPosition,
} from "@/lib/scrollRestoration";

export function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'

  const currentScrollYRef = useRef<number>(0);
  const prevLocationRef = useRef<{
    key: string;
    pathname: string;
    search: string;
  } | null>(null);

  // 1. Configure browser history scroll restoration to manual
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch {
        // Fallback for restricted environments
      }
    }

    // Passive scroll listener to keep current scroll position fresh with zero overhead
    const handleScroll = () => {
      currentScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Ensure scroll position is persisted before window unloads
    const handleBeforeUnload = () => {
      const currentKey = location.key || location.pathname;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      saveScrollPosition(currentKey, y);
      saveScrollPosition(location.pathname + location.search, y);
      saveScrollPosition(location.pathname, y);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [location.key, location.pathname, location.search]);

  // 2. Perform route transition scroll handling (PUSH vs POP)
  useLayoutEffect(() => {
    // Save scroll position for the outgoing route before switching
    if (prevLocationRef.current) {
      const prev = prevLocationRef.current;
      const y = currentScrollYRef.current;
      saveScrollPosition(prev.key, y);
      saveScrollPosition(prev.pathname + prev.search, y);
      saveScrollPosition(prev.pathname, y);
    }

    let frameId: number | null = null;

    if (navigationType === "POP") {
      // Browser Back or Forward navigation: restore saved scroll position
      const targetKey = location.key || location.pathname;
      const targetY =
        getSavedScrollPosition(targetKey) ??
        getSavedScrollPosition(location.pathname + location.search) ??
        getSavedScrollPosition(location.pathname) ??
        0;

      if (targetY <= 0) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        currentScrollYRef.current = 0;
      } else {
        // Apply immediate scroll to prevent visible jumping
        window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        currentScrollYRef.current = targetY;

        // Verify over subsequent frames to ensure DOM height was ready and avoid clamping
        let attempts = 0;
        const maxAttempts = 8; // ~120ms total verification window

        const verifyAndRestore = () => {
          attempts++;
          const maxScroll = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            document.body.scrollHeight - window.innerHeight,
            0
          );

          const clampedTarget = Math.min(targetY, maxScroll);
          if (Math.abs((window.scrollY || document.documentElement.scrollTop || 0) - clampedTarget) > 1) {
            window.scrollTo({ top: clampedTarget, left: 0, behavior: "instant" });
            currentScrollYRef.current = clampedTarget;
          }

          // Continue if the document height has not expanded to allow the full targetY yet
          if (attempts < maxAttempts && (window.scrollY < targetY - 2 || maxScroll < targetY)) {
            frameId = requestAnimationFrame(verifyAndRestore);
          }
        };

        frameId = requestAnimationFrame(verifyAndRestore);
      }
    } else {
      // PUSH or REPLACE navigation: new page visit
      if (location.hash) {
        // Handle hash anchors (#comments, etc.)
        const elementId = decodeURIComponent(location.hash.slice(1));
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "instant" });
          currentScrollYRef.current = window.scrollY;
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          currentScrollYRef.current = 0;
        }
      } else {
        // Standard new page visit: reset to top instantly
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        currentScrollYRef.current = 0;
      }
    }

    // Update reference to current location for the next transition
    prevLocationRef.current = {
      key: location.key,
      pathname: location.pathname,
      search: location.search,
    };

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);

  return null;
}
