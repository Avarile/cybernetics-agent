import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "type" | "role" | "value" | "children"
  > {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  function Checkbox(
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      className,
      onClick,
      ...rest
    },
    ref,
  ) {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const value = isControlled ? checked : internal;

    function toggle(e: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (disabled) return;
      const next = !value;
      if (!isControlled) setInternal(next);
      onCheckedChange?.(next);
    }

    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={value}
        data-state={value ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          value
            ? "bg-primary text-primary-foreground"
            : "bg-background",
          className,
        )}
        {...rest}
      >
        {value ? <Check className="h-3 w-3" aria-hidden /> : null}
      </button>
    );
  },
);
