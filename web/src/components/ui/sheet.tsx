import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  backdropDismissLabel?: string;
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function BottomSheet({
  backdropDismissLabel = "Close",
  children,
  onClose,
  open,
  title,
}: BottomSheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label={backdropDismissLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fade-in_120ms_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[85vh] w-full overflow-y-auto",
          "rounded-t-xl border-t border-border bg-background shadow-2xl",
          "animate-[dialog-in_180ms_ease-out]",
        )}
      >
        <div className="flex items-center justify-center pt-3 pb-1">
          <div
            aria-hidden
            className="h-1 w-10 rounded-full bg-muted-foreground/30"
          />
        </div>
        <div className="px-5 pb-2 pt-2 text-sm font-semibold text-foreground">
          {title}
        </div>
        <div className="px-2 pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
