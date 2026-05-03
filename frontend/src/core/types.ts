export type CommandSource = "text" | "voice" | "hotkey";
export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";
export type HudCornerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type CommandObject = {
  raw: string;
  command: string;
  args: string[];
  source: CommandSource;
  timestamp: number;
};

export type ParsedCommand = CommandObject & {
  isSlashCommand: boolean;
};

export type CommandResult = {
  ok: boolean;
  command: string;
  message: string;
  payload?: unknown;
};

export type Suggestion = {
  command: string;
  label: string;
  description: string;
};

export type CommandHandler = (command: CommandObject) => Promise<CommandResult> | CommandResult;

export type DialogHistoryEntry = {
  input: string;
  result: CommandResult;
  timestamp: number;
};

export type WebSocketChannel = "/telemetry" | "/audit" | "/orb-state";
