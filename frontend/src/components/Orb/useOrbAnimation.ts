import { MutableRefObject, useEffect } from "react";
import { OrbCanvas } from "./OrbCanvas";

export function useOrbAnimation(rendererRef: MutableRefObject<OrbCanvas | null>) {
  useEffect(() => {
    let frame = 0;
    let active = true;

    function loop(timestamp: number) {
      if (!active) return;
      if (!document.hidden) {
        rendererRef.current?.render(timestamp);
      }
      frame = window.requestAnimationFrame(loop);
    }

    frame = window.requestAnimationFrame(loop);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, [rendererRef]);
}
