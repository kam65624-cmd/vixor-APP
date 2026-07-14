/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const cardVariants = cva("relative overflow-hidden border transition-all", {
  variants: {
    variant: {
      /** Default solid card — surface-1 bg, hairline border */
      default: "bg-card border-border rounded-2xl",
      /** Elevated card — hover lift + shadow */
      elevated:
        "bg-card border-border rounded-2xl hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] hover:border-border-hover cursor-pointer",
      /** Glass card — blurred translucent surface */
      glass:
        "bg-white/[0.04] backdrop-blur-[20px] border-white/[0.08] rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
      /** Accent-left — primary color left border */
      accent: "bg-card border-border rounded-2xl border-l-2 border-l-primary",
      /** Interactive — press feedback for clickable cards */
      interactive:
        "bg-card border-border rounded-2xl active:scale-[0.985] active:transition-[transform_100ms] cursor-pointer hover:bg-card-hover hover:border-border-hover",
      /** Terminal — minimal data display card */
      terminal: "bg-card border-border rounded-2xl",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
      xl: "p-6",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, padding }), className)} {...props} />
  ),
);
Card.displayName = "Card";

/** Card header — flex row with title + optional action */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between gap-2 mb-3", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

/** Card title — section heading */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

/** Card content area */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
);
CardContent.displayName = "CardContent";

/** Premium gradient overlay (subtle top-left light) */
function CardGradientOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.02] to-transparent"
      aria-hidden="true"
    />
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardGradientOverlay, cardVariants };
