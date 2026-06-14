import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

export interface CommandBlockProps {
  /** Monospace code to display. */
  code: string;
  /** Label shown above the code. */
  label: string;
  className?: string;
}

export function CommandBlock({ code, label, className }: CommandBlockProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-muted/40 p-3 text-sm",
        className,
      )}
    >
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate font-mono text-foreground">
          {code}
        </code>
        <CopyButton value={code} ariaLabel={`Copy ${label}`} />
      </div>
    </div>
  );
}
