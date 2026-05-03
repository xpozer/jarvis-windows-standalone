import { CommandBus } from "./CommandBus";
import type { CommandResult } from "./types";

const F1_COMMANDS = [
  ["/help", "Help", "Show available commands"],
  ["/clear", "Clear", "Clear command history"],
  ["/agents", "Agents", "Open agents overlay in a later block"],
  ["/tools", "Tools", "Open tools overlay in a later block"],
  ["/audit", "Audit", "Open audit overlay in a later block"],
  ["/diag", "Diagnostics", "Open diagnostics overlay in a later block"],
  ["/settings", "Settings", "Open settings overlay in a later block"],
  ["/sap", "SAP", "Route to SAP workspace in a later block"],
  ["/vde", "VDE", "Route to VDE workspace in a later block"],
  ["/knowledge", "Knowledge", "Route to knowledge workspace in a later block"],
  ["/work", "Work", "Route to work command workspace in a later block"],
] as const;

export function createCommandBus() {
  const bus = new CommandBus();

  for (const [command, label, description] of F1_COMMANDS) {
    bus.register(
      command,
      (input): CommandResult => {
        const result: CommandResult = {
          ok: true,
          command,
          message: `${command} accepted as F1 stub`,
          payload: input,
        };
        console.log("[JARVIS:F1:COMMAND]", result);
        return result;
      },
      { label, description },
    );
  }

  return bus;
}

export const registeredCommandNames = F1_COMMANDS.map(([command]) => command);
