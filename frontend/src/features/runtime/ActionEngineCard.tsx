import { pretty } from "./runtimeFormat";

type Props = {
  actionBusy: boolean;
  actionPath: string;
  actionUrl: string;
  actionResult: unknown;
  onActionPathChange: (value: string) => void;
  onActionUrlChange: (value: string) => void;
  onRunAction: (toolId: string, payload?: Record<string, unknown>) => void;
};

export function ActionEngineCard({ actionBusy, actionPath, actionUrl, actionResult, onActionPathChange, onActionUrlChange, onRunAction }: Props) {
  return (
    <section className="runtime-control-card runtime-action-card">
      <div className="runtime-control-card-title"><h2>Action Engine</h2><span>level 1 safe tools</span></div>
      <div className="runtime-action-toolbar">
        <button onClick={() => void onRunAction("system.info")}>{actionBusy ? "..." : "SYSTEM"}</button>
        <button onClick={() => void onRunAction("git.status")}>GIT STATUS</button>
        <button onClick={() => void onRunAction("git.branch")}>BRANCH</button>
        <button onClick={() => void onRunAction("process.list", { limit: 25 })}>PROCESSES</button>
      </div>
      <div className="runtime-control-form runtime-action-path">
        <input value={actionPath} onChange={(e) => onActionPathChange(e.target.value)} placeholder="Pfad optional, leer = Projektordner" />
        <button onClick={() => void onRunAction("filesystem.list_dir", { path: actionPath || undefined, limit: 60 })}>LIST</button>
      </div>
      <div className="runtime-control-form runtime-action-path">
        <input value={actionUrl} onChange={(e) => onActionUrlChange(e.target.value)} placeholder="URL für Browser Action" />
        <button onClick={() => void onRunAction("browser.open_url", { url: actionUrl })}>PREPARE URL</button>
      </div>
      <pre className="runtime-action-result">{actionResult ? pretty(actionResult) : "Noch kein Action Ergebnis."}</pre>
    </section>
  );
}
