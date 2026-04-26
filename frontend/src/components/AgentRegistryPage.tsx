import { useEffect, useState } from "react";

interface AgentDef {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  risk_level: string;
  tools: string[];
  capabilities: string[];
  status: string;
  last_action: string | null;
  last_ts: string | null;
  error_count: number;
  call_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  idle:    "#6ec4ff",
  running: "#ffb300",
  error:   "#ff4466",
  done:    "#00e87a",
  disabled:"#555",
};

const RISK_COLOR: Record<string, string> = {
  low:    "#00e87a",
  medium: "#ffb300",
  high:   "#ff4466",
};

const API = "http://127.0.0.1:8000";

export function AgentRegistryPage() {
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/agents/registry`);
      if (r.ok) setAgents((await r.json()).agents ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function resetAll() {
    try {
      await fetch(`${API}/agents/registry/reset`, { method: "POST" });
      setMsg("Alle Agenten auf idle gesetzt.");
      setTimeout(() => setMsg(""), 2000);
      load();
    } catch { /* silent */ }
  }

  useEffect(() => { load(); }, []);

  const sel = agents.find(a => a.id === selected);

  return (
    <div style={page}>
      <div style={hdr}>
        <div>
          <div style={ttl}>Agent Registry</div>
          <div style={sub}>Alle Agenten — Rolle, Status, Tools, Risiko</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={btn} disabled={loading}>{loading ? "..." : "Aktualisieren"}</button>
          <button onClick={resetAll} style={btn}>Alle auf idle</button>
        </div>
      </div>
      {msg && <div style={{ color: "#00e87a", fontSize: 12, marginBottom: 8 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {agents.map(a => (
          <div
            key={a.id}
            onClick={() => setSelected(selected === a.id ? null : a.id)}
            style={{
              ...card,
              borderColor: selected === a.id ? a.color : "rgba(0,190,255,.18)",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 22, color: a.color }}>{a.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#e8f6ff" }}>{a.name}</div>
                <div style={{ fontSize: 10, color: STATUS_COLOR[a.status] ?? "#fff" }}>
                  {a.status} {a.status === "running" ? "●" : ""}
                </div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 10, color: RISK_COLOR[a.risk_level] ?? "#fff" }}>
                {a.risk_level}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#8899aa", lineHeight: 1.5 }}>{a.role}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#6ec4ff" }}>
              <span>Aufrufe: {a.call_count}</span>
              {a.error_count > 0 && <span style={{ color: "#ff6680" }}>Fehler: {a.error_count}</span>}
            </div>

            {/* Detail-Ausklappen */}
            {selected === a.id && (
              <div style={{ marginTop: 10, borderTop: "1px solid rgba(0,190,255,.15)", paddingTop: 10 }}>
                <div style={detailLabel}>Tools</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {a.tools.map(t => (
                    <span key={t} style={tag}>{t}</span>
                  ))}
                </div>
                <div style={detailLabel}>Fähigkeiten</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {a.capabilities.map(c => (
                    <span key={c} style={{ ...tag, background: "rgba(0,200,100,.12)", borderColor: "rgba(0,200,100,.3)" }}>{c}</span>
                  ))}
                </div>
                {a.last_action && (
                  <div style={{ fontSize: 11, color: "#8899aa" }}>
                    Letzte Aktion: {a.last_action}
                    {a.last_ts && <span style={{ opacity: .6 }}> — {a.last_ts.replace("T", " ")}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { padding: "20px 16px", fontFamily: "Consolas, monospace", color: "#d4e0f0" };
const hdr: React.CSSProperties  = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 };
const ttl: React.CSSProperties  = { fontSize: 20, color: "#00e5ff", fontWeight: "bold" };
const sub: React.CSSProperties  = { fontSize: 12, color: "#8899aa", marginTop: 2 };
const btn: React.CSSProperties  = { background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.4)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 };
const card: React.CSSProperties = { background: "rgba(0,20,40,.6)", border: "1px solid", borderRadius: 12, padding: "12px 14px", transition: "border-color .2s" };
const detailLabel: React.CSSProperties = { fontSize: 10, color: "#00e5ff", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 };
const tag: React.CSSProperties  = { background: "rgba(0,180,255,.12)", border: "1px solid rgba(0,180,255,.25)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#a8d8ea" };
