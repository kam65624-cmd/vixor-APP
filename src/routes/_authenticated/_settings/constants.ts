// ── Types ────────────────────────────────────────────────────────────────────
export interface NotificationChannels {
  price_alerts?: boolean;
  whale_alerts?: boolean;
  signal_notifications?: boolean;
}

export interface UserSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  compactMode: boolean;
  showChartOnHover: boolean;
  autoRefresh: boolean;
  tradeConfirmations: boolean;
  twoFactor: boolean;
  slippageIdx: number;
  chainIdx: number;
}

export interface ExchangeFormState {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  label: string;
  isTestnet: boolean;
  showSecret: boolean;
  mtType: "mt4" | "mt5";
}

export type SettingItem =
  | {
      type: "toggle-server";
      id: string;
      label: string;
      desc: string;
      key: keyof NotificationChannels;
    }
  | { type: "toggle-local"; id: string; label: string; desc: string }
  | {
      type: "select";
      label: string;
      desc: string;
      options: string[];
      current: number;
      onChange: (i: number) => void;
    }
  | {
      type: "input";
      id: string;
      label: string;
      desc: string;
      value: string;
      onChange: (v: string) => void;
      placeholder: string;
    }
  | {
      type: "button";
      label: string;
      desc: string;
      btnText: string;
      btnColor: string;
      onClick?: () => void;
    };

// ── Constants & Helpers ───────────────────────────────────────────────────────
export const SETTINGS_STORAGE_KEY = "vixor:user-settings";

export function loadLocalSettings(): Partial<UserSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalSettings(settings: Partial<UserSettings>) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable in private browsing
  }
}
