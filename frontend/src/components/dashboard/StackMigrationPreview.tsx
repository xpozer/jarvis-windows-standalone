// frontend/src/components/dashboard/StackMigrationPreview.tsx
import { Activity, BrainCircuit, Database, ShieldCheck } from "lucide-react";

import { DashboardShell } from "./DashboardShell";
import { HotkeyBadge } from "./HotkeyBadge";
import { LogList } from "./LogList";
import { MetricCard } from "./MetricCard";
import { Panel } from "./Panel";
import { SparkLine } from "./SparkLine";
import { StatusDot } from "./StatusDot";

const previewLogs = [
  { id: "1", time: "08:15", source: "AuditLog", message: "Quick Capture gespeichert", status: "ok" as const },
  { id: "2", time: "08:17", source: "ToolRegistry", message: "High Risk Aktion wartet", status: "critical" as const },
  { id: "3", time: "08:21", source: "Agent", message: "ResearchAgent idle", status: "idle" as const },
];

export function StackMigrationPreview() {
  return (
    <DashboardShell
      header={<PreviewHeader />}
      leftRail={<PreviewLeftRail />}
      main={<PreviewMain />}
      rightRail={<PreviewRightRail />}
      assistantRail={<PreviewAssistantRail />}
    />
  );
}

function PreviewHeader() {
  return (
    <header className="flex h-[72px] items-center justify-between gap-4 px-5">
      <div>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-muted-foreground">JARVIS 2026 Preview</p>
        <h1 className="font-mono text-lg uppercase tracking-[0.16em]">Operational Cockpit</h1>
      </div>
      <div className="flex items-center gap-4">
        <StatusDot status="ok" label="local first" />
        <HotkeyBadge label="Command" keys={["Ctrl", "K"]} />
      </div>
    </header>
  );
}

function PreviewLeftRail() {
  return (
    <Panel title="System" eyebrow="Rail 01" description="Kernstatus als Werkzeug, nicht als Show.">
      <div className="grid gap-3">
        <MetricCard label="Health" value="OK" status="ok" icon={<ShieldCheck size={18} />} />
        <MetricCard label="Agents" value="07" status="ok" trend="2 active" icon={<BrainCircuit size={18} />} />
        <MetricCard label="Memory" value="LOCAL" status="idle" icon={<Database size={18} />} />
      </div>
    </Panel>
  );
}

function PreviewMain() {
  return (
    <Panel title="Workspace" eyebrow="Main" description="Platz fuer Karte, Tabellen, Akten oder Command Results.">
      <div className="grid min-h-[520px] gap-4 rounded-md border border-dashed border-border bg-muted/20 p-5">
        <div className="grid place-items-center text-center">
          <div className="max-w-md">
            <Activity className="mx-auto mb-4 text-muted-foreground" size={32} />
            <h2 className="font-mono text-sm uppercase tracking-[0.16em]">Migration Safe Area</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Diese Vorschau kapselt neue Komponenten parallel zur bestehenden JARVIS UI.
              Die alte Oberflaeche bleibt aktiv, bis der neue Stack stabil ist.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Task Throughput</span>
            <span className="font-mono text-xs text-muted-foreground">last 8h</span>
          </div>
          <SparkLine values={[12, 15, 14, 21, 18, 24, 27, 25, 31]} width={320} height={54} label="Task Throughput Verlauf" />
        </div>
      </div>
    </Panel>
  );
}

function PreviewRightRail() {
  return (
    <Panel title="Live Data" eyebrow="Rail 02" description="Spaeter echte REST und Websocket Daten.">
      <div className="space-y-4">
        <div className="space-y-3 font-mono text-xs text-muted-foreground">
          <p>GET /api/dashboard/metrics</p>
          <p>WS /api/dashboard/stream</p>
          <p>GET /api/agents/status</p>
          <p>GET /api/system/health</p>
        </div>
        <LogList items={previewLogs} />
      </div>
    </Panel>
  );
}

function PreviewAssistantRail() {
  return (
    <Panel title="JARVIS Sidebar" eyebrow="AI Copilot" description="KI als Beifahrer, nicht als Hauptbuehne.">
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Kontextuelle Vorschlaege kommen hier rein.</p>
        <p>High Risk Aktionen brauchen spaeter explizite Freigabe.</p>
        <HotkeyBadge label="Toggle" keys={["Ctrl", "J"]} />
      </div>
    </Panel>
  );
}
