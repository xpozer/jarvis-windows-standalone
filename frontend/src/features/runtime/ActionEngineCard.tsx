import { pretty } from "./runtimeFormat";

type Props = {
  actionBusy: boolean;
  actionPath: string;
  actionUrl: string;
  mkdirPath: string;
  writePath: string;
  writeContent: string;
  copySource: string;
  copyDestination: string;
  actionResult: unknown;
  onActionPathChange: (value: string) => void;
  onActionUrlChange: (value: string) => void;
  onMkdirPathChange: (value: string) => void;
  onWritePathChange: (value: string) => void;
  onWriteContentChange: (value: string) => void;
  onCopySourceChange: (value: string) => void;
  onCopyDestinationChange: (value: string) => void;
  onRunAction: (toolId: string, payload?: Record<string, unknown>) => void;
};

export function ActionEngineCard({
  actionBusy,
  actionPath,
  actionUrl,
  mkdirPath,
  writePath,
  writeContent,
  copySource,
  copyDestination,
  actionResult,
  onActionPathChange,
  onActionUrlChange,
  onMkdirPathChange,
  onWritePathChange,
  onWriteContentChange,
  onCopySourceChange,
  onCopyDestinationChange,
  onRunAction,
}: Props) {
  return (
    <section className="runtime-control-card runtime-action-card runtime-action-card-level2">
      <div className="runtime-control-card-title"><h2>Action Engine</h2><span>level 2 gated tools</span></div>
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

      <div className="runtime-action-divider"><span>Authority gated filesystem</span></div>

      <div className="runtime-control-form runtime-action-path">
        <input value={mkdirPath} onChange={(e) => onMkdirPathChange(e.target.value)} placeholder="Ordnerpfad, z.B. data/test-folder" />
        <button onClick={() => void onRunAction("filesystem.make_dir", { path: mkdirPath })}>PREPARE MKDIR</button>
      </div>

      <div className="runtime-control-form runtime-action-path">
        <input value={writePath} onChange={(e) => onWritePathChange(e.target.value)} placeholder="Textdatei Pfad, z.B. data/test.txt" />
        <button onClick={() => void onRunAction("filesystem.write_text_file", { path: writePath, content: writeContent, overwrite: false })}>PREPARE WRITE</button>
      </div>
      <textarea className="runtime-action-textarea" value={writeContent} onChange={(e) => onWriteContentChange(e.target.value)} placeholder="Textinhalt, max. 128 KB. Überschreiben ist im UI bewusst aus." />

      <div className="runtime-action-copy-grid">
        <input value={copySource} onChange={(e) => onCopySourceChange(e.target.value)} placeholder="Quelle" />
        <input value={copyDestination} onChange={(e) => onCopyDestinationChange(e.target.value)} placeholder="Ziel" />
        <button onClick={() => void onRunAction("filesystem.copy_file", { source: copySource, destination: copyDestination, overwrite: false })}>PREPARE COPY</button>
      </div>

      <pre className="runtime-action-result">{actionResult ? pretty(actionResult) : "Noch kein Action Ergebnis."}</pre>
    </section>
  );
}
