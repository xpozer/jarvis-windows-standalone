import { useEffect, useState, useCallback } from "react";

interface AuditEntry {
  id: string;
  ts: string;
  action: string;
  agent: string;
  tool: string | null;
  risk_level: string;
  requires_confirmation: boolean;
  confirmed: boolean | null;
  result: string | null;
  error: string | null;
  ui_page: string | null;
}

interface AuditStats {
  total: number;
  errors: number;
  by_agent: Record<string, number>;
  by_risk: Record<string, number>;
}

const RISK_COLOR: Record<string, string> = {
  low: "#00e87a",
  medium: "#ffb300",
  high: "#ff4466",
  critical: "#ff0044",
};

const API = "http://127.0.0.1:8000";

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [filterError, setFilterError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterAgent) params.set("agent", filterAgent);
      if (filterRisk)  params.set("risk_level", filterRisk);
      if (filterError) params.set("has_error", filterError);
      const [logRes, statsRes] = await Promise.all([
        fetch(`${API}/audit/log?${params}`),
        fetch(`${API}/audit/stats`),
      ]);
      if (logRes.ok)   setEntries((await logRes.json()).entries ?? []);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterAgent, filterRisk, filterError]);

  useEffect(() => { load(); }, [load]);

  function copyAll() {
    const text = entries.map(e =>
      `[${e.ts}] ${e.agent} | ${e.action}${e.tool ? " | " + e.tool : ""}${e.error ? " | ERR: " + e.error : ""}`
    ).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function exportCSV() {
    const header = "ts,agent,action,tool,risk_level,result,error";
    const rows = entries.map(e =>
      [e.ts, e.agent, e.action, e.tool ?? "", e.risk_level, e.result ?? "", e.error ?? ""]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "jarvis_audit.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const agents = stats ? Object.keys(stats.by_agent) : [];

  return (
    <div style={page}>
      <div style={header}>
        <div>
          <div style={title}>Audit Log</div>
          <div style={subtitle}>Alle Aktionen — Agent, Tool, Risiko, Ergebnis</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={load} style={btn} disabled={loading}>
            {loading ? "Lädt..." : "Aktualisieren"}
          </button>
          <button onClick={copyAll} style={btn}>{copied ? "Kopiert!" : "Kopieren"}</button>
          <button onClick={exportCSV} style={btn}>CSV Export</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={statsBar}>
          <span style={stat}>Gesamt: <b style={{ color: "#7ee7ff" }}>{stats.total}</b></span>
          <span style={stat}>Fehler: <b style={{ color: stats.errors > 0 ? "#ff4466" : "#00e87a" }}>{stats.errors}</b></span>
          {Object.entries(stats.by_risk).map(([r, c]) => (
            <span key={r} style={stat}>
              <span style={{ color: RISK_COLOR[r] ?? "#fff" }}>{r}</span>: <b>{c}</b>
            </span>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={filterRow}>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} style={sel}>
          <option value="">Alle Agenten</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={sel}>
          <option value="">Alle Risiken</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <select value={filterError} onChange={e => setFilterError(e.target.value)} style={sel}>
          <option value="">Alle</option>
          <option value="true">Nur Fehler</option>
          <option value="false">Ohne Fehler</option>
        </select>
      </div>

      {/* Tabelle */}
      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr>
              {["Zeit", "Agent", "Aktion", "Tool", "Risiko", "Ergebnis / Fehler"].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} style={{ ...td, opacity: .5, textAlign: "center" }}>Keine Einträge</td></tr>
            )}
            {entries.map(e => (
              <tr key={e.id} style={{ background: e.error ? "rgba(255,68,102,.07)" : "transparent" }}>
                <td style={{ ...td, opacity: .6, whiteSpace: "nowrap" }}>{e.ts.replace("T", " ")}</td>
                <td style={{ ...td, color: "#7ee7ff" }}>{e.agent}</td>
                <td style={td}>{e.action}</td>
                <td style={{ ...td, opacity: .7 }}>{e.tool ?? "—"}</td>
                <td style={{ ...td, color: RISK_COLOR[e.risk_level] ?? "#fff" }}>{e.risk_level}</td>
                <td style={{ ...td, color: e.error ? "#ff6680" : "#aaddcc", maxWidth: 320, wordBreak: "break-word" }}>
                  {e.error ?? e.result ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const C = { bg: "rgba(2,6,14,.0)", accent: "#00e5ff", text: "#d4e0f0", dim: "#8899aa" };
const page: React.CSSProperties  = { padding: "20px 16px", fontFamily: "Consolas, monospace", color: C.text, maxWidth: 1200 };
const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 };
const title: React.CSSProperties  = { fontSize: 20, color: C.accent, fontWeight: "bold" };
const subtitle: React.CSSProperties = { fontSize: 12, color: C.dim, marginTop: 2 };
const statsBar: React.CSSProperties = { display: "flex", gap: 16, flexWrap: "wrap", background: "rgba(0,20,40,.5)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12 };
const stat: React.CSSProperties = { color: C.dim };
const filterRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 };
const sel: React.CSSProperties  = { background: "rgba(0,20,40,.8)", color: C.text, border: "1px solid rgba(0,190,255,.25)", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" };
const btn: React.CSSProperties  = { background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.4)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 12 };
const th: React.CSSProperties    = { textAlign: "left", padding: "6px 10px", color: C.accent, borderBottom: "1px solid rgba(0,190,255,.2)", whiteSpace: "nowrap" };
const td: React.CSSProperties    = { padding: "5px 10px", borderBottom: "1px solid rgba(0,190,255,.08)", verticalAlign: "top" };
