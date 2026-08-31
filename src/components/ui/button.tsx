/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96] active:transition-[transform_100ms]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-primary-glow text-white shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] hover:brightness-110 rounded-xl",
        destructive:
          "bg-gradient-to-br from-bearish to-red-600 text-white shadow-[0_4px_16px_rgba(251,70,103,0.25)] hover:shadow-[0_6px_24px_rgba(251,70,103,0.35)] hover:brightness-110 rounded-xl",
        bullish:
          "bg-gradient-to-br from-bullish to-emerald-500 text-[var(--buy-text)] shadow-[0_4px_16px_rgba(34,211,166,0.25)] hover:shadow-[0_6px_24px_rgba(34,211,166,0.35)] hover:brightness-110 rounded-xl",
        outline:
          "border border-border bg-transparent hover:bg-card-hover hover:border-border-hover rounded-xl",
        secondary:
          "bg-card text-foreground border border-border hover:bg-card-hover hover:border-border-hover rounded-xl",
        ghost: "bg-transparent hover:bg-card-hover rounded-xl",
        link: "text-primary underline-offset-4 hover:underline rounded-md",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-[15px] rounded-2xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
