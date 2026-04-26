import { useEffect, useMemo, useState } from "react";
import { Orb, OrbState } from "./components/Orb";
import "./jarvis-dashboard.css";
import "./orb-legacy.css";

type Role = "operator" | "jarvis";
type Level = "ok" | "warn" | "critical" | "unknown";

type Message = {
  role: Role;
  time: string;
  text: string;
  link?: string;
  file?: boolean;
};

type SystemMetrics = {
  status: Level;
  cpu: { percent: number | null; level: Level };
  memory: { used_gb: number | null; total_gb: number | null; percent: number | null; level: Level };
  temperature: { celsius: number | null; level: Level };
  network: { mbps: number | null; label: string; level: Level };
};

type ChatApiResponse = {
  ok?: boolean;
  response?: string;
  agent?: string;
  reason?: string;
  model?: string;
};

const fallbackMetrics: SystemMetrics = {
  status: "unknown",
  cpu: { percent: null, level: "unknown" },
  memory: { used_gb: null, total_gb: null, percent: null, level: "unknown" },
  temperature: { celsius: null, level: "unknown" },
  network: { mbps: null, label: "N/A", level: "unknown" },
};

const navGroups = [
  { title: "MAIN", items: [["⌂", "Home"], ["☏", "Conversations"], ["▤", "Knowledge Base"], ["⌘", "Data Streams"], ["☷", "Tasks & Automation"]] },
  { title: "SYSTEM", items: [["♡", "Diagnostics"], ["⌁", "Neural Network"], ["⌬", "Memory Banks"], ["▣", "Core Systems"], ["⬡", "Security Center"]] },
  { title: "TOOLS", items: [["{}", "Code Interpreter"], ["⌁", "Data Analyzer"], ["□", "File Manager"], ["◎", "Web Search"], ["▧", "API Console"]] },
];

const initialMessages: Message[] = [
  { role: "operator", time: "11:42 AM", text: "Give me a summary of today’s system performance\nand any important alerts." },
  { role: "jarvis", time: "11:42 AM", text: "All systems are operating within normal parameters.\nCPU usage is at 18%, memory usage at 52%.\nNo critical alerts. 2 informational notifications.", link: "VIEW DETAILS" },
  { role: "operator", time: "11:43 AM", text: "Show me the latest data from the neural network training\npipeline and any anomalies." },
  { role: "jarvis", time: "11:43 AM", text: "Training pipeline is running smoothly. Latest model accuracy: 97.3%.\nNo anomalies detected. All metrics are within expected ranges.", link: "VIEW PIPELINE DASHBOARD" },
  { role: "operator", time: "11:44 AM", text: "Draft a report on system optimization opportunities\nbased on current diagnostics." },
  { role: "jarvis", time: "11:44 AM", text: "Report generated. Identified 3 optimization opportunities\nthat could improve efficiency by up to 12%.", file: true },
];

function metricClass(level: Level) {
  return `metric-level ${level}`;
}

function fmtPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value)}%` : "N/A";
}

function fmtMemory(metrics: SystemMetrics) {
  const used = metrics.memory.used_gb;
  const total = metrics.memory.total_gb;
  if (typeof used === "number" && typeof total === "number") return `${used.toFixed(1)} / ${total.toFixed(1)} GB`;
  return "N/A";
}

function fmtTemp(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toFixed(1)} °C` : "N/A";
}

function statusLabel(status: Level) {
  if (status === "critical") return "CRITICAL";
  if (status === "warn") return "WARNUNG";
  if (status === "ok") return "OPTIMAL";
  return "UNBEKANNT";
}

function buildHistory(messages: Message[]) {
  return messages.slice(-10).map((message) => ({
    role: message.role === "operator" ? "user" : "assistant",
    content: message.text,
  }));
}

export function App() {
  const [activeNav, setActiveNav] = useState("Conversations");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pinned, setPinned] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>(fallbackMetrics);
  const [lastAgent, setLastAgent] = useState("general");

  const now = useMemo(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), [messages.length]);
  const orbState: OrbState = thinking ? "thinking" : listening ? "listening" : "idle";
  const typingActivity = Math.min(1, input.length / 80);

  useEffect(() => {
    let alive = true;
    async function loadMetrics() {
      try {
        const response = await fetch("/system/metrics", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (alive) setMetrics(data as SystemMetrics);
      } catch {
        if (alive) setMetrics(fallbackMetrics);
      }
    }
    loadMetrics();
    const interval = window.setInterval(loadMetrics, 2500);
    return () => { alive = false; window.clearInterval(interval); };
  }, []);

  async function sendMessage(text = input.trim()) {
    const cleanText = text.trim();
    if (!cleanText || thinking) return;
    const sentAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const history = buildHistory(messages);
    setMessages((prev) => [...prev, { role: "operator", time: sentAt, text: cleanText }]);
    setInput("");
    setThinking(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanText, history }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof data.detail === "string" ? data.detail : `HTTP ${response.status}`;
        throw new Error(detail);
      }
      const result = data as ChatApiResponse;
      setLastAgent(result.agent || "general");
      setMessages((prev) => [...prev, {
        role: "jarvis",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: result.response || "Ich habe keine Antwort vom lokalen Modell bekommen.",
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: "jarvis",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Fehler beim lokalen Chat: ${error instanceof Error ? error.message : String(error)}\n\nPrüfe bitte, ob Ollama läuft und das Modell qwen3:8b vorhanden ist.`,
      }]);
    } finally {
      setThinking(false);
    }
  }

  function quickAction(label: string) {
    sendMessage(label);
  }

  return (
    <div className={`jarvis-screen ${thinking ? "is-thinking" : ""}`}>
      <header className="jarvis-topbar">
        <div className="jarvis-brand">
          <div className="jarvis-mini-orb" />
          <div>
            <div className="jarvis-brand-title">JARVIS</div>
            <div className="jarvis-brand-sub">AI ASSISTANT INTERFACE&nbsp;&nbsp;v2.1.4</div>
          </div>
        </div>
        <div className={`jarvis-system-status ${metrics.status}`}>SYSTEM STATUS: <b>{statusLabel(metrics.status)}</b></div>
        <div className="jarvis-metrics">
          <div className={metricClass(metrics.cpu.level)}><span>CPU</span><b>{fmtPercent(metrics.cpu.percent)}</b></div>
          <div className={metricClass(metrics.memory.level)}><span>MEMORY</span><b>{fmtMemory(metrics)}</b></div>
          <div className={metricClass(metrics.temperature.level)}><span>TEMP</span><b>{fmtTemp(metrics.temperature.celsius)}</b></div>
          <div className={metricClass(metrics.network.level)}><span>NETWORK</span><b>{metrics.network.label || "N/A"}</b></div>
          <nav><button>↻</button><button>⚙</button><button>−</button><button>□</button><button>×</button></nav>
        </div>
      </header>

      <aside className="jarvis-sidebar">
        {navGroups.map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            {group.items.map(([icon, label]) => (
              <button key={label} className={`jarvis-nav-item ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}>
                <span>{icon}</span><em>{label}</em>{label === "Conversations" && <b>›</b>}
              </button>
            ))}
          </section>
        ))}
        <div className="jarvis-user-card">
          <div className="jarvis-user-orb" />
          <div><small>USER</small><strong>Operator</strong><p>Agent: {lastAgent}</p></div>
          <button>•••</button>
        </div>
      </aside>

      <main className="jarvis-main">
        <section className="jarvis-conversation">
          <div className="jarvis-conversation-head">
            <div>
              <h1>Conversation with JARVIS</h1>
              <p><span />Online&nbsp;&nbsp;•&nbsp;&nbsp;Ready to assist</p>
            </div>
            <div className="jarvis-head-actions">
              <button className={pinned ? "active" : ""} onClick={() => setPinned(!pinned)}>✧ PIN</button>
              <button onClick={() => setMessages(initialMessages)}>⊕ NEW CHAT</button>
            </div>
          </div>
          <div className="jarvis-message-list">
            {messages.map((message, index) => (
              <article key={`${message.time}-${index}-${message.text}`} className="jarvis-message-card">
                <div className={`jarvis-avatar ${message.role === "jarvis" ? "jarvis" : "operator"}`}>{message.role === "operator" ? "●" : ""}</div>
                <div className="jarvis-message-body">
                  <div className="jarvis-message-meta"><b className={message.role === "jarvis" ? "cyan" : ""}>{message.role === "jarvis" ? "JARVIS" : "OPERATOR"}</b><span>{message.time}</span></div>
                  <p>{message.text}</p>
                  {message.link && <button className="jarvis-link-btn" onClick={() => quickAction(message.link!)}>{message.link}<span>›</span></button>}
                  {message.file && <div className="jarvis-file"><span>▤</span><div><b>system_optimization_report.pdf</b><small>2.4 MB • PDF Document</small></div><button>⇩</button><button>↗</button></div>}
                </div>
                <button className="jarvis-dots">•••</button>
              </article>
            ))}
            {thinking && <article className="jarvis-message-card thinking-card"><div className="jarvis-avatar jarvis" /><div className="jarvis-message-body"><div className="jarvis-message-meta"><b className="cyan">JARVIS</b><span>{now}</span></div><p>Processing request...</p></div></article>}
          </div>
        </section>

        <section className="jarvis-core-stage">
          <div className="jarvis-legacy-orb-wrap">
            <Orb state={orbState} typingActivity={typingActivity} heatmapActive={thinking} />
          </div>
          <div className="jarvis-core-label"><h2>JARVIS CORE</h2><p>Adaptive&nbsp;&nbsp;•&nbsp;&nbsp;Proactive&nbsp;&nbsp;•&nbsp;&nbsp;Reliable</p><div /></div>
        </section>
      </main>

      <aside className="jarvis-right-panel">
        <section className="jarvis-card context-card">
          <div className="jarvis-card-title"><h2>CONVERSATION CONTEXT</h2><button>• VIEW ALL</button></div>
          {[ ["System Performance Summary", "11:42 AM"], ["Neural Network Pipeline", "11:43 AM"], ["Optimization Report", "11:44 AM"] ].map(([label, time]) => <button className="context-row" key={label} onClick={() => quickAction(label)}><span /><em>{label}</em><b>{time}</b></button>)}
        </section>
        <section className="jarvis-card quick-card">
          <div className="jarvis-card-title"><h2>QUICK ACTIONS</h2></div>
          {[ ["▣", "Run System Diagnostics", "Full system health check"], ["⌘", "Analyze Data Stream", "Real-time data analysis"], ["⌬", "Search Knowledge Base", "Find information quickly"], ["▤", "Generate Report", "Create detailed reports"] ].map(([icon, label, sub]) => <button className="quick-action" key={label} onClick={() => quickAction(label)}><span>{icon}</span><em><b>{label}</b><small>{sub}</small></em></button>)}
          <button className="custom-command" onClick={() => quickAction("Custom Command")}>CUSTOM COMMAND <span>›</span></button>
        </section>
        <section className="jarvis-card snapshot-card">
          <div className="jarvis-card-title"><h2>SYSTEM SNAPSHOT</h2><button>• LIVE</button></div>
          <div className="snapshot-grid">
            <div className={metricClass(metrics.cpu.level)}><span>CPU</span><b>{fmtPercent(metrics.cpu.percent)}</b></div>
            <div className={metricClass(metrics.memory.level)}><span>Memory</span><b>{fmtPercent(metrics.memory.percent)}</b></div>
            <div><span>Storage</span><b>68%</b></div>
          </div>
          <div className="snapshot-bottom"><div className={metricClass(metrics.network.level)}><span>Network</span><b>{metrics.network.label || "N/A"}</b></div><ul><li><span>Active Processes</span><b>142</b></li><li><span>System Uptime</span><b>Live</b></li><li className={metricClass(metrics.temperature.level)}><span>Temperature</span><b>{fmtTemp(metrics.temperature.celsius)}</b></li><li><span>Power Status</span><b>{statusLabel(metrics.status)}</b></li></ul></div>
        </section>
      </aside>

      <section className="jarvis-input-panel">
        <div className="jarvis-input-row">
          <button className="voice-btn" onMouseDown={() => setListening(true)} onMouseUp={() => setListening(false)} onMouseLeave={() => setListening(false)}>≋</button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type your command or question..." />
          <button className="plus-btn">＋</button>
          <button className="send-btn" onClick={() => sendMessage()}>➤</button>
        </div>
        <div className="jarvis-chip-row">
          {['⊙ Summarize recent activity','⌘ Check security status','⌁ Analyze performance','▣ Help me with coding','◎ Search knowledge base'].map((chip) => <button key={chip} onClick={() => quickAction(chip.replace(/^. /, ""))}>{chip}</button>)}
        </div>
      </section>
    </div>
  );
}
