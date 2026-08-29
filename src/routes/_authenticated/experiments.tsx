import { createFileRoute } from "@tanstack/react-router";
import { ExperimentsPage } from "./_experiments";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({ meta: [{ title: "Experiments — Vixor" }] }),
  component: ExperimentsPage,
});
