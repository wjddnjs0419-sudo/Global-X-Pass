import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex min-h-5 items-center justify-center border px-2 py-0.5 text-[11px] leading-none font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors duration-200 tracking-normal",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "bg-[rgba(100,116,139,0.12)] border-[rgba(100,116,139,0.25)] text-slate-600 dark:bg-[rgba(255,255,255,0.1)] dark:border-[rgba(255,255,255,0.35)] dark:text-slate-200",
        destructive:
          "border-transparent bg-destructive text-white",
        outline:
          "bg-transparent border-slate-200 text-slate-500 dark:border-white/25 dark:text-slate-300",
        blue:
          "bg-[rgba(67,119,241,0.08)] border-[rgba(67,119,241,0.20)] text-[#4377F1]",
        green:
          "bg-[rgba(24,163,67,0.08)] border-[rgba(24,163,67,0.20)] text-[#18A343]",
        yellow:
          "bg-[rgba(251,188,5,0.10)] border-[rgba(251,188,5,0.22)] text-[#A66F00]",
        red:
          "bg-[rgba(234,67,53,0.08)] border-[rgba(234,67,53,0.20)] text-[#EA4335]",
        purple:
          "bg-[rgba(168,85,247,0.08)] border-[rgba(168,85,247,0.20)] text-[#A855F7]",
        glass:
          "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.22)] text-white",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full px-2.5 py-0.5",
      }
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
    },
  },
);

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  showDot?: boolean;
}

const DOT_COLOR: Record<string, string> = {
  default: "bg-white",
  secondary: "bg-slate-400 dark:bg-slate-300",
  destructive: "bg-white",
  outline: "bg-slate-300 dark:bg-slate-400",
  blue: "bg-[#4377F1]",
  green: "bg-[#18A343]",
  yellow: "bg-[#FBBC05]",
  red: "bg-[#EA4335]",
  purple: "bg-[#A855F7]",
  glass: "bg-white",
};

function Badge({
  className,
  variant,
  shape,
  showDot = false,
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  const dotColorClass = DOT_COLOR[variant ?? "default"];

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, shape }), className)}
      {...props}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColorClass)} />
      )}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
