import { useState, useRef, useCallback, type CSSProperties } from "react";

const PULL_THRESHOLD = 60;

/**
 * Shared pull-to-refresh hook for touch devices.
 * Extracts the logic that was previously duplicated in discover.tsx.
 *
 * Usage:
 * ```
 * const ptr = usePullToRefresh(() => refetch());
 * ```
 */
export function usePullToRefresh(onRefresh: () => void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = 0;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    if (scrollTop <= 0 && startY.current > 0) {
      const diff = e.touches[0].clientY - startY.current;
      // Apply resistance: 0.3 factor so it feels natural
      const damped = Math.min(diff * 0.3, 80);
      currentY.current = damped;
      if (damped > 0) {
        setPullDistance(damped);
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (currentY.current >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 800);
    } else {
      setPullDistance(0);
    }
    startY.current = 0;
    currentY.current = 0;
  }, [onRefresh, isRefreshing]);

  const pullIndicatorStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: `${pullDistance}px`,
    overflow: "hidden",
    transition: pullDistance === 0 && !isRefreshing ? "height 0.3s ease" : undefined,
  };

  return {
    pullIndicatorStyle,
    pullDistance,
    isRefreshing,
    pullHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    containerRef,
  };
}

export { PULL_THRESHOLD };
