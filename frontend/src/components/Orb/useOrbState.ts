import { useOrbStore } from "../../state/orbStore";

export function useOrbState() {
  const state = useOrbStore((store) => store.state);
  const audioLevel = useOrbStore((store) => store.audioLevel);
  const intensity = useOrbStore((store) => store.intensity);
  const setState = useOrbStore((store) => store.setState);
  const setAudioLevel = useOrbStore((store) => store.setAudioLevel);

  return { state, audioLevel, intensity, setState, setAudioLevel };
}
