// frontend/src/routes/StackPagePlaceholder.tsx
import { HotkeyBadge } from "@/components/dashboard/HotkeyBadge";
import { LogList } from "@/components/dashboard/LogList";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { SparkLine } from "@/components/dashboard/SparkLine";
import type { DashboardPage } from "./pageRegistry";

export function StackPagePlaceholder({ page }: { page: DashboardPage }) {
  return (
    <div className="grid gap-3">
      <Panel title={page.title} eyebrow={page.group} description={page.description}>
        <div className="grid gap-4 lg:grid-cols-3">
          <MetricCard label="Status" value="SLOT" status="idle" trend="ready for migration" />
          <MetricCard label="Data" value="API" status="warn" trend="connect later" />
          <MetricCard label="UX" value="2026" status="ok" trend="keyboard first" />
        </div>
      </Panel>
      <Panel
        title="Page Contract"
        eyebrow="Routing"
        description="Dieser Slot ist bewusst leer und wartet auf echte Daten, Komponenten und Tastatur Workflows."
        action={<HotkeyBadge label="Command" keys={["Ctrl", "K"]} />}
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Route: <span className="font-mono text-foreground">{page.path}</span>
            </p>
            <div className="mt-4">
              <SparkLine values={[8, 10, 9, 14, 13, 16, 18, 17]} label={`${page.title} Preview Verlauf`} />
            </div>
          </div>
          <LogList
            items={[
              { id: `${page.id}-1`, time: "now", source: "Router", message: `${page.title} Slot geladen`, status: "ok" },
              { id: `${page.id}-2`, time: "next", source: "Migration", message: "Echte Komponenten folgen", status: "idle" },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}
