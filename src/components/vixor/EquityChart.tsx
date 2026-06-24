"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/shared/utils";

interface EquityPoint {
  day: number | string;
  equity: number;
  pnl?: number;
}

interface EquityChartProps {
  data: EquityPoint[];
  height?: number;
  showAxis?: boolean;
  className?: string;
}

export function EquityChart({
  data,
  height = 240,
  showAxis = true,
  className,
}: EquityChartProps) {
  if (!data || data.length === 0) return null;

  const isUp = (data.at(-1)?.equity ?? 0) >= (data[0]?.equity ?? 0);
  const color = isUp ? "var(--bullish)" : "var(--bearish)";
  const startEquity = data[0]?.equity ?? 0;

  return (
    <div
      className={cn("w-full", className)}
      style={{ height }}
      role="img"
      aria-label={`Equity chart: ${data[0]?.equity} to ${data.at(-1)?.equity}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && (
            <>
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                axisLine={{ stroke: "var(--border, rgba(255,255,255,0.06))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={50}
                domain={["auto", "auto"]}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border, rgba(255,255,255,0.06))",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-primary)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          <ReferenceLine
            y={startEquity}
            stroke="var(--border, rgba(255,255,255,0.1))"
            strokeDasharray="3 3"
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#equityGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EquityChart;