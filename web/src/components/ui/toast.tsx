import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastState {
  message: string;
  type: ToastType;
}

export interface ToastProps {
  toast: ToastState | null;
  className?: string;
}

const ICON: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE: Record<ToastType, string> = {
  success: "border-success/30 [&_svg]:text-[var(--color-success)]",
  error: "border-destructive/30 [&_svg]:text-[var(--color-destructive)]",
  info: "border-info/30 [&_svg]:text-[var(--color-info)]",
  warning: "border-warning/30 [&_svg]:text-[var(--color-warning)]",
};

export function Toast({ toast, className }: ToastProps) {
  if (!toast || typeof document === "undefined") return null;
  const Icon = ICON[toast.type] ?? Info;
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-lg border bg-background p-4 text-sm text-foreground shadow-lg",
        "animate-[toast-in_180ms_ease-out]",
        TONE[toast.type] ?? "",
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1">{toast.message}</span>
    </div>,
    document.body,
  );
}
