import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/token/$symbol")({
  head: () => ({ meta: [{ title: "Token — Vixor" }] }),
  component: lazyRouteComponent(() => import("./token-symbol-component"), "TokenPage"),
  validateSearch: (search) => ({
    chain: (search.chain as string) || undefined,
    price: (search.price as string) || undefined,
    change24h: (search.change24h as string) || undefined,
    name: (search.name as string) || undefined,
    dexUrl: (search.dexUrl as string) || undefined,
  }),
});
