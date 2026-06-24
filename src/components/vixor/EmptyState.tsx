import { cn } from "@/shared/utils";
import React from "react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary";
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-tertiary)",
            border: "1px solid var(--border)",
          }}
        >
          {icon}
        </div>
      )}
      <p
        className="mb-1.5 text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </p>
      {description && (
        <p
          className="mb-5 max-w-sm text-[13px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "rounded-md border px-4 py-2 text-xs font-medium transition-colors",
            "hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            "min-h-[44px]",
          )}
          style={{
            background:
              action.variant === "primary"
                ? "var(--info)"
                : "var(--surface)",
            color:
              action.variant === "primary"
                ? "var(--surface)"
                : "var(--text-primary)",
            borderColor: "var(--border)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;