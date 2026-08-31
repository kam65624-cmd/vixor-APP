import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getUserPoints } from "@/shared/data";

// ── Points Badge ───────────────────────────────────────────────────────────

export const PointsBadge = memo(function PointsBadge() {
  const { data } = useQuery({
    queryKey: ["user-points-nav"],
    queryFn: () => getUserPoints({}),
    staleTime: 30_000,
    retry: 2,
  });
  const balance = data?.balance ?? 0;

  return (
    <Link
      to="/rewards"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-mono font-bold"
      style={{
        color: "var(--color-primary)",
        background: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)",
        textDecoration: "none",
        minWidth: "44px",
        minHeight: "44px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: "12px" }}>⚡</span>
      {balance}
    </Link>
  );
});
