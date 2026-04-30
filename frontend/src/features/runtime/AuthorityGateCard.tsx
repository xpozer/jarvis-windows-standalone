import { useMemo, useState } from "react";
import type { ActionRequest } from "./runtimeTypes";
import { pretty } from "./runtimeFormat";

type Filter = "all" | "pending_approval" | "approved" | "executed" | "execution_failed" | "rejected";

type Props = {
  actions: ActionRequest[];
  onApprove: (action: ActionRequest, approve: boolean) => void;
  onExecute: (action: ActionRequest) => void;
};

function compactResult(result: unknown) {
  const text = pretty(result);
  if (!text) return "";
  return text.length > 420 ? `${text.slice(0, 420)}...` : text;
}

function countByStatus(actions: ActionRequest[], status: Filter) {
  if (status === "all") return actions.length;
  return actions.filter((action) => action.status === status).length;
}

export function AuthorityGateCard({ actions, onApprove, onExecute }: Props) {
  const [filter, setFilter] = useState<Filter>("pending_approval");
  const visibleActions = useMemo(() => {
    if (filter === "all") return actions;
    return actions.filter((action) => action.status === filter);
  }, [actions, filter]);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "pending_approval", label: "OFFEN" },
    { id: "approved", label: "FREIGEGEBEN" },
    { id: "executed", label: "ERLEDIGT" },
    { id: "execution_failed", label: "FEHLER" },
    { id: "rejected", label: "ABGELEHNT" },
    { id: "all", label: "ALLE" },
  ];

  return (
    <section className="runtime-control-card">
      <div className="runtime-control-card-title"><h2>Freigabezentrale</h2><span>{visibleActions.length} sichtbar</span></div>
      <div className="runtime-authority-filters">
        {filters.map((item) => (
          <button key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)}>
            {item.label}<small>{countByStatus(actions, item.id)}</small>
          </button>
        ))}
      </div>
      <div className="runtime-control-list compact runtime-authority-list">
        {visibleActions.map((action) => (
          <article key={action.id} className={`risk-${action.risk} status-${action.status}`}>
            <b>{String(action.action_type || "")}</b>
            <span>{String(action.summary || "")}</span>
            <em>{String(action.risk || "")} / {String(action.status || "")}</em>
            {Boolean(action.result) && Object.keys(action.result as Record<string, unknown>).length > 0 ? (
              <pre className="runtime-authority-result">{compactResult(action.result)}</pre>
            ) : null}
            {action.status === "pending_approval" && (
              <div className="runtime-control-row-actions">
                <button onClick={() => void onApprove(action, true)}>FREIGEBEN</button>
                <button onClick={() => void onApprove(action, false)}>ABLEHNEN</button>
              </div>
            )}
            {action.status === "approved" && (
              <div className="runtime-control-row-actions">
                <button onClick={() => void onExecute(action)}>AUSFUEHREN</button>
              </div>
            )}
          </article>
        ))}
        {!visibleActions.length && <p className="runtime-control-empty">Keine Aktionen fuer diesen Filter.</p>}
      </div>
    </section>
  );
}
