import type { ActionRequest } from "./runtimeTypes";
import { pretty } from "./runtimeFormat";

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

export function AuthorityGateCard({ actions, onApprove, onExecute }: Props) {
  return (
    <section className="runtime-control-card">
      <div className="runtime-control-card-title"><h2>Authority Gate</h2><span>pending actions</span></div>
      <div className="runtime-control-list compact">
        {actions.map((action) => (
          <article key={action.id} className={`risk-${action.risk} status-${action.status}`}>
            <b>{action.action_type}</b>
            <span>{action.summary}</span>
            <em>{action.risk} · {action.status}</em>
            {action.result && Object.keys(action.result as Record<string, unknown>).length > 0 && (
              <pre className="runtime-authority-result">{compactResult(action.result)}</pre>
            )}
            {action.status === "pending_approval" && (
              <div className="runtime-control-row-actions">
                <button onClick={() => void onApprove(action, true)}>APPROVE</button>
                <button onClick={() => void onApprove(action, false)}>REJECT</button>
              </div>
            )}
            {action.status === "approved" && (
              <div className="runtime-control-row-actions">
                <button onClick={() => void onExecute(action)}>EXECUTE</button>
              </div>
            )}
          </article>
        ))}
        {!actions.length && <p className="runtime-control-empty">Keine Actions vorhanden.</p>}
      </div>
    </section>
  );
}
