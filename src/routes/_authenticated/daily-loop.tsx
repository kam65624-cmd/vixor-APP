import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/daily-loop")({
  head: () => ({ meta: [{ title: "Daily Loop — Vixor" }] }),
  component: lazyRouteComponent(() => import("./daily-loop-component"), "DailyLoopPage"),
});
