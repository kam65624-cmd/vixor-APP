"use client";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/shared/utils";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MiniSparkline({
  data,
  color = "var(--bullish)",
  width = 80,
  height = 24,
  className,
}: MiniSparklineProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div
      className={cn("", className)}
      style={{ width, height }}
      role="img"
      aria-label={`Sparkline: ${data[0]} to ${data.at(-1)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
        >
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MiniSparkline;