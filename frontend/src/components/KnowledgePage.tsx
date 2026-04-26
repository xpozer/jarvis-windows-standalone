import { useEffect, useState } from "react";

interface KnowledgeDoc  { doc_id: string; title: string; category: string; chunks: number; imported_at: string; source_type: string; }
interface SearchResult  { id: string; doc_id: string; title: string; category: string; preview: string; score: number; chunk_no: number; chunk_total: number; imported_at: string; }
interface KnowledgeStats { total_chunks: number; total_documents: number; by_category: Record<string, number>; categories: string[]; }

const API = "http://127.0.0.1:8000";
const CAT_COLORS: Record<string, string> = {
  VDE: "#a0e84c", SAP: "#4ca8e8", FSM: "#4ce8a0", CATS: "#e8e84c",
  LNW: "#c44ce8", "Prüfung": "#ff6680", Kosten: "#ffb300", E41: "#4ce8e8",
  Arbeit: "#6ec4ff", Personen: "#e8a04c", Projekte: "#00e87a", Allgemein: "#8899aa",
};

export function KnowledgePage() {
  const [stats,     setStats]     = useState<KnowledgeStats | null>(null);
  const [docs,      setDocs]      = useState<KnowledgeDoc[]>([]);
  const [results,   setResults]   = useState<SearchResult[]>([]);
  const [summary,   setSummary]   = useState("");
  const [query,     setQuery]     = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importText,    setImportText]    = useState("");
  const [importTitle,   setImportTitle]   = useState("");
  const [importCat,     setImportCat]     = useState("");
  const [loading,   setLoading]   = useState<string | null>(null);
  const [msg,       setMsg]       = useState("");

  async function loadAll() {
    try {
      const [sR, dR] = await Promise.all([
        fetch(`${API}/knowledge/stats`),
        fetch(`${API}/knowledge/documents`),
      ]);
      if (sR.ok) setStats(await sR.json());
      if (dR.ok) setDocs((await dR.json()).documents ?? []);
    } catch { }
  }

  useEffect(() => { loadAll(); }, []);

  async function search() {
    if (!query.trim()) return;
    setLoading("search");
    try {
      const params = new URLSearchParams({ q: query, limit: "10" });
      if (catFilter) params.set("category", catFilter);
      const r = await fetch(`${API}/knowledge/search?${params}`);
      if (r.ok) { const d = await r.json(); setResults(d.results ?? []); setSummary(d.summary ?? ""); }
    } catch { } finally { setLoading(null); }
  }

  async function importDoc() {
    if (!importText.trim() || !importTitle.trim()) return;
    setLoading("import");
    try {
      const r = await fetch(`${API}/knowledge/import`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText, title: importTitle, category: importCat || undefined }),
      });
      if (r.ok) {
        const d = await r.json();
        setMsg(`Importiert: ${d.chunks} Chunks in Kategorie ${d.category}`);
        setImportText(""); setImportTitle(""); setImportCat("");
        setImporting(false);
        loadAll();
        setTimeout(() => setMsg(""), 3000);
      }
    } catch { } finally { setLoading(null); }
  }

  async function deleteDoc(doc_id: string, title: string) {
    if (!confirm(`"${title}" aus dem Index löschen?`)) return;
    try {
      await fetch(`${API}/knowledge/documents/${doc_id}`, { method: "DELETE" });
      loadAll();
    } catch { }
  }

  async function rebuild() {
    setLoading("rebuild");
    try {
      const r = await fetch(`${API}/knowledge/rebuild`, { method: "POST" });
      if (r.ok) { const d = await r.json(); setMsg(`Index neu aufgebaut: ${d.chunks} Chunks`); loadAll(); setTimeout(() => setMsg(""), 3000); }
    } catch { } finally { setLoading(null); }
  }

  const categories = stats?.categories ?? [];

  return (
    <div style={{ padding: "20px 16px", fontFamily: "Consolas, monospace", color: "#d4e0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, color: "#00e5ff", fontWeight: "bold" }}>Local Knowledge</div>
          <div style={{ fontSize: 12, color: "#8899aa", marginTop: 2 }}>Lokaler Wissensindex — Import, Suche, Quellenangaben</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setImporting(i => !i)} style={btn}>{importing ? "Abbrechen" : "+ Importieren"}</button>
          <button onClick={rebuild} style={btn} disabled={loading === "rebuild"}>{loading === "rebuild" ? "..." : "Index neu aufbauen"}</button>
        </div>
      </div>

      {msg && <div style={{ color: "#00e87a", fontSize: 12, marginBottom: 10 }}>{msg}</div>}

      {/* Stats */}
      {stats && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(0,20,40,.5)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12 }}>
          <span>Dokumente: <b style={{ color: "#7ee7ff" }}>{stats.total_documents}</b></span>
          <span>Chunks: <b style={{ color: "#7ee7ff" }}>{stats.total_chunks}</b></span>
          {Object.entries(stats.by_category).map(([cat, n]) => (
            <span key={cat}><span style={{ color: CAT_COLORS[cat] ?? "#8899aa" }}>{cat}</span>: {n}</span>
          ))}
        </div>
      )}

      {/* Import */}
      {importing && (
        <div style={{ background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#7ee7ff", fontWeight: "bold", marginBottom: 10 }}>Text importieren</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={fldLbl}>Titel</div>
              <input value={importTitle} onChange={e => setImportTitle(e.target.value)} placeholder="z.B. VDE 0100-600 Notizen"
                style={inputS} />
            </div>
            <div>
              <div style={fldLbl}>Kategorie</div>
              <select value={importCat} onChange={e => setImportCat(e.target.value)} style={inputS}>
                <option value="">Auto-Erkennung</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={fldLbl}>Text</div>
          <textarea value={importText} onChange={e => setImportText(e.target.value)}
            placeholder="Hier den zu importierenden Text einfügen..."
            style={{ ...inputS, height: 120, resize: "vertical" }} rows={5} />
          <button onClick={importDoc} disabled={!importText.trim() || !importTitle.trim() || loading === "import"} style={{ ...btn, marginTop: 10 }}>
            {loading === "import" ? "Importiert..." : "Importieren"}
          </button>
        </div>
      )}

      {/* Suche */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Suche im lokalen Wissen..."
          style={{ ...inputS, flex: 1, minWidth: 200 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputS, width: 150 }}>
          <option value="">Alle Kategorien</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={search} style={btn} disabled={!query.trim() || loading === "search"}>
          {loading === "search" ? "..." : "Suchen"}
        </button>
      </div>

      {/* Suchergebnisse */}
      {results.length > 0 && (
        <div style={{ background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.18)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#7ee7ff", fontWeight: "bold", marginBottom: 8 }}>
            {results.length} Treffer
          </div>
          {summary && <div style={{ fontSize: 11, color: "#a8d8ea", background: "rgba(0,0,0,.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 10, whiteSpace: "pre-wrap" }}>{summary}</div>}
          {results.map((r, i) => (
            <div key={r.id || i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(0,190,255,.07)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
                <span style={{ color: CAT_COLORS[r.category] ?? "#8899aa", fontSize: 10, fontWeight: "bold" }}>{r.category}</span>
                <span style={{ fontSize: 12, color: "#e8f6ff" }}>{r.title}</span>
                {r.chunk_total > 1 && <span style={{ fontSize: 10, color: "#8899aa" }}>({r.chunk_no + 1}/{r.chunk_total})</span>}
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#6ec4ff" }}>Score: {r.score}</span>
              </div>
              <div style={{ fontSize: 11, color: "#a8d8ea", lineHeight: 1.5 }}>{r.preview}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dokumente */}
      <div style={{ background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.18)", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, color: "#7ee7ff", fontWeight: "bold", marginBottom: 10 }}>
          Dokumente ({docs.length})
        </div>
        {docs.length === 0 && <div style={{ fontSize: 12, color: "#8899aa" }}>Noch keine Dokumente importiert</div>}
        {docs.map(d => (
          <div key={d.doc_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(0,190,255,.07)" }}>
            <div>
              <span style={{ color: CAT_COLORS[d.category] ?? "#8899aa", fontSize: 10, marginRight: 6 }}>[{d.category}]</span>
              <span style={{ fontSize: 12 }}>{d.title}</span>
              <span style={{ fontSize: 10, color: "#8899aa", marginLeft: 8 }}>{d.chunks} Chunks</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#8899aa" }}>{d.imported_at?.replace("T", " ").slice(0, 16)}</span>
              <button onClick={() => deleteDoc(d.doc_id, d.title)}
                style={{ background: "rgba(255,68,102,.1)", color: "#ff6680", border: "1px solid rgba(255,68,102,.2)", borderRadius: 5, padding: "2px 8px", fontSize: 10, cursor: "pointer" }}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = { background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.4)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 };
const fldLbl: React.CSSProperties = { fontSize: 10, color: "#8899aa", textTransform: "uppercase" as const, letterSpacing: .5, marginBottom: 4 };
const inputS: React.CSSProperties = { width: "100%", background: "rgba(0,0,0,.4)", color: "#d4e0f0", border: "1px solid rgba(0,190,255,.2)", borderRadius: 6, padding: "7px 9px", fontSize: 12, boxSizing: "border-box" as const };
