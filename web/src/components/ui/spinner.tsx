import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "size"> {
  size?: "xs" | "sm" | "default" | "lg" | number;
}

const SIZE_MAP: Record<string, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-6 w-6",
};

export function Spinner({ size = "default", className, ...props }: SpinnerProps) {
  const sizeClass =
    typeof size === "number" ? undefined : (SIZE_MAP[size] ?? SIZE_MAP.default);
  const style =
    typeof size === "number"
      ? { width: size, height: size, ...props.style }
      : props.style;
  return (
    <Loader2
      aria-label="Loading"
      role="status"
      className={cn("animate-spin", sizeClass, className)}
      style={style}
      {...props}
    />
  );
}
