import { useState, useCallback, useEffect, useRef } from "react";
import { Orb, OrbState } from "./components/Orb";
import { Sidebar } from "./components/Sidebar";
import { ChatLayer, ChatMessage, normalizeMessageContent } from "./components/ChatLayer";
import { InputBar } from "./components/InputBar";
import { TopBar } from "./components/TopBar";
import { TitleBar } from "./components/TitleBar";
import { ContentRouter } from "./components/ContentRouter";
import { useSpeech } from "./hooks/useSpeech";
import { useHistory } from "./hooks/useHistory";
import { useGreeting } from "./hooks/useGreeting";
import { useBootSound } from "./hooks/useBootSound";
import { useSettings } from "./hooks/useSettings";
import { useMemory } from "./hooks/useMemory";
import { useFileUpload } from "./hooks/useFileUpload";
import { useWakeWord } from "./hooks/useWakeWord";
import { detectIntent, executeTool } from "./hooks/useTools";
import { getHelpText } from "./hooks/useSlashCommands";
import { NeuralLog } from "./components/NeuralLog";
import { AgentStatusBar } from "./components/AgentStatusBar";
import { useOrchestrator } from "./hooks/useOrchestrator";
import { useDailyBriefing } from "./hooks/useDailyBriefing";
import { useAwareness } from "./hooks/useAwareness";
import { AwarenessBar } from "./components/AwarenessBar";
import { useProactiveAgent } from "./hooks/useProactiveAgent";
import "./App.css";

export function App() {
  const [activeItem, setActiveItem] = useState("Dialog");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [neuralLogActive, setNeuralLogActive] = useState(false);
  const [typingActivity, setTypingActivity] = useState(0);
  const orbRef = useRef<any>(null);
  const [busy, setBusy] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [voiceTrigger, setVoiceTrigger] = useState<number | undefined>(undefined);

  const { settings, update, reset } = useSettings();
  const { messages, addMessage, updateLastAssistant, clearHistory } = useHistory();
  const {
    facts, addFact, removeFact, clearFacts,
    getMemoryBlock, parseExplicitCommand, autoExtract,
  } = useMemory(settings.apiUrl, settings.model);
  const { uploadedFile, uploading, uploadError, processFile, clearFile } = useFileUpload();
  const lastSpokenRef = useRef<number>(-1);

  // ── Orchestrator ──────────────────────────────────────────────────
  const { state: orchState, run: orchRun, abort: orchAbort } = useOrchestrator({
    apiUrl:      settings.apiUrl,
    model:       settings.model,
    memoryFacts: facts.map((f) => f.text),
    onOrbState:  setOrbState,
    onDelta:     (chunk) => updateLastAssistant((prev: string) => {
      const clean = prev.endsWith("▌") ? prev.slice(0,-1) : prev;
      return clean + chunk + "▌";
    }),
    onDone: (full) => {
      updateLastAssistant(full);
      setTimeout(() => setOrbState("idle"), 200);
      if (full) autoExtract("", full);
    },
    onError: (msg) => {
      updateLastAssistant(`Fehler: ${msg}`);
      setOrbState("idle");
      setBusy(false);
    },
  });

  const { speak, stop, status: speechStatus } = useSpeech({
    onStart: () => setOrbState("speaking"),
    onEnd: () => setOrbState("idle"),
    settings,
  });

  const { status: wakeStatus } = useWakeWord({
    enabled: wakeWordEnabled && activeItem === "Dialog" && !busy,
    onWakeWord: useCallback(() => {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
        setTimeout(() => ctx.close(), 500);
      } catch { /* ignore */ }
      setOrbState("listening");
      setVoiceTrigger(Date.now());
    }, []),
  });

  useGreeting(addMessage);
  useBootSound();

  // Awareness Pipeline
  const { context: desktopContext, online: awarenessOnline } = useAwareness(settings.apiUrl);

  // Proaktiver Agent
  useProactiveAgent({
    awareness: desktopContext,
    awarenessOnline: awarenessOnline,
    enabled: true,
    onSuggestion: (text) => addMessage({ role: "assistant", content: text, timestamp: Date.now() }),
  });

  // Daily Briefing (einmal pro Tag)
  useDailyBriefing({
    apiUrl: settings.apiUrl,
    enabled: true,
    onBriefing: (text) => addMessage({ role: "assistant", content: text, timestamp: Date.now() }),
    onOrbState: setOrbState,
  });

  // Wake word visual flash
  useEffect(() => {
    if (wakeStatus === "detected") {
      setTypingActivity(1.0);
      setTimeout(() => setTypingActivity(0), 600);
    }
  }, [wakeStatus]);

  // Auto-speak neue Assistenten-Nachrichten
  useEffect(() => {
    const assMsgs = messages.filter((m) => m.role === "assistant");
    const lastIdx = assMsgs.length - 1;
    if (lastIdx < 0) return;
    if (lastIdx === lastSpokenRef.current) return;
    const spokenText = normalizeMessageContent(assMsgs[lastIdx].content);
    if (spokenText.endsWith("▌")) return;
    lastSpokenRef.current = lastIdx;
    speak(spokenText);
  }, [messages, speak]);

  // Voice Interface: Transkript aus Push-to-Talk direkt als Chat-Nachricht senden
  useEffect(() => {
    const handler = (e: Event) => {
      const transcript = (e as CustomEvent).detail?.transcript as string | undefined;
      if (!transcript?.trim() || busy) return;
      handleSend(transcript.trim());
    };
    window.addEventListener("jarvis-transcript", handler);
    return () => window.removeEventListener("jarvis-transcript", handler);
  }, [busy, handleSend]);

  const handleListening = useCallback((active: boolean) => {
    if (busy || speechStatus === "speaking") return;
    setOrbState(active ? "listening" : "idle");
  }, [busy, speechStatus]);

  const handleSend = useCallback(async (text: string) => {
    if (text === "__CLEAR__") { clearHistory(); lastSpokenRef.current = -1; return; }
    if (text === "__HELP__") {
      addMessage({ role: "assistant", content: getHelpText(), timestamp: Date.now() });
      return;
    }

    const memCmd = parseExplicitCommand(text);
    if (memCmd.action === "add" && memCmd.fact) {
      addFact(memCmd.fact, "explicit");
      addMessage({ role: "assistant", content: `Gespeichert: "${memCmd.fact}"`, timestamp: Date.now() });
      (orbRef.current as any)?.triggerMemoryFlash?.();
      return;
    }
    if (memCmd.action === "clear") {
      clearFacts();
      addMessage({ role: "assistant", content: "Gedaechtnis geloescht.", timestamp: Date.now() });
      return;
    }

    stop();
    const displayText = uploadedFile
      ? uploadedFile.type === "pdf"
        ? `${text || "Datei analysieren"}\n[Anhang: ${uploadedFile.name}]\n\n[Dateiinhalt Auszug]\n${uploadedFile.content}`
        : `${text || "Bild analysieren"}\n[Anhang: ${uploadedFile.name}]\n[Bild wurde lokal geladen. Beschreibung bitte anhand der Nutzerangabe erstellen.]`
      : text;
    const userMsg: ChatMessage = { role: "user", content: displayText, timestamp: Date.now() };
    addMessage(userMsg);
    setBusy(true);
    addMessage({ role: "assistant", content: "▌", timestamp: Date.now() });

    // Orchestrator übernimmt Routing + Streaming
    const historyForOrch = [...messages, userMsg].map(m => ({role: m.role, content: normalizeMessageContent(m.content)}));
    await orchRun(displayText, historyForOrch);
    clearFile();
    setBusy(false);
  }, [messages, addMessage, updateLastAssistant, clearHistory, stop, settings,
      uploadedFile, clearFile, getMemoryBlock, parseExplicitCommand, addFact, clearFacts, autoExtract]);

  const isDialog = activeItem === "Dialog";

  return (
    <div className={`jv-root jv-command-center jv-state-${orbState}`}>
      <TitleBar />
      <Orb state={orbState} heatmapActive={heatmapActive} typingActivity={typingActivity} />
      <TopBar
        state={orbState}
        onStopSpeech={stop}
        isSpeaking={speechStatus === "speaking"}
        onClearHistory={clearHistory}
        messageCount={messages.length}
        wakeWordStatus={wakeStatus}
        onToggleWakeWord={() => setWakeWordEnabled((e) => !e)}
        heatmapActive={heatmapActive}
        onToggleHeatmap={() => setHeatmapActive(h => !h)}
        neuralLogActive={neuralLogActive}
        onToggleNeuralLog={() => setNeuralLogActive(l => !l)}
      />
      <AgentStatusBar state={orchState} />
      <AwarenessBar context={desktopContext} online={awarenessOnline} />
      <Sidebar
          activeItem={activeItem}
          onSelect={setActiveItem}
          orchState={orchState}
          awareness={desktopContext}
          awarenessOnline={awarenessOnline}
          memoryCount={facts.length}
          messageCount={messages.length}
        />
      {isDialog && <ChatLayer messages={messages} isLoading={busy} />}
      {isDialog && (
        <InputBar
          onSend={handleSend}
          onListening={handleListening}
          onNavigate={setActiveItem}
          onFileSelect={processFile}
          uploadedFile={uploadedFile}
          uploading={uploading}
          uploadError={uploadError}
          onClearFile={clearFile}
          triggerVoice={voiceTrigger}
          disabled={busy}
          onTypingActivity={setTypingActivity}
        />
      )}
      <ContentRouter
        activeItem={activeItem}
        settings={settings}
        onUpdate={update}
        onReset={reset}
        memory={{ facts, addFact, removeFact, clearFacts }}
      />
      {neuralLogActive && <NeuralLog state={orbState} />}
    </div>
  );
}
