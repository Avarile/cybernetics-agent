import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps {
  children: (active: string, setActive: (value: string) => void) => React.ReactNode;
  className?: string;
  defaultValue: string;
}

export function Tabs({ children, className, defaultValue }: TabsProps) {
  const [active, setActive] = React.useState(defaultValue);
  return <div className={cn(className)}>{children(active, setActive)}</div>;
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  value: string;
}

export function TabsTrigger({
  active,
  className,
  value: _value,
  type = "button",
  ...props
}: TabsTriggerProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        active
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/60",
        className,
      )}
      {...props}
    />
  );
}
