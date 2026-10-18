import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * CSS-only route transition + focus management.
 * On navigation, focus moves to <main> so keyboard and screen-reader users land on new content.
 * Reduced-motion users get no animation (handled globally in index.css).
 */
export function PageTransition({ children }) {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
