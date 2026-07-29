import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll the main window to the top instantly on navigation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior
    });

    // Also reset scroll for any custom scrollable containers if present
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}
