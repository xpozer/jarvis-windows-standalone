import { useEffect, useMemo, useState } from "react";
import "./security-panel.css";

type Action = {
  id: string;
  type: string;
  risk?: string;
  status?: string;
  message?: string;
  created_at?: string;
  payload?: Record<string, unknown>;
};

type WindowsInfo = {
  apps?: string[];
  folders?: string[];
};

type Props = {
  onSend: (message: string) => void;
};

type LoadState = "idle" | "loading" | "ok" | "error";

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? String((data as { detail: unknown }).detail) : text || `HTTP ${response.status}`;
    throw new Error(detail);
  }
  return data;
}

function actionText(action: Action) {
  const payload = action.payload || {};
  if (action.type === "tool_run") return `Werkzeug ${payload.tool_id || "unbekannt"}`;
  if (action.type === "write_text_file") return `Datei schreiben: ${payload.path || "unbekannt"}`;
  if (action.type === "copy_file") return `Datei kopieren: ${payload.src || "Quelle"} -> ${payload.dst || "Ziel"}`;
  return action.type || "Aktion";
}

export function SecurityPanel({ onSend }: Props) {
  const [actions, setActions] = useState<Action[]>([]);
  const [windowsInfo, setWindowsInfo] = useState<WindowsInfo>({});
  const [ports, setPorts] = useState<unknown>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [targetType, setTargetType] = useState<"open_app" | "open_folder">("open_app");
  const [targetName, setTargetName] = useState("notepad");
  const [result, setResult] = useState<unknown>(null);

  const selected = useMemo(() => actions.find((item) => item.id === selectedId) || actions[0], [actions, selectedId]);
  const safeTargets = targetType === "open_app" ? windowsInfo.apps || [] : windowsInfo.folders || [];

  async function loadAll() {
    setStatus("loading");
    setError("");
    try {
      const [pendingData, windowsData, portsData] = await Promise.all([
        requestJson("/actions/pending"),
        requestJson("/windows/apps"),
        requestJson("/diagnostic/ports"),
      ]);
      const nextActions = Array.isArray((pendingData as { actions?: unknown[] }).actions) ? (pendingData as { actions: Action[] }).actions : [];
      setActions(nextActions);
      setWindowsInfo(windowsData as WindowsInfo);
      setPorts(portsData);
      if (!selectedId && nextActions[0]) setSelectedId(nextActions[0].id);
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const fallback = targetType === "open_app" ? "notepad" : "downloads";
    setTargetName(safeTargets[0] || fallback);
  }, [targetType, windowsInfo.apps, windowsInfo.folders]);

  async function confirmAction(action: Action) {
    setResult({ status: "Bestaetige", action_id: action.id });
    const data = await requestJson("/actions/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: action.id }),
    });
    setResult(data);
    await loadAll();
  }

  async function cancelAction(action: Action) {
    setResult({ status: "Verwerfe", action_id: action.id });
    const data = await requestJson("/actions/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: action.id }),
    });
    setResult(data);
    await loadAll();
  }

  async function prepareWindowsAction() {
    const tool_id = targetType;
    const key = targetType === "open_app" ? "name" : "folder";
    setResult({ status: "Bereite vor", tool_id, target: targetName });
    const data = await requestJson("/tools/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_id, args: { [key]: targetName } }),
    });
    setResult(data);
    await loadAll();
  }

  return (
    <section className="jv-security-shell">
      <div className="jv-security-header">
        <div>
          <small>Sicherheit</small>
          <h1>Sicherheitszentrale</h1>
          <p>Offene Bestätigungen, Windows-Allowlist und riskante Werkzeugausführung an einem ruhigen Ort.</p>
        </div>
        <div className="jv-security-actions">
          <button onClick={loadAll}>{status === "loading" ? "LAEDT" : "AKTUALISIEREN"}</button>
          <button onClick={() => onSend("Pruefe offene Aktionen und Windows Freigaben")}>CHAT PRUEFUNG</button>
        </div>
      </div>

      {error && <div className="jv-sec-error">{error}</div>}

      <div className="jv-sec-summary">
        <div><b>{actions.length}</b><span>offen</span></div>
        <div><b>{(windowsInfo.apps || []).length}</b><span>Apps</span></div>
        <div><b>{(windowsInfo.folders || []).length}</b><span>Ordner</span></div>
        <div><b>{status}</b><span>Status</span></div>
      </div>

      <div className="jv-sec-grid">
        <section className="jv-sec-card">
          <div className="jv-sec-title"><h2>Offene Aktionen</h2><span>{actions.length}</span></div>
          <div className="jv-sec-list">
            {actions.length ? actions.map((action) => (
              <button key={action.id} className={`jv-sec-action ${selected?.id === action.id ? "active" : ""}`} onClick={() => setSelectedId(action.id)}>
                <div><b>{actionText(action)}</b><em>{action.risk || "confirm"}</em></div>
                <p>{action.message || "Wartet auf sichtbare Bestaetigung."}</p>
                <span>{action.created_at || action.id}</span>
              </button>
            )) : <div className="jv-sec-empty">Keine offenen Aktionen.</div>}
          </div>
        </section>

        <section className="jv-sec-card">
          <div className="jv-sec-title"><h2>Windows Freigaben</h2><span>Allowlist</span></div>
          <div className="jv-sec-targets">
            <label>
              <span>Aktion</span>
              <select value={targetType} onChange={(event) => setTargetType(event.target.value as "open_app" | "open_folder")}>
                <option value="open_app">App vorbereiten</option>
                <option value="open_folder">Ordner vorbereiten</option>
              </select>
            </label>
            <label>
              <span>Ziel</span>
              <select value={targetName} onChange={(event) => setTargetName(event.target.value)}>
                {safeTargets.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button onClick={prepareWindowsAction}>SICHER VORBEREITEN</button>
          </div>
          <div className="jv-sec-chips">
            {safeTargets.slice(0, 16).map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="jv-sec-card jv-sec-detail">
          <div className="jv-sec-title"><h2>Bestätigung</h2><span>{selected ? selected.status || "pending" : "leer"}</span></div>
          {selected ? (
            <>
              <div className="jv-sec-selected">
                <b>{actionText(selected)}</b>
                <p>{selected.message || "Diese Aktion wird erst nach deiner Bestaetigung ausgefuehrt."}</p>
                <pre>{pretty(selected.payload || {})}</pre>
              </div>
              <div className="jv-sec-buttons">
                <button onClick={() => void confirmAction(selected)}>BESTAETIGEN</button>
                <button className="danger" onClick={() => void cancelAction(selected)}>VERWERFEN</button>
              </div>
            </>
          ) : <div className="jv-sec-empty">Keine Aktion ausgewählt.</div>}
        </section>

        <section className="jv-sec-card jv-sec-debug">
          <div className="jv-sec-title"><h2>Prüfbereich</h2><span>Ports / Ergebnis</span></div>
          <pre>{pretty(result || ports || { status })}</pre>
        </section>
      </div>
    </section>
  );
}
