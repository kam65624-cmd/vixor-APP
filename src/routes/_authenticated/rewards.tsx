import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Vixor Terminal" }] }),
  component: RewardsPage,
});

function RewardsPage() {
  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <h1 className="text-lg font-bold">Rewards</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Earn rewards for trading, referrals, and community contributions</p>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[9px]" style={{ color: "#4A5568" }}>Your Points</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "#F59E0B" }}>12,450</div>
          <div className="text-[9px]" style={{ color: "#7B8BA8" }}>+2,340 this week</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[9px]" style={{ color: "#4A5568" }}>Rank</div>
          <div className="text-2xl font-bold">#247</div>
          <div className="text-[9px]" style={{ color: "#22C55E" }}>↑ 12 positions</div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span>📈</span>
            <span className="text-[12px] font-bold">Earn by Trading</span>
          </div>
          <p className="text-[11px]" style={{ color: "#7B8BA8" }}>Earn 1 point per $1 traded. Bonus points for profitable trades.</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span>👥</span>
            <span className="text-[12px] font-bold">Referral Program</span>
          </div>
          <p className="text-[11px]" style={{ color: "#7B8BA8" }}>Earn 500 points per referral. Extra 10% of your referrals' trading points.</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span>🎮</span>
            <span className="text-[12px] font-bold">Daily Quests</span>
          </div>
          <p className="text-[11px]" style={{ color: "#7B8BA8" }}>Complete daily quests to earn bonus points. Streak bonuses for consecutive days.</p>
        </div>
      </div>
    </div>
  );
}
