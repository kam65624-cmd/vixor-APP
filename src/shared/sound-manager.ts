/**
 * Sound Manager — framework-agnostic procedural audio via Web Audio API.
 *
 * All sounds are synthesised on the fly (no audio files).  The singleton
 * respects `vixor:user-settings.soundEnabled` and `soundVolume` from
 * localStorage and lazily creates an AudioContext on first play to comply
 * with browser autoplay policies.
 */

// ── Public types ───────────────────────────────────────────────────────────────
export type SoundType =
  | "alert"
  | "signal"
  | "trade"
  | "whale"
  | "notification"
  | "success"
  | "error"
  | "click";

// ── Frequency helpers ─────────────────────────────────────────────────────────
/** Note → Hz (4th / 5th octave) */
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

const STORAGE_KEY = "vixor:user-settings";

function loadSettings(): { soundEnabled: boolean; soundVolume: number } {
  if (typeof window === "undefined") return { soundEnabled: false, soundVolume: 0.5 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      soundEnabled: parsed.soundEnabled ?? false,
      soundVolume: parsed.soundVolume ?? 0.5,
    };
  } catch {
    return { soundEnabled: false, soundVolume: 0.5 };
  }
}

// ── Sound definitions ─────────────────────────────────────────────────────────
type Tone = { freq: number; start: number; dur: number; gain?: number };

function getTones(type: SoundType): Tone[] {
  switch (type) {
    case "alert":
      // Two-tone rising beep: 400Hz → 800Hz, 150ms each
      return [
        { freq: 400, start: 0, dur: 0.15 },
        { freq: 800, start: 0.15, dur: 0.15 },
      ];
    case "signal":
      // Three short ascending tones: C5-E5-G5
      return [
        { freq: C5, start: 0, dur: 0.1 },
        { freq: E5, start: 0.12, dur: 0.1 },
        { freq: G5, start: 0.24, dur: 0.1 },
      ];
    case "trade":
      // Cash register style: high-low-high
      return [
        { freq: 1200, start: 0, dur: 0.06, gain: 0.6 },
        { freq: 800, start: 0.07, dur: 0.06, gain: 0.6 },
        { freq: 1200, start: 0.14, dur: 0.1, gain: 0.8 },
      ];
    case "whale":
      // Deep rumble: 100Hz, 300ms
      return [
        { freq: 100, start: 0, dur: 0.3, gain: 0.9 },
      ];
    case "notification":
      // Single pleasant chime: 660Hz, 100ms
      return [
        { freq: 660, start: 0, dur: 0.1 },
      ];
    case "success":
      // Ascending arpeggio: C5-E5-G5-C6
      return [
        { freq: C5, start: 0, dur: 0.09 },
        { freq: E5, start: 0.1, dur: 0.09 },
        { freq: G5, start: 0.2, dur: 0.09 },
        { freq: C6, start: 0.3, dur: 0.15 },
      ];
    case "error":
      // Descending buzz: 400Hz → 200Hz
      return [
        { freq: 400, start: 0, dur: 0.15 },
        { freq: 200, start: 0.15, dur: 0.2 },
      ];
    case "click":
      // Very short tap: 1000Hz, 30ms
      return [
        { freq: 1000, start: 0, dur: 0.03, gain: 0.4 },
      ];
  }
}

// ── AudioContext helpers ───────────────────────────────────────────────────────
function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

// ── Sound Manager singleton ───────────────────────────────────────────────────
class SoundManager {
  private ctx: AudioContext | null = null;
  private _enabled: boolean | null = null; // null = not yet loaded from storage
  private _volume: number = 0.5;

  /** Lazily get or create the AudioContext, resuming if suspended. */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      this.ctx = createAudioContext();
    }

    if (this.ctx?.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /** Read the latest enabled/volume from localStorage (called on every play). */
  private syncSettings() {
    const s = loadSettings();
    if (this._enabled === null) this._enabled = s.soundEnabled;
    this._volume = s.soundVolume;
  }

  /** Play a single tone. */
  private playTone(ctx: AudioContext, freq: number, startTime: number, dur: number, gain: number, masterVolume: number) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    const vol = Math.max(0, Math.min(1, masterVolume * gain));
    gainNode.gain.setValueAtTime(vol, ctx.currentTime + startTime);
    // Smooth fade-out to avoid clicks
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + dur);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + dur + 0.05);
  }

  /** Internal play — always plays regardless of enabled state when `force` is true. */
  private _play(type: SoundType, force: boolean, volumeOverride?: number) {
    this.syncSettings();

    if (!force && !this._enabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    const tones = getTones(type);
    const vol = volumeOverride ?? this._volume;

    for (const t of tones) {
      this.playTone(ctx, t.freq, t.start, t.dur, t.gain ?? 1, vol);
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Play a sound if enabled. */
  play(type: SoundType, volume?: number): void {
    this._play(type, false, volume);
  }

  /** Play a sound regardless of enabled state (for settings preview). */
  test(type: SoundType): void {
    this._play(type, true);
  }

  /** Enable / disable sound. */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.soundEnabled = enabled;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }

  /** Set master volume (0–1). */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.soundVolume = this._volume;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }

  /** Check if sound is currently enabled. */
  isEnabled(): boolean {
    this.syncSettings();
    return !!this._enabled;
  }
}

export const soundManager = new SoundManager();