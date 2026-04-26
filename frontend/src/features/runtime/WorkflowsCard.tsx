import type { Workflow } from "./runtimeTypes";

type Props = {
  workflows: Workflow[];
  workflowName: string;
  onWorkflowNameChange: (value: string) => void;
  onCreateDemoWorkflow: () => void;
  onRunWorkflow: (workflow: Workflow) => void;
};

export function WorkflowsCard({ workflows, workflowName, onWorkflowNameChange, onCreateDemoWorkflow, onRunWorkflow }: Props) {
  return (
    <section className="runtime-control-card runtime-control-card-wide">
      <div className="runtime-control-card-title"><h2>Workflows</h2><span>self healing runner</span></div>
      <div className="runtime-control-form">
        <input value={workflowName} onChange={(e) => onWorkflowNameChange(e.target.value)} placeholder="Workflow Name" />
        <button onClick={() => void onCreateDemoWorkflow()}>CREATE DEMO</button>
      </div>
      <div className="runtime-control-list workflow-list">
        {workflows.map((workflow) => (
          <article key={workflow.id}>
            <b>{workflow.name}</b>
            <span>{workflow.description || "Kein Beschreibungstext"}</span>
            <em>{workflow.enabled ? "enabled" : "disabled"} · {workflow.authority_policy}</em>
            <div className="runtime-control-row-actions"><button onClick={() => void onRunWorkflow(workflow)}>RUN</button></div>
          </article>
        ))}
        {!workflows.length && <p className="runtime-control-empty">Noch keine Workflows. Erstelle einen Demo Workflow.</p>}
      </div>
    </section>
  );
}
