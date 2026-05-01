import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Orb, OrbState } from "./components/Orb";
import { DashboardModules } from "./components/DashboardModules";
import { DayStartCard } from "./components/DayStartCard";
import { TodayScheduleCard } from "./components/TodayScheduleCard";
import "./jarvis-dashboard.css";
import "./orb-legacy.css";
import "./chat-window.css";

type Role = "operator" | "jarvis";
type Level = "ok" | "warn" | "critical" | "unknown";

type Message = {
  role: Role;
  time: string;
  text: string;
  link?: string;
  file?: boolean;
  meta?: ChatMessageMeta;
  streaming?: boolean;
  streamId?: string;
  phase?: string;
  phaseDetail?: string;
  pulse?: number;
};

type ChatMessageMeta = {
  agent?: string;
  model?: string;
  provider?: string;
  duration_ms?: number;
  memory?: { facts_used?: number; facts_extracted?: number };
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
  session_id?: string;
  response?: string;
  answer?: string;
  content?: string;
  message?: string | { content?: string };
  agent?: string;
  reason?: string;
  model?: string;
  provider?: string;
  duration_ms?: number;
  meta?: ChatMessageMeta;
  memory?: { facts_used?: number; facts_extracted?: number };
};

type ChatStreamPayload = ChatApiResponse & {
  text?: string;
  delta?: string;
  detail?: string;
  step?: string;
  label?: string;
  facts_used?: number;
};

type ChatStreamEvent = {
  event: string;
  data: ChatStreamPayload;
};

type ChatSessionSummary = {
  id: string;
  title: string;
  updated_at?: string;
  message_count?: number;
  last_message?: string;
  agent?: string;
  model?: string;
  provider?: string;
};

type ChatSessionDetail = ChatSessionSummary & {
  messages?: Array<{ role: Role; time?: string; text?: string; meta?: ChatMessageMeta }>;
};

const fallbackMetrics: SystemMetrics = {
  status: "unknown",
  cpu: { percent: null, level: "unknown" },
  memory: { used_gb: null, total_gb: null, percent: null, level: "unknown" },
  temperature: { celsius: null, level: "unknown" },
  network: { mbps: null, label: "N/A", level: "unknown" },
};

const navGroups = [
  { title: "HAUPT", items: [["H", "Start"], ["D", "Dialog"], ["L", "LifeOS"], ["W", "Wissensbasis"], ["S", "Datenstroeme"], ["A", "Aufgaben & Automationen"]] },
  { title: "SYSTEM", items: [["R", "JARVIS Runtime"], ["D", "Diagnose"], ["N", "Agentennetz"], ["M", "Speicherbanken"], ["K", "Kernsysteme"], ["U", "Update Center"], ["S", "Sicherheitszentrale"]] },
  { title: "WERKZEUGE", items: [["C", "Code-Werkzeuge"], ["A", "Datenanalyse"], ["F", "Dateimanager"], ["R", "Websuche"], ["API", "API-Konsole"]] },
];

const initialMessages: Message[] = [
  { role: "operator", time: "11:42", text: "Fasse mir die heutige Systemleistung\nund wichtige Hinweise kurz zusammen." },
  { role: "jarvis", time: "11:42", text: "Alle Systeme arbeiten im normalen Bereich.\nCPU-Auslastung liegt bei 18%, Arbeitsspeicher bei 52%.\nKeine kritischen Hinweise. 2 reine Informationsmeldungen.", link: "DETAILS ANZEIGEN" },
  { role: "operator", time: "11:43", text: "Zeig mir die letzten Daten aus dem Agentennetz\nund moegliche Auffaelligkeiten." },
  { role: "jarvis", time: "11:43", text: "Das Agentennetz arbeitet stabil. Letzte Modellgenauigkeit: 97,3%.\nKeine Auffaelligkeiten erkannt. Alle Werte liegen im erwarteten Bereich.", link: "AGENTEN-DASHBOARD OEFFNEN" },
  { role: "operator", time: "11:44", text: "Erstelle einen Bericht zu Optimierungsmoeglichkeiten\nauf Basis der aktuellen Diagnose." },
  { role: "jarvis", time: "11:44", text: "Bericht erstellt. Es wurden 3 Optimierungsmoeglichkeiten erkannt,\ndie die Effizienz um bis zu 12% verbessern koennten.", file: true },
];

function loadUiZoom() {
  try {
    const value = Number(localStorage.getItem("jarvis_ui_zoom") || "100");
    if (Number.isFinite(value)) return Math.min(200, Math.max(100, value));
  } catch {}
  return 100;
}

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
  return typeof value === "number" ? `${value.toFixed(1)} C` : "N/A";
}

function statusLabel(status: Level) {
  if (status === "critical") return "KRITISCH";
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

function fmtDuration(value: number | undefined) {
  if (typeof value !== "number") return "";
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(1)} s`;
}

function fmtSessionTime(value: string | undefined) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function parseSseBlock(block: string): ChatStreamEvent | null {
  const lines = block.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) as ChatStreamPayload };
  } catch {
    return null;
  }
}

export function App() {
  const [activeNav, setActiveNav] = useState("Dialog");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pinned, setPinned] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [interactionState, setInteractionState] = useState<OrbState>("idle");
  const [metrics, setMetrics] = useState<SystemMetrics>(fallbackMetrics);
  const [lastAgent, setLastAgent] = useState("general");
  const [uiZoom, setUiZoom] = useState(loadUiZoom);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const now = useMemo(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), [messages.length]);
  const orbState: OrbState = listening ? "listening" : interactionState !== "idle" ? interactionState : thinking ? "thinking" : "idle";
  const typingActivity = Math.min(1, input.length / 80);
  const isDialog = activeNav === "Dialog";
  const uiScale = uiZoom / 100;

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

  useEffect(() => {
    void loadSessions();
  }, []);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    try {
      localStorage.setItem("jarvis_ui_zoom", String(uiZoom));
    } catch {}
  }, [uiZoom]);

  function readChatResponse(data: ChatApiResponse) {
    if (typeof data.response === "string" && data.response.trim()) return data.response;
    if (typeof data.answer === "string" && data.answer.trim()) return data.answer;
    if (typeof data.content === "string" && data.content.trim()) return data.content;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (data.message && typeof data.message === "object" && typeof data.message.content === "string") return data.message.content;
    return "Ich habe keine Antwort vom lokalen Modell bekommen.";
  }

  function chatMetaFromResponse(result: ChatApiResponse): ChatMessageMeta {
    return result.meta || {
      agent: result.agent,
      model: result.model,
      provider: result.provider,
      duration_ms: result.duration_ms,
      memory: result.memory,
    };
  }

  async function loadSessions() {
    try {
      const response = await fetch("/api/chat/sessions", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json().catch(() => ({}));
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      setSessions([]);
    }
  }

  async function loadSession(sessionId: string) {
    setSessionLoading(true);
    try {
      const response = await fetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as ChatSessionDetail;
      if (!response.ok) throw new Error(typeof (data as any).detail === "string" ? (data as any).detail : `HTTP ${response.status}`);
      const loaded = Array.isArray(data.messages) ? data.messages : [];
      setMessages(loaded.map((message) => ({
        role: message.role === "jarvis" ? "jarvis" : "operator",
        time: message.time ? new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        text: message.text || "",
        meta: message.meta,
      })));
      setActiveSessionId(sessionId);
      setActiveNav("Dialog");
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: "jarvis",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Gespräch konnte nicht geladen werden: ${error instanceof Error ? error.message : String(error)}`,
      }]);
    } finally {
      setSessionLoading(false);
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      const response = await fetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(String(response.status));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: "jarvis",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Gespräch konnte nicht gelöscht werden: ${error instanceof Error ? error.message : String(error)}`,
      }]);
    }
  }

  function newChat() {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setActiveNav("Dialog");
  }

  async function sendMessage(text = input.trim()) {
    const cleanText = text.trim();
    if (!cleanText || thinking) return;
    const sentAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const history = buildHistory(messages);
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setActiveNav("Dialog");
    setMessages((prev) => [
      ...prev,
      { role: "operator", time: sentAt, text: cleanText },
      { role: "jarvis", time: sentAt, text: "", streaming: true, streamId, phase: "JARVIS initialisiert Kontext...", pulse: 0 },
    ]);
    setInput("");
    setThinking(true);
    setInteractionState("thinking");
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanText, history, session_id: activeSessionId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!response.body) {
        throw new Error("Streaming wird von diesem Browser nicht unterstuetzt.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedDone = false;

      function appendDelta(delta: string) {
        setInteractionState("speaking");
        setMessages((prev) => prev.map((message) => (
          message.streamId === streamId ? { ...message, text: message.text + delta, pulse: (message.pulse || 0) + 1 } : message
        )));
      }

      function finishStream(result: ChatApiResponse) {
        receivedDone = true;
        setInteractionState("idle");
        setLastAgent(result.agent || "general");
        if (result.session_id) setActiveSessionId(result.session_id);
        setMessages((prev) => prev.map((message) => {
          if (message.streamId !== streamId) return message;
          return {
            ...message,
            text: message.text.trim() ? message.text : readChatResponse(result),
            meta: chatMetaFromResponse(result),
            streaming: false,
            phase: "Antwort abgeschlossen",
            phaseDetail: "",
          };
        }));
      }

      function updatePhase(label: string, detail = "", step = "") {
        if (step === "answer") setInteractionState("speaking");
        else if (step && step !== "done") setInteractionState("thinking");
        setMessages((prev) => prev.map((message) => (
          message.streamId === streamId
            ? { ...message, phase: label, phaseDetail: detail, pulse: (message.pulse || 0) + 1 }
            : message
        )));
      }

      function handleEvent(item: ChatStreamEvent) {
        if (item.event === "meta") {
          if (item.data.agent) setLastAgent(item.data.agent);
          return;
        }
        if (item.event === "phase") {
          updatePhase(item.data.label || "JARVIS arbeitet...", item.data.detail || "", item.data.step || "");
          return;
        }
        if (item.event === "memory") {
          updatePhase("Gedächtnis geprüft", `${item.data.facts_used || 0} relevante Memory-Bloecke`, "memory");
          return;
        }
        if (item.event === "delta") {
          const delta = typeof item.data.text === "string" ? item.data.text : item.data.delta;
          if (delta) appendDelta(delta);
          return;
        }
        if (item.event === "done") {
          finishStream(item.data);
          return;
        }
        if (item.event === "error") {
          throw new Error(item.data.detail || "Chat Stream fehlgeschlagen.");
        }
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\n\n/);
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          const item = parseSseBlock(block);
          if (item) handleEvent(item);
        }
      }
      const tail = parseSseBlock(buffer);
      if (tail) handleEvent(tail);
      if (!receivedDone) throw new Error("Chat Stream wurde ohne Abschluss beendet.");
      await loadSessions();
    } catch (error) {
      setInteractionState("idle");
      setMessages((prev) => prev.map((message) => (
        message.streamId === streamId
          ? {
              ...message,
              text: `Fehler beim lokalen Chat: ${error instanceof Error ? error.message : String(error)}\n\nPruefe bitte, ob Ollama laeuft und das Modell qwen3:8b vorhanden ist.`,
              streaming: false,
              phase: "Fehler im Dialog",
            }
          : message
      )));
    } finally {
      setThinking(false);
      setInteractionState("idle");
    }
  }

  function quickAction(label: string) {
    sendMessage(label);
  }

  return (
    <div className={`jarvis-screen ${thinking ? "is-thinking" : ""} ${isDialog ? "dialog-mode" : ""}`} style={{ "--ui-scale": uiScale } as CSSProperties}>
      <DayStartCard onSend={sendMessage} />
      <header className="jarvis-topbar">
        <div className="jarvis-brand">
          <div className="jarvis-mini-orb" />
          <div>
            <div className="jarvis-brand-title">JARVIS</div>
            <div className="jarvis-brand-sub">KI ASSISTENT OBERFLAECHE&nbsp;&nbsp;v2.1.4</div>
          </div>
        </div>
        <div className={`jarvis-system-status ${metrics.status}`}>SYSTEMSTATUS: <b>{statusLabel(metrics.status)}</b></div>
        <div className="jarvis-metrics">
          <div className={metricClass(metrics.cpu.level)}><span>CPU</span><b>{fmtPercent(metrics.cpu.percent)}</b></div>
          <div className={metricClass(metrics.memory.level)}><span>SPEICHER</span><b>{fmtMemory(metrics)}</b></div>
          <div className={metricClass(metrics.temperature.level)}><span>TEMP</span><b>{fmtTemp(metrics.temperature.celsius)}</b></div>
          <div className={metricClass(metrics.network.level)}><span>NETZ</span><b>{metrics.network.label || "N/A"}</b></div>
          <nav className="jarvis-zoom-control" aria-label="Anzeige Zoom">
            <span>ANZEIGE</span>
            <input
              type="range"
              min="100"
              max="200"
              step="10"
              value={uiZoom}
              onChange={(event) => setUiZoom(Number(event.target.value))}
              aria-label="Anzeige Zoom"
            />
            <b>{uiZoom}%</b>
            <button type="button" onClick={() => setUiZoom(100)} title="Zoom zuruecksetzen">100</button>
          </nav>
        </div>
      </header>

      <aside className="jarvis-sidebar">
        {navGroups.map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            {group.items.map(([icon, label]) => (
              <button key={label} className={`jarvis-nav-item ${activeNav === label ? "active" : ""}`} onClick={() => setActiveNav(label)}>
                <span>{icon}</span><em>{label}</em>{label === "Dialog" && <b>&gt;</b>}
              </button>
            ))}
          </section>
        ))}
        <div className="jarvis-user-card">
          <div className="jarvis-user-orb" />
          <div><small>NUTZER</small><strong>Bediener</strong><p>Agent: {lastAgent}</p></div>
          <button>...</button>
        </div>
      </aside>

      <main className="jarvis-main">
        <section className="jarvis-conversation">
          <div className="jarvis-conversation-head">
            <div>
              <h1>Dialog mit JARVIS</h1>
              <p><span />Online&nbsp;&nbsp;â€¢&nbsp;&nbsp;Bereit</p>
            </div>
            <div className="jarvis-head-actions">
              <button className={pinned ? "active" : ""} onClick={() => setPinned(!pinned)}>ANHEFTEN</button>
              <button onClick={newChat}>NEUER CHAT</button>
            </div>
          </div>
          <div className="jarvis-message-list" ref={messageListRef}>
            {messages.map((message, index) => (
              <article key={message.streamId || `${message.time}-${index}-${message.text}`} className={`jarvis-message-card ${message.streaming ? "streaming-card" : ""} ${message.phase ? "has-phase" : ""}`} data-pulse={message.pulse || 0}>
                <div className={`jarvis-avatar ${message.role === "jarvis" ? "jarvis" : "operator"}`}>{message.role === "operator" ? "â—" : ""}</div>
                <div className="jarvis-message-body">
                  <div className="jarvis-message-meta"><b className={message.role === "jarvis" ? "cyan" : ""}>{message.role === "jarvis" ? "JARVIS" : "BEDIENER"}</b><span>{message.time}</span></div>
                  {message.phase && (
                    <div className="jarvis-live-phase">
                      <i />
                      <span>{message.phase}</span>
                      {message.phaseDetail && <em>{message.phaseDetail}</em>}
                    </div>
                  )}
                  <p>{message.text || (message.streaming ? "JARVIS antwortet live..." : "")}</p>
                  {message.meta && (
                    <div className="jarvis-message-insights">
                      {message.meta.agent && <span>Agent: {message.meta.agent}</span>}
                      {message.meta.provider && <span>Provider: {message.meta.provider}</span>}
                      {message.meta.model && <span>Modell: {message.meta.model}</span>}
                      {typeof message.meta.duration_ms === "number" && <span>Dauer: {fmtDuration(message.meta.duration_ms)}</span>}
                      {message.meta.memory && <span>Memory: {message.meta.memory.facts_used || 0}/{message.meta.memory.facts_extracted || 0}</span>}
                    </div>
                  )}
                  {message.link && <button className="jarvis-link-btn" onClick={() => quickAction(message.link!)}>{message.link}<span>&gt;</span></button>}
                  {message.file && <div className="jarvis-file"><span>â–£</span><div><b>system_optimierung_bericht.pdf</b><small>2.4 MB â€¢ PDF Dokument</small></div><button>â†“</button><button>â†—</button></div>}
                </div>
                <button className="jarvis-dots">...</button>
              </article>
            ))}
            {thinking && !messages.some((message) => message.streaming) && <article className="jarvis-message-card thinking-card"><div className="jarvis-avatar jarvis" /><div className="jarvis-message-body"><div className="jarvis-message-meta"><b className="cyan">JARVIS</b><span>{now}</span></div><p>Anfrage wird verarbeitet...</p></div></article>}
          </div>
        </section>

        <section className="jarvis-core-stage">
          <div className="jarvis-legacy-orb-wrap">
            <Orb state={orbState} typingActivity={typingActivity} heatmapActive={thinking} />
          </div>
          <div className="jarvis-core-label"><h2>JARVIS KERN</h2><p>Anpassungsfaehig&nbsp;&nbsp;â€¢&nbsp;&nbsp;Proaktiv&nbsp;&nbsp;â€¢&nbsp;&nbsp;Zuverlaessig</p><div /></div>
        </section>
      </main>

      <aside className="jarvis-right-panel">
        <TodayScheduleCard onSend={sendMessage} />
        <section className="jarvis-card context-card">
          <div className="jarvis-card-title"><h2>GESPRÄCHE</h2><button onClick={() => void loadSessions()}>{sessionLoading ? "LÄDT" : "AKTIV"}</button></div>
          <div className="jarvis-session-list">
            {sessions.slice(0, 4).map((session) => (
              <div className={`jarvis-session-row ${activeSessionId === session.id ? "active" : ""}`} key={session.id}>
                <button type="button" onClick={() => void loadSession(session.id)}>
                  <span />
                  <em>{session.title || "Neuer Chat"}</em>
                  <b>{fmtSessionTime(session.updated_at)}</b>
                </button>
                <button type="button" className="jarvis-session-delete" onClick={() => void deleteSession(session.id)}>x</button>
              </div>
            ))}
            {!sessions.length && <button className="context-row" onClick={newChat}><span /><em>Noch kein gespeicherter Chat</em><b>NEU</b></button>}
          </div>
        </section>
        <section className="jarvis-card quick-card">
          <div className="jarvis-card-title"><h2>SCHNELLAKTIONEN</h2></div>
          {[ ["â–£", "Systemdiagnose starten", "Vollstaendiger Systemcheck"], ["S", "Datenstrom analysieren", "Analyse in Echtzeit"], ["W", "Wissensbasis durchsuchen", "Informationen schnell finden"], ["B", "Bericht erzeugen", "Detaillierten Bericht erstellen"] ].map(([icon, label, sub]) => <button className="quick-action" key={label} onClick={() => quickAction(label)}><span>{icon}</span><em><b>{label}</b><small>{sub}</small></em></button>)}
          <button className="custom-command" onClick={() => quickAction("Eigener Befehl")}>EIGENER BEFEHL <span>&gt;</span></button>
        </section>
        <section className="jarvis-card snapshot-card">
          <div className="jarvis-card-title"><h2>SYSTEMMOMENT</h2><button>â€¢ AKTIV</button></div>
          <div className="snapshot-grid">
            <div className={metricClass(metrics.cpu.level)}><span>CPU</span><b>{fmtPercent(metrics.cpu.percent)}</b></div>
            <div className={metricClass(metrics.memory.level)}><span>Speicher</span><b>{fmtPercent(metrics.memory.percent)}</b></div>
            <div><span>Datentraeger</span><b>68%</b></div>
          </div>
          <div className="snapshot-bottom"><div className={metricClass(metrics.network.level)}><span>Netzwerk</span><b>{metrics.network.label || "N/A"}</b></div><ul><li><span>Aktive Prozesse</span><b>142</b></li><li><span>Laufzeit</span><b>Aktiv</b></li><li className={metricClass(metrics.temperature.level)}><span>Temperatur</span><b>{fmtTemp(metrics.temperature.celsius)}</b></li><li><span>Energie</span><b>{statusLabel(metrics.status)}</b></li></ul></div>
        </section>
      </aside>

      <section className="jarvis-input-panel">
        <div className="jarvis-input-row">
          <button className="voice-btn" onMouseDown={() => setListening(true)} onMouseUp={() => setListening(false)} onMouseLeave={() => setListening(false)}>â‰‹</button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Befehl oder Frage eingeben..." />
          <button className="plus-btn">+</button>
          <button className="send-btn" onClick={() => sendMessage()}>âž¤</button>
        </div>
        <div className="jarvis-chip-row">
          {["Letzte Aktivitaet zusammenfassen", "Sicherheitsstatus pruefen", "Leistung analysieren", "Beim Code helfen", "Wissensbasis durchsuchen"].map((chip) => <button key={chip} onClick={() => quickAction(chip)}>{chip}</button>)}
        </div>
      </section>

      <DashboardModules activeNav={activeNav} onSend={sendMessage} />
    </div>
  );
}
