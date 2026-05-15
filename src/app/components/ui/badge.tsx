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
          "bg-[var(--badge-secondary-bg)] border-[var(--badge-secondary-border)] text-[var(--badge-secondary-text)]",
        destructive:
          "border-transparent bg-destructive text-white",
        outline:
          "bg-transparent border-[var(--badge-outline-border)] text-[var(--badge-outline-text)]",
        blue:
          "bg-[var(--color-accent-blue-soft-bg)] border-[var(--color-accent-blue-soft-border)] text-[var(--color-accent-blue)]",
        green:
          "bg-[var(--color-success-soft-bg)] border-[var(--color-success-soft-border)] text-[var(--color-accent-green)]",
        yellow:
          "bg-[var(--color-warning-soft-bg)] border-[var(--color-warning-soft-border)] text-[var(--badge-yellow-text)]",
        red:
          "bg-[var(--color-danger-soft-bg)] border-[var(--color-danger-soft-border)] text-[var(--color-brand-red)]",
        purple:
          "bg-[var(--color-accent-purple-soft-bg)] border-[var(--color-accent-purple-soft-border)] text-[var(--color-accent-purple)]",
        glass:
          "bg-[var(--badge-glass-bg)] border-[var(--badge-glass-border)] text-white",
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
  secondary: "bg-[var(--badge-secondary-text)]",
  destructive: "bg-white",
  outline: "bg-[var(--badge-outline-text)]",
  blue: "bg-[var(--color-accent-blue)]",
  green: "bg-[var(--color-accent-green)]",
  yellow: "bg-[var(--color-brand-yellow)]",
  red: "bg-[var(--color-brand-red)]",
  purple: "bg-[var(--color-accent-purple)]",
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
