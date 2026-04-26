import { useEffect, useState } from "react";

interface DepCheck  { name: string; ok: boolean; value: string; severity: string; fix: string | null; }
interface Finding   { severity: string; description: string; fix: string; source: string; line_no: number; raw: string; }
interface LogInfo   { name: string; size_kb: number; modified: string; }
interface PortInfo  { port: number; in_use: boolean; }

const SEV_COLOR: Record<string, string> = {
  critical: "#ff0044", high: "#ff4466", medium: "#ffb300", low: "#8899aa", info: "#6ec4ff",
};
const API = "http://127.0.0.1:8000";

export function DiagCenterPage() {
  const [deps,     setDeps]     = useState<DepCheck[]>([]);
  const [ports,    setPorts]    = useState<PortInfo[]>([]);
  const [logs,     setLogs]     = useState<LogInfo[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [logText,  setLogText]  = useState("");
  const [summary,  setSummary]  = useState("");
  const [loading,  setLoading]  = useState<string | null>(null);
  const [deepResult, setDeepResult] = useState<any>(null);

  async function runDeps() {
    setLoading("deps");
    try {
      const r = await fetch(`${API}/diagnostic/dependencies`);
      if (r.ok) { const d = await r.json(); setDeps(d.checks ?? []); }
    } catch { /* */ } finally { setLoading(null); }
  }

  async function runPorts() {
    setLoading("ports");
    try {
      const r = await fetch(`${API}/diagnostic/ports`);
      if (r.ok) { const d = await r.json(); setPorts(d.ports ?? []); }
    } catch { /* */ } finally { setLoading(null); }
  }

  async function loadLogs() {
    try {
      const r = await fetch(`${API}/diagnostic/logs/list`);
      if (r.ok) setLogs((await r.json()).logs ?? []);
    } catch { /* */ }
  }

  async function runDeepCheck() {
    setLoading("deep");
    try {
      const r = await fetch(`${API}/diagnostic/deep-check`);
      if (r.ok) {
        const d = await r.json();
        setDeepResult(d);
        setDeps(d.dependencies ?? []);
        // Alle Findings aus Log-Analyse sammeln
        const allFindings: Finding[] = [];
        for (const la of d.log_analysis ?? []) allFindings.push(...(la.findings ?? []));
        setFindings(allFindings);
        setSummary(d.summary ?? "");
      }
    } catch { /* */ } finally { setLoading(null); }
  }

  async function analyzeText() {
    if (!logText.trim()) return;
    setLoading("analyze");
    try {
      const r = await fetch(`${API}/diagnostic/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: logText, source: "Manuell eingefügt" }),
      });
      if (r.ok) {
        const d = await r.json();
        setFindings(d.findings ?? []);
        setSummary(d.summary ?? "");
      }
    } catch { /* */ } finally { setLoading(null); }
  }

  async function analyzeLogFile(name: string) {
    setLoading("logfile");
    try {
      const r = await fetch(`${API}/diagnostic/analyze-log/${encodeURIComponent(name)}`);
      if (r.ok) {
        const d = await r.json();
        setFindings(d.findings ?? []);
        setSummary(d.summary ?? "");
      }
    } catch { /* */ } finally { setLoading(null); }
  }

  async function createDiagZip() {
    setLoading("zip");
    try {
      await fetch(`${API}/diagnostics`, { method: "POST" });
    } catch { /* */ } finally { setLoading(null); }
  }

  async function createBackup() {
    setLoading("backup");
    try {
      await fetch(`${API}/backup/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "diag-center" }),
      });
    } catch { /* */ } finally { setLoading(null); }
  }

  useEffect(() => { runDeps(); runPorts(); loadLogs(); }, []);

  const failures = deps.filter(d => !d.ok);
  const criticalFindings = findings.filter(f => f.severity === "critical" || f.severity === "high");

  return (
    <div style={page}>
      <div style={hdr}>
        <div>
          <div style={ttl}>Diagnose Center</div>
          <div style={sub}>System-Status, Fehleranalyse, Fix-Vorschläge</div>
        </div>
      </div>

      {/* Aktions-Buttons */}
      <div style={btnRow}>
        {[
          ["Self Check",    () => runDeps(),      "deps"],
          ["Deep Check",    () => runDeepCheck(),  "deep"],
          ["Ports prüfen",  () => runPorts(),      "ports"],
          ["Diagnose ZIP",  () => createDiagZip(), "zip"],
          ["Backup",        () => createBackup(),  "backup"],
        ].map(([label, fn, key]) => (
          <button key={key as string} onClick={fn as any}
            style={{ ...btn, opacity: loading === key ? .6 : 1 }}
            disabled={loading === key as string}>
            {loading === key ? "..." : label as string}
          </button>
        ))}
      </div>

      {/* Summary */}
      {summary && (
        <div style={{
          ...panel,
          borderColor: deepResult?.ok === false ? "rgba(255,68,102,.4)" : "rgba(0,232,122,.3)",
          marginBottom: 16,
        }}>
          <span style={{ color: deepResult?.ok === false ? "#ff6680" : "#00e87a" }}>
            {deepResult?.ok === false ? "⚠ " : "✓ "}
          </span>
          {summary}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Abhängigkeiten */}
        <div style={panel}>
          <div style={panelTitle}>Abhängigkeiten</div>
          {deps.length === 0 && <div style={dim}>Noch nicht geprüft — Self Check ausführen</div>}
          {deps.map(d => (
            <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid rgba(0,190,255,.07)" }}>
              <div>
                <span style={{ color: d.ok ? "#00e87a" : "#ff4466", marginRight: 6 }}>{d.ok ? "✓" : "✗"}</span>
                <span style={{ fontSize: 12 }}>{d.name}</span>
                {!d.ok && d.fix && <div style={{ fontSize: 10, color: "#ffb300", marginTop: 2, marginLeft: 18 }}>→ {d.fix}</div>}
              </div>
              <span style={{ fontSize: 11, color: "#6ec4ff", opacity: .8 }}>{d.value}</span>
            </div>
          ))}
        </div>

        {/* Ports */}
        <div style={panel}>
          <div style={panelTitle}>Ports</div>
          {ports.length === 0 && <div style={dim}>Noch nicht geprüft</div>}
          {[
            { port: 8000,  label: "Backend FastAPI" },
            { port: 11434, label: "Ollama" },
            { port: 5173,  label: "Frontend Dev" },
            { port: 3000,  label: "Dev Alt" },
          ].map(({ port, label }) => {
            const p = ports.find(x => x.port === port);
            return (
              <div key={port} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(0,190,255,.07)", fontSize: 12 }}>
                <span>{label} <span style={{ color: "#8899aa" }}>:{port}</span></span>
                <span style={{ color: p ? (p.in_use ? "#00e87a" : "#8899aa") : "#555" }}>
                  {p ? (p.in_use ? "erreichbar" : "nicht erreichbar") : "—"}
                </span>
              </div>
            );
          })}

          {/* Log-Dateien */}
          <div style={{ ...panelTitle, marginTop: 16 }}>Log-Dateien</div>
          {logs.length === 0 && <div style={dim}>Keine Logs vorhanden</div>}
          {logs.map(l => (
            <div key={l.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(0,190,255,.07)" }}>
              <span style={{ fontSize: 11 }}>{l.name}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#8899aa" }}>{l.size_kb} KB</span>
                <button onClick={() => analyzeLogFile(l.name)} style={smallBtn} disabled={loading === "logfile"}>
                  analysieren
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manuelle Log-Analyse */}
      <div style={{ ...panel, marginTop: 16 }}>
        <div style={panelTitle}>Log-Text analysieren</div>
        <div style={dim}>Fehlertext, Stacktrace oder Log-Ausschnitt hier einfügen:</div>
        <textarea
          value={logText}
          onChange={e => setLogText(e.target.value)}
          placeholder="Traceback, npm ERR!, PowerShell Fehler, ..."
          style={textarea}
          rows={5}
        />
        <button onClick={analyzeText} style={btn} disabled={!logText.trim() || loading === "analyze"}>
          {loading === "analyze" ? "Analysiert..." : "Analysieren"}
        </button>
      </div>

      {/* Befunde */}
      {findings.length > 0 && (
        <div style={{ ...panel, marginTop: 16 }}>
          <div style={panelTitle}>
            Befunde
            {criticalFindings.length > 0 && (
              <span style={{ marginLeft: 8, color: "#ff4466", fontSize: 11 }}>
                {criticalFindings.length} kritisch/hoch
              </span>
            )}
          </div>
          {findings.map((f, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(0,190,255,.07)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: "bold", color: SEV_COLOR[f.severity] ?? "#fff",
                  background: "rgba(0,0,0,.3)", borderRadius: 4, padding: "1px 6px" }}>
                  {f.severity.toUpperCase()}
                </span>
                <span style={{ fontSize: 12 }}>{f.description}</span>
                {f.line_no > 0 && <span style={{ fontSize: 10, color: "#8899aa" }}>Zeile {f.line_no}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#ffb300", marginBottom: f.raw ? 3 : 0 }}>
                → {f.fix}
              </div>
              {f.raw && (
                <div style={{ fontSize: 10, color: "#6ec4ff", opacity: .7, fontFamily: "Courier, monospace",
                  background: "rgba(0,0,0,.3)", borderRadius: 4, padding: "3px 6px", marginTop: 2 }}>
                  {f.raw}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alte Pfade aus Deep Check */}
      {deepResult?.old_paths?.length > 0 && (
        <div style={{ ...panel, marginTop: 12, borderColor: "rgba(255,68,102,.3)" }}>
          <div style={{ ...panelTitle, color: "#ff6680" }}>Alte Pfade gefunden</div>
          {deepResult.old_paths.map((p: any, i: number) => (
            <div key={i} style={{ fontSize: 12, padding: "4px 0" }}>
              <span style={{ color: "#ff6680" }}>{p.file}</span>: {p.pattern}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const page: React.CSSProperties  = { padding: "20px 16px", fontFamily: "Consolas, monospace", color: "#d4e0f0", maxWidth: 1200 };
const hdr: React.CSSProperties   = { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 };
const ttl: React.CSSProperties   = { fontSize: 20, color: "#00e5ff", fontWeight: "bold" };
const sub: React.CSSProperties   = { fontSize: 12, color: "#8899aa", marginTop: 2 };
const btnRow: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 };
const btn: React.CSSProperties   = { background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.4)", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12 };
const smallBtn: React.CSSProperties = { ...btn, padding: "3px 8px", fontSize: 10 };
const panel: React.CSSProperties = { background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.18)", borderRadius: 10, padding: "14px 16px" };
const panelTitle: React.CSSProperties = { fontSize: 12, color: "#00e5ff", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 };
const dim: React.CSSProperties   = { fontSize: 11, color: "#8899aa", marginBottom: 8 };
const textarea: React.CSSProperties = { width: "100%", background: "rgba(0,0,0,.4)", color: "#d4e0f0", border: "1px solid rgba(0,190,255,.2)", borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "Courier, monospace", resize: "vertical", marginBottom: 10, boxSizing: "border-box" };
