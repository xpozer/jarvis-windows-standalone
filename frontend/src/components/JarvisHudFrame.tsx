import { OrbState } from "./Orb";

interface JarvisHudFrameProps {
  activeItem: string;
  orbState: OrbState;
  busy: boolean;
  memoryCount: number;
  messageCount: number;
  awarenessOnline: boolean;
}

export function JarvisHudFrame({ activeItem, orbState, busy, memoryCount, messageCount, awarenessOnline }: JarvisHudFrameProps) {
  const isThinking = orbState === "thinking" || busy;
  const isSystem = activeItem.toLowerCase().includes("system");
  const isDialog = activeItem === "Dialog";

  return (
    <div className={`jv2-hud ${isThinking ? "thinking" : "idle"} ${isSystem ? "system" : ""} ${isDialog ? "dialog" : ""}`} aria-hidden="true">
      <div className="jv2-core-caption">
        <div className="jv2-core-title">JARVIS CORE</div>
        <div className="jv2-core-sub">Adaptive&nbsp;&nbsp;•&nbsp;&nbsp;Proactive&nbsp;&nbsp;•&nbsp;&nbsp;Reliable</div>
        <div className="jv2-core-wave" />
      </div>

      <section className="jv2-card jv2-right-primary">
        <div className="jv2-card-title">CONVERSATION CONTEXT <small>• VIEW ALL</small></div>
        {[
          ["System Performance Summary", "11:42 AM"],
          ["Neural Network Pipeline", "11:43 AM"],
          ["Optimization Report", "11:44 AM"],
        ].map(([name, time]) => (
          <div className="jv2-context" key={name}>
            <span className="jv2-timeline-dot" />
            <span>{name}</span>
            <em>{time}</em>
          </div>
        ))}
      </section>

      <section className="jv2-card jv2-right-secondary">
        <div className="jv2-card-title">QUICK ACTIONS</div>
        {[
          ["Run System Diagnostics", "Full system health check"],
          ["Analyze Data Stream", "Real-time data analysis"],
          ["Search Knowledge Base", "Find information quickly"],
          ["Generate Report", "Create detailed reports"],
        ].map(([name, sub], idx) => (
          <div className="jv2-action" key={name}>
            <span className="jv2-action-icon">{["▣", "⌁", "⌘", "▤"][idx]}</span>
            <span><b>{name}</b><small>{sub}</small></span>
          </div>
        ))}
        <div className="jv2-custom-command">CUSTOM COMMAND <em>›</em></div>
      </section>

      <section className="jv2-card jv2-right-tertiary">
        <div className="jv2-card-title">SYSTEM SNAPSHOT <small>• LIVE</small></div>
        <div className="jv2-snapshot-grid">
          <div><span>CPU</span><b>{isThinking ? "67%" : "18%"}</b></div>
          <div><span>Memory</span><b>{isThinking ? "82%" : "52%"}</b></div>
          <div><span>Storage</span><b>68%</b></div>
          <div><span>Network</span><b>{isThinking ? "3.2 GB/s" : "1.2 GB/s"}</b></div>
        </div>
        {[
          ["Active Processes", isThinking ? "196" : "142"],
          ["System Uptime", "3d 14h 28m"],
          ["Temperature", isThinking ? "48.7 °C" : "34.2 °C"],
          ["Power Status", isThinking ? "Elevated" : "Optimal"],
          ["Memory Facts", String(memoryCount)],
          ["Messages", String(messageCount)],
          ["Awareness", awarenessOnline ? "Live" : "Offline"],
        ].map(([k, v]) => <div className="jv2-diag" key={k}><span>{k}</span><b>{v}</b></div>)}
      </section>
    </div>
  );
}
