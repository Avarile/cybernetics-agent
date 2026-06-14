import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatItem {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

export interface StatsProps {
  items: StatItem[];
  className?: string;
}

export function Stats({ items, className }: StatsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {item.value}
          </div>
          {item.hint ? (
            <div className="mt-1 text-xs text-muted-foreground">
              {item.hint}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
