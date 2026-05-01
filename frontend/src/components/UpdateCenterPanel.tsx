import { useEffect, useMemo, useState } from "react";
import "./update-center-panel.css";

type UpdateStatus = "ok" | "warn" | "error" | "unknown";

type UpdateAction = {
  id: string;
  label: string;
  risk: "low" | "medium" | "high" | string;
  requires_confirmation: boolean;
  auto_execute: boolean;
  command: string;
};

type UpdateComponent = {
  id: string;
  name: string;
  status: UpdateStatus;
  current?: string;
  latest?: string;
  update_available?: boolean;
  safe_to_check?: boolean;
  requires_confirmation?: boolean;
  details?: Record<string, unknown>;
  actions?: UpdateAction[];
};

type UpdateCenterStatus = {
  ok?: boolean;
  checked_at?: string;
  auto_apply?: boolean;
  policy?: string;
  summary?: Record<string, number>;
  components?: Record<string, UpdateComponent>;
  logs?: string[];
};

type Props = {
  onSend: (message: string) => void;
};

function statusLabel(status: UpdateStatus) {
  if (status === "ok") return "AKTUELL";
  if (status === "warn") return "AKTION";
  if (status === "error") return "FEHLER";
  return "UNKLAR";
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "N/A";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  try { return JSON.stringify(value); } catch { return String(value); }
}

export function UpdateCenterPanel({ onSend }: Props) {
  const [status, setStatus] = useState<UpdateCenterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("jarvis_core");
  const [error, setError] = useState("");

  const components = useMemo(() => Object.values(status?.components || {}), [status]);
  const selected = components.find((item) => item.id === selectedId) || components[0];

  async function loadStatus(refresh = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(refresh ? "/api/updates/check" : "/api/updates/status", {
        method: refresh ? "POST" : "GET",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : `HTTP ${response.status}`);
      setStatus(data as UpdateCenterStatus);
      const first = Object.keys((data as UpdateCenterStatus).components || {})[0];
      if (!selectedId && first) setSelectedId(first);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : String(exc));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus(false);
  }, []);

  return (
    <section className="update-center-shell">
      <div className="update-center-header">
        <div>
          <small>KERN / WARTUNG</small>
          <h1>Update Center</h1>
          <p>{status?.policy || "JARVIS prueft Updates automatisch. Installiert wird erst nach klarer Bestaetigung."}</p>
        </div>
        <div className="update-center-actions">
          <button onClick={() => void loadStatus(true)} disabled={loading}>{loading ? "PRUEFT..." : "JETZT PRUEFEN"}</button>
          <button onClick={() => onSend("Pruefe alle JARVIS Updates und gib mir einen sicheren Aktualisierungsplan.")}>PLAN IM CHAT</button>
        </div>
      </div>

      <div className="update-center-summary">
        <span><b>{status?.summary?.ok ?? 0}</b> aktuell</span>
        <span><b>{status?.summary?.warn ?? 0}</b> Aktion</span>
        <span><b>{status?.summary?.error ?? 0}</b> Fehler</span>
        <span><b>{status?.summary?.unknown ?? 0}</b> unklar</span>
      </div>

      {error && <div className="update-center-error">{error}</div>}

      <div className="update-center-grid">
        <div className="update-component-list">
          {components.map((component) => (
            <button
              key={component.id}
              className={`update-component-row ${component.status} ${selected?.id === component.id ? "active" : ""}`}
              onClick={() => setSelectedId(component.id)}
            >
              <span />
              <b>{component.name}</b>
              <em>{statusLabel(component.status)}</em>
              <small>{component.update_available ? "Update verfuegbar" : component.current || "Bereit"}</small>
            </button>
          ))}
        </div>

        <div className="update-detail-panel">
          {selected ? (
            <>
              <div className="update-detail-title">
                <div>
                  <small>{selected.id}</small>
                  <h2>{selected.name}</h2>
                </div>
                <strong className={selected.status}>{statusLabel(selected.status)}</strong>
              </div>

              <div className="update-facts">
                <span><b>Aktuell</b>{selected.current || "N/A"}</span>
                <span><b>Neueste</b>{selected.latest || "N/A"}</span>
                <span><b>Auto Apply</b>{status?.auto_apply ? "Ja" : "Nein"}</span>
                <span><b>Bestaetigung</b>{selected.requires_confirmation ? "Pflicht" : "Nein"}</span>
              </div>

              <div className="update-action-list">
                {(selected.actions || []).map((action) => (
                  <button key={action.id} className={`risk-${action.risk}`} title={action.command}>
                    <b>{action.label}</b>
                    <span>{action.requires_confirmation ? "Bestaetigung erforderlich" : "Direkt moeglich"}</span>
                  </button>
                ))}
              </div>

              <div className="update-debug">
                <h3>Details</h3>
                <dl>
                  {Object.entries(selected.details || {}).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{formatValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          ) : (
            <p>Keine Update-Daten geladen.</p>
          )}
        </div>
      </div>
    </section>
  );
}
