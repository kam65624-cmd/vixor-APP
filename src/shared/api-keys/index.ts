// ── API Keys — Centralized vault + admin guard ─────────────────────────────
// SERVER-SIDE ONLY. Never import this module in client code.

export {
  API_KEY_REGISTRY,
  getApiKey,
  isKeyConfigured,
  maskKey,
  getAllKeyStatuses,
  type ApiKeyId,
} from "./vault";

export { isAdmin, requireAdmin, canAccessAdminPanel } from "./admin-guard";
