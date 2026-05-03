import { useEffect, useRef } from "react";
import { OrbCanvas } from "./OrbCanvas";
import { useAudioReactive } from "./useAudioReactive";
import { useOrbAnimation } from "./useOrbAnimation";
import { useOrbState } from "./useOrbState";

export function Orb() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<OrbCanvas | null>(null);
  const { state, audioLevel, setAudioLevel } = useOrbState();
  const reactiveAudioLevel = useAudioReactive();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new OrbCanvas(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(2, window.devicePixelRatio || 1);
      renderer.resize(rect.width, rect.height, dpr);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      observer.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setState(state, 600);
  }, [state]);

  useEffect(() => {
    const level = Math.max(audioLevel, reactiveAudioLevel);
    rendererRef.current?.setAudioLevel(level);
    if (reactiveAudioLevel > 0) setAudioLevel(reactiveAudioLevel);
  }, [audioLevel, reactiveAudioLevel, setAudioLevel]);

  useOrbAnimation(rendererRef);

  return <canvas ref={canvasRef} className="orb-canvas" aria-label={`JARVIS Orb ${state}`} />;
}
