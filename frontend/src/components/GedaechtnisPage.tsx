import { useState } from "react";
import { MemoryFact } from "../hooks/useMemory";

interface GedaechtnisPageProps {
  facts: MemoryFact[];
  onAdd: (text: string, source: "explicit") => void;
  onRemove: (id: number) => void;
  onClear: () => void;
}

export function GedaechtnisPage({ facts, onAdd, onRemove, onClear }: GedaechtnisPageProps) {
  const [input, setInput] = useState("");

  function handleAdd() {
    if (!input.trim()) return;
    onAdd(input.trim(), "explicit");
    setInput("");
  }

  const autoFacts = facts.filter((f) => f.source === "auto");
  const manualFacts = facts.filter((f) => f.source === "explicit");

  return (
    <div className="aufg-root">
      <div className="calc-title">LANGZEITGEDÄCHTNIS</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        JARVIS lernt automatisch aus Gesprächen. Du kannst auch manuell Fakten hinzufügen oder löschen.
      </div>

      <div className="aufg-input-row">
        <input className="sap-input aufg-input" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Fakt manuell hinzufügen..." />
        <button className="termin-parse-btn" onClick={handleAdd}>HINZUFÜGEN</button>
      </div>

      {manualFacts.length > 0 && (
        <div className="aufg-section">
          <div className="sap-label">MANUELL GESPEICHERT ({manualFacts.length})</div>
          {manualFacts.map((f) => (
            <div key={f.id} className="aufg-item">
              <span className="mem-badge manual">M</span>
              <span className="aufg-text">{f.text}</span>
              <button className="sap-remove-btn" onClick={() => onRemove(f.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {autoFacts.length > 0 && (
        <div className="aufg-section">
          <div className="sap-label">AUTOMATISCH GELERNT ({autoFacts.length})</div>
          {autoFacts.map((f) => (
            <div key={f.id} className="aufg-item">
              <span className="mem-badge auto">A</span>
              <span className="aufg-text">{f.text}</span>
              <button className="sap-remove-btn" onClick={() => onRemove(f.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {facts.length === 0 && (
        <div className="jv-content-placeholder" style={{ flex: 1 }}>
          <div className="jv-placeholder-hint">Noch nichts gespeichert. Sprich mit JARVIS oder füge manuell Fakten ein.</div>
        </div>
      )}

      {facts.length > 0 && (
        <button className="aufg-clear" onClick={onClear}>Gesamtes Gedächtnis löschen</button>
      )}
    </div>
  );
}
