// frontend/src/components/dashboard/MetricCard.tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "./StatusDot";

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  status?: StatusTone;
  trend?: string;
  icon?: ReactNode;
  className?: string;
};

export function MetricCard({ label, value, unit, status = "idle", trend, icon, className }: MetricCardProps) {
  return (
    <article className={cn("rounded-md border border-border bg-background px-4 py-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <strong className="font-mono text-2xl leading-none text-foreground">{value}</strong>
            {unit ? <span className="font-mono text-xs uppercase text-muted-foreground">{unit}</span> : null}
          </div>
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusDot status={status} label={status} />
        {trend ? <span className="font-mono text-xs text-muted-foreground">{trend}</span> : null}
      </div>
    </article>
  );
}
