// ============================================================================
// VIXOR Strategy Runtime — Indicator Parameter Parser
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/indicator_params.py
//
// Parses `# @param name type default description` annotations from indicator
// code, plus `# @strategy key value` annotations for risk/position config.

export type ParamType = "int" | "float" | "bool" | "str";

export interface IndicatorParam {
  name: string;
  type: ParamType;
  default: string | number | boolean;
  description: string;
}

const PARAM_PATTERN = /^#\s*@param\s+(\w+)\s+(int|float|bool|str|string)\s+(\S+)\s*(.*)$/i;

const STRATEGY_PATTERN = /^#\s*@strategy\s+(\w+)\s*:?\s*(\S+)\s*(.*)$/i;

interface StrategyKeySpec {
  type: "float" | "int" | "bool" | "str";
  min?: number;
  max?: number;
  enum?: string[];
}

const STRATEGY_KEYS: Record<string, StrategyKeySpec> = {
  stopLossPct: { type: "float", min: 0, max: 1 },
  takeProfitPct: { type: "float", min: 0, max: 5 },
  entryPct: { type: "float", min: 0.01, max: 1 },
  trailingEnabled: { type: "bool" },
  trailingStopPct: { type: "float", min: 0, max: 1 },
  trailingActivationPct: { type: "float", min: 0, max: 1 },
  tradeDirection: { type: "str", enum: ["long", "short", "both"] },
};

export class IndicatorParamsParser {
  /** Parse `# @param name type default description` lines into typed specs. */
  static parseParams(code: string): IndicatorParam[] {
    if (!code) return [];
    const params: IndicatorParam[] = [];
    const lines = code.split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      const m = line.match(PARAM_PATTERN);
      if (!m) continue;
      const [, name, typeRaw, defaultStr, description] = m;
      let type: ParamType = typeRaw.toLowerCase() as ParamType;
      if (type === ("string" as unknown)) type = "str";
      if (type !== "int" && type !== "float" && type !== "bool" && type !== "str") continue;
      params.push({
        name,
        type,
        default: convertValue(defaultStr, type),
        description: (description ?? "").trim(),
      });
    }
    return params;
  }

  /**
   * Merge declared params with user-supplied overrides. User values are coerced
   * to the declared type.
   */
  static mergeParams(
    declared: IndicatorParam[],
    userParams: Record<string, unknown>,
  ): Record<string, string | number | boolean> {
    const out: Record<string, string | number | boolean> = {};
    for (const p of declared) {
      if (Object.prototype.hasOwnProperty.call(userParams, p.name)) {
        out[p.name] = convertValue(String(userParams[p.name]), p.type);
      } else {
        out[p.name] = p.default;
      }
    }
    // also pass through any user-provided keys that weren't declared (rare)
    for (const [k, v] of Object.entries(userParams)) {
      if (!Object.prototype.hasOwnProperty.call(out, k)) {
        out[k] = typeof v === "object" ? JSON.stringify(v) : (v as string | number | boolean);
      }
    }
    return out;
  }

  /** Parse `# @strategy key value` lines into a typed config dict. */
  static parseStrategyConfig(code: string): Record<string, string | number | boolean> {
    if (!code) return {};
    const cfg: Record<string, string | number | boolean> = {};
    for (const raw of code.split("\n")) {
      const line = raw.trim();
      const m = line.match(STRATEGY_PATTERN);
      if (!m) continue;
      const [, key, valStr] = m;
      const spec = STRATEGY_KEYS[key];
      if (!spec) continue;
      const v = convertStrategyValue(valStr, spec);
      if (v !== null) cfg[key] = v;
    }
    return cfg;
  }
}

function convertValue(raw: string, type: ParamType): string | number | boolean {
  try {
    if (type === "int") {
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : raw;
    }
    if (type === "float") {
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : raw;
    }
    if (type === "bool") {
      return /^(true|1|yes|on)$/i.test(raw.trim());
    }
    return raw;
  } catch {
    return raw;
  }
}

function convertStrategyValue(
  raw: string,
  spec: StrategyKeySpec,
): string | number | boolean | null {
  try {
    if (spec.type === "float") {
      let v = parseFloat(raw);
      if (!Number.isFinite(v)) return null;
      if (spec.min !== undefined) v = Math.max(spec.min, v);
      if (spec.max !== undefined) v = Math.min(spec.max, v);
      return Math.round(v * 1e6) / 1e6;
    }
    if (spec.type === "int") {
      let v = parseInt(raw, 10);
      if (!Number.isFinite(v)) return null;
      if (spec.min !== undefined) v = Math.max(spec.min, v);
      if (spec.max !== undefined) v = Math.min(spec.max, v);
      return v;
    }
    if (spec.type === "bool") {
      return /^(true|1|yes|on)$/i.test(raw.trim());
    }
    // str
    if (spec.enum && !spec.enum.includes(raw)) return spec.enum[0];
    return raw;
  } catch {
    return null;
  }
}
