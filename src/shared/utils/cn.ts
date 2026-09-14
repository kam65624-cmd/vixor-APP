/**
 * VIXOR — Class name concatenation utility
 * =========================================
 * Tiny shim around the standard `clsx` pattern — combines class names,
 * filters out falsy values, and joins with spaces.
 *
 * Usage:
 *   cn("base", isActive && "active", undefined, "extra")
 *   // → "base active extra"
 */

export type ClassValue = string | number | boolean | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const push = (val: ClassValue): void => {
    if (!val) return;
    if (typeof val === "string" || typeof val === "number") {
      out.push(String(val));
    } else if (Array.isArray(val)) {
      for (const v of val) push(v);
    }
  };

  for (const input of inputs) push(input);
  return out.join(" ");
}
