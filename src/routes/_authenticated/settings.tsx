import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "./_settings";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Vixor" }] }),
  component: SettingsPage,
});
