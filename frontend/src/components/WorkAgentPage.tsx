import { useEffect, useState } from "react";

interface WorkType { id: string; name: string; description: string; }

const FIELD_DEFS: Record<string, Array<{ key: string; label: string; type?: string; placeholder?: string; options?: string[] }>> = {
  sap_kurztext:        [
    { key: "leistung", label: "Leistung", placeholder: "z.B. LED-Umbau Bürobeleuchtung" },
    { key: "ort", label: "Ort/Bereich", placeholder: "z.B. E41" },
    { key: "art", label: "Art", placeholder: "z.B. Instandhaltung" },
    { key: "auftrag", label: "Auftragsnr.", placeholder: "optional" },
  ],
  sap_langtext: [
    { key: "leistung", label: "Leistungsumfang", placeholder: "Beschreibung der Arbeiten" },
    { key: "ort", label: "Ort/Bereich", placeholder: "z.B. E41" },
    { key: "gebaeude", label: "Gebäude", placeholder: "optional" },
    { key: "auftrag", label: "Auftragsnr.", placeholder: "optional" },
    { key: "meldung", label: "Meldungsnr.", placeholder: "optional" },
    { key: "normen", label: "Normen", placeholder: "z.B. DIN VDE 0100-600, DGUV V3" },
    { key: "hinweis", label: "Hinweis", placeholder: "optional" },
    { key: "pruefung", label: "Prüfung", type: "checkbox" },
    { key: "aufwand", label: "Aufwandsabrechnung", type: "checkbox" },
  ],
  aufwandsangebot: [
    { key: "leistung", label: "Leistungsumfang", placeholder: "Beschreibung" },
    { key: "ort", label: "Ort/Bereich", placeholder: "z.B. E41" },
    { key: "normen", label: "Normen", placeholder: "z.B. DIN VDE 0100-600" },
    { key: "art", label: "Art", placeholder: "z.B. Aufwandsangebot" },
    { key: "hinweis", label: "Hinweis", placeholder: "optional" },
    { key: "pruefung", label: "Prüfung", type: "checkbox" },
  ],
  lnw: [
    { key: "leistung", label: "Ausgeführte Arbeiten", placeholder: "Was wurde gemacht?" },
    { key: "ort", label: "Ort/Anlage", placeholder: "z.B. E41 Werkstatt" },
    { key: "ergebnis", label: "Ergebnis/Hinweis", placeholder: "z.B. Alle Geräte bestanden" },
    { key: "normen", label: "Prüfbezug", placeholder: "z.B. DGUV V3" },
    { key: "auftrag", label: "Auftragsnr.", placeholder: "optional" },
    { key: "meldung", label: "Meldungsnr.", placeholder: "optional" },
  ],
  pruefhinweis: [
    { key: "anlage", label: "Anlage/Betriebsmittel", placeholder: "z.B. Steckdosen E41" },
    { key: "ort", label: "Bereich", placeholder: "z.B. E41" },
    { key: "art", label: "Prüfart", placeholder: "z.B. Wiederholungsprüfung" },
    { key: "normen", label: "Prüfgrundlage", placeholder: "z.B. DGUV V3" },
    { key: "ergebnis", label: "Prüfergebnis", placeholder: "optional" },
  ],
  vde_hinweis: [
    { key: "norm", label: "Norm", options: ["DIN VDE 0100-600", "DIN VDE 0105-100", "DGUV V3", "DIN VDE 0100"] },
    { key: "kontext", label: "Kontext", placeholder: "z.B. Erstprüfung nach Umbau" },
  ],
  dguv_hinweis: [
    { key: "anlage", label: "Anlage", placeholder: "z.B. Ortsveränderliche Betriebsmittel" },
    { key: "ort", label: "Ort", placeholder: "z.B. E41" },
    { key: "frist", label: "Frist", placeholder: "z.B. 1 Jahr" },
  ],
  fsm_buchungshinweis: [
    { key: "empfaenger", label: "Empfänger", placeholder: "z.B. Team" },
    { key: "hinweis", label: "Hinweis", placeholder: "optional" },
  ],
  cats_warnhinweis: [
    { key: "empfaenger", label: "Empfänger", placeholder: "z.B. zusammen" },
    { key: "auftrag", label: "Auftrag", placeholder: "optional" },
  ],
  mail: [
    { key: "empfaenger", label: "Empfänger", placeholder: "z.B. Team" },
    { key: "betreff", label: "Betreff", placeholder: "optional" },
    { key: "inhalt", label: "Inhalt", placeholder: "Kernaussage der Mail" },
    { key: "ton", label: "Ton", options: ["locker", "klar", "formal", "intern"] },
  ],
  maengeltext: [
    { key: "mangel", label: "Festgestellter Mangel", placeholder: "z.B. Fehlende Abdeckung" },
    { key: "ort", label: "Ort", placeholder: "z.B. E41 Büro 12" },
    { key: "anlage", label: "Anlage/Betriebsmittel", placeholder: "optional" },
    { key: "schwere", label: "Schwere", options: ["gering", "mittel", "hoch", "kritisch"] },
    { key: "empfehlung", label: "Empfehlung", placeholder: "optional" },
  ],
  kostenuebersicht: [
    { key: "leistung", label: "Leistung", placeholder: "z.B. LED-Umbau" },
    { key: "ort", label: "Ort", placeholder: "optional" },
    { key: "stunden", label: "Stunden", placeholder: "z.B. 8" },
    { key: "stundensatz", label: "Stundensatz €", placeholder: "z.B. 85" },
    { key: "material", label: "Material €", placeholder: "z.B. 320" },
    { key: "aufschlag", label: "Aufschlag %", placeholder: "z.B. 0" },
  ],
  zeitberechnung: [
    { key: "einheit", label: "Einheit", placeholder: "z.B. Steckdosen" },
    { key: "anzahl", label: "Anzahl", placeholder: "z.B. 24" },
    { key: "zeit_pro", label: "Min pro Einheit", placeholder: "z.B. 15" },
    { key: "leistung", label: "Beschreibung", placeholder: "optional" },
    { key: "aufschlag", label: "Rüstzeit %", placeholder: "z.B. 20" },
  ],
  stundensatz: [
    { key: "jahresgehalt", label: "Jahresgehalt €", placeholder: "z.B. 48000" },
    { key: "zuschlaege", label: "Lohnnebenkosten %", placeholder: "z.B. 25" },
    { key: "produktiv_h", label: "Produktivstunden", placeholder: "z.B. 1600" },
    { key: "gemeinkosten", label: "Gemeinkosten %", placeholder: "z.B. 30" },
    { key: "gewinn", label: "Gewinn %", placeholder: "z.B. 10" },
  ],
};

const CAT_GROUPS: Record<string, string[]> = {
  "SAP":      ["sap_kurztext", "sap_langtext", "aufwandsangebot", "lnw", "pruefhinweis"],
  "Normen":   ["vde_hinweis", "dguv_hinweis"],
  "FSM/CATS": ["fsm_buchungshinweis", "cats_warnhinweis"],
  "Mail":     ["mail", "maengeltext"],
  "Kosten":   ["kostenuebersicht", "zeitberechnung", "stundensatz"],
};

const API = "http://127.0.0.1:8000";

export function WorkAgentPage() {
  const [types, setTypes] = useState<WorkType[]>([]);
  const [activeKind, setActiveKind] = useState("aufwandsangebot");
  const [fields, setFields] = useState<Record<string, any>>({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/work/types`).then(r => r.json()).then(d => setTypes(d.types ?? [])).catch(() => {});
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const r = await fetch(`${API}/work-agent/logs?limit=6`);
      if (r.ok) setLogs((await r.json()).logs ?? []);
    } catch { }
  }

  function resetFields() { setFields({}); setResult(""); }

  async function generate() {
    setLoading(true); setResult("");
    try {
      const r = await fetch(`${API}/work/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: activeKind, data: fields }),
      });
      const d = await r.json();
      setResult(d.ok ? d.text : `Fehler: ${d.error}`);
      if (d.ok) loadLogs();
    } catch (e) { setResult(`Fehler: ${e}`); }
    finally { setLoading(false); }
  }

  async function loadExample() {
    try {
      const r = await fetch(`${API}/work/examples/${activeKind}`);
      const d = await r.json();
      if (d.example) setFields(d.example);
    } catch { }
  }

  function copy() {
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const fieldDefs = FIELD_DEFS[activeKind] ?? [];

  return (
    <div style={{ padding: "20px 16px", fontFamily: "Consolas, monospace", color: "#d4e0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, color: "#00e5ff", fontWeight: "bold" }}>Work Agent</div>
          <div style={{ fontSize: 12, color: "#8899aa", marginTop: 2 }}>SAP · Normen · FSM/CATS · Mail · Kosten · Zeit</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
        {/* Typ-Auswahl */}
        <div style={{ background: "rgba(0,20,40,.5)", borderRadius: 10, padding: "10px 6px", height: "fit-content" }}>
          {Object.entries(CAT_GROUPS).map(([group, ids]) => (
            <div key={group}>
              <div style={{ fontSize: 10, color: "#00e5ff", textTransform: "uppercase", letterSpacing: 1, padding: "6px 10px 3px" }}>{group}</div>
              {ids.map(id => {
                const t = types.find(x => x.id === id);
                return (
                  <button key={id} onClick={() => { setActiveKind(id); resetFields(); }}
                    style={{ display: "block", width: "100%", textAlign: "left", border: "1px solid",
                      borderColor: activeKind === id ? "rgba(0,229,255,.4)" : "transparent",
                      borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", marginBottom: 2,
                      background: activeKind === id ? "rgba(0,229,255,.15)" : "transparent",
                      color: activeKind === id ? "#7ee7ff" : "#8899aa" }}
                    title={t?.description ?? ""}>
                    {t?.name ?? id}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Formular + Ergebnis */}
        <div>
          <div style={{ background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.18)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#7ee7ff", fontWeight: "bold" }}>
                {types.find(t => t.id === activeKind)?.name ?? activeKind}
              </div>
              <button onClick={loadExample} style={{ background: "rgba(0,180,255,.12)", color: "#a8d8ea", border: "1px solid rgba(0,180,255,.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                Beispiel laden
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
              {fieldDefs.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 10, color: "#8899aa", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{f.label}</div>
                  {f.type === "checkbox" ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={!!fields[f.key]}
                        onChange={e => setFields(p => ({ ...p, [f.key]: e.target.checked }))}
                        style={{ accentColor: "#00e5ff" }} />
                      <span style={{ fontSize: 12, color: "#8899aa" }}>{f.label}</span>
                    </label>
                  ) : f.options ? (
                    <select value={fields[f.key] ?? ""}
                      onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", background: "rgba(0,0,0,.4)", color: "#d4e0f0", border: "1px solid rgba(0,190,255,.2)", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const }}>
                      <option value="">—</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={fields[f.key] ?? ""} placeholder={f.placeholder}
                      onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", background: "rgba(0,0,0,.4)", color: "#d4e0f0", border: "1px solid rgba(0,190,255,.2)", borderRadius: 6, padding: "6px 8px", fontSize: 12, boxSizing: "border-box" as const }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={generate} disabled={loading}
                style={{ background: "rgba(0,229,255,.2)", color: "#7ee7ff", border: "1px solid rgba(0,229,255,.4)", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: "bold", opacity: loading ? .6 : 1 }}>
                {loading ? "Wird erstellt..." : "Text erstellen"}
              </button>
              <button onClick={resetFields}
                style={{ background: "rgba(0,180,255,.12)", color: "#a8d8ea", border: "1px solid rgba(0,180,255,.3)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>
                Zurücksetzen
              </button>
            </div>
          </div>

          {result && (
            <div style={{ background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.18)", borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: "#7ee7ff", fontWeight: "bold" }}>Ergebnis</div>
                <button onClick={copy}
                  style={{ background: "rgba(0,180,255,.12)", color: "#a8d8ea", border: "1px solid rgba(0,180,255,.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                  {copied ? "Kopiert!" : "Kopieren"}
                </button>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Consolas, monospace", fontSize: 12, color: "#c8e8ff", background: "rgba(0,0,0,.3)", borderRadius: 8, padding: "12px 14px", lineHeight: 1.6, margin: 0 }}>
                {result}
              </pre>
            </div>
          )}

          {logs.length > 0 && (
            <div style={{ background: "rgba(0,20,40,.6)", border: "1px solid rgba(0,190,255,.18)", borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
              <div style={{ fontSize: 12, color: "#7ee7ff", fontWeight: "bold", marginBottom: 8 }}>Letzte Texte</div>
              {logs.slice(0, 5).map((l: any, i: number) => (
                <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid rgba(0,190,255,.07)", fontSize: 11 }}>
                  <span style={{ color: "#7ee7ff" }}>{l.kind ?? l.type ?? "—"}</span>
                  <span style={{ color: "#8899aa", marginLeft: 8 }}>{(l.ts ?? l.created_at ?? "").replace("T", " ")}</span>
                  <div style={{ color: "#a8d8ea", marginTop: 2, opacity: .8 }}>{(l.result ?? l.text ?? "").slice(0, 80)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
