import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  ACTIVE_CHARACTER_IDS,
  getCharacter,
} from "../../../packages/vixor-gamification/src/characters/registry";

export const Route = createFileRoute("/v2/")({
  head: () => ({ meta: [{ title: "VIXOR — Crypto Decision Intelligence" }] }),
  component: V2Home,
});

function V2Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-4 py-8 text-center">
        <h1
          className="text-4xl font-extrabold tracking-tight md:text-5xl"
          style={{ color: "var(--color-foreground)" }}
        >
          VIXOR
        </h1>
        <p className="text-lg" style={{ color: "var(--color-muted-foreground)" }}>
          Crypto Decision Intelligence
        </p>
        <p className="mx-auto max-w-2xl text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          A guided journey from signal discovery to outcome learning. Four characters, one decision
          loop, no noise.
        </p>
      </section>

      <section
        className="rounded-xl border p-6"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <h2
          className="mb-3 text-sm font-bold uppercase tracking-wide"
          style={{ color: "var(--color-foreground)" }}
        >
          How it works
        </h2>
        <ol className="space-y-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          <li>
            1. <strong>Discover</strong> a target with a clear reason for appearing.
          </li>
          <li>
            2. <strong>Investigate</strong> evidence with sources and timestamps.
          </li>
          <li>
            3. <strong>Assess</strong> risk and uncertainty before acting.
          </li>
          <li>
            4. <strong>Decide</strong> deliberately, with rationale and an invalidation condition.
          </li>
        </ol>
      </section>

      <section className="flex flex-col items-center gap-3">
        <Link
          to="/v2/onboarding"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
        >
          Start a Decision Case
          <ArrowRight size={16} />
        </Link>
        <Link
          to="/v2/discover"
          className="text-sm underline"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          Or go straight to Discover
        </Link>
      </section>

      <section
        className="rounded-xl border p-4"
        style={{
          background: "var(--color-muted)",
          borderColor: "var(--color-border)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          <strong>Demo mode:</strong> All data is sample. No wallet, no real trades, no API keys
          required.
        </p>
      </section>

      <section>
        <h2
          className="mb-3 text-sm font-bold uppercase tracking-wide"
          style={{ color: "var(--color-foreground)" }}
        >
          Active Characters
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ACTIVE_CHARACTER_IDS.map((id) => {
            const c = getCharacter(id);
            return (
              <div
                key={id}
                className="rounded-lg border p-4"
                style={{
                  background: "var(--color-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>
                  {c.displayName}
                </h3>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {c.shortDescription}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.allowedSurfaces.map((s) => (
                    <span
                      key={s}
                      className="rounded px-2 py-0.5 text-[10px]"
                      style={{
                        background: "var(--color-muted)",
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
