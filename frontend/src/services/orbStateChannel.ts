import type { OrbState } from "../core/types";
import { useWebSocket } from "../hooks/useWebSocket";
import { useOrbStore } from "../state/orbStore";

type OrbStateMessage =
  | { type: "state_change"; state: OrbState }
  | { type: "audio_level"; level: number };

function getOrbStateUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/orb-state`;
}

function isOrbState(value: unknown): value is OrbState {
  return value === "idle" || value === "listening" || value === "thinking" || value === "speaking" || value === "error";
}

export function useOrbStateChannel() {
  const setState = useOrbStore((store) => store.setState);
  const setAudioLevel = useOrbStore((store) => store.setAudioLevel);

  useWebSocket({
    url: getOrbStateUrl(),
    enabled: true,
    onMessage: (payload) => {
      const message = payload as Partial<OrbStateMessage>;
      if (message.type === "state_change" && isOrbState(message.state)) {
        setState(message.state);
      }
      if (message.type === "audio_level" && typeof message.level === "number") {
        setAudioLevel(message.level);
      }
    },
    onClose: () => {
      setState("error");
    },
    onError: () => {
      setState("error");
    },
  });
}
