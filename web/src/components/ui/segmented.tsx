import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedProps<T extends string> {
  className?: string;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: "md" | "sm";
  value: T;
}

const SIZE_CLASSES: Record<NonNullable<SegmentedProps<string>["size"]>, string> = {
  md: "h-9 text-sm px-3",
  sm: "h-8 text-xs px-2.5",
};

export function Segmented<T extends string>({
  className,
  onChange,
  options,
  size = "md",
  value,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-state={active ? "active" : "inactive"}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              SIZE_CLASSES[size],
              active
                ? "bg-background text-foreground shadow-sm"
                : "hover:bg-background/60",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterGroupProps {
  children: React.ReactNode;
  className?: string;
  label: string;
}

export function FilterGroup({ children, className, label }: FilterGroupProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
