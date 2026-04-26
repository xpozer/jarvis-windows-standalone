import { OrbState } from "./Orb";

interface JarvisHudFrameProps {
  activeItem: string;
  orbState: OrbState;
  busy: boolean;
  memoryCount: number;
  messageCount: number;
  awarenessOnline: boolean;
}

const idleRows = [
  ["CORE SYSTEMS", "Nominal"],
  ["NEURAL NETWORK", "Online / Active"],
  ["MEMORY BANKS", "Synced"],
  ["DATA STREAMS", "Active feeds"],
  ["SECURITY STATUS", "Protected"],
];

const thinkingRows = [
  ["CORE SYSTEMS", "Analyzing subsystems..."],
  ["NEURAL NETWORK", "High activity"],
  ["MEMORY BANKS", "Context expansion"],
  ["DATA STREAMS", "Correlation active"],
  ["SECURITY STATUS", "Protected"],
];

export function JarvisHudFrame({ activeItem, orbState, busy, memoryCount, messageCount, awarenessOnline }: JarvisHudFrameProps) {
  const isThinking = orbState === "thinking" || busy;
  const rows = isThinking ? thinkingRows : idleRows;
  const isSystem = activeItem.toLowerCase().includes("system");
  const isDialog = activeItem === "Dialog";

  return (
    <div className={`jv2-hud ${isThinking ? "thinking" : "idle"} ${isSystem ? "system" : ""} ${isDialog ? "dialog" : ""}`} aria-hidden="true">
      <div className="jv2-center-status">
        <div className="jv2-status-eyebrow">{isThinking ? "THINKING MODE" : isSystem ? "SYSTEM CENTER" : "JARVIS CORE"}</div>
        <div className="jv2-status-title">{isThinking ? "ANALYSIS IN PROGRESS" : "SYSTEM STATUS: OPTIMAL"}</div>
        <div className="jv2-mini-wave" />
      </div>

      <section className="jv2-card jv2-left-primary">
        <div className="jv2-card-title">{isThinking ? "COGNITIVE STATUS" : "SYSTEM OVERVIEW"}</div>
        <div className="jv2-row-list">
          {rows.map(([label, value], index) => (
            <div className="jv2-status-row" key={label}>
              <span className={`jv2-node ${isThinking && index > 0 && index < 4 ? "hot" : ""}`} />
              <span><b>{label}</b><small>{value}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="jv2-card jv2-left-secondary">
        <div className="jv2-card-title">RECENT ACTIVITY</div>
        <div className="jv2-activity"><span>System initialization complete</span><em>OK</em></div>
        <div className="jv2-activity"><span>Messages indexed</span><em>{messageCount}</em></div>
        <div className="jv2-activity"><span>Memory facts available</span><em>{memoryCount}</em></div>
        <div className="jv2-activity"><span>Desktop awareness</span><em>{awarenessOnline ? "LIVE" : "OFF"}</em></div>
      </section>

      <section className="jv2-card jv2-right-primary">
        <div className="jv2-card-title">NEURAL ACTIVITY <small>LIVE FEED</small></div>
        <div className="jv2-chart">
          <i style={{ height: isThinking ? "62%" : "28%" }} />
          <i style={{ height: isThinking ? "48%" : "54%" }} />
          <i style={{ height: isThinking ? "78%" : "36%" }} />
          <i style={{ height: isThinking ? "55%" : "68%" }} />
          <i style={{ height: isThinking ? "88%" : "46%" }} />
          <i style={{ height: isThinking ? "70%" : "62%" }} />
          <i style={{ height: isThinking ? "92%" : "42%" }} />
          <i style={{ height: isThinking ? "64%" : "58%" }} />
        </div>
        <div className="jv2-progress-label"><span>Overall activity</span><b>{isThinking ? "92%" : "72%"}</b></div>
        <div className="jv2-progress"><span style={{ width: isThinking ? "92%" : "72%" }} /></div>
      </section>

      <section className="jv2-card jv2-right-secondary">
        <div className="jv2-card-title">{isThinking ? "COGNITIVE PROCESSING" : "QUICK TOOLS"}</div>
        {(isThinking ? ["Network Processing", "Data Correlation", "Pattern Recognition", "Memory Utilization"] : ["New Conversation", "Code Interpreter", "Data Analyzer", "Web Search"]).map((name, idx) => (
          <div className="jv2-tool" key={name}>
            <span>{name}</span>
            <em>{isThinking ? ["HIGH", "ELEVATED", "ACTIVE", "83%"][idx] : "READY"}</em>
          </div>
        ))}
      </section>

      <section className="jv2-card jv2-right-tertiary">
        <div className="jv2-card-title">SYSTEM DIAGNOSTICS</div>
        {[
          ["CPU", isThinking ? "67%" : "18%"],
          ["MEMORY", isThinking ? "9.8 / 12 GB" : "6.2 / 12 GB"],
          ["TEMP", isThinking ? "48.7 C" : "34.2 C"],
          ["NETWORK", isThinking ? "3.2 Gb/s" : "1.2 Gb/s"],
        ].map(([k, v]) => <div className="jv2-diag" key={k}><span>{k}</span><b>{v}</b></div>)}
      </section>
    </div>
  );
}
