import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOptionProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
}

// Marker component — never rendered. The parent Select picks these out of
// its children and emits real <option> elements.
export function SelectOption(_props: SelectOptionProps): null {
  return null;
}
SelectOption.__isSelectOption = true;

export interface SelectProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  value?: string;
  name?: string;
}

function collectOptions(children: React.ReactNode): SelectOptionProps[] {
  const out: SelectOptionProps[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type as { __isSelectOption?: boolean } | string;
    if (typeof type === "object" && type && "__isSelectOption" in type) {
      out.push(child.props as SelectOptionProps);
    }
  });
  return out;
}

export function Select({
  children,
  className,
  disabled,
  id,
  onValueChange,
  placeholder,
  style,
  value,
  name,
}: SelectProps) {
  const options = collectOptions(children);
  const showPlaceholder = placeholder !== undefined;
  return (
    <div className={cn("relative", className)} style={style}>
      <select
        id={id}
        name={name}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.currentTarget.value)}
        className={cn(
          "flex h-9 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {showPlaceholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {typeof opt.children === "string" || typeof opt.children === "number"
              ? opt.children
              : String(opt.children ?? opt.value)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
