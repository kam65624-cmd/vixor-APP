import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({ meta: [{ title: "Vixor Signal — Analysis Result" }] }),
  component: lazyRouteComponent(() => import("./analysis-id-component"), "AnalysisResult"),
});