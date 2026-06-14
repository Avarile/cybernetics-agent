import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-success/15 [color:var(--color-success)]",
        warning:
          "border-transparent bg-warning/15 [color:var(--color-warning)]",
        info: "border-transparent bg-info/15 [color:var(--color-info)]",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Legacy Nous DS prop — aliased to `variant`. */
  tone?: BadgeVariant | string;
}

const ALLOWED_TONES: BadgeVariant[] = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "success",
  "warning",
  "info",
  "muted",
];

function resolveTone(
  variant: BadgeProps["variant"],
  tone: BadgeProps["tone"],
): BadgeVariant {
  if (variant) return variant;
  if (tone === "error") return "destructive";
  if (tone === "neutral") return "muted";
  if (typeof tone === "string") {
    if ((ALLOWED_TONES as string[]).includes(tone)) return tone as BadgeVariant;
  }
  return "default";
}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const resolved = resolveTone(variant, tone);
  return (
    <span
      className={cn(badgeVariants({ variant: resolved }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
