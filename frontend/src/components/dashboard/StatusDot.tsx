// frontend/src/components/dashboard/StatusDot.tsx
import { cn } from "@/lib/utils";

export type StatusTone = "ok" | "warn" | "critical" | "idle";

type StatusDotProps = {
  status: StatusTone;
  label?: string;
  className?: string;
};

const toneClass: Record<StatusTone, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  critical: "bg-red-500",
  idle: "bg-muted-foreground",
};

export function StatusDot({ status, label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em]", className)}>
      <span className={cn("h-2 w-2 rounded-full", toneClass[status])} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
