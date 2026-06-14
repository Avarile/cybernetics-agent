import * as React from "react";
import { cn } from "@/lib/utils";

export interface ListItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "prefix"> {
  active?: boolean;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  function ListItem(
    { active, disabled, prefix, suffix, className, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-state={active ? "active" : undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/60 hover:text-accent-foreground",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        {...props}
      >
        {prefix ? <span className="shrink-0">{prefix}</span> : null}
        <span className="min-w-0 flex-1">{children}</span>
        {suffix ? <span className="shrink-0">{suffix}</span> : null}
      </div>
    );
  },
);
