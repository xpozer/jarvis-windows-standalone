// frontend/src/components/dashboard/LogList.tsx
import { cn } from "@/lib/utils";
import { StatusDot, type StatusTone } from "./StatusDot";

export type LogListItem = {
  id: string;
  time: string;
  source: string;
  message: string;
  status?: StatusTone;
};

type LogListProps = {
  items: LogListItem[];
  emptyText?: string;
  className?: string;
};

export function LogList({ items, emptyText = "Keine Logs vorhanden.", className }: LogListProps) {
  if (!items.length) {
    return <div className={cn("rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground", className)}>{emptyText}</div>;
  }

  return (
    <ol className={cn("divide-y divide-border overflow-hidden rounded-md border border-border", className)} aria-label="Log Eintraege">
      {items.map((item) => (
        <li key={item.id} className="grid grid-cols-[88px_120px_minmax(0,1fr)] gap-3 bg-background px-3 py-2 font-mono text-xs">
          <time className="text-muted-foreground">{item.time}</time>
          <span className="truncate text-muted-foreground">{item.source}</span>
          <span className="flex min-w-0 items-center gap-2">
            <StatusDot status={item.status ?? "idle"} />
            <span className="truncate text-foreground">{item.message}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
