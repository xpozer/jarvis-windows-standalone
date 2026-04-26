// JARVIS Runtime Status Panel
// Inspiriert von usejarvis.dev Landing Page
// Zeigt Memory, Awareness, Orchestrator, Agents live

import { useEffect, useState } from "react";
import { OrchestratorState, AGENT_LABELS, AGENT_COLORS } from "../hooks/useOrchestrator";
import { DesktopContext } from "../hooks/useAwareness";

interface RuntimePanelProps {
  orchState: OrchestratorState;
  awareness: DesktopContext | null;
  awarenessOnline: boolean;
  memoryCount: number;
  messageCount: number;
}

function StatusDot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      background: color, boxShadow: `0 0 6px ${color}`,
      animation: pulse ? "runtime-pulse 1.5s ease-in-out infinite" : "none",
    }}/>
  );
}

function MetricRow({ label, value, color = "rgba(76,168,232,0.7)" }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0" }}>
      <span style={{
        fontFamily:"'Share Tech Mono',monospace", fontSize:8,
        letterSpacing:1.5, color:"rgba(76,168,232,0.35)", textTransform:"uppercase",
      }}>{label}</span>
      <span style={{
        fontFamily:"'Share Tech Mono',monospace", fontSize:9,
        letterSpacing:1, color, fontWeight:600,
      }}>{value}</span>
    </div>
  );
}

function StatusBlock({ title, status, statusColor, children }: {
  title: string; status: string; statusColor: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background:"rgba(4,14,30,0.6)",
      border:"1px solid rgba(76,168,232,0.1)",
      padding:"10px 12px", marginBottom:8,
    }}>
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:8, paddingBottom:6,
        borderBottom:"1px solid rgba(76,168,232,0.06)",
      }}>
        <span style={{
          fontFamily:"'Share Tech Mono',monospace", fontSize:9,
          letterSpacing:2, color:"rgba(76,168,232,0.5)", fontWeight:700,
        }}>{title}</span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <StatusDot color={statusColor} pulse={status === "aktiv"} />
          <span style={{
            fontFamily:"'Share Tech Mono',monospace", fontSize:8,
            letterSpacing:1, color: statusColor,
          }}>{status}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function RuntimePanel({ orchState, awareness, awarenessOnline, memoryCount, messageCount }: RuntimePanelProps) {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = s%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const activeAgent = orchState.activeAgent;
  const agentColor = activeAgent ? (AGENT_COLORS[activeAgent] || "#4ca8e8") : "#4ca8e8";
  const agentLabel = activeAgent ? (AGENT_LABELS[activeAgent] || activeAgent) : "idle";

  return (
    <div style={{ padding:"12px 10px" }}>
      {/* Header */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:12, paddingBottom:8,
        borderBottom:"1px solid rgba(76,168,232,0.1)",
      }}>
        <span style={{
          fontFamily:"'Share Tech Mono',monospace", fontSize:9,
          letterSpacing:3, color:"rgba(76,168,232,0.3)",
        }}>RUNTIME</span>
        <span style={{
          fontFamily:"'Share Tech Mono',monospace", fontSize:10,
          letterSpacing:2, color:"rgba(76,168,232,0.5)",
        }}>{fmt(uptime)}</span>
      </div>

      {/* Memory */}
      <StatusBlock title="MEMORY" status={memoryCount > 0 ? "aktiv" : "leer"}
        statusColor={memoryCount > 0 ? "#4ce8a0" : "rgba(76,168,232,0.3)"}>
        <MetricRow label="Fakten" value={String(memoryCount)} color="#4ce8a0" />
        <MetricRow label="Nachrichten" value={String(messageCount)} />
        <MetricRow label="Suche" value="semantisch" color="rgba(76,168,232,0.4)" />
      </StatusBlock>

      {/* Awareness */}
      <StatusBlock title="AWARENESS"
        status={awarenessOnline ? "erfasst" : "offline"}
        statusColor={awarenessOnline ? "#4ce8a0" : "#e84c4c"}>
        {awarenessOnline && awareness ? (
          <>
            <MetricRow label="App" value={awareness.app || "---"} color={agentColor} />
            <MetricRow label="Kategorie" value={awareness.category || "---"} />
            <MetricRow label="Zyklus" value="7s" color="rgba(76,168,232,0.4)" />
            {awareness.hints && awareness.hints.length > 0 && (
              <MetricRow label="Erkannt" value={awareness.hints.join(", ")} color="#e8c44c" />
            )}
          </>
        ) : (
          <MetricRow label="Status" value="nicht verbunden" color="rgba(232,76,76,0.5)" />
        )}
      </StatusBlock>

      {/* Orchestrator */}
      <StatusBlock title="ORCHESTRATOR"
        status={orchState.isRunning ? "aktiv" : "bereit"}
        statusColor={orchState.isRunning ? agentColor : "rgba(76,168,232,0.3)"}>
        <MetricRow label="Agent" value={agentLabel}
          color={orchState.isRunning ? agentColor : "rgba(76,168,232,0.4)"} />
        {orchState.routing && (
          <>
            <MetricRow label="Konfidenz"
              value={Math.round(orchState.routing.confidence * 100) + "%"}
              color={orchState.routing.confidence > 0.8 ? "#4ce8a0" : "#e8c44c"} />
            <div style={{
              fontFamily:"'Share Tech Mono',monospace", fontSize:7,
              letterSpacing:0.5, color:"rgba(76,168,232,0.25)",
              marginTop:4, lineHeight:1.5,
              overflow:"hidden", textOverflow:"ellipsis",
              display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any,
            }}>
              {orchState.routing.reason}
            </div>
          </>
        )}
      </StatusBlock>

      {/* Agents */}
      <StatusBlock title="AGENTEN" status="9 rollen" statusColor="rgba(76,168,232,0.4)">
        {(["sap","calendar","research","memory","email","general","file","exam","vde"] as const).map(name => {
          const isActive = orchState.activeAgent === name || orchState.lastAgent === name;
          const c = AGENT_COLORS[name] || "#4ca8e8";
          return (
            <div key={name} style={{
              display:"flex", alignItems:"center", gap:6, padding:"2px 0",
              opacity: isActive ? 1 : 0.4,
              transition:"opacity 0.3s",
            }}>
              <StatusDot color={isActive ? c : "rgba(76,168,232,0.2)"} pulse={orchState.activeAgent === name} />
              <span style={{
                fontFamily:"'Share Tech Mono',monospace", fontSize:8,
                letterSpacing:1, color: isActive ? c : "rgba(76,168,232,0.3)",
                flex:1,
              }}>{AGENT_LABELS[name]?.toUpperCase() || name}</span>
              {orchState.activeAgent === name && (
                <span style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:7,
                  color: c, letterSpacing:1,
                }}>AKTIV</span>
              )}
            </div>
          );
        })}
      </StatusBlock>
    </div>
  );
}
