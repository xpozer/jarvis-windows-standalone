import { useState } from "react";
const API = "http://127.0.0.1:8000";
type TemplateKind = "sap" | "mail" | "lnw" | "fsm";
export function WorkModePage() {
  const [kind, setKind] = useState<TemplateKind>("sap");
  const [scope, setScope] = useState("");
  const [location, setLocation] = useState("E41");
  const [norms, setNorms] = useState("DIN VDE 0100-600, DGUV V3");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("Bereit");
  const [count, setCount] = useState("320");
  const [minutes, setMinutes] = useState("5");
  const [hours, setHours] = useState("18,5");
  const [rate, setRate] = useState("93,50");
  async function generate() { setStatus("Erstelle Text..."); const res = await fetch(`${API}/work/template`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, scope, location, norms, extra }) }); const data = await res.json(); setResult(data.text || JSON.stringify(data, null, 2)); setStatus("Fertig"); }
  async function calc(type: "sockets" | "hours") { setStatus("Rechne..."); const body = type === "sockets" ? { count, minutes_per_item: minutes, rate } : { hours, rate }; const res = await fetch(`${API}/work/calc/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await res.json(); setResult(data.text || JSON.stringify(data, null, 2)); setStatus("Berechnung fertig"); }
  function copy() { navigator.clipboard?.writeText(result); setStatus("Kopiert"); }
  return <div className="aufg-root"><div className="calc-title">ARBEITSMODUS</div><div className="set-hint" style={{ marginTop: -8 }}>SAP Texte, Mails, LNW Hinweise und Standardrechner.</div><div className="set-hint">Status: {status}</div><div className="aufg-section"><div className="sap-label">TEXTGENERATOR</div><div className="calc-toggle" style={{ marginBottom: 10 }}>{(["sap", "mail", "lnw", "fsm"] as TemplateKind[]).map(k => <button key={k} className={`calc-toggle-btn ${kind===k ? "active" : ""}`} onClick={() => setKind(k)}>{k.toUpperCase()}</button>)}</div><input className="sap-input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Ort, z. B. E41" /><textarea className="sap-textarea" value={scope} onChange={e=>setScope(e.target.value)} placeholder="Leistungsumfang oder Mailinhalt..." rows={4} /><input className="sap-input" value={norms} onChange={e=>setNorms(e.target.value)} placeholder="Normen optional" /><textarea className="sap-textarea" value={extra} onChange={e=>setExtra(e.target.value)} placeholder="Zusatzhinweise optional..." rows={3} /><button className="termin-parse-btn" onClick={generate}>ERSTELLEN</button></div><div className="aufg-section"><div className="sap-label">RECHNER</div><div className="aufg-input-row"><input className="sap-input" value={count} onChange={e=>setCount(e.target.value)} placeholder="Anzahl Steckdosen" /><input className="sap-input" value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Minuten pro Stück" /><input className="sap-input" value={rate} onChange={e=>setRate(e.target.value)} placeholder="Stundensatz" /><button className="termin-parse-btn" onClick={()=>calc("sockets")}>PRÜFZEIT</button></div><div className="aufg-input-row"><input className="sap-input" value={hours} onChange={e=>setHours(e.target.value)} placeholder="Stunden" /><input className="sap-input" value={rate} onChange={e=>setRate(e.target.value)} placeholder="Stundensatz" /><button className="termin-parse-btn" onClick={()=>calc("hours")}>KOSTEN</button></div></div>{result && <div className="sap-preview"><div className="sap-preview-header"><span className="sap-preview-label">ERGEBNIS</span><button className="sap-copy-btn" onClick={copy}>KOPIEREN</button></div><pre className="sap-preview-text">{result}</pre></div>}</div>;
}
