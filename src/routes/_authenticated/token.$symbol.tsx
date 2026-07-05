import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/token/$symbol")({
  head: () => ({ meta: [{ title: "Token — Vixor" }] }),
  component: lazyRouteComponent(() => import("./token-symbol-component"), "TokenPage"),
});