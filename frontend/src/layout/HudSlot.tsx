import { HudCorner } from "../components/Hud/HudCorner";

export function HudSlot() {
  return (
    <div className="hud-slot" aria-label="JARVIS HUD corner placeholders">
      <HudCorner position="top-left" title="SYSTEM" />
      <HudCorner position="top-right" title="NETWORK" />
      <HudCorner position="bottom-left" title="AUDIT" />
      <HudCorner position="bottom-right" title="TOOLS" />
    </div>
  );
}
