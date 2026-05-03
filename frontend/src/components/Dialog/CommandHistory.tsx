import type { DialogHistoryEntry } from "../../core/types";

type CommandHistoryProps = {
  history: DialogHistoryEntry[];
};

export function CommandHistory({ history }: CommandHistoryProps) {
  if (history.length === 0) return null;

  return (
    <aside className="command-history" aria-label="Command history">
      {history.slice(0, 3).map((entry) => (
        <div key={`${entry.timestamp}-${entry.input}`}>
          <span>{entry.input}</span>
          <small>{entry.result.message}</small>
        </div>
      ))}
    </aside>
  );
}
