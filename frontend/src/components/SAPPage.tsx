import { useState } from "react";

type SAPTool = "auftragstext" | "pm_meldung" | "leistungsnachweis";

// ── Auftragstext-Generator ────────────────────────────────────────────────────
function AuftragstextTool() {
  const [art, setArt] = useState("Inspektion");
  const [anlage, setAnlage] = useState("");
  const [ort, setOrt] = useState("");
  const [befund, setBefund] = useState("");
  const [massnahme, setMassnahme] = useState("");
  const [norm, setNorm] = useState("");
  const [copied, setCopied] = useState(false);

  const AUFTRAGSARTEN = ["Inspektion", "Wartung", "Instandsetzung", "Prüfung", "Umbau", "Entstörung"];

  function generateText(): string {
    const lines: string[] = [];
    lines.push(`Auftragsart: ${art}`);
    if (anlage) lines.push(`Anlage/Betriebsmittel: ${anlage}`);
    if (ort) lines.push(`Aufstellungsort: ${ort}`);
    if (befund) lines.push(`\nBefund:\n${befund}`);
    if (massnahme) lines.push(`\nDurchgeführte Maßnahme:\n${massnahme}`);
    if (norm) lines.push(`\nRelevante Norm/Vorschrift: ${norm}`);
    return lines.join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const text = generateText();

  return (
    <div className="sap-tool-panel">
      <div className="sap-fields">
        <div className="sap-field">
          <label className="sap-label">Auftragsart</label>
          <div className="sap-select-row">
            {AUFTRAGSARTEN.map((a) => (
              <button key={a} className={`sap-chip ${art === a ? "active" : ""}`} onClick={() => setArt(a)}>{a}</button>
            ))}
          </div>
        </div>
        <div className="sap-field-row">
          <div className="sap-field">
            <label className="sap-label">Anlage / Betriebsmittel</label>
            <input className="sap-input" value={anlage} onChange={(e) => setAnlage(e.target.value)} placeholder="z.B. Schaltanlage UV-E12" />
          </div>
          <div className="sap-field">
            <label className="sap-label">Aufstellungsort</label>
            <input className="sap-input" value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="z.B. Gebäude 5, EG" />
          </div>
        </div>
        <div className="sap-field">
          <label className="sap-label">Befund</label>
          <textarea className="sap-textarea" value={befund} onChange={(e) => setBefund(e.target.value)} placeholder="Festgestellter Zustand / Mangel..." rows={3} />
        </div>
        <div className="sap-field">
          <label className="sap-label">Durchgeführte Maßnahme</label>
          <textarea className="sap-textarea" value={massnahme} onChange={(e) => setMassnahme(e.target.value)} placeholder="Was wurde gemacht..." rows={3} />
        </div>
        <div className="sap-field">
          <label className="sap-label">Norm / Vorschrift (optional)</label>
          <input className="sap-input" value={norm} onChange={(e) => setNorm(e.target.value)} placeholder="z.B. VDE 0100-600, DGUV V3" />
        </div>
      </div>

      {text.trim() && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">VORSCHAU</span>
            <button className={`sap-copy-btn ${copied ? "done" : ""}`} onClick={handleCopy}>
              {copied ? "KOPIERT ✓" : "KOPIEREN"}
            </button>
          </div>
          <pre className="sap-preview-text">{text}</pre>
        </div>
      )}
    </div>
  );
}

// ── PM-Meldung ────────────────────────────────────────────────────────────────
function PMMeldungTool() {
  const [prioritaet, setPrioritaet] = useState("Mittel");
  const [funktionsort, setFunktionsort] = useState("");
  const [kurztext, setKurztext] = useState("");
  const [langtext, setLangtext] = useState("");
  const [copied, setCopied] = useState(false);

  const PRIORITAETEN = ["Sehr hoch", "Hoch", "Mittel", "Niedrig"];
  const PRIO_CODES: Record<string, string> = { "Sehr hoch": "1", "Hoch": "2", "Mittel": "3", "Niedrig": "4" };

  function generateText(): string {
    const lines: string[] = [];
    lines.push(`Meldungsart: M2 (Schadenmeldung)`);
    lines.push(`Priorität: ${PRIO_CODES[prioritaet]} — ${prioritaet}`);
    if (funktionsort) lines.push(`Funktionsort: ${funktionsort}`);
    if (kurztext) lines.push(`Kurztext: ${kurztext}`);
    if (langtext) lines.push(`\nLangtext:\n${langtext}`);
    lines.push(`\nMeldedatum: ${new Date().toLocaleDateString("de-DE")}`);
    return lines.join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="sap-tool-panel">
      <div className="sap-fields">
        <div className="sap-field">
          <label className="sap-label">Priorität</label>
          <div className="sap-select-row">
            {PRIORITAETEN.map((p) => (
              <button key={p} className={`sap-chip ${prioritaet === p ? "active" : ""} prio-${p.toLowerCase().replace(" ", "-")}`} onClick={() => setPrioritaet(p)}>{p}</button>
            ))}
          </div>
        </div>
        <div className="sap-field">
          <label className="sap-label">Funktionsort</label>
          <input className="sap-input" value={funktionsort} onChange={(e) => setFunktionsort(e.target.value)} placeholder="z.B. E-BG05-UV012" />
        </div>
        <div className="sap-field">
          <label className="sap-label">Kurztext (max. 40 Zeichen)</label>
          <div style={{ position: "relative" }}>
            <input className="sap-input" value={kurztext} maxLength={40}
              onChange={(e) => setKurztext(e.target.value)} placeholder="Störungsbeschreibung kurz..." />
            <span className="sap-char-count">{kurztext.length}/40</span>
          </div>
        </div>
        <div className="sap-field">
          <label className="sap-label">Langtext</label>
          <textarea className="sap-textarea" value={langtext} onChange={(e) => setLangtext(e.target.value)}
            placeholder="Detaillierte Störungsbeschreibung, Begleitumstände, Erstmaßnahmen..." rows={4} />
        </div>
      </div>

      {(funktionsort || kurztext) && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">VORSCHAU</span>
            <button className={`sap-copy-btn ${copied ? "done" : ""}`} onClick={handleCopy}>
              {copied ? "KOPIERT ✓" : "KOPIEREN"}
            </button>
          </div>
          <pre className="sap-preview-text">{generateText()}</pre>
        </div>
      )}
    </div>
  );
}

// ── Leistungsnachweis ─────────────────────────────────────────────────────────
interface LNPosition {
  id: number;
  beschreibung: string;
  menge: string;
  einheit: string;
  ep: string;
}

function LeistungsnachweissTool() {
  const [auftragsnr, setAuftragsnr] = useState("");
  const [kostenstelle, setKostenstelle] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [techniker, setTechniker] = useState("");
  const [positionen, setPositionen] = useState<LNPosition[]>([
    { id: 1, beschreibung: "", menge: "1", einheit: "Std.", ep: "" },
  ]);
  const [copied, setCopied] = useState(false);

  function addPosition() {
    setPositionen((prev) => [...prev, { id: Date.now(), beschreibung: "", menge: "1", einheit: "Std.", ep: "" }]);
  }

  function updatePos(id: number, field: keyof LNPosition, value: string) {
    setPositionen((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }

  function removePos(id: number) {
    setPositionen((prev) => prev.filter((p) => p.id !== id));
  }

  function gesamtkosten(): number {
    return positionen.reduce((sum, p) => {
      const m = parseFloat(p.menge) || 0;
      const ep = parseFloat(p.ep) || 0;
      return sum + m * ep;
    }, 0);
  }

  function generateText(): string {
    const lines: string[] = [];
    lines.push("LEISTUNGSNACHWEIS");
    lines.push("=".repeat(40));
    if (auftragsnr) lines.push(`Auftragsnummer:  ${auftragsnr}`);
    if (kostenstelle) lines.push(`Kostenstelle:    ${kostenstelle}`);
    lines.push(`Datum:           ${new Date(datum).toLocaleDateString("de-DE")}`);
    if (techniker) lines.push(`Techniker:       ${techniker}`);
    lines.push("");
    lines.push("POSITIONEN:");
    lines.push("-".repeat(40));
    positionen.forEach((p, i) => {
      if (!p.beschreibung) return;
      const gp = (parseFloat(p.menge) || 0) * (parseFloat(p.ep) || 0);
      lines.push(`${i + 1}. ${p.beschreibung}`);
      lines.push(`   ${p.menge} ${p.einheit}${p.ep ? ` × ${p.ep} € = ${gp.toFixed(2)} €` : ""}`);
    });
    const gesamt = gesamtkosten();
    if (gesamt > 0) {
      lines.push("-".repeat(40));
      lines.push(`Gesamtkosten:    ${gesamt.toFixed(2)} €`);
    }
    return lines.join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const EINHEITEN = ["Std.", "Stk.", "m", "m²", "Psch."];

  return (
    <div className="sap-tool-panel">
      <div className="sap-fields">
        <div className="sap-field-row">
          <div className="sap-field">
            <label className="sap-label">Auftragsnummer</label>
            <input className="sap-input" value={auftragsnr} onChange={(e) => setAuftragsnr(e.target.value)} placeholder="z.B. 1000123456" />
          </div>
          <div className="sap-field">
            <label className="sap-label">Kostenstelle</label>
            <input className="sap-input" value={kostenstelle} onChange={(e) => setKostenstelle(e.target.value)} placeholder="z.B. 4711" />
          </div>
          <div className="sap-field">
            <label className="sap-label">Datum</label>
            <input className="sap-input" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </div>
        </div>
        <div className="sap-field">
          <label className="sap-label">Techniker</label>
          <input className="sap-input" value={techniker} onChange={(e) => setTechniker(e.target.value)} placeholder="Name" />
        </div>

        <div className="sap-field">
          <label className="sap-label">Positionen</label>
          <div className="sap-positionen">
            {positionen.map((pos) => (
              <div key={pos.id} className="sap-position-row">
                <input className="sap-input sap-pos-desc" value={pos.beschreibung}
                  onChange={(e) => updatePos(pos.id, "beschreibung", e.target.value)}
                  placeholder="Beschreibung der Leistung" />
                <input className="sap-input sap-pos-num" value={pos.menge}
                  onChange={(e) => updatePos(pos.id, "menge", e.target.value)}
                  placeholder="1" type="number" min="0" step="0.5" />
                <select className="sap-select" value={pos.einheit} onChange={(e) => updatePos(pos.id, "einheit", e.target.value)}>
                  {EINHEITEN.map((e) => <option key={e}>{e}</option>)}
                </select>
                <input className="sap-input sap-pos-num" value={pos.ep}
                  onChange={(e) => updatePos(pos.id, "ep", e.target.value)}
                  placeholder="EP €" type="number" min="0" />
                {positionen.length > 1 && (
                  <button className="sap-remove-btn" onClick={() => removePos(pos.id)}>✕</button>
                )}
              </div>
            ))}
            <button className="sap-add-btn" onClick={addPosition}>+ Position hinzufügen</button>
          </div>
        </div>
      </div>

      <div className="sap-preview">
        <div className="sap-preview-header">
          <span className="sap-preview-label">VORSCHAU{gesamtkosten() > 0 ? ` — ${gesamtkosten().toFixed(2)} €` : ""}</span>
          <button className={`sap-copy-btn ${copied ? "done" : ""}`} onClick={handleCopy}>
            {copied ? "KOPIERT ✓" : "KOPIEREN"}
          </button>
        </div>
        <pre className="sap-preview-text">{generateText()}</pre>
      </div>
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export function SAPPage() {
  const [tool, setTool] = useState<SAPTool>("auftragstext");

  const TOOLS: { id: SAPTool; label: string }[] = [
    { id: "auftragstext", label: "AUFTRAGSTEXT" },
    { id: "pm_meldung", label: "PM-MELDUNG" },
    { id: "leistungsnachweis", label: "LEISTUNGSNACHWEIS" },
  ];

  return (
    <div className="calc-root">
      <div className="calc-header">
        <div className="calc-title">SAP WERKZEUGE</div>
        <div className="calc-tabs">
          {TOOLS.map((t) => (
            <button key={t.id} className={`calc-tab ${tool === t.id ? "active" : ""}`} onClick={() => setTool(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="calc-content">
        {tool === "auftragstext" && <AuftragstextTool />}
        {tool === "pm_meldung" && <PMMeldungTool />}
        {tool === "leistungsnachweis" && <LeistungsnachweissTool />}
      </div>
    </div>
  );
}
