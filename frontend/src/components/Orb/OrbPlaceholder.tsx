import { useOrbStore } from "../../state/orbStore";

export function OrbPlaceholder() {
  const state = useOrbStore((store) => store.state);

  return (
    <div className="orb-placeholder" data-state={state} aria-label={`JARVIS orb placeholder ${state}`}>
      <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="orb-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(220,250,255,0.95)" />
            <stop offset="38%" stopColor="rgba(0,212,255,0.36)" />
            <stop offset="72%" stopColor="rgba(0,90,140,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="78" fill="url(#orb-core)" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(0,212,255,0.38)" strokeWidth="1" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(0,212,255,0.22)" strokeWidth="1" />
      </svg>
      <span>{state.toUpperCase()}</span>
    </div>
  );
}
