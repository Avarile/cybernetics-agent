import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyTag =
  | "p"
  | "span"
  | "div"
  | "small"
  | "strong"
  | "em"
  | "label"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: TypographyTag;
  /** Legacy Nous DS prop — picks a heading-like size. */
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "muted";
  /** Legacy Nous DS prop — Mondwest font; ignored in the shadcn theme. */
  mondwest?: boolean;
}

const VARIANT_CLASS: Record<NonNullable<TypographyProps["variant"]>, string> = {
  h1: "text-3xl font-bold tracking-tight",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-semibold tracking-tight",
  h4: "text-lg font-semibold tracking-tight",
  body: "text-sm leading-relaxed",
  small: "text-xs",
  muted: "text-sm text-muted-foreground",
};

const VARIANT_TAG: Partial<Record<NonNullable<TypographyProps["variant"]>, TypographyTag>> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
};

export function Typography({
  as,
  variant,
  mondwest: _mondwest,
  className,
  children,
  ...props
}: TypographyProps) {
  const Tag: TypographyTag = as ?? (variant && VARIANT_TAG[variant]) ?? "p";
  const variantClass = variant ? VARIANT_CLASS[variant] : "text-sm leading-relaxed";
  return React.createElement(
    Tag,
    {
      ...props,
      className: cn("text-foreground", variantClass, className),
    },
    children,
  );
}

export function H1({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { variant?: string; mondwest?: boolean }) {
  const { variant: _v, mondwest: _m, ...rest } = props;
  return (
    <h1
      className={cn(
        "scroll-m-20 text-3xl font-bold tracking-tight text-foreground",
        className,
      )}
      {...rest}
    />
  );
}

export function H2({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { variant?: string; mondwest?: boolean }) {
  const { variant: _v, mondwest: _m, ...rest } = props;
  return (
    <h2
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...rest}
    />
  );
}

export function H3({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { variant?: string; mondwest?: boolean }) {
  const { variant: _v, mondwest: _m, ...rest } = props;
  return (
    <h3
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...rest}
    />
  );
}

export function H4({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { variant?: string; mondwest?: boolean }) {
  const { variant: _v, mondwest: _m, ...rest } = props;
  return (
    <h4
      className={cn(
        "scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
      {...rest}
    />
  );
}
