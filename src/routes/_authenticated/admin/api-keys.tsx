import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import {
  PageLayout,
  StatsRow,
  ProgressBar,
  ScrollArea,
  Badge,
  EmptyState,
  SectionTitle,
  DataRow,
} from "@/components/vixor/PageLayout";

// ── Server function: get all key statuses (admin only) ──
const getKeyStatuses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin, getAllKeyStatuses } = await import("@/shared/api-keys");
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

/** Shared style for a single column in the table header */
const thCol: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

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
  const pct = totalKeys > 0 ? Math.round((configuredCount / totalKeys) * 100) : 0;
  const allConfigured = configuredCount === totalKeys && totalKeys > 0;

  return (
    <PageLayout
      title="API Key Management"
      badge="ADMIN ONLY"
      badgeColor={"var(--color-neutral-wait)"}
      loading={loading}
      loadingColor={"var(--color-neutral-wait)"}
    >
      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "16px",
            background: `rgba(246,70,93,0.10)`,
            borderBottom: `1px solid rgba(246,70,93,0.19)`,
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--color-bearish)",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* No error, no keys */}
      {!error && !loading && keys.length === 0 && (
        <EmptyState
          icon="🔒"
          title="No API Keys Found"
          message="No API keys are configured in the system."
        />
      )}

      {/* Content */}
      {!error && !loading && keys.length > 0 && (
        <>
          <StatsRow
            stats={[
              {
                label: "CONFIG STATUS",
                value: `${pct}%`,
                color: allConfigured ? "var(--color-bullish)" : "var(--color-neutral-wait)",
                sub: `${configuredCount} of ${totalKeys} keys configured`,
              },
            ]}
          />

          <ProgressBar
            value={configuredCount}
            max={totalKeys}
            color={allConfigured ? "var(--color-bullish)" : "var(--color-neutral-wait)"}
            height={4}
          />

          <ScrollArea>
            {/* Keys grouped by category */}
            {Object.entries(categories).map(([category, categoryKeys]) => (
              <div key={category}>
                <SectionTitle title={category} count={categoryKeys.length} />

                {/* Table header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    height: "32px",
                    background: "var(--color-muted)",
                    borderBottom: `1px solid ${"var(--color-border)"}`,
                    flexShrink: 0,
                    overflowX: "auto",
                  }}
                  className="scrollbar-hide"
                >
                  <div style={{ flex: 1.2, minWidth: 80, ...thCol }}>Key</div>
                  <div style={{ flex: 1.5, minWidth: 100, ...thCol }}>Environment Variable</div>
                  <div
                    style={{
                      flex: 2,
                      minWidth: 120,
                      ...thCol,
                    }}
                  >
                    Description
                  </div>
                  <div style={{ width: "70px", textAlign: "center", ...thCol }}>Status</div>
                  <div style={{ width: "90px", textAlign: "right", ...thCol }}>Value</div>
                </div>

                {/* Rows */}
                {categoryKeys.map((key) => (
                  <DataRow key={key.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        overflowX: "auto",
                      }}
                      className="scrollbar-hide"
                    >
                      <div
                        style={{
                          flex: 1.2,
                          minWidth: 80,
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--color-foreground)",
                          flexShrink: 0,
                        }}
                      >
                        {key.label}
                      </div>
                      <div
                        style={{
                          flex: 1.5,
                          minWidth: 100,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "10px",
                          color: "var(--color-muted-foreground)",
                          flexShrink: 0,
                        }}
                      >
                        {key.envVar}
                      </div>
                      <div
                        style={{
                          flex: 2,
                          minWidth: 120,
                          fontSize: "10px",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        {key.description}
                      </div>
                      <div
                        style={{
                          width: "70px",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {key.configured ? (
                          <Badge label="Active" color={"var(--color-bullish)"} small />
                        ) : (
                          <Badge label="Missing" color={"var(--color-muted-foreground)"} small />
                        )}
                      </div>
                      <div
                        style={{
                          width: "90px",
                          textAlign: "right",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "10px",
                          color: key.configured
                            ? "var(--color-muted-foreground)"
                            : "var(--color-muted-foreground)",
                          flexShrink: 0,
                        }}
                      >
                        {key.maskedValue || "\u2014"}
                      </div>
                    </div>
                  </DataRow>
                ))}
              </div>
            ))}

            {/* Info note */}
            <div
              style={{
                padding: "12px 16px",
                background: `rgba(14,203,129,0.06)`,
                borderTop: `1px solid rgba(14,203,129,0.10)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={"var(--color-primary)"}
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
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}
                  >
                    How to configure
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-muted-foreground)",
                      marginTop: "2px",
                      lineHeight: 1.5,
                    }}
                  >
                    Set environment variables in your Vercel project settings or .env.local file.
                    Keys are never sent to the browser. Admin access is controlled via the
                    VIXOR_ADMIN_IDS environment variable.
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </>
      )}
    </PageLayout>
  );
}
