import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface ImportedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  imported_at: string;
  summary: string;
  text_preview: string;
}

export function FilesPage() {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [selected, setSelected] = useState<ImportedFile | null>(null);
  const [status, setStatus] = useState("Bereit");
  const [q, setQ] = useState("");

  async function load(query = q) {
    const res = await fetch(`${API}/files${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setFiles(Array.isArray(data.files) ? data.files : []);
  }

  async function analyzeSelected() {
    if (!selected) return;
    setStatus("Analysiere Datei...");
    const res = await fetch(`${API}/documents/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: selected.id }),
    });
    const data = await res.json();
    setSelected({ ...selected, summary: data.analysis?.summary || selected.summary });
    setStatus("Analyse fertig");
  }

  async function upload(file?: File) {
    if (!file) return;
    setStatus("Importiere Datei...");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/files/import`, { method: "POST", body: fd });
    const data = await res.json();
    setSelected(data);
    setStatus("Import fertig");
    await load("");
  }

  useEffect(() => { load(""); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">DATEI IMPORT</div>
      <div className="set-hint" style={{ marginTop: -8 }}>Log, TXT, CSV, JSON, Code und kleine Textdateien lokal importieren.</div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">IMPORT</div>
        <input className="sap-input" type="file" onChange={(e) => upload(e.target.files?.[0])} />
      </div>

      <div className="aufg-input-row">
        <input className="sap-input aufg-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Importe durchsuchen..." />
        <button className="termin-parse-btn" onClick={() => load()}>SUCHEN</button>
      </div>

      <div className="aufg-section">
        <div className="sap-label">IMPORTIERTE DATEIEN</div>
        {files.map((f) => (
          <div className="aufg-item" key={f.id} onClick={() => setSelected(f)} style={{ cursor: "pointer" }}>
            <span className="mem-badge auto">F</span>
            <span className="aufg-text">{f.name}<br/><small>{f.imported_at} | {Math.round(f.size / 1024)} KB</small></span>
          </div>
        ))}
      </div>

      {selected && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">{selected.name}</span>
            <button className="sap-copy-btn" onClick={analyzeSelected}>ANALYSIEREN</button><button className="sap-copy-btn" onClick={() => navigator.clipboard?.writeText(selected.text_preview || selected.summary)}>KOPIEREN</button>
          </div>
          <pre className="sap-preview-text">{selected.summary + "\n\n--- Vorschau ---\n" + selected.text_preview}</pre>
        </div>
      )}
    </div>
  );
}
