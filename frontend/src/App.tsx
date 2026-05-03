import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Orb, type OrbEventSignal, type OrbState } from "./components/Orb";
import { useLayoutMode } from "./hooks/useLayoutMode";
import { IronManShell } from "./components/IronManShell";
import { DashboardModules } from "./components/DashboardModules";
import { DayStartCard } from "./components/DayStartCard";
import { TodayScheduleCard } from "./components/TodayScheduleCard";
import { jarvisSound } from "./sound-engine";
import "./jarvis-dashboard.css";
import "./orb-legacy.css";
import "./chat-window.css";
// Master HUD tokens — must load LAST so the alias layer overrides the legacy
// drift values still embedded in jarvis-dashboard.css. See docs/FRONTEND_VISUAL_ROADMAP.md.
import "./styles/tokens.css";
// HUD enhancements: corner brackets on cards, MIC OFF pill, sidebar glow,
// pulse dots, button/scrollbar/selection polish. Additive only.
import "./styles/hud-enhancements.css";

type Role = "operator" | "jarvis";
type Level = "ok" | "warn" | "critical" | "unknown";
type DashboardTheme = "jarvis" | "matrix" | "ultron";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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
  kind?: string;
  intensity?: number;
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

type VoiceCoreResponse = {
  settings?: {
    language?: string;
    send_transcript_to_chat?: boolean;
    auto_speak?: boolean;
    rate?: number;
    pitch?: number;
    volume?: number;
  };
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
  { title: "SYSTEM", items: [["R", "JARVIS Runtime"], ["D", "Diagnose"], ["N", "Agentennetz"], ["M", "Speicherbanken"], ["K", "Kernsysteme"], ["U", "Optionen / Updates"], ["S", "Sicherheitszentrale"]] },
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

function loadSoundEnabled() {
  try {
    return localStorage.getItem("jarvis_sound_enabled") === "true";
  } catch {}
  return false;
}

function loadSoundVolume() {
  try {
    const value = Number(localStorage.getItem("jarvis_sound_volume") || "22");
    if (Number.isFinite(value)) return Math.min(100, Math.max(0, value));
  } catch {}
  return 22;
}

function loadDashboardTheme(): DashboardTheme {
  try {
    const value = localStorage.getItem("jarvis_dashboard_theme");
    if (value === "matrix" || value === "ultron") return value;
  } catch {}
  return "jarvis";
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
  const [orbSignal, setOrbSignal] = useState<OrbEventSignal | null>(null);
  const [orbStatus, setOrbStatus] = useState("BEREIT");
  const [metrics, setMetrics] = useState<SystemMetrics>(fallbackMetrics);
  const [lastAgent, setLastAgent] = useState("general");
  const [uiZoom, setUiZoom] = useState(loadUiZoom);
  const [soundEnabled, setSoundEnabled] = useState(loadSoundEnabled);
  const [soundVolume, setSoundVolume] = useState(loadSoundVolume);
  const [dashboardTheme, setDashboardTheme] = useState<DashboardTheme>(loadDashboardTheme);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Push-to-Talk bereit");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("de-DE");
  const [voiceSendToChat, setVoiceSendToChat] = useState(true);
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState(false);
  const [voiceTtsRate, setVoiceTtsRate] = useState(0.96);
  const [voiceTtsPitch, setVoiceTtsPitch] = useState(0.82);
  const [voiceTtsVolume, setVoiceTtsVolume] = useState(0.72);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceFinalTranscriptRef = useRef("");

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
    void loadVoiceCore();
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

  useEffect(() => {
    try {
      localStorage.setItem("jarvis_dashboard_theme", dashboardTheme);
      document.documentElement.dataset.jarvisTheme = dashboardTheme;
    } catch {}
  }, [dashboardTheme]);

  useEffect(() => {
    jarvisSound.configure(soundEnabled, soundVolume / 100);
    try {
      localStorage.setItem("jarvis_sound_enabled", String(soundEnabled));
      localStorage.setItem("jarvis_sound_volume", String(soundVolume));
    } catch {}
  }, [soundEnabled, soundVolume]);

  useEffect(() => {
    jarvisSound.setMode(orbState);
  }, [orbState]);

  async function loadVoiceCore() {
    const browserWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    setVoiceSupported(Boolean(browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition));
    try {
      const response = await fetch("/voice/core", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as VoiceCoreResponse;
      const settings = data.settings || {};
      if (settings.language) setVoiceLanguage(settings.language);
      if (typeof settings.send_transcript_to_chat === "boolean") setVoiceSendToChat(settings.send_transcript_to_chat);
      if (typeof settings.auto_speak === "boolean") setVoiceAutoSpeak(settings.auto_speak);
      if (typeof settings.rate === "number") setVoiceTtsRate(settings.rate);
      if (typeof settings.pitch === "number") setVoiceTtsPitch(settings.pitch);
      if (typeof settings.volume === "number") setVoiceTtsVolume(settings.volume);
    } catch {
      setVoiceStatus("Voice Backend nicht erreichbar");
    }
  }

  async function updateVoiceRuntime(payload: Record<string, unknown>) {
    try {
      await fetch("/voice/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}
  }

  async function storeVoiceTranscript(text: string) {
    try {
      await fetch("/voice/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch {}
  }

  function speakJarvis(text: string) {
    if (!voiceAutoSpeak || !("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 900));
    utterance.lang = voiceLanguage;
    utterance.rate = voiceTtsRate;
    utterance.pitch = voiceTtsPitch;
    utterance.volume = Math.max(0, Math.min(1, voiceTtsVolume));
    window.speechSynthesis.speak(utterance);
  }

  function getRecognition() {
    if (recognitionRef.current) return recognitionRef.current;
    const browserWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSupported(false);
      setVoiceStatus("Browser unterstuetzt Speech Recognition nicht");
      return null;
    }
    const recognition = new Recognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("Hoere zu...");
      setOrbStatus("VOICE INPUT");
      void updateVoiceRuntime({ listening: true, last_event: "listening_started" });
    };
    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = String(result?.[0]?.transcript || "");
        if (result?.isFinal) finalText += text;
        else interim += text;
      }
      if (finalText.trim()) voiceFinalTranscriptRef.current = `${voiceFinalTranscriptRef.current} ${finalText}`.trim();
      const visible = `${voiceFinalTranscriptRef.current} ${interim}`.trim();
      setVoiceTranscript(visible);
      if (visible) setInput(visible);
    };
    recognition.onerror = (event: { error?: string }) => {
      setListening(false);
      setVoiceStatus(event.error === "not-allowed" ? "Mikrofonfreigabe blockiert" : `Voice Fehler: ${event.error || "unbekannt"}`);
      setOrbStatus("VOICE FEHLER");
      jarvisSound.play("error_pulse");
      void updateVoiceRuntime({ listening: false, last_event: "voice_error" });
    };
    recognition.onend = () => {
      setListening(false);
      setOrbStatus("BEREIT");
      const finalText = voiceFinalTranscriptRef.current.trim();
      void updateVoiceRuntime({ listening: false, last_event: "listening_stopped", last_transcript: finalText });
      if (!finalText) {
        setVoiceStatus("Kein Sprachtext erkannt");
        return;
      }
      setVoiceStatus(voiceSendToChat ? "Transkript wird gesendet..." : "Transkript bereit");
      void storeVoiceTranscript(finalText);
      if (voiceSendToChat) void sendMessage(finalText);
    };
    recognitionRef.current = recognition;
    return recognition;
  }

  async function startVoiceInput() {
    if (thinking || listening) return;
    const recognition = getRecognition();
    if (!recognition) return;
    recognition.lang = voiceLanguage;
    voiceFinalTranscriptRef.current = "";
    setVoiceTranscript("");
    try {
      await fetch("/voice/microphone/enable", { method: "POST" });
    } catch {}
    jarvisSound.play("listening_start");
    try {
      recognition.start();
    } catch {
      setVoiceStatus("Voice ist bereits aktiv");
    }
  }

  function stopVoiceInput() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setListening(false);
      return;
    }
    setVoiceStatus("Transkript wird verarbeitet...");
    try {
      recognition.stop();
    } catch {
      setListening(false);
    }
  }

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
    jarvisSound.play("agent_route");
    let errorSoundPlayed = false;
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
      let streamedAnswer = "";

      function appendDelta(delta: string) {
        streamedAnswer += delta;
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
        const finalAnswer = streamedAnswer.trim() || readChatResponse(result);
        setMessages((prev) => prev.map((message) => {
          if (message.streamId !== streamId) return message;
          return {
            ...message,
            text: finalAnswer,
            meta: chatMetaFromResponse(result),
            streaming: false,
            phase: "Antwort abgeschlossen",
            phaseDetail: "",
          };
        }));
        if (finalAnswer) speakJarvis(finalAnswer);
      }

      function updatePhase(label: string, detail = "", step = "") {
        if (step === "answer") setInteractionState("speaking");
        else if (step && step !== "done") setInteractionState("thinking");
        setOrbStatus(label);
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
        if (item.event === "orb") {
          const label = item.data.label || "Orb Signal";
          setOrbStatus(label);
          jarvisSound.play(item.data.kind || "ui_toggle");
          setOrbSignal({
            kind: item.data.kind || "pulse",
            label,
            detail: item.data.detail || "",
            intensity: item.data.intensity,
            nonce: Date.now() + Math.random(),
          });
          return;
        }
        if (item.event === "phase") {
          updatePhase(item.data.label || "JARVIS arbeitet...", item.data.detail || "", item.data.step || "");
          return;
        }
        if (item.event === "memory") {
          updatePhase("Gedächtnis geprüft", `${item.data.facts_used || 0} relevante Memory-Blöcke`, "memory");
          return;
        }
        if (item.event === "delta") {
          const delta = typeof item.data.text === "string" ? item.data.text : item.data.delta;
          if (delta) appendDelta(delta);
          return;
        }
        if (item.event === "done") {
          setOrbStatus("BEREIT");
          jarvisSound.play("done");
          finishStream(item.data);
          return;
        }
        if (item.event === "error") {
          if (!errorSoundPlayed) {
            jarvisSound.play("error_pulse");
            errorSoundPlayed = true;
          }
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
      setOrbStatus("FEHLER");
      if (!errorSoundPlayed) jarvisSound.play("error_pulse");
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

  async function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      await jarvisSound.unlock();
      jarvisSound.configure(true, soundVolume / 100);
      jarvisSound.play("ui_toggle");
    }
  }

  const layoutMode = useLayoutMode();
  if (layoutMode.mode === "iron-man") {
    return (
      <IronManShell
        orbState={orbState}
        orbSignal={orbSignal}
        typingActivity={typingActivity}
        thinking={thinking}
        onSwitchToClassic={() => layoutMode.setMode("classic")}
        onSubmit={async (command) => {
          // Naive Bridge fuer F1: Text-Eingaben gehen durch die bestehende sendMessage.
          // F4 ersetzt das durch echtes Slash-Routing.
          if (typeof sendMessage === "function") {
            await sendMessage(command.raw);
          }
        }}
      />
    );
  }

  return (
    <div className={`jarvis-screen theme-${dashboardTheme} ${thinking ? "is-thinking" : ""} ${orbState === "speaking" ? "is-speaking" : ""} ${isDialog ? "dialog-mode" : ""}`} style={{ "--ui-scale": uiScale } as CSSProperties}>
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
          <nav className="jarvis-sound-control" aria-label="JARVIS Sound">
            <span>SOUND</span>
            <button type="button" className={soundEnabled ? "active" : ""} onClick={() => void toggleSound()} title="Sound an oder aus">{soundEnabled ? "AN" : "AUS"}</button>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={soundVolume}
              onChange={(event) => setSoundVolume(Number(event.target.value))}
              aria-label="Sound Lautstaerke"
            />
            <b>{soundVolume}%</b>
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
              <p><span />Online&nbsp;&nbsp;•&nbsp;&nbsp;Bereit</p>
            </div>
            <div className="jarvis-head-actions">
              <button className={pinned ? "active" : ""} onClick={() => setPinned(!pinned)}>ANHEFTEN</button>
              <button onClick={newChat}>NEUER CHAT</button>
            </div>
          </div>
          <div className="jarvis-message-list" ref={messageListRef}>
            {messages.map((message, index) => (
              <article key={message.streamId || `${message.time}-${index}-${message.text}`} className={`jarvis-message-card ${message.streaming ? "streaming-card" : ""} ${message.phase ? "has-phase" : ""}`} data-pulse={message.pulse || 0}>
                <div className={`jarvis-avatar ${message.role === "jarvis" ? "jarvis" : "operator"}`}>{message.role === "operator" ? "•" : ""}</div>
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
                  {message.file && <div className="jarvis-file"><span>▣</span><div><b>system_optimierung_bericht.pdf</b><small>2.4 MB • PDF Dokument</small></div><button>↧</button><button>↗</button></div>}
                </div>
                <button className="jarvis-dots">...</button>
              </article>
            ))}
            {thinking && !messages.some((message) => message.streaming) && <article className="jarvis-message-card thinking-card"><div className="jarvis-avatar jarvis" /><div className="jarvis-message-body"><div className="jarvis-message-meta"><b className="cyan">JARVIS</b><span>{now}</span></div><p>Anfrage wird verarbeitet...</p></div></article>}
          </div>
        </section>

        <section className="jarvis-core-stage">
          <div className="jarvis-legacy-orb-wrap">
            <Orb state={orbState} typingActivity={typingActivity} heatmapActive={thinking || orbState === "speaking"} eventSignal={orbSignal} />
          </div>
          <div className="jarvis-core-label"><h2>JARVIS KERN</h2><small>{orbStatus}</small><p>Anpassungsfähig&nbsp;&nbsp;•&nbsp;&nbsp;Proaktiv&nbsp;&nbsp;•&nbsp;&nbsp;Zuverlässig</p><div /></div>
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
          {[ ["▣", "Systemdiagnose starten", "Vollständiger Systemcheck"], ["S", "Datenstrom analysieren", "Analyse in Echtzeit"], ["W", "Wissensbasis durchsuchen", "Informationen schnell finden"], ["B", "Bericht erzeugen", "Detaillierten Bericht erstellen"] ].map(([icon, label, sub]) => <button className="quick-action" key={label} onClick={() => quickAction(label)}><span>{icon}</span><em><b>{label}</b><small>{sub}</small></em></button>)}
          <button className="custom-command" onClick={() => quickAction("Eigener Befehl")}>EIGENER BEFEHL <span>&gt;</span></button>
        </section>
        <section className="jarvis-card snapshot-card">
          <div className="jarvis-card-title"><h2>SYSTEMMOMENT</h2><button>• AKTIV</button></div>
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
          <button
            className={`voice-btn ${listening ? "active" : ""}`}
            type="button"
            disabled={!voiceSupported || thinking}
            onMouseDown={() => void startVoiceInput()}
            onMouseUp={stopVoiceInput}
            onMouseLeave={() => listening && stopVoiceInput()}
            onTouchStart={(event) => { event.preventDefault(); void startVoiceInput(); }}
            onTouchEnd={(event) => { event.preventDefault(); stopVoiceInput(); }}
            title={voiceSupported ? "Gedrueckt halten zum Sprechen" : "Speech Recognition wird von diesem Browser nicht unterstuetzt"}
          >
            MIC
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Befehl oder Frage eingeben..." />
          <button className="plus-btn">+</button>
          <button className="send-btn" onClick={() => sendMessage()}>➤</button>
        </div>
        <div className={`jarvis-voice-status ${listening ? "active" : ""} ${voiceSupported ? "" : "unsupported"}`}>
          <span>{listening ? "LIVE" : voiceSupported ? "VOICE" : "OFF"}</span>
          <b>{voiceStatus}</b>
          {voiceTranscript && <em>{voiceTranscript}</em>}
        </div>
        <div className="jarvis-chip-row">
          {["Letzte Aktivitaet zusammenfassen", "Sicherheitsstatus pruefen", "Leistung analysieren", "Beim Code helfen", "Wissensbasis durchsuchen"].map((chip) => <button key={chip} onClick={() => quickAction(chip)}>{chip}</button>)}
        </div>
      </section>

      <DashboardModules activeNav={activeNav} onSend={sendMessage} dashboardTheme={dashboardTheme} onThemeChange={setDashboardTheme} />
    </div>
  );
}

