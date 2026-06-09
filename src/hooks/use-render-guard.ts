// ============================================================================
// useRenderGuard — Detects and breaks infinite render loops
// ============================================================================
//
// React error #310 ("Too many re-renders") happens when a component renders
// more than 50 times in a row without committing. This hook detects rapid
// re-renders and logs a warning with the component name, helping identify
// the source of the infinite loop.
//
// In development, it also sets a global flag that the error boundary can
// check to provide better error messages.
// ============================================================================

import { useRef, useEffect } from "react";

const MAX_RAPID_RENDERS = 20; // React's limit is 50, we warn earlier
const RESET_INTERVAL = 1000; // Reset counter after 1 second of stability

// Global flag for the error boundary to check
let _renderLoopDetected = false;
let _renderLoopComponent = "";

export function wasRenderLoopDetected(): boolean {
  return _renderLoopDetected;
}

export function getRenderLoopComponent(): string {
  return _renderLoopComponent;
}

export function clearRenderLoopFlag(): void {
  _renderLoopDetected = false;
  _renderLoopComponent = "";
}

/**
 * Call this hook at the top of any component that might be involved in
 * render loops. It tracks render frequency and warns when it exceeds
 * the threshold.
 *
 * Example:
 * ```tsx
 * function MyComponent() {
 *   useRenderGuard("MyComponent");
 *   // ... rest of component
 * }
 * ```
 */
export function useRenderGuard(componentName: string): void {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  renderCount.current++;
  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTime.current;
  lastRenderTime.current = now;

  // If more than RESET_INTERVAL has passed since last render, reset counter
  if (timeSinceLastRender > RESET_INTERVAL) {
    renderCount.current = 1;
  }

  // Clear any existing reset timer
  if (resetTimer.current) {
    clearTimeout(resetTimer.current);
  }

  // Set a timer to reset the counter after stability
  resetTimer.current = setTimeout(() => {
    renderCount.current = 0;
  }, RESET_INTERVAL);

  // Warn if we're rendering too rapidly
  if (renderCount.current >= MAX_RAPID_RENDERS) {
    console.error(
      `[Vixor Render Guard] Component "${componentName}" has rendered ${renderCount.current} times in rapid succession. ` +
      `This is likely causing React error #310. Check for setState calls during render or unstable dependencies.`
    );
    _renderLoopDetected = true;
    _renderLoopComponent = componentName;
    // Reset to prevent spam
    renderCount.current = 0;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);
}
