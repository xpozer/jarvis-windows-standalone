import { useEffect, useMemo, useState } from "react";
import "./lifeos-panel.css";

type LifeTask = {
  title: string;
  source?: string;
  risk?: string;
  status?: string;
  next_step?: string;
  priority_score?: number;
};

type WorkItem = {
  id: string;
  title: string;
  status: string;
  risk: string;
  deadline?: string;
  next_step?: string;
  score_percent?: number;
  note?: string;
};

type LifeOSBriefing = {
  ok?: boolean;
  generated_at?: string;
  source?: { mode?: string; path?: string; loaded?: boolean; error?: string };
  daily_briefing?: {
    day_mode?: string;
    focus_minutes?: number;
    open_loops?: number;
    energy_percent?: number;
  };
  summary?: string;
  top_tasks?: LifeTask[];
  next_best_action?: string;
  work_radar?: { items?: WorkItem[]; count?: number };
  life_modules?: Array<{ name?: string; description?: string }>;
  timeline?: Array<{ time?: string; title?: string; tag?: string }>;
};

type InstallerCheck = {
  ok?: boolean;
  checks?: Record<string, { ok?: boolean; path?: string }>;
  recommendation?: string;
};

type Props = {
  onSend: (message: string) => void;
};

function sourceLabel(mode?: string) {
  if (mode === "private") return "PRIVATE JSON";
  if (mode === "example") return "EXAMPLE JSON";
  return "FALLBACK";
}

function riskClass(value?: string) {
  if (value === "high" || value === "critical") return "high";
  if (value === "medium") return "medium";
  if (value === "low") return "low";
  return "unknown";
}

export function LifeOSPanel({ onSend }: Props) {
  const [briefing, setBriefing] = useState<LifeOSBriefing | null>(null);
  const [installer, setInstaller] = useState<InstallerCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daily = briefing?.daily_briefing || {};
  const workItems = useMemo(() => briefing?.work_radar?.items || [], [briefing]);

  async function loadLifeOS(regenerate = false) {
    setLoading(true);
    setError("");
    try {
      const briefingResponse = await fetch(regenerate ? "/api/lifeos/briefing/regenerate" : "/api/lifeos/briefing", {
        method: regenerate ? "POST" : "GET",
        cache: "no-store",
      });
      const briefingData = await briefingResponse.json().catch(() => ({}));
      if (!briefingResponse.ok) throw new Error(typeof briefingData.detail === "string" ? briefingData.detail : `HTTP ${briefingResponse.status}`);
      setBriefing(briefingData as LifeOSBriefing);

      const installerResponse = await fetch("/api/lifeos/installer-check", { cache: "no-store" });
      const installerData = await installerResponse.json().catch(() => ({}));
      if (installerResponse.ok) setInstaller(installerData as InstallerCheck);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLifeOS(false);
  }, []);

  return (
    <section className="lifeos-shell">
      <div className="lifeos-header">
        <div>
          <small>LIFEOS / DAILY COMMAND</small>
          <h1>Daily Command Center</h1>
          <p>{briefing?.summary || "Tageslage wird aus lokaler LifeOS Konfiguration geladen."}</p>
        </div>
        <div className="lifeos-actions">
          <button onClick={() => void loadLifeOS(true)} disabled={loading}>{loading ? "LAEDT..." : "NEU BERECHNEN"}</button>
          <button onClick={() => onSend("Analysiere mein LifeOS Daily Command Center und nenne mir den naechsten sinnvollen Schritt.")}>IN CHAT</button>
        </div>
      </div>

      {error && <div className="lifeos-error">{error}</div>}

      <div className="lifeos-status-row">
        <span><b>{daily.day_mode || "FOCUSED"}</b> Tagesmodus</span>
        <span><b>{daily.focus_minutes ?? "N/A"}</b> Fokus-Minuten</span>
        <span><b>{daily.open_loops ?? "N/A"}</b> offene Schleifen</span>
        <span><b>{daily.energy_percent ?? "N/A"}%</b> Energie</span>
        <span className={installer?.ok ? "ok" : "warn"}><b>{installer?.ok ? "OK" : "CHECK"}</b> Setup</span>
        <span><b>{sourceLabel(briefing?.source?.mode)}</b> Datenquelle</span>
      </div>

      <div className="lifeos-grid">
        <article className="lifeos-card">
          <div className="lifeos-card-title"><h2>Top 3</h2><span>Prioritaet</span></div>
          <div className="lifeos-task-list">
            {(briefing?.top_tasks || []).map((task, index) => (
              <div key={`${task.title}-${index}`} className={`lifeos-task ${riskClass(task.risk)}`}>
                <em>{index + 1}</em>
                <div>
                  <b>{task.title}</b>
                  <span>{task.next_step || task.source || "Naechsten Schritt klaeren"}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="lifeos-card lifeos-card-wide">
          <div className="lifeos-card-title"><h2>Work Radar 2.0</h2><span>{workItems.length} Vorgaenge</span></div>
          <div className="lifeos-work-list">
            {workItems.map((item) => (
              <div key={item.id} className={`lifeos-work-item ${riskClass(item.risk)}`}>
                <div>
                  <b>{item.title}</b>
                  <span>{item.next_step || item.note || "Status pruefen"}</span>
                </div>
                <em>{item.status}</em>
                <strong>{item.risk}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="lifeos-card">
          <div className="lifeos-card-title"><h2>Next Best Action</h2><span>Heute</span></div>
          <p className="lifeos-next">{briefing?.next_best_action || "Noch keine Empfehlung geladen."}</p>
          <div className="lifeos-installer-mini">
            {Object.entries(installer?.checks || {}).map(([key, check]) => (
              <span key={key} className={check.ok ? "ok" : "warn"}>{key.replace(/_/g, " ")}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
