import { createFileRoute } from "@tanstack/react-router";
import { Analyze } from "./_analyze-page";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({ meta: [{ title: "Analyze — Vixor" }] }),
  component: Analyze,
  validateSearch: (search: Record<string, unknown>) => ({
    screenshot: (search.screenshot as string) || undefined,
    pair: (search.pair as string) || undefined,
  }),
});
