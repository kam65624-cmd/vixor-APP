// ============================================================================
// VIXOR Share — X (Twitter) Integration
// ============================================================================
// Opens X compose window via web intent URL. No API key needed.
// ============================================================================

import type { ShareableSignal } from './format-signal';
import { buildXShareUrl } from './format-signal';

/**
 * Open X (Twitter) share dialog for a signal.
 * Uses web intent URL — works in any browser, no API keys.
 */
export function shareOnX(signal: ShareableSignal): void {
  const url = buildXShareUrl(signal);
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
}

/**
 * Get the X share URL without opening it.
 * Useful for custom UI (e.g., QR code generation).
 */
export function getXShareUrl(signal: ShareableSignal): string {
  return buildXShareUrl(signal);
}