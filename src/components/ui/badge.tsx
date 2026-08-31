/* eslint-disable react-refresh/only-export-components */
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.04em] leading-[1.4] transition-colors",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-primary/15 text-primary",
        bullish: "border border-bullish/20 bg-bullish/10 text-bullish",
        bearish: "border border-bearish/20 bg-bearish/10 text-bearish",
        wait: "border border-neutral-wait/20 bg-neutral-wait/10 text-neutral-wait",
        secondary: "border border-transparent bg-card text-muted-foreground",
        destructive: "border border-bearish/20 bg-bearish/10 text-bearish",
        outline: "border border-border text-muted-foreground",
        gold: "border border-gold/30 bg-gold/10 text-gold",
        muted: "border border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
