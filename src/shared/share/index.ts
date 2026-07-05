// ============================================================================
// VIXOR Share — Barrel Export
// ============================================================================

export type { ShareableSignal } from "./format-signal";
export {
  formatSignalText,
  formatSignalTelegramHtml,
  buildXShareUrl,
  buildTelegramShareUrl,
} from "./format-signal";
export { shareOnX, getXShareUrl } from "./x-share";
export { shareOnTelegram, getTelegramShareUrl } from "./telegram-share";
