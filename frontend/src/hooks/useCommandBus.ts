import { useMemo } from "react";
import { createCommandBus } from "../core/CommandRegistry";

export function useCommandBus() {
  return useMemo(() => createCommandBus(), []);
}
