import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  /** Shadcn-style. Text to copy. */
  value?: string;
  /** Nous DS alias of `value`. */
  text?: string;
  className?: string;
  size?: "sm" | "default" | "icon" | "xs";
  ariaLabel?: string;
  /** Visible label rendered alongside the icon when provided. */
  label?: React.ReactNode;
  /** Visible label shown briefly after a successful copy. */
  copiedLabel?: React.ReactNode;
}

export function CopyButton({
  value,
  text,
  className,
  size,
  ariaLabel = "Copy",
  label,
  copiedLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const payload = value ?? text ?? "";
  const hasLabel = label !== undefined;

  async function onClick() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard refused — no-op
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size ?? (hasLabel ? "sm" : "icon")}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(className)}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      {hasLabel ? (
        <span className="ml-1">{copied && copiedLabel ? copiedLabel : label}</span>
      ) : null}
    </Button>
  );
}
