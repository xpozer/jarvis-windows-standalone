import { useEffect, useMemo, useState } from "react";
import "./diagnostics-panel.css";

type CheckStatus = "idle" | "loading" | "ok" | "warn" | "error";

type ResultItem = {
  key: string;
  title: string;
  endpoint: string;
  status: CheckStatus;
  data?: unknown;
  error?: string;
};

type Props = {
  onSend: (message: string) => void;
};

const checks: Omit<ResultItem, "status">[] = [
  { key: "self", title: "Backend Self Check", endpoint: "/self-check" },
  { key: "chat", title: "Ollama / LLM", endpoint: "/api/chat/health" },
  { key: "metrics", title: "System Metrics", endpoint: "/system/metrics" },
  { key: "ports", title: "Ports", endpoint: "/diagnostic/ports" },
  { key: "deps", title: "Dependencies", endpoint: "/diagnostic/dependencies" },
  { key: "logs", title: "Logs", endpoint: "/diagnostic/logs/list" },
  { key: "deep", title: "Deep Status", endpoint: "/deep/status" },
  { key: "repair", title: "Repair Plan", endpoint: "/deep/repair-plan" },
];

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function inferStatus(data: unknown): CheckStatus {
  if (!data || typeof data !== "object") return "ok";
  const text = pretty(data).toLowerCase();
  if (text.includes('"ok": false') || text.includes('"status": "error"') || text.includes("failed") || text.includes("fehler")) return "error";
  if (text.includes("warn") || text.includes("missing") || text.includes("nicht erreichbar") || text.includes("unbekannt")) return "warn";
  return "ok";
}

function statusLabel(status: CheckStatus) {
  if (status === "loading") return "Prüft";
  if (status === "ok") return "OK";
  if (status === "warn") return "Warnung";
  if (status === "error") return "Fehler";
  return "Bereit";
}

function shortSummary(item: ResultItem) {
  if (item.status === "loading") return "Diagnose läuft...";
  if (item.error) return item.error;
  const data = item.data;
  if (!data) return "Noch nicht geprüft";
  if (item.key === "chat" && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return `Ollama: ${obj.ok ? "erreichbar" : "nicht erreichbar"} · Modell: ${obj.model || "unbekannt"}`;
  }
  if (item.key === "metrics" && typeof data === "object") {
    const obj = data as Record<string, any>;
    return `CPU ${obj.cpu?.percent ?? "N/A"}% · RAM ${obj.memory?.percent ?? "N/A"}% · Temp ${obj.temperature?.celsius ?? "N/A"}°C`;
  }
  if (item.key === "logs" && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const logs = Array.isArray(obj.logs) ? obj.logs.length : Array.isArray(obj.items) ? obj.items.length : 0;
    return `${logs} Logs gefunden`;
  }
  if (typeof data === "object") return `${Object.keys(data as Record<string, unknown>).length} Felder geprüft`;
  return String(data).slice(0, 160);
}

async function fetchJson(endpoint: string) {
  const response = await fetch(endpoint, { cache: "no-store" });
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) throw new Error(typeof data === "string" ? data : pretty(data));
  return data;
}

export function DiagnosticsPanel({ onSend }: Props) {
  const [items, setItems] = useState<ResultItem[]>(checks.map((check) => ({ ...check, status: "idle" })));
  const [selected, setSelected] = useState<string>("self");

  const selectedItem = useMemo(() => items.find((item) => item.key === selected) || items[0], [items, selected]);
  const totals = useMemo(() => ({
    ok: items.filter((item) => item.status === "ok").length,
    warn: items.filter((item) => item.status === "warn").length,
    error: items.filter((item) => item.status === "error").length,
    loading: items.filter((item) => item.status === "loading").length,
  }), [items]);

  async function runOne(key: string) {
    const check = checks.find((item) => item.key === key);
    if (!check) return;
    setItems((prev) => prev.map((item) => item.key === key ? { ...item, status: "loading", error: undefined } : item));
    try {
      const data = await fetchJson(check.endpoint);
      setItems((prev) => prev.map((item) => item.key === key ? { ...item, status: inferStatus(data), data } : item));
    } catch (error) {
      setItems((prev) => prev.map((item) => item.key === key ? { ...item, status: "error", error: error instanceof Error ? error.message : String(error) } : item));
    }
  }

  async function runAll() {
    for (const check of checks) {
      await runOne(check.key);
    }
  }

  useEffect(() => {
    void runAll();
  }, []);

  return (
    <section className="jv-diagnostics-shell">
      <div className="jv-diagnostics-header">
        <div>
          <small>System Diagnostics</small>
          <h1>JARVIS Diagnose</h1>
          <p>Prüft Backend, LLM, Ports, Logs, Dependencies und Repair Plan als klare Statuskarten.</p>
        </div>
        <div className="jv-diagnostics-actions">
          <button onClick={runAll}>KOMPLETT PRÜFEN</button>
          <button onClick={() => onSend("Erstelle mir aus der aktuellen Diagnose einen konkreten Reparaturplan")}>REPARATURPLAN IM CHAT</button>
        </div>
      </div>

      <div className="jv-diagnostics-summary">
        <div className="ok"><b>{totals.ok}</b><span>OK</span></div>
        <div className="warn"><b>{totals.warn}</b><span>Warnung</span></div>
        <div className="error"><b>{totals.error}</b><span>Fehler</span></div>
        <div className="loading"><b>{totals.loading}</b><span>Läuft</span></div>
      </div>

      <div className="jv-diagnostics-grid">
        <div className="jv-check-list">
          {items.map((item) => (
            <button key={item.key} className={`jv-check-card ${item.status} ${selected === item.key ? "active" : ""}`} onClick={() => setSelected(item.key)}>
              <div><b>{item.title}</b><span>{item.endpoint}</span></div>
              <em>{statusLabel(item.status)}</em>
              <p>{shortSummary(item)}</p>
              <strong onClick={(event) => { event.stopPropagation(); void runOne(item.key); }}>Neu prüfen</strong>
            </button>
          ))}
        </div>

        <div className="jv-diagnostics-detail">
          <div className="jv-detail-title">
            <div><h2>{selectedItem.title}</h2><span>{selectedItem.endpoint}</span></div>
            <button onClick={() => runOne(selectedItem.key)}>AKTUALISIEREN</button>
          </div>
          <pre>{selectedItem.error || pretty(selectedItem.data) || "Noch kein Ergebnis vorhanden."}</pre>
        </div>
      </div>
    </section>
  );
}
