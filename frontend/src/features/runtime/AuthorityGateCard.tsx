import type { ActionRequest } from "./runtimeTypes";

type Props = {
  actions: ActionRequest[];
  onApprove: (action: ActionRequest, approve: boolean) => void;
  onExecute: (action: ActionRequest) => void;
};

export function AuthorityGateCard({ actions, onApprove, onExecute }: Props) {
  return (
    <section className="runtime-control-card">
      <div className="runtime-control-card-title"><h2>Authority Gate</h2><span>pending actions</span></div>
      <div className="runtime-control-list compact">
        {actions.map((action) => (
          <article key={action.id} className={`risk-${action.risk}`}>
            <b>{action.action_type}</b>
            <span>{action.summary}</span>
            <em>{action.risk} · {action.status}</em>
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
