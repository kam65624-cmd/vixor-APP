import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Server function: get all key statuses (admin only) ──
const getKeyStatuses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin, getAllKeyStatuses } = await import(
      "@/shared/api-keys"
    );
    requireAdmin(context.userId);

    return {
      isAdmin: true,
      keys: getAllKeyStatuses(),
    };
  });

export const Route = createFileRoute("/_authenticated/admin/api-keys")({
  head: () => ({
    meta: [{ title: "API Keys — Vixor Admin" }],
  }),
  component: AdminApiKeysPage,
});

interface KeyStatus {
  id: string;
  label: string;
  envVar: string;
  description: string;
  category: string;
  configured: boolean;
  maskedValue?: string;
}

function AdminApiKeysPage() {
  const [keys, setKeys] = useState<KeyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getKeyStatuses()
      .then((data: { isAdmin: boolean; keys: KeyStatus[] }) => {
        if (data.isAdmin) {
          setKeys(data.keys);
        } else {
          setError("Access denied. Admin privileges required.");
        }
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load API key statuses.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Group keys by category
  const categories = keys.reduce<Record<string, KeyStatus[]>>(
    (acc, key) => {
      if (!acc[key.category]) acc[key.category] = [];
      acc[key.category].push(key);
      return acc;
    },
    {} as Record<string, KeyStatus[]>,
  );

  const totalKeys = keys.length;
  const configuredCount = keys.filter((k) => k.configured).length;

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: "#121212",
        color: "#FFFFFF",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h1 className="text-lg font-bold">API Key Management</h1>
          <span
            className="text-[9px] px-1.5 rounded font-bold"
            style={{
              background: "rgba(245,158,11,0.15)",
              color: "#F59E0B",
            }}
          >
            ADMIN ONLY
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
          Centralized view of all platform API keys. Keys are stored in
          environment variables and never exposed to clients.
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && (
          <div
            className="flex items-center justify-center"
            style={{ height: "200px" }}
          >
            <div
              className="text-[11px] font-mono"
              style={{ color: "#9CA3AF" }}
            >
              Loading key statuses...
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <p className="text-[12px] font-bold" style={{ color: "#EF4444" }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && keys.length > 0 && (
          <>
            {/* Summary */}
            <div
              className="rounded-lg p-3 mb-4"
              style={{
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold">
                    Configuration Status
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "#9CA3AF" }}
                  >
                    {configuredCount} of {totalKeys} keys configured
                  </div>
                </div>
                <div
                  className="text-[18px] font-mono font-bold"
                  style={{
                    color:
                      configuredCount === totalKeys ? "#22C55E" : "#F59E0B",
                  }}
                >
                  {Math.round((configuredCount / totalKeys) * 100)}%
                </div>
              </div>
              {/* Progress bar */}
              <div
                className="mt-2 h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  style={{
                    width: `${(configuredCount / totalKeys) * 100}%`,
                    height: "100%",
                    borderRadius: "9999px",
                    background:
                      configuredCount === totalKeys
                        ? "#22C55E"
                        : "linear-gradient(90deg, #10B981, #F59E0B)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>

            {/* Keys by category */}
            {Object.entries(categories).map(([category, categoryKeys]) => (
              <div key={category} className="mb-4">
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1"
                  style={{ color: "#6B7280" }}
                >
                  {category}
                </div>

                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Table header */}
                  <div
                    className="flex items-center px-3 py-2 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      color: "#6B7280",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ flex: 1.2 }}>Key</div>
                    <div style={{ flex: 1.5 }}>Environment Variable</div>
                    <div style={{ flex: 2 }}>Description</div>
                    <div style={{ width: "70px", textAlign: "center" }}>
                      Status
                    </div>
                    <div style={{ width: "90px", textAlign: "right" }}>
                      Value
                    </div>
                  </div>

                  {/* Rows */}
                  {categoryKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center px-3 py-2.5"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        fontSize: "11px",
                      }}
                    >
                      <div style={{ flex: 1.2 }} className="font-semibold">
                        {key.label}
                      </div>
                      <div
                        style={{
                          flex: 1.5,
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color: "#9CA3AF",
                        }}
                      >
                        {key.envVar}
                      </div>
                      <div
                        style={{
                          flex: 2,
                          fontSize: "10px",
                          color: "#6B7A8D",
                        }}
                      >
                        {key.description}
                      </div>
                      <div
                        style={{
                          width: "70px",
                          textAlign: "center",
                        }}
                      >
                        {key.configured ? (
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(34,197,94,0.12)",
                              color: "#22C55E",
                            }}
                          >
                            <span
                              style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: "#22C55E",
                                display: "inline-block",
                              }}
                            />
                            Active
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              color: "#6B7280",
                            }}
                          >
                            Missing
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          width: "90px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color: key.configured ? "#9CA3AF" : "#2D3748",
                        }}
                      >
                        {key.maskedValue || "\u2014"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Info note */}
            <div
              className="rounded-lg p-3 mt-2"
              style={{
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.12)",
              }}
            >
              <div className="flex items-start gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: "1px" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12.01" y1="8" y2="8" />
                </svg>
                <div>
                  <div
                    className="text-[11px] font-bold"
                    style={{ color: "#34D399" }}
                  >
                    How to configure
                  </div>
                  <div
                    className="text-[10px] mt-0.5"
                    style={{ color: "#9CA3AF" }}
                  >
                    Set environment variables in your Vercel project settings
                    or .env.local file. Keys are never sent to the browser.
                    Admin access is controlled via the VIXOR_ADMIN_IDS
                    environment variable.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}