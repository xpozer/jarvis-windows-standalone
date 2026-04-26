import { useEffect, useState, useCallback } from "react";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  risk_level: string;
  requires_confirmation: boolean;
  input_schema: Record<string, string>;
  output_schema: Record<string, string>;
  enabled: boolean;
  last_used: string | null;
  error_count: number;
  call_count: number;
}

const RISK_COLOR: Record<string, string> = {
  low:    "#00e87a",
  medium: "#ffb300",
  high:   "#ff4466",
};

const CAT_COLOR: Record<string, string> = {
  file:       "#e8a04c",
  windows:    "#4ce8a0",
  system:     "#4ca8e8",
  knowledge:  "#c44ce8",
  work:       "#4ce8e8",
  automation: "#e8e84c",
  voice:      "#a0e84c",
};

const CATEGORIES = ["alle", "work", "file", "system", "knowledge", "windows", "automation", "voice"];

const API = "http://127.0.0.1:8000";

export function ToolRegistryPage() {
  const [tools, setTools]       = useState<Tool[]>([]);
  const [loading, setLoading]   = useState(false);
  const [filterCat, setFilterCat] = useState("alle");
  const [filterRisk, setFilterRisk] = useState("alle");
  const [selected, setSelected] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tools/registry/full`);
      if (r.ok) setTools((await r.json()).tools ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleTool(id: string, enabled: boolean) {
    setToggling(id);
    try {
      await fetch(`${API}/tools/registry/full/${id}/enabled`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      setMsg(`Tool ${enabled ? "aktiviert" : "deaktiviert"}: ${id}`);
      setTimeout(() => setMsg(""), 2000);
      load();
    } catch { /* silent */ }
    finally { setToggling(null); }
  }

  const filtered = tools.filter(t => {
    if (filterCat  !== "alle" && t.category   !== filterCat)   return false;
    if (filterRisk !== "alle" && t.risk_level !== filterRisk)  return false;
    return true;
  });

  const stats = {
    total:    tools.length,
    enabled:  tools.filter(t => t.enabled).length,
    risky:    tools.filter(t => t.requires_confirmation).length,
    errors:   tools.reduce((s, t) => s + (t.error_count || 0), 0),
  };

  return (
    <div style={page}>
      <div style={hdr}>
        <div>
          <div style={ttl}>Tool Registry</div>
          <div style={sub}>Alle lokalen Tools — Risiko, Bestätigung, Status</div>
        </div>
        <button onClick={load} style={btn} disabled={loading}>
          {loading ? "..." : "Aktualisieren"}
        </button>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        <span style={stat}>Tools: <b style={{ color: "#7ee7ff" }}>{stats.total}</b></span>
        <span style={stat}>Aktiv: <b style={{ color: "#00e87a" }}>{stats.enabled}</b></span>
        <span style={stat}>Bestätigung nötig: <b style={{ color: "#ffb300" }}>{stats.risky}</b></span>
        {stats.errors > 0 && <span style={stat}>Fehler gesamt: <b style={{ color: "#ff4466" }}>{stats.errors}</b></span>}
      </div>

      {msg && <div style={{ color: "#00e87a", fontSize: 12, marginBottom: 8 }}>{msg}</div>}

      {/* Filter */}
      <div style={filterRow}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            style={{ ...filterBtn, borderColor: filterCat === c ? (CAT_COLOR[c] ?? "#00e5ff") : "rgba(0,190,255,.2)",
              color: filterCat === c ? "#fff" : "#8899aa" }}>
            {c}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["alle", "low", "medium", "high"].map(r => (
            <button key={r} onClick={() => setFilterRisk(r)}
              style={{ ...filterBtn, borderColor: filterRisk === r ? (RISK_COLOR[r] ?? "#00e5ff") : "rgba(0,190,255,.2)",
                color: filterRisk === r ? "#fff" : "#8899aa" }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {filtered.map(t => (
          <div key={t.id}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
            style={{
              ...card,
              opacity: t.enabled ? 1 : 0.5,
              borderColor: selected === t.id ? (CAT_COLOR[t.category] ?? "#00e5ff") : "rgba(0,190,255,.15)",
              cursor: "pointer",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, color: "#e8f6ff", fontWeight: "bold" }}>{t.name}</div>
                <div style={{ fontSize: 10, color: CAT_COLOR[t.category] ?? "#6ec4ff", marginTop: 2 }}>
                  {t.category}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 10, color: RISK_COLOR[t.risk_level] }}>
                  {t.risk_level}
                </span>
                {t.requires_confirmation && (
                  <span style={{ fontSize: 9, color: "#ffb300", background: "rgba(255,179,0,.1)",
                    border: "1px solid rgba(255,179,0,.3)", borderRadius: 4, padding: "1px 5px" }}>
                    Bestätigung
                  </span>
                )}
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#8899aa", marginBottom: 8, lineHeight: 1.4 }}>
              {t.description}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: "#6ec4ff" }}>
                Aufrufe: {t.call_count}
                {t.error_count > 0 && <span style={{ color: "#ff6680", marginLeft: 8 }}>Fehler: {t.error_count}</span>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleTool(t.id, !t.enabled); }}
                disabled={toggling === t.id}
                style={{
                  ...smallBtn,
                  background: t.enabled ? "rgba(0,232,122,.12)" : "rgba(255,68,102,.12)",
                  borderColor: t.enabled ? "rgba(0,232,122,.3)" : "rgba(255,68,102,.3)",
                  color: t.enabled ? "#00e87a" : "#ff6680",
                }}
              >
                {t.enabled ? "aktiv" : "inaktiv"}
              </button>
            </div>

            {/* Detail-Ausklappen */}
            {selected === t.id && (
              <div style={{ marginTop: 10, borderTop: "1px solid rgba(0,190,255,.1)", paddingTop: 10 }}>
                <div style={detailLbl}>Input</div>
                <div style={{ fontSize: 10, color: "#8899aa", fontFamily: "Courier, monospace", marginBottom: 6 }}>
                  {Object.entries(t.input_schema).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}
                </div>
                <div style={detailLbl}>Output</div>
                <div style={{ fontSize: 10, color: "#8899aa", fontFamily: "Courier, monospace", marginBottom: 6 }}>
                  {Object.entries(t.output_schema).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}
                </div>
                <div style={{ fontSize: 10, color: "#6ec4ff" }}>ID: {t.id}</div>
                {t.last_used && (
                  <div style={{ fontSize: 10, color: "#6ec4ff", opacity: .7 }}>
                    Zuletzt: {t.last_used.replace("T", " ")}
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

const page: React.CSSProperties    = { padding: "20px 16px", fontFamily: "Consolas, monospace", color: "#d4e0f0" };
const hdr: React.CSSProperties     = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 };
const ttl: React.CSSProperties     = { fontSize: 20, color: "#00e5ff", fontWeight: "bold" };
const sub: React.CSSProperties     = { fontSize: 12, color: "#8899aa", marginTop: 2 };
const statsRow: React.CSSProperties = { display: "flex", gap: 16, flexWrap: "wrap", background: "rgba(0,20,40,.5)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12 };
const stat: React.CSSProperties    = { color: "#8899aa" };
const filterRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, alignItems: "center" };
const filterBtn: React.CSSProperties = { background: "transparent", border: "1px solid", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", transition: "all .15s" };
const btn: React.CSSProperties     = { background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.4)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 };
const smallBtn: React.CSSProperties = { border: "1px solid", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer" };
const card: React.CSSProperties    = { background: "rgba(0,20,40,.6)", border: "1px solid", borderRadius: 10, padding: "12px 14px", transition: "border-color .2s" };
const detailLbl: React.CSSProperties = { fontSize: 10, color: "#00e5ff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 };
