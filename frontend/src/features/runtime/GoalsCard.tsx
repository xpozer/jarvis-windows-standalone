import type { Goal } from "./runtimeTypes";

type Props = {
  goals: Goal[];
  goalTitle: string;
  onGoalTitleChange: (value: string) => void;
  onAddGoal: () => void;
};

export function GoalsCard({ goals, goalTitle, onGoalTitleChange, onAddGoal }: Props) {
  return (
    <section className="runtime-control-card">
      <div className="runtime-control-card-title"><h2>Ziele</h2><span>OKR Basis</span></div>
      <div className="runtime-control-form">
        <input value={goalTitle} onChange={(e) => onGoalTitleChange(e.target.value)} placeholder="Ziel anlegen" onKeyDown={(e) => e.key === "Enter" && onAddGoal()} />
        <button onClick={() => void onAddGoal()}>HINZUFUEGEN</button>
      </div>
      <div className="runtime-control-list compact">
        {goals.map((goal) => <article key={goal.id}><b>{goal.title}</b><span>{goal.type} / {goal.status}</span></article>)}
        {!goals.length && <p className="runtime-control-empty">Noch keine Ziele.</p>}
      </div>
    </section>
  );
}
