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
  category?: string;
  status: string;
  risk: string;
  deadline?: string;
  due_state?: string;
  next_step?: string;
  score_percent?: number;
  note?: string;
  priority_score?: number;
};

type WorkRadar = {
  items?: WorkItem[];
  count?: number;
  risk_summary?: Record<string, number>;
  status_summary?: Record<string, number>;
  due_summary?: Record<string, number>;
  attention_count?: number;
  overdue_count?: number;
  next_work_action?: string;
  categories?: Array<{ name?: string; count?: number; critical?: number; open?: number }>;
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
  work_radar?: WorkRadar;
  learning_focus?: {
    ok?: boolean;
    subject?: string;
    topic?: string;
    confidence?: number;
    next_review?: string;
    error_rate?: number;
    open_cards?: number;
    recommendation?: string;
  };
  decision_layer?: {
    count?: number;
    next?: { title?: string; recommendation?: string; reason?: string; urgency?: string };
  };
  projects?: {
    count?: number;
    blocked_count?: number;
    next?: { name?: string; status?: string; risk?: string; next_step?: string; blocker?: string };
  };
  energy_profile?: {
    energy_percent?: number;
    load?: string;
    mode?: string;
    recommendation?: string;
    next_break?: string;
    focus_windows?: Array<{ from?: string; to?: string; label?: string }>;
  };
  finance_radar?: {
    count?: number;
    next?: { title?: string; category?: string; due?: string; due_state?: string; next_step?: string; proof_required?: boolean };
  };
  memory_layer?: { count?: number; recommendation?: string; recent?: Array<{ title?: string; type?: string; source?: string }> };
  automation_layer?: { count?: number; requires_confirmation?: number };
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

function workStatusLabel(value?: string) {
  const map: Record<string, string> = {
    blocked: "Blockiert",
    attention: "Achtung",
    open: "Offen",
    check: "Pruefen",
    waiting: "Wartet",
    ready: "Bereit",
    stable: "Stabil",
    done: "Erledigt",
  };
  return map[String(value || "").toLowerCase()] || value || "Unklar";
}

function dueLabel(value?: string) {
  const map: Record<string, string> = {
    overdue: "Ueberfaellig",
    today: "Heute",
    soon: "Bald",
    later: "Spaeter",
    open: "Ohne Frist",
  };
  return map[String(value || "").toLowerCase()] || "Ohne Frist";
}

export function LifeOSPanel({ onSend }: Props) {
  const [briefing, setBriefing] = useState<LifeOSBriefing | null>(null);
  const [installer, setInstaller] = useState<InstallerCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daily = briefing?.daily_briefing || {};
  const workRadar = briefing?.work_radar || {};
  const workItems = useMemo(() => workRadar.items || [], [workRadar.items]);
  const decision = briefing?.decision_layer?.next;
  const project = briefing?.projects?.next;
  const energy = briefing?.energy_profile;
  const finance = briefing?.finance_radar?.next;

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
          <div className="lifeos-work-summary">
            <span><b>{workRadar.risk_summary?.critical || 0}</b> kritisch</span>
            <span><b>{workRadar.risk_summary?.high || 0}</b> hoch</span>
            <span><b>{workRadar.status_summary?.waiting || 0}</b> wartend</span>
            <span><b>{workRadar.overdue_count || 0}</b> ueberfaellig</span>
          </div>
          {workRadar.next_work_action && <p className="lifeos-work-action">{workRadar.next_work_action}</p>}
          {!!workRadar.categories?.length && (
            <div className="lifeos-work-categories">
              {workRadar.categories.slice(0, 5).map((category) => (
                <span key={category.name}>{category.name}<b>{category.count || 0}</b></span>
              ))}
            </div>
          )}
          <div className="lifeos-work-list">
            {workItems.map((item) => (
              <div key={item.id} className={`lifeos-work-item ${riskClass(item.risk)}`}>
                <div>
                  <b><i>{item.category || "WORK"}</i>{item.title}</b>
                  <span>{item.next_step || item.note || "Status pruefen"}</span>
                </div>
                <em>{workStatusLabel(item.status)}</em>
                <small>{dueLabel(item.due_state)}</small>
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

        <article className="lifeos-card lifeos-learning-card">
          <div className="lifeos-card-title"><h2>Lernfokus</h2><span>{briefing?.learning_focus?.subject || "Coach"}</span></div>
          <div className="lifeos-learning-focus">
            <b>{briefing?.learning_focus?.topic || "Kein Lernthema gesetzt"}</b>
            <p>{briefing?.learning_focus?.recommendation || "Ergaenze learning_radar.subjects in deiner lokalen LifeOS Config."}</p>
            <div>
              <span>Sicherheit <strong>{briefing?.learning_focus?.confidence ?? "N/A"}/5</strong></span>
              <span>Karten <strong>{briefing?.learning_focus?.open_cards ?? 0}</strong></span>
              <span>Fehlerquote <strong>{Math.round((briefing?.learning_focus?.error_rate || 0) * 100)}%</strong></span>
            </div>
          </div>
        </article>

        <article className="lifeos-card lifeos-roadmap-card">
          <div className="lifeos-card-title"><h2>Decision</h2><span>{briefing?.decision_layer?.count || 0} offen</span></div>
          <b>{decision?.title || "Keine Entscheidung offen"}</b>
          <p>{decision?.recommendation || "decision_layer.decisions lokal ergaenzen."}</p>
          <small>{decision?.reason || "Empfehlung bleibt begruendet und ohne Scheinsicherheit."}</small>
        </article>

        <article className="lifeos-card lifeos-roadmap-card">
          <div className="lifeos-card-title"><h2>Projekte</h2><span>{briefing?.projects?.blocked_count || 0} blockiert</span></div>
          <b>{project?.name || "Kein Projekt gesetzt"}</b>
          <p>{project?.next_step || "projects lokal ergaenzen."}</p>
          <small>{project?.blocker ? `Blocker: ${project.blocker}` : `Status: ${project?.status || "N/A"}`}</small>
        </article>

        <article className="lifeos-card lifeos-roadmap-card">
          <div className="lifeos-card-title"><h2>Energie</h2><span>{energy?.mode || "Profil"}</span></div>
          <b>{energy?.energy_percent ?? daily.energy_percent ?? "N/A"}% / {energy?.load || "medium"}</b>
          <p>{energy?.recommendation || "energy_profile lokal ergaenzen."}</p>
          <small>{energy?.next_break ? `Naechste Pause: ${energy.next_break}` : "Keine Pause gesetzt"}</small>
        </article>

        <article className="lifeos-card lifeos-roadmap-card">
          <div className="lifeos-card-title"><h2>Finanzen</h2><span>{briefing?.finance_radar?.count || 0} Punkte</span></div>
          <b>{finance?.title || "Keine Frist gesetzt"}</b>
          <p>{finance?.next_step || "finance_radar.items lokal ergaenzen."}</p>
          <small>{finance?.due ? `${finance.category || "Frist"}: ${finance.due}` : "Nur lokale Daten verwenden"}</small>
        </article>

        <article className="lifeos-card lifeos-roadmap-card">
          <div className="lifeos-card-title"><h2>Memory</h2><span>{briefing?.memory_layer?.count || 0} Eintraege</span></div>
          <b>Lokales Wissen</b>
          <p>{briefing?.memory_layer?.recommendation || "memory_layer.entries lokal ergaenzen."}</p>
          <small>{briefing?.memory_layer?.recent?.[0]?.title || "Noch keine Regel gesetzt"}</small>
        </article>

        <article className="lifeos-card lifeos-roadmap-card">
          <div className="lifeos-card-title"><h2>Automation</h2><span>{briefing?.automation_layer?.requires_confirmation || 0} Freigaben</span></div>
          <b>{briefing?.automation_layer?.count || 0} lokale Automationen</b>
          <p>RiskLevel und Freigabe bleiben sichtbar, bevor Aktionen ausgefuehrt werden.</p>
          <small>Keine blinden Windows Aktionen.</small>
        </article>
      </div>
    </section>
  );
}
