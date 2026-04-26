// JARVIS Agent Delegation Flow
// Visueller Pipeline-Flow: Routing -> Agent -> Antwort
// Inspiriert von usejarvis.dev Agent Delegation Visualisierung

import { OrchestratorState, AGENT_LABELS, AGENT_COLORS, AGENT_ICONS } from "../hooks/useOrchestrator";

interface AgentDelegationFlowProps {
  state: OrchestratorState;
}

type FlowStep = "idle" | "routing" | "working" | "streaming" | "done";

function FlowNode({ label, icon, color, active, done, first = false }: {
  label: string; icon: string; color: string; active: boolean; done: boolean; first?: boolean;
}) {
  const bg = active ? `${color}18` : done ? `${color}08` : "rgba(4,14,30,0.4)";
  const borderColor = active ? color : done ? `${color}44` : "rgba(76,168,232,0.1)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:0 }}>
      {!first && (
        <div style={{
          width:20, height:2,
          background: done || active
            ? `linear-gradient(90deg, ${color}44, ${color})`
            : "rgba(76,168,232,0.08)",
          position:"relative",
        }}>
          {active && (
            <div style={{
              position:"absolute", top:-2, width:6, height:6,
              borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color}`,
              animation:"flow-travel 1s linear infinite",
            }}/>
          )}
        </div>
      )}
      <div style={{
        background:bg, border:`1px solid ${borderColor}`,
        padding:"6px 10px", minWidth:70, textAlign:"center",
        transition:"all 0.3s",
        boxShadow: active ? `0 0 12px ${color}15` : "none",
      }}>
        <div style={{
          fontFamily:"'Share Tech Mono',monospace", fontSize:12,
          color: active ? color : done ? `${color}88` : "rgba(76,168,232,0.2)",
          marginBottom:2,
        }}>{icon}</div>
        <div style={{
          fontFamily:"'Share Tech Mono',monospace", fontSize:7,
          letterSpacing:1.5, color: active ? color : done ? `${color}66` : "rgba(76,168,232,0.2)",
          textTransform:"uppercase",
        }}>{label}</div>
      </div>
    </div>
  );
}

function FlowLog({ entries, color }: { entries: string[]; color: string }) {
  if (entries.length === 0) return null;
  return (
    <div style={{
      background:"rgba(4,10,20,0.6)", border:"1px solid rgba(76,168,232,0.06)",
      padding:"6px 10px", marginTop:8,
    }}>
      {entries.map((e, i) => (
        <div key={i} style={{
          fontFamily:"'Share Tech Mono',monospace", fontSize:8,
          letterSpacing:0.5, lineHeight:1.8,
          color: e.startsWith("OK") ? "#4ce8a0"
               : e.startsWith("!!") ? "#e8c44c"
               : `${color}66`,
          display:"flex", gap:6,
        }}>
          <span style={{ color:"rgba(76,168,232,0.2)", flexShrink:0 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          {e}
        </div>
      ))}
    </div>
  );
}

export function AgentDelegationFlow({ state }: AgentDelegationFlowProps) {
  const { activeAgent, lastAgent, routing, isRunning, toolLog } = state;
  const displayAgent = activeAgent || lastAgent;
  const color = displayAgent ? (AGENT_COLORS[displayAgent] || "#4ca8e8") : "#4ca8e8";
  const label = displayAgent ? (AGENT_LABELS[displayAgent] || displayAgent) : "---";
  const icon = displayAgent ? (AGENT_ICONS[displayAgent] || "O") : "O";

  // Flow state bestimmen
  let flowStep: FlowStep = "idle";
  if (isRunning && !activeAgent && routing) flowStep = "routing";
  else if (isRunning && activeAgent) flowStep = "working";
  else if (!isRunning && lastAgent && toolLog.length > 0) flowStep = "done";

  // Wenn komplett idle und kein lastAgent, nichts zeigen
  if (!displayAgent && !isRunning) return null;

  const routingDone = flowStep === "working" || flowStep === "done";
  const agentDone = flowStep === "done";

  // Log-Eintraege aufbereiten
  const logEntries: string[] = [];
  if (routing) {
    logEntries.push(`OK Routing: ${label} (${Math.round(routing.confidence * 100)}%)`);
    if (routing.reason) logEntries.push(`   ${routing.reason}`);
  }
  if (isRunning && activeAgent) {
    logEntries.push(`   ${label} verarbeitet...`);
  }
  toolLog.forEach(t => logEntries.push(`OK ${t}`));

  return (
    <div style={{
      padding:"12px 10px", borderTop:"1px solid rgba(76,168,232,0.06)",
    }}>
      {/* Title */}
      <div style={{
        fontFamily:"'Share Tech Mono',monospace", fontSize:9,
        letterSpacing:3, color:"rgba(76,168,232,0.3)",
        marginBottom:10,
      }}>DELEGATION</div>

      {/* Flow Nodes */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"4px 0",
      }}>
        <FlowNode label="Orchestrator" icon="O" color="#4ca8e8"
          active={flowStep === "routing"} done={routingDone} first />
        <FlowNode label={label} icon={icon} color={color}
          active={flowStep === "working"} done={agentDone} />
        <FlowNode label="Antwort" icon="R" color="#4ce8a0"
          active={false} done={agentDone} />
      </div>

      {/* Log */}
      <FlowLog entries={logEntries} color={color} />

      {/* CSS Animation */}
      <style>{`
        @keyframes flow-travel {
          0% { left: -6px; }
          100% { left: calc(100% - 0px); }
        }
        @keyframes runtime-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
