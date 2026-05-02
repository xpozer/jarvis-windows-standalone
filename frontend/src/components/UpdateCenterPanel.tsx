import { useEffect, useMemo, useState } from "react";
import { addonVisibilityItems, defaultVisibleAddonIds, loadVisibleAddonIds, saveVisibleAddonIds } from "../features/dashboard/addonVisibility";
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

type DashboardTheme = "jarvis" | "matrix" | "ultron";

type Props = {
  onSend: (message: string) => void;
  dashboardTheme: DashboardTheme;
  onThemeChange: (theme: DashboardTheme) => void;
};

const themeOptions: Array<{ id: DashboardTheme; label: string; description: string; accent: string }> = [
  { id: "jarvis", label: "JARVIS", description: "Klassisches blaues HUD mit Orb-Fokus.", accent: "Cyan" },
  { id: "matrix", label: "MATRIX", description: "Gruener Datenstrom fuer Analyse-Modus.", accent: "Gruen" },
  { id: "ultron", label: "ULTRON", description: "Roter Kontrollmodus mit Warn-Kontrast.", accent: "Rot" },
];

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

export function UpdateCenterPanel({ onSend, dashboardTheme, onThemeChange }: Props) {
  const [status, setStatus] = useState<UpdateCenterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("jarvis_core");
  const [error, setError] = useState("");
  const [visibleAddonIds, setVisibleAddonIds] = useState(loadVisibleAddonIds);

  const components = useMemo(() => Object.values(status?.components || {}), [status]);
  const selected = components.find((item) => item.id === selectedId) || components[0];
  const visibleAddonSet = useMemo(() => new Set(visibleAddonIds), [visibleAddonIds]);
  const hiddenAddonCount = addonVisibilityItems.length - visibleAddonIds.length;

  function toggleAddon(id: string) {
    const next = visibleAddonSet.has(id)
      ? visibleAddonIds.filter((item) => item !== id)
      : [...visibleAddonIds, id];
    setVisibleAddonIds(saveVisibleAddonIds(next));
  }

  function resetAddons() {
    setVisibleAddonIds(saveVisibleAddonIds(defaultVisibleAddonIds()));
  }

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
          <small>SYSTEM / OPTIONEN</small>
          <h1>Optionen / Updates</h1>
          <p>{status?.policy || "JARVIS prueft Updates automatisch. Installiert wird erst nach klarer Bestaetigung."} Theme-Wechsel wirken sofort auf diese Oberflaeche.</p>
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

      <div className="update-theme-panel addon-visibility-panel">
        <div className="update-theme-title">
          <div>
            <small>OBERFLAECHE</small>
            <h2>Addons einblenden</h2>
          </div>
          <strong>{hiddenAddonCount ? `${hiddenAddonCount} AUS` : "ALLE AN"}</strong>
        </div>
        <p className="addon-visibility-copy">Blende Module aus, die du gerade nicht brauchst. Die Funktionen bleiben vorhanden und koennen jederzeit wieder aktiviert werden.</p>
        <div className="addon-visibility-grid">
          {addonVisibilityItems.map((addon) => {
            const enabled = visibleAddonSet.has(addon.id);
            return (
              <button
                type="button"
                key={addon.id}
                className={`addon-visibility-option ${enabled ? "active" : "inactive"}`}
                onClick={() => toggleAddon(addon.id)}
              >
                <span className="addon-toggle-dot" />
                <b>{addon.label}</b>
                <em>{addon.description}</em>
              </button>
            );
          })}
        </div>
        <div className="addon-visibility-actions">
          <button type="button" onClick={resetAddons}>ALLE STANDARDMODULE EINBLENDEN</button>
        </div>
      </div>

      <div className="update-theme-panel">
        <div className="update-theme-title">
          <div>
            <small>OBERFLAECHE</small>
            <h2>Theme wechseln</h2>
          </div>
          <strong>{dashboardTheme.toUpperCase()}</strong>
        </div>
        <div className="update-theme-list">
          {themeOptions.map((theme) => (
            <button
              type="button"
              key={theme.id}
              className={`update-theme-option ${theme.id} ${dashboardTheme === theme.id ? "active" : ""}`}
              onClick={() => onThemeChange(theme.id)}
            >
              <span>{theme.accent}</span>
              <b>{theme.label}</b>
              <em>{theme.description}</em>
            </button>
          ))}
        </div>
      </div>

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
