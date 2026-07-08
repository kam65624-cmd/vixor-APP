import { useState, useEffect, useCallback } from "react";

/**
 * Tracks the browser's online/offline status.
 *
 * Usage:
 * ```tsx
 * const { isOnline } = useOnline();
 * if (!isOnline) return <OfflineBanner />;
 * ```
 */
export function useOnline() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  const handleOnline = useCallback(() => setIsOnline(true), []);
  const handleOffline = useCallback(() => setIsOnline(false), []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline };
}
