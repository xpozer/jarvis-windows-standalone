import { useCallback, useMemo } from "react";
import type { OrbState } from "../core/types";
import { useWebSocket } from "../hooks/useWebSocket";
import { useOrbStore } from "../state/orbStore";

type OrbStateMessage =
  | { type: "state_change"; state: OrbState }
  | { type: "audio_level"; level: number };

function isOrbState(value: unknown): value is OrbState {
  return value === "idle" || value === "listening" || value === "thinking" || value === "speaking" || value === "error";
}

export function useOrbStateChannel() {
  const setState = useOrbStore((store) => store.setState);
  const setAudioLevel = useOrbStore((store) => store.setAudioLevel);
  const url = useMemo(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/orb-state`;
  }, []);

  const onMessage = useCallback((payload: unknown) => {
    const message = payload as Partial<OrbStateMessage>;
    if (message.type === "state_change" && isOrbState(message.state)) {
      setState(message.state);
    }
    if (message.type === "audio_level" && typeof message.level === "number") {
      setAudioLevel(message.level);
    }
  }, [setAudioLevel, setState]);

  const onDisconnect = useCallback(() => {
    setState("error");
  }, [setState]);

  useWebSocket({
    url,
    enabled: true,
    onMessage,
    onClose: onDisconnect,
    onError: onDisconnect,
  });
}
