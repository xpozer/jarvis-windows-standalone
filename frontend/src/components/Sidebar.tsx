import { OrchestratorState } from "../hooks/useOrchestrator";
import { DesktopContext } from "../hooks/useAwareness";
import { RuntimePanel } from "./RuntimePanel";
import { AgentDelegationFlow } from "./AgentDelegationFlow";

interface SidebarProps {
  activeItem: string;
  onSelect: (item: string) => void;
  orchState?: OrchestratorState;
  awareness?: DesktopContext | null;
  awarenessOnline?: boolean;
  memoryCount?: number;
  messageCount?: number;
}

const SECTIONS = [
  {
    title: "KERN",
    items: ["Dialog", "Dashboard", "Arbeitsmodus", "Work Agent", "Automationen", "Aufgaben", "Notizen", "Dateien", "Local Knowledge", "Agenten", "Arbeitswissen", "Wissen", "Email"],
  },
  {
    title: "FACHBEREICH",
    items: ["SAP Werkzeuge", "VDE Normen", "Rechner"],
  },
  {
    title: "SYSTEM",
    items: ["Windows", "Tech Core", "Deep Control", "System Center", "Voice Core", "Voice Interface", "Voice Lab", "UI Optionen", "Systemstatus", "Self Check", "Diag Center", "Agent Registry", "Tool Registry", "Audit Log", "Einstellungen"],
  },
];

export function Sidebar({
  activeItem, onSelect, orchState, awareness, awarenessOnline,
  memoryCount = 0, messageCount = 0,
}: SidebarProps) {
  return (
    <aside className="jv-sidebar">
      {/* Navigation */}
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="jv-section">{section.title}</div>
          {section.items.map((item) => (
            <div
              key={item}
              className={`jv-nav ${activeItem === item ? "active" : ""}`}
              onClick={() => onSelect(item)}
            >
              {item}
            </div>
          ))}
        </div>
      ))}

      {/* Separator */}
      <div style={{
        margin:"12px 10px", height:1,
        background:"rgba(76,168,232,0.08)",
      }}/>

      {/* Agent Delegation Flow */}
      {orchState && (
        <AgentDelegationFlow state={orchState} />
      )}

      {/* Runtime Status Panel */}
      {orchState && (
        <RuntimePanel
          orchState={orchState}
          awareness={awareness ?? null}
          awarenessOnline={awarenessOnline ?? false}
          memoryCount={memoryCount}
          messageCount={messageCount}
        />
      )}
    </aside>
  );
}
