// frontend/src/components/dashboard/DashboardShell.tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardShellProps = {
  header: ReactNode;
  leftRail?: ReactNode;
  main: ReactNode;
  rightRail?: ReactNode;
  assistantRail?: ReactNode;
  className?: string;
};

export function DashboardShell({ header, leftRail, main, rightRail, assistantRail, className }: DashboardShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      <div className="border-b border-border">{header}</div>
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 gap-3 p-3 xl:grid-cols-[280px_minmax(0,1fr)_320px] 2xl:grid-cols-[280px_minmax(0,1fr)_320px_360px]">
        {leftRail ? <aside className="min-w-0">{leftRail}</aside> : null}
        <main className="min-w-0">{main}</main>
        {rightRail ? <aside className="min-w-0">{rightRail}</aside> : null}
        {assistantRail ? <aside className="hidden min-w-0 2xl:block">{assistantRail}</aside> : null}
      </div>
    </div>
  );
}
