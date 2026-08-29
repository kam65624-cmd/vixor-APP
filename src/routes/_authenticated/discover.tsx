import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "./_discover";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: DiscoverPage,
  validateSearch: (search) => ({
    category: (search.category as string) || "ALL",
    sortBy: (search.sortBy as string) || "trending",
    search: (search.search as string) || "",
    minLiquidity: search.minLiquidity as string | undefined,
    minVolume: search.minVolume as string | undefined,
    honeypotOnly: search.honeypotOnly === "true",
    smartMoneyMin: search.smartMoneyMin as string | undefined,
  }),
});
