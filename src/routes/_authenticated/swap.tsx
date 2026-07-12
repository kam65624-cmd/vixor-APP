import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/swap")({
  component: lazyRouteComponent(() => import("./-swap-component"), "SwapPage"),
});
