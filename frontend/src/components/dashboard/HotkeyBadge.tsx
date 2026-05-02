// frontend/src/components/dashboard/HotkeyBadge.tsx
import { cn } from "@/lib/utils";

type HotkeyBadgeProps = {
  keys: string[];
  label?: string;
  className?: string;
};

export function HotkeyBadge({ keys, label, className }: HotkeyBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-xs text-muted-foreground", className)}>
      {label ? <span>{label}</span> : null}
      <span className="inline-flex items-center gap-1" aria-label={keys.join(" plus ")}>
        {keys.map((key) => (
          <kbd
            key={key}
            className="min-w-6 rounded border border-border bg-background px-1.5 py-0.5 text-center text-[0.68rem] uppercase text-foreground"
          >
            {key}
          </kbd>
        ))}
      </span>
    </span>
  );
}
