import { useOrbStore } from "../state/orbStore";
import type { CommandHandler, CommandObject, CommandResult, ParsedCommand, Suggestion } from "./types";

export class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  private suggestions = new Map<string, Suggestion>();

  register(command: string, handler: CommandHandler, suggestion?: Omit<Suggestion, "command">) {
    const normalized = this.normalizeCommand(command);
    this.handlers.set(normalized, handler);
    this.suggestions.set(normalized, {
      command: normalized,
      label: suggestion?.label ?? normalized,
      description: suggestion?.description ?? "Command stub",
    });
  }

  parse(input: string, source: CommandObject["source"] = "text"): ParsedCommand {
    const raw = input.trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    const first = parts[0] ?? "";
    const isSlashCommand = first.startsWith("/");
    const command = isSlashCommand ? this.normalizeCommand(first) : "text";
    const args = isSlashCommand ? parts.slice(1) : parts;

    return {
      raw,
      command,
      args,
      source,
      timestamp: Date.now(),
      isSlashCommand,
    };
  }

  async execute(input: string, source: CommandObject["source"] = "text"): Promise<CommandResult> {
    const orb = useOrbStore.getState();
    orb.setState("thinking");

    try {
      const parsed = this.parse(input, source);
      const handler = this.handlers.get(parsed.command);

      if (!handler) {
        const result = {
          ok: false,
          command: parsed.command,
          message: parsed.isSlashCommand
            ? `Unknown command: ${parsed.command}`
            : "Text input captured. Backend binding follows in a later block.",
          payload: parsed,
        };
        orb.setState("error");
        return result;
      }

      const result = await handler(parsed);
      orb.setState(result.ok ? "speaking" : "error");
      if (result.ok) {
        window.setTimeout(() => useOrbStore.getState().setState("idle"), 1500);
      }
      return result;
    } catch (error) {
      orb.setState("error");
      return {
        ok: false,
        command: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getSuggestions(partial: string): Suggestion[] {
    const value = partial.trim().toLowerCase();
    if (!value.startsWith("/")) return [];

    return Array.from(this.suggestions.values())
      .filter((item) => item.command.startsWith(value))
      .sort((a, b) => a.command.localeCompare(b.command));
  }

  private normalizeCommand(command: string) {
    return command.startsWith("/") ? command.toLowerCase() : `/${command.toLowerCase()}`;
  }
}
