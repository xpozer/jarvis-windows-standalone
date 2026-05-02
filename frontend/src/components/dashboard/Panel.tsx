// frontend/src/components/dashboard/Panel.tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, eyebrow, description, action, footer, children, className }: PanelProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card text-card-foreground", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div className="min-w-0">
          {eyebrow ? <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p> : null}
          <h2 className="mt-1 truncate font-mono text-sm uppercase tracking-[0.14em] text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="px-4 py-4">{children}</div>
      {footer ? <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground">{footer}</footer> : null}
    </section>
  );
}
