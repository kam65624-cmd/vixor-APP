// ============================================================================
// VIXOR Security — Input Sanitization Tests
// ============================================================================

import { describe, expect, it } from "vitest";
import {
  sanitizeHtml,
  sanitizeUrl,
  sanitizePair,
  sanitizeErrorMessage,
  isAllowedFileType,
} from "./sanitize";

describe("sanitizeHtml", () => {
  it("1. returns plain text unchanged", () => {
    expect(sanitizeHtml("Hello World")).toBe("Hello World");
  });

  it("2. strips <script> tags and content", () => {
    expect(sanitizeHtml('<script>alert("xss")</script>safe')).toBe("safe");
  });

  it("3. strips <iframe> tags", () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>content')).toBe("content");
  });

  it("4. strips on* event handlers", () => {
    expect(sanitizeHtml('<div onclick="alert(1)">click</div>')).toBe("click");
  });

  it("5. strips javascript: URLs in attributes", () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("6. strips <style> tags", () => {
    expect(sanitizeHtml("<style>body{display:none}</style>visible")).toBe("visible");
  });

  it("7. strips <embed> tags", () => {
    expect(sanitizeHtml('<embed src="evil.swf">content')).toBe("content");
  });

  it("8. strips <object> tags", () => {
    expect(sanitizeHtml('<object data="evil"></object>content')).toBe("content");
  });

  it("9. handles mixed content", () => {
    const input = "Hello <b>world</b> <script>evil()</script> end";
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("evil");
  });

  it("10. trims whitespace", () => {
    expect(sanitizeHtml("  hello  ")).toBe("hello");
  });

  it("11. handles empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("12. handles null-like content with numbers", () => {
    expect(sanitizeHtml('<div onmouseover="x">text</div>')).toBe("text");
  });

  it("13. strips data: protocol in src", () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("data:text");
  });

  it("14. removes all remaining HTML tags", () => {
    expect(sanitizeHtml("<b>bold</b> and <i>italic</i>")).toBe("bold and italic");
  });

  it("15. handles nested script in div", () => {
    const input = "<div><script>alert(1)</script>safe</div>";
    const result = sanitizeHtml(input);
    expect(result).not.toContain("script");
    expect(result).toContain("safe");
  });
});

describe("sanitizeUrl", () => {
  it("1. allows http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
  });

  it("2. allows https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("3. rejects javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("4. rejects data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("5. rejects vbscript: URLs", () => {
    expect(sanitizeUrl("vbscript:MsgBox(1)")).toBe("");
  });

  it("6. converts protocol-relative URLs to https", () => {
    expect(sanitizeUrl("//cdn.example.com/file.js")).toBe("https://cdn.example.com/file.js");
  });

  it("7. allows relative paths", () => {
    expect(sanitizeUrl("/api/health")).toBe("/api/health");
  });

  it("8. returns empty for empty input", () => {
    expect(sanitizeUrl("")).toBe("");
  });

  it("9. trims and normalizes whitespace", () => {
    expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com");
  });

  it("10. rejects blob: URLs", () => {
    expect(sanitizeUrl("blob:https://example.com/abc-123")).toBe("");
  });
});

describe("sanitizePair", () => {
  it("1. uppercases a valid pair", () => {
    expect(sanitizePair("btc/usdt")).toBe("BTC/USDT");
  });

  it("2. accepts slash format", () => {
    expect(sanitizePair("ETH/USDT")).toBe("ETH/USDT");
  });

  it("3. accepts hyphen format", () => {
    expect(sanitizePair("sol-usdt")).toBe("SOL-USDT");
  });

  it("4. accepts no separator", () => {
    expect(sanitizePair("BTCUSDT")).toBe("BTCUSDT");
  });

  it("5. returns empty for special characters", () => {
    expect(sanitizePair("BTC@USDT")).toBe("");
  });

  it("6. returns empty for empty string", () => {
    expect(sanitizePair("")).toBe("");
  });

  it("7. returns empty for spaces", () => {
    expect(sanitizePair("  ")).toBe("");
  });

  it("8. returns empty for non-string", () => {
    expect(sanitizePair(null as unknown as string)).toBe("");
  });
});

describe("sanitizeErrorMessage", () => {
  it("1. handles Error instances", () => {
    const err = new Error("Something went wrong");
    expect(sanitizeErrorMessage(err)).toBe("Something went wrong");
  });

  it("2. handles plain strings", () => {
    expect(sanitizeErrorMessage("raw error")).toBe("raw error");
  });

  it("3. removes file paths", () => {
    const msg = "Error at /home/user/project/src/index.ts:42";
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain("/home/user/project/src/index.ts");
    expect(result).toContain("[path]");
  });

  it("4. removes email addresses", () => {
    const msg = "Failed for user@example.com";
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain("user@example.com");
    expect(result).toContain("[email]");
  });

  it("5. removes API keys (long hex)", () => {
    const msg = "Invalid key abcdef1234567890abcdef1234567890abcdef12";
    const result = sanitizeErrorMessage(msg);
    expect(result).toContain("[key]");
  });

  it("6. removes connection strings", () => {
    const msg = "postgresql://user:pass@host:5432/db failed";
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain("postgresql://user:pass@host:5432/db");
    expect(result).toContain("[connection]");
  });

  it("7. removes bearer tokens", () => {
    const msg = "Request failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test");
    expect(result).toContain("Bearer [token]");
  });

  it("8. handles unknown types", () => {
    expect(sanitizeErrorMessage(42)).toBe("42");
  });

  it("9. handles null", () => {
    expect(sanitizeErrorMessage(null)).toBe("null");
  });

  it("10. removes IP addresses", () => {
    const msg = "Connection refused at 192.168.1.1:5432";
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain("192.168.1.1");
    expect(result).toContain("[ip]");
  });
});

describe("isAllowedFileType", () => {
  it("1. allows png files", () => {
    expect(isAllowedFileType("photo.png", ["png", "jpg", "gif"])).toBe(true);
  });

  it("2. rejects disallowed types", () => {
    expect(isAllowedFileType("script.exe", ["png", "jpg"])).toBe(false);
  });

  it("3. is case-insensitive", () => {
    expect(isAllowedFileType("photo.PNG", ["png"])).toBe(true);
  });

  it("4. rejects files without extension", () => {
    expect(isAllowedFileType("noext", ["png"])).toBe(false);
  });

  it("5. handles empty filename", () => {
    expect(isAllowedFileType("", ["png"])).toBe(false);
  });

  it("6. handles double extensions correctly", () => {
    expect(isAllowedFileType("archive.tar.gz", ["gz"])).toBe(true);
  });
});
