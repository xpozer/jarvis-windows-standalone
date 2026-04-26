import { useEffect, useRef, useState } from "react";
import { OrbState } from "./Orb";

interface LogEntry {
  time: string;
  text: string;
  cls: "ok" | "warn" | "high" | "";
}

const LOG_MESSAGES: Record<OrbState, Array<{ text: string; cls: "ok" | "warn" | "high" | "" }>> = {
  idle: [
    { text: "Ruhezustand aktiv. Basistakt stabil.", cls: "" },
    { text: "Memory-Refresh läuft durch Cluster C.", cls: "" },
    { text: "Keine eingehenden Signale.", cls: "" },
    { text: "Thermisches Rauschen nominal.", cls: "" },
    { text: "Hintergrund-Sync abgeschlossen.", cls: "ok" },
    { text: "Alle Subsysteme stabil.", cls: "ok" },
  ],
  listening: [
    { text: "Auditory Input erkannt.", cls: "ok" },
    { text: "Sprachfilter aktiviert.", cls: "" },
    { text: "Frequenzband 300–3400 Hz isoliert.", cls: "" },
    { text: "Rauschunterdrückung läuft.", cls: "" },
    { text: "Kontext-Buffer wird befüllt...", cls: "" },
    { text: "Segmentierung läuft. Warte auf EOT.", cls: "warn" },
    { text: "Phonem-Match: 87% Konfidenz.", cls: "" },
  ],
  thinking: [
    { text: "Inferenz gestartet. Tiefe: 24 Layer.", cls: "" },
    { text: "Hypothese #1 generiert.", cls: "" },
    { text: "Hypothese #2 verworfen. Konfidenz: 12%.", cls: "warn" },
    { text: "Attention-Score Cluster A: 0.94.", cls: "ok" },
    { text: "Kontext-Buffer: 87% voll.", cls: "warn" },
    { text: "Sampling Temperatur auf 0.7 gesetzt.", cls: "" },
    { text: "Analogie gefunden: Ähnlichkeit 0.82.", cls: "ok" },
    { text: "Arbeitsgedächtnis: 3 aktive Frames.", cls: "" },
    { text: "Token #847 generiert.", cls: "" },
    { text: "WARNUNG: Kohärenzprüfung fehlgeschlagen.", cls: "high" },
    { text: "Neustart Inferenzpfad B.", cls: "warn" },
    { text: "Pfad B stabil. Weiter.", cls: "ok" },
  ],
  speaking: [
    { text: "Ausgabe-Buffer gefüllt.", cls: "ok" },
    { text: "TTS-Modul aktiv.", cls: "" },
    { text: "Prosodie-Layer: Intonation angepasst.", cls: "" },
    { text: "Sequenz 1/4 gesendet.", cls: "" },
    { text: "Sequenz 2/4 gesendet.", cls: "" },
    { text: "Feedback-Loop: keine Anomalien.", cls: "ok" },
    { text: "Buffer-Flush abgeschlossen.", cls: "" },
  ],
};

interface NeuralLogProps {
  state: OrbState;
}

export function NeuralLog({ state }: NeuralLogProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const stateRef = useRef(state);
  const idxRef = useRef<Record<OrbState, number>>({ idle:0, listening:0, thinking:0, speaking:0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const addEntry = () => {
    const st = stateRef.current;
    const msgs = LOG_MESSAGES[st];
    const idx = idxRef.current[st] % msgs.length;
    idxRef.current[st]++;
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    setEntries(prev => {
      const next = [...prev, { time: ts, text: msgs[idx].text, cls: msgs[idx].cls }];
      return next.slice(-20);
    });
    const delay = st === "thinking" ? 600 + Math.random()*1000
                : st === "idle"     ? 2500 + Math.random()*2500
                : 1000 + Math.random()*1200;
    timerRef.current = setTimeout(addEntry, delay);
  };

  useEffect(() => {
    timerRef.current = setTimeout(addEntry, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="jv-neural-log">
      <div className="jv-neural-log-header">
        <span>SYSTEM LOG</span>
        <span className="jv-neural-log-dot" />
      </div>
      <div className="jv-neural-log-entries">
        {entries.map((e, i) => (
          <div key={i} className="jv-log-entry">
            <span className="jv-log-time">[{e.time}]</span>
            <span className={`jv-log-text ${e.cls}`}>{e.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
