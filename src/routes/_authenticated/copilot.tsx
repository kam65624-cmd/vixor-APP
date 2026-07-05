import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — Vixor" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    chartPair: (search.chartPair as string) || undefined,
    chartTimeframe: (search.chartTimeframe as string) || undefined,
    chartPrice: (search.chartPrice as number) || undefined,
    chartSymbol: (search.chartSymbol as string) || undefined,
  }),
  component: lazyRouteComponent(() => import("./copilot-component"), "CopilotPage"),
});