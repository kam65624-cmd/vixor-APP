import { createFileRoute } from "@tanstack/react-router";
import { TradeDesk } from "./_trade-desk";

export const Route = createFileRoute("/_authenticated/trade-desk")({
  head: () => ({ meta: [{ title: "Trade Desk — Vixor" }] }),
  component: TradeDesk,
  validateSearch: (
    search: Record<string, unknown>,
  ): { symbol?: string; price?: string; direction?: string } => ({
    symbol: search.symbol as string | undefined,
    price: search.price as string | undefined,
    direction: search.direction as string | undefined,
  }),
});
