import type { Fact } from "./runtimeTypes";
import { prettyDate } from "./runtimeFormat";

type Props = {
  facts: Fact[];
  factText: string;
  onFactTextChange: (value: string) => void;
  onAddFact: () => void;
};

export function MemoryCard({ facts, factText, onFactTextChange, onAddFact }: Props) {
  return (
    <section className="runtime-control-card runtime-control-card-tall">
      <div className="runtime-control-card-title"><h2>Gedächtnis</h2><span>semantische Fakten</span></div>
      <div className="runtime-control-form">
        <input value={factText} onChange={(e) => onFactTextChange(e.target.value)} placeholder="Fakt speichern, z.B. JARVIS soll lokal first bleiben" onKeyDown={(e) => e.key === "Enter" && onAddFact()} />
        <button onClick={() => void onAddFact()}>SPEICHERN</button>
      </div>
      <div className="runtime-control-list">
        {facts.map((fact) => <article key={fact.id}><b>{fact.fact_text}</b><span>{fact.source_type} / Wichtigkeit {fact.importance ?? 0} / {prettyDate(fact.created_at)}</span></article>)}
        {!facts.length && <p className="runtime-control-empty">Noch keine Fakten gespeichert.</p>}
      </div>
    </section>
  );
}
