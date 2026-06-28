// ============================================================================
// VIXOR Share — Telegram Integration
// ============================================================================
// Opens Telegram share dialog via web URL. No Bot API needed for sharing.
// ============================================================================

import type { ShareableSignal } from './format-signal';
import { buildTelegramShareUrl } from './format-signal';

/**
 * Open Telegram share dialog for a signal.
 * Uses t.me/share/url — works in any browser, no Bot API key needed.
 */
export function shareOnTelegram(signal: ShareableSignal): void {
  const url = buildTelegramShareUrl(signal);
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
}

/**
 * Get the Telegram share URL without opening it.
 */
export function getTelegramShareUrl(signal: ShareableSignal): string {
  return buildTelegramShareUrl(signal);
}