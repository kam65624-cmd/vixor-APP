import { cn } from "@/shared/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "circle" | "text" | "chart";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-white/[0.06]",
        variant === "card" && "rounded-2xl",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded-md h-4",
        variant === "chart" && "rounded-2xl",
        variant === "default" && "rounded-xl",
        className,
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border p-4 space-y-3 bg-card",
        className,
      )}
      {...props}
    >
      <div className="h-4 w-2/3 rounded-md bg-white/[0.06]" />
      <div className="h-8 w-1/2 rounded-md bg-white/[0.06]" />
      <div className="h-3 w-1/3 rounded-md bg-white/[0.06]" />
    </div>
  );
}

function SkeletonRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-3 py-3 px-4 animate-pulse", className)} {...props}>
      <div className="h-8 w-8 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 rounded-md bg-white/[0.06]" />
        <div className="h-3 w-1/5 rounded-md bg-white/[0.06]" />
      </div>
      <div className="h-4 w-16 rounded-md bg-white/[0.06] text-right" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonRow };
