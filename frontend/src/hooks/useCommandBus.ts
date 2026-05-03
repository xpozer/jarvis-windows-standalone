import { useCallback, useMemo, useRef, useState } from "react";

export type CommandSource = "text" | "voice" | "hotkey";

export interface BusCommand {
  raw: string;
  slash: string | null;
  args: string;
  source: CommandSource;
  timestamp: number;
}

export type CommandHandler = (command: BusCommand) => void | Promise<void>;

function parseInput(raw: string): { slash: string | null; args: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) {
    return { slash: null, args: trimmed };
  }
  const space = trimmed.indexOf(" ");
  if (space === -1) {
    return { slash: trimmed.slice(1).toLowerCase(), args: "" };
  }
  return {
    slash: trimmed.slice(1, space).toLowerCase(),
    args: trimmed.slice(space + 1).trim(),
  };
}

export function useCommandBus(defaultHandler?: CommandHandler) {
  const [history, setHistory] = useState<BusCommand[]>([]);
  const handlerRef = useRef<CommandHandler | undefined>(defaultHandler);

  const setHandler = useCallback((handler: CommandHandler | undefined) => {
    handlerRef.current = handler;
  }, []);

  const dispatch = useCallback(
    async (raw: string, source: CommandSource = "text") => {
      const parsed = parseInput(raw);
      const command: BusCommand = {
        raw,
        slash: parsed.slash,
        args: parsed.args,
        source,
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev.slice(-49), command]);
      if (handlerRef.current) {
        await handlerRef.current(command);
      }
      return command;
    },
    [],
  );

  return useMemo(
    () => ({
      dispatch,
      setHandler,
      history,
    }),
    [dispatch, setHandler, history],
  );
}

export function parseSlashCommand(raw: string) {
  return parseInput(raw);
}
