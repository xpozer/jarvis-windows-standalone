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
      <div className="runtime-control-card-title"><h2>Abläufe</h2><span>selbstheilender Runner</span></div>
      <div className="runtime-control-form">
        <input value={workflowName} onChange={(e) => onWorkflowNameChange(e.target.value)} placeholder="Ablaufname" />
        <button onClick={() => void onCreateDemoWorkflow()}>DEMO ERSTELLEN</button>
      </div>
      <div className="runtime-control-list workflow-list">
        {workflows.map((workflow) => (
          <article key={workflow.id}>
            <b>{workflow.name}</b>
            <span>{workflow.description || "Kein Beschreibungstext"}</span>
            <em>{workflow.enabled ? "aktiv" : "inaktiv"} / {workflow.authority_policy}</em>
            <div className="runtime-control-row-actions"><button onClick={() => void onRunWorkflow(workflow)}>AUSFUEHREN</button></div>
          </article>
        ))}
        {!workflows.length && <p className="runtime-control-empty">Noch keine Ablaeufe. Erstelle einen Demo Ablauf.</p>}
      </div>
    </section>
  );
}
