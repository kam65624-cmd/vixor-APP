// ============================================================================
// VIXOR Share — Signal Formatting Utilities
// ============================================================================
// Formats signal data into shareable text for X (Twitter) and Telegram.
// No external API keys needed — uses web intent URLs.
// ============================================================================

export interface ShareableSignal {
  pair: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence?: number;
  entry?: number | null;
  stopLoss?: number | null;
  takeProfit?: number[] | null;
  pattern?: string | null;
  reasons?: string[] | null;
  timeframe?: string;
  source?: string; // 'VIXOR AI' or custom
}

/**
 * Format a signal as a compact, readable text for social sharing.
 * Supports both English and structured layouts.
 */
export function formatSignalText(signal: ShareableSignal): string {
  const { pair, direction, confidence, entry, stopLoss, takeProfit, pattern, reasons, timeframe, source } = signal;

  const lines: string[] = [];

  // Header
  const dirEmoji = direction === 'BUY' ? '🟢' : direction === 'SELL' ? '🔴' : '⏸️';
  lines.push(`${dirEmoji} ${direction} ${pair}${timeframe ? ` | ${timeframe}` : ''}`);
  lines.push('');

  // Confidence
  if (confidence !== undefined) {
    const bar = '█'.repeat(Math.round(confidence / 10)) + '░'.repeat(10 - Math.round(confidence / 10));
    lines.push(`Confidence: ${bar} ${confidence}%`);
  }

  // Pattern
  if (pattern) {
    lines.push(`Pattern: ${pattern}`);
  }

  // Price levels
  if (entry) lines.push(`Entry: $${formatPrice(entry)}`);
  if (stopLoss) lines.push(`SL: $${formatPrice(stopLoss)}`);
  if (takeProfit && takeProfit.length > 0) {
    lines.push(`TP: ${takeProfit.map((tp, i) => `$${formatPrice(tp)}`).join(' → ')}`);
  }

  // R:R calculation
  if (entry && stopLoss && takeProfit && takeProfit.length > 0) {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit[0] - entry);
    if (risk > 0) {
      lines.push(`R:R: 1:${(reward / risk).toFixed(1)}`);
    }
  }

  // Reasons (first 3 max to keep it concise)
  if (reasons && reasons.length > 0) {
    lines.push('');
    const displayReasons = reasons.slice(0, 3);
    lines.push(displayReasons.map((r) => `• ${r}`).join('\n'));
  }

  // Footer / branding
  lines.push('');
  lines.push(`via ${source ?? 'VIXOR AI'} — Trade Intelligence`);

  return lines.join('\n');
}

/**
 * Format a signal as HTML for Telegram (supports bold/italic).
 */
export function formatSignalTelegramHtml(signal: ShareableSignal): string {
  const { pair, direction, confidence, entry, stopLoss, takeProfit, pattern, reasons, timeframe, source } = signal;

  const dirEmoji = direction === 'BUY' ? '🟢' : direction === 'SELL' ? '🔴' : '⏸️';
  const lines: string[] = [];

  lines.push(`<b>${dirEmoji} ${direction} ${pair}</b>${timeframe ? ` | ${timeframe}` : ''}`);
  lines.push('');

  if (confidence !== undefined) {
    lines.push(`<b>Confidence:</b> ${confidence}%`);
  }
  if (pattern) {
    lines.push(`<b>Pattern:</b> ${pattern}`);
  }
  if (entry) lines.push(`<b>Entry:</b> $${formatPrice(entry)}`);
  if (stopLoss) lines.push(`<b>SL:</b> $${formatPrice(stopLoss)}`);
  if (takeProfit && takeProfit.length > 0) {
    lines.push(`<b>TP:</b> ${takeProfit.map((tp) => `$${formatPrice(tp)}`).join(' → ')}`);
  }

  // R:R
  if (entry && stopLoss && takeProfit && takeProfit.length > 0) {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit[0] - entry);
    if (risk > 0) {
      lines.push(`<b>R:R:</b> 1:${(reward / risk).toFixed(1)}`);
    }
  }

  if (reasons && reasons.length > 0) {
    lines.push('');
    reasons.slice(0, 3).forEach((r) => {
      lines.push(`• ${r}`);
    });
  }

  lines.push('');
  lines.push(`<i>via ${source ?? 'VIXOR AI'} — Trade Intelligence</i>`);

  return lines.join('\n');
}

/** Format price with appropriate decimal places */
function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

/**
 * Build X (Twitter) share URL. Opens a compose window with pre-filled text.
 * Max 280 chars for the tweet text. Truncates reasons if needed.
 */
export function buildXShareUrl(signal: ShareableSignal): string {
  let text = formatSignalText(signal);

  // X has a 280 char limit for the text parameter
  // (URL is auto-tacked on and counted as ~23 chars)
  if (text.length > 250) {
    // Truncate reasons
    const signalNoReasons = { ...signal, reasons: undefined };
    text = formatSignalText(signalNoReasons);
    if (text.length > 280) {
      text = text.slice(0, 277) + '...';
    }
  }

  const encoded = encodeURIComponent(text);
  return `https://twitter.com/intent/tweet?text=${encoded}`;
}

/**
 * Build Telegram share URL. Opens Telegram with pre-filled message.
 */
export function buildTelegramShareUrl(signal: ShareableSignal): string {
  // Telegram uses plain text in URL sharing (HTML only works via Bot API)
  const text = formatSignalText(signal);
  const encoded = encodeURIComponent(text);
  return `https://t.me/share/url?url=${encodeURIComponent('https://vixor-app.vercel.app')}&text=${encoded}`;
}