// ── VirtualList — High-performance virtual scrolling wrapper ──────────────
// Uses @tanstack/react-virtual for rendering large lists efficiently
import { useRef, useCallback, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface VirtualListProps {
  count: number;
  estimateSize?: number;
  overscan?: number;
  renderItem: (index: number) => ReactNode;
  className?: string;
  getItemKey?: (index: number) => string;
}

export function VirtualList({
  count,
  estimateSize = 60,
  overscan = 5,
  renderItem,
  className,
  getItemKey,
}: VirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKey ? (index) => getItemKey(index) : undefined,
  });

  return (
    <div
      ref={parentRef}
      className={`scrollbar-hide ${className ?? ""}`}
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        minHeight: 0,
      }}
    >
      {count === 0 ? null : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(virtualItem.index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Simple store creator using zustand ────────────────────────────────────
// Lightweight client-side state for UI state that doesn't need server sync

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export function createUIStore<T extends object>(initialState: T) {
  return create<T>()(
    immer((set) => ({
      ...initialState,
      _set: (partial: Partial<T>) =>
        set((state) => {
          Object.assign(state, partial);
        }),
    })),
  );
}
