import { createFileRoute } from "@tanstack/react-router";
import { RadarPage, getRadarBlips } from "./_radar";

export const Route = createFileRoute("/_authenticated/radar")({
  head: () => ({ meta: [{ title: "Trade Radar — Vixor" }] }),
  component: RadarPage,
});

export { getRadarBlips };
