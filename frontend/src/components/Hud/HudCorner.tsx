import type { HudCornerPosition } from "../../core/types";

type HudCornerProps = {
  position: HudCornerPosition;
  title: string;
};

export function HudCorner({ position, title }: HudCornerProps) {
  const className = ["hud-corner", `hud-${position}`].join(" ");

  return (
    <section className={className} aria-label={title}>
      <header>{title}</header>
      <div className="hud-line" />
      <div className="hud-line" />
      <div className="hud-line" />
    </section>
  );
}
