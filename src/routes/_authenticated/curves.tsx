import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/curves")({
  head: () => ({ meta: [{ title: "Virtual Curve — Vixor Terminal" }] }),
  component: CurvesPage,
});

function CurvesPage() {
  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h1 className="text-lg font-bold">Virtual Curve</h1>
          <span className="text-[9px] px-1.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>COMING SOON</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Bonding curve analysis for new token launches</p>
      </div>
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 140px)" }}>
        <div className="text-center">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-sm font-bold mb-1">Virtual Curve Monitor</p>
          <p className="text-[11px]" style={{ color: "#7B8BA8" }}>Monitor bonding curves for new pump.fun launches.<br/>Find early entries before tokens hit Raydium.</p>
          <p className="text-[10px] mt-4" style={{ color: "#4A5568" }}>Coming in Phase 3 — Stay tuned!</p>
        </div>
      </div>
    </div>
  );
}
