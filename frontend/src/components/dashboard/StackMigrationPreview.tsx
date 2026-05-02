// frontend/src/components/dashboard/StackMigrationPreview.tsx
import { Activity, BrainCircuit, Database, ShieldCheck } from "lucide-react";

import { DashboardShell } from "./DashboardShell";
import { MetricCard } from "./MetricCard";
import { Panel } from "./Panel";
import { StatusDot } from "./StatusDot";

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
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Ctrl K Command</span>
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
      <div className="grid min-h-[520px] place-items-center rounded-md border border-dashed border-border bg-muted/20">
        <div className="max-w-md text-center">
          <Activity className="mx-auto mb-4 text-muted-foreground" size={32} />
          <h2 className="font-mono text-sm uppercase tracking-[0.16em]">Migration Safe Area</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Diese Vorschau kapselt neue Komponenten parallel zur bestehenden JARVIS UI.
            Die alte Oberflaeche bleibt aktiv, bis der neue Stack stabil ist.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function PreviewRightRail() {
  return (
    <Panel title="Live Data" eyebrow="Rail 02" description="Spaeter echte REST und Websocket Daten.">
      <div className="space-y-3 font-mono text-xs text-muted-foreground">
        <p>GET /api/dashboard/metrics</p>
        <p>WS /api/dashboard/stream</p>
        <p>GET /api/agents/status</p>
        <p>GET /api/system/health</p>
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
      </div>
    </Panel>
  );
}
