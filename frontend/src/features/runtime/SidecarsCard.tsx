import type { Sidecar } from "./runtimeTypes";

type Props = {
  sidecars: Sidecar[];
  sidecarName: string;
  onSidecarNameChange: (value: string) => void;
  onRegisterSidecar: () => void;
};

export function SidecarsCard({ sidecars, sidecarName, onSidecarNameChange, onRegisterSidecar }: Props) {
  return (
    <section className="runtime-control-card">
      <div className="runtime-control-card-title"><h2>Nebenkerne</h2><span>mehrere Maschinen</span></div>
      <div className="runtime-control-form">
        <input value={sidecarName} onChange={(e) => onSidecarNameChange(e.target.value)} placeholder="Maschinenname" />
        <button onClick={() => void onRegisterSidecar()}>REGISTRIEREN</button>
      </div>
      <div className="runtime-control-list compact">
        {sidecars.map((sidecar) => <article key={sidecar.id}><b>{sidecar.name}</b><span>{sidecar.machine_id} / {sidecar.status}</span><em>{(sidecar.capabilities || []).join(", ")}</em></article>)}
        {!sidecars.length && <p className="runtime-control-empty">Noch keine Nebenkerne registriert.</p>}
      </div>
    </section>
  );
}
