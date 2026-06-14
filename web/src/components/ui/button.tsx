import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        xs: "h-7 rounded-md px-2 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonHtmlProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "prefix" | "suffix"
>;

export interface ButtonProps
  extends ButtonHtmlProps,
    VariantProps<typeof buttonVariants> {
  /** Render as the destructive variant. Legacy Nous DS API. */
  destructive?: boolean;
  /** Render as the ghost variant. Legacy Nous DS API. */
  ghost?: boolean;
  /** Render as the outlined variant. Legacy Nous DS API. */
  outlined?: boolean;
  /** Inverts colors — kept for API compatibility, treated as default variant. */
  invert?: boolean;
  /** Optional leading icon/element. */
  prefix?: React.ReactNode;
  /** Optional trailing icon/element. */
  suffix?: React.ReactNode;
}

function resolveVariant(
  variant: ButtonProps["variant"],
  destructive: boolean | undefined,
  ghost: boolean | undefined,
  outlined: boolean | undefined,
): NonNullable<ButtonProps["variant"]> {
  if (variant) return variant;
  if (destructive) return "destructive";
  if (ghost) return "ghost";
  if (outlined) return "outline";
  return "default";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      destructive,
      ghost,
      outlined,
      invert: _invert,
      prefix,
      suffix,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    const resolved = resolveVariant(variant, destructive, ghost, outlined);
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant: resolved, size, className }))}
        {...props}
      >
        {prefix}
        {children}
        {suffix}
      </button>
    );
  },
);

export { buttonVariants };
