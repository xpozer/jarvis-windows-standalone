// JARVIS AgentStatusBar
// Zeigt aktiven Agenten, Routing-Grund, Confidence
// Sitzt zwischen TopBar und Chat

import { OrchestratorState, AGENT_LABELS, AGENT_COLORS, AGENT_ICONS } from "../hooks/useOrchestrator";

interface AgentStatusBarProps {
  state: OrchestratorState;
}

export function AgentStatusBar({ state }: AgentStatusBarProps) {
  const { activeAgent, routing, isRunning, lastAgent } = state;
  const displayAgent = activeAgent ?? lastAgent;
  if (!displayAgent && !isRunning) return null;

  const color  = AGENT_COLORS[displayAgent ?? "general"] ?? "#4ca8e8";
  const label  = AGENT_LABELS[displayAgent ?? "general"] ?? "Agent";
  const icon   = AGENT_ICONS[displayAgent ?? "general"]  ?? "○";
  const conf   = routing?.confidence ? Math.round(routing.confidence * 100) : null;
  const reason = routing?.reason ?? "";

  return (
    <div style={{
      position:"fixed", top:48, left:0, right:0, zIndex:28,
      height:28, display:"flex", alignItems:"center",
      padding:"0 16px", gap:12,
      background:"rgba(4,8,20,0.82)",
      borderBottom:`1px solid ${color}22`,
      backdropFilter:"blur(8px)",
    }}>
      {/* Agent-Indikator */}
      <div style={{display:"flex", alignItems:"center", gap:6}}>
        <div style={{
          width:6, height:6, borderRadius:"50%",
          background: isRunning ? color : `${color}44`,
          boxShadow: isRunning ? `0 0 8px ${color}` : "none",
          transition:"all 0.3s",
          animation: isRunning ? "orb-dot-pulse 1s ease-in-out infinite" : "none",
        }}/>
        <span style={{
          fontFamily:"Share Tech Mono,monospace", fontSize:9,
          letterSpacing:2, color: isRunning ? color : `${color}66`,
          transition:"color 0.3s",
        }}>
          {icon} {label.toUpperCase()}
        </span>
      </div>

      {/* Separator */}
      <div style={{width:1, height:14, background:"rgba(76,168,232,0.15)"}}/>

      {/* Routing-Info */}
      {conf !== null && (
        <span style={{
          fontFamily:"Share Tech Mono,monospace", fontSize:8,
          letterSpacing:1, color:"rgba(76,168,232,0.3)",
        }}>
          {conf}% KONFIDENZ
        </span>
      )}

      {reason && (
        <span style={{
          fontFamily:"Share Tech Mono,monospace", fontSize:8,
          letterSpacing:0.5, color:"rgba(76,168,232,0.25)",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          maxWidth:400,
        }}>
          {reason}
        </span>
      )}

      {/* Tool-Log (letzter Eintrag) */}
      {state.toolLog.length > 0 && (
        <span style={{
          marginLeft:"auto",
          fontFamily:"Share Tech Mono,monospace", fontSize:8,
          letterSpacing:1, color:"rgba(76,232,160,0.35)",
        }}>
          ✓ {state.toolLog[state.toolLog.length-1]}
        </span>
      )}
    </div>
  );
}
