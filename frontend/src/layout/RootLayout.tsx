import { useRef } from "react";
import { useCommandBus } from "../hooks/useCommandBus";
import { useHotkeys } from "../hooks/useHotkeys";
import { useOrbStateChannel } from "../services/orbStateChannel";
import { DialogSlot } from "./DialogSlot";
import { HudSlot } from "./HudSlot";
import { OrbSlot } from "./OrbSlot";

export function RootLayout() {
  const bus = useCommandBus();
  const inputRef = useRef<HTMLInputElement>(null);
  useHotkeys({ inputRef });
  useOrbStateChannel();

  return (
    <div className="jarvis-v18-root">
      <div className="jarvis-v18-background" />
      <HudSlot />
      <OrbSlot />
      <DialogSlot bus={bus} inputRef={inputRef} />
    </div>
  );
}
