// JARVIS Orchestrator Hook
import { useState, useCallback, useRef } from "react";
import { OrbState } from "../components/Orb";

export type AgentName = "sap"|"calendar"|"research"|"memory"|"email"|"general"|"file"|"exam"|"vde"|null;

function normalizeStreamContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map(normalizeStreamContent).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["content", "response", "text", "message", "answer", "output", "result", "delta", "value"]) {
      if (key in obj && obj[key] !== value) {
        const normalized = normalizeStreamContent(obj[key]);
        if (normalized.trim()) return normalized;
      }
    }
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }
  return String(value);
}

export interface AgentEvent {
  event: string; agent?: AgentName; content?: unknown;
  reason?: string; confidence?: number; message?: string; tool_log?: string[]; response?: unknown; text?: unknown;
}

export interface OrchestratorState {
  activeAgent: AgentName; routing: {agent:AgentName;reason:string;confidence:number}|null;
  toolLog: string[]; isRunning: boolean; lastAgent: AgentName;
}

interface UseOrchestratorProps {
  apiUrl: string; model: string; memoryFacts: string[];
  onOrbState: (s: OrbState) => void;
  onDelta:    (chunk: string) => void;
  onDone:     (full: string) => void;
  onError:    (msg: string) => void;
}

export const AGENT_LABELS: Record<string, string> = {
  sap:"SAP-Agent", calendar:"Kalender-Agent", research:"Recherche-Agent",
  memory:"Memory-Agent", email:"Email-Agent", general:"General-Agent",
  file:"File-Agent", exam:"Pruefungs-Agent", vde:"VDE-Agent",
};

export const AGENT_COLORS: Record<string, string> = {
  sap:"#4ca8e8", calendar:"#4ce8a0", research:"#e8c44c",
  memory:"#c44ce8", email:"#e84c4c", general:"#6ec4ff",
  file:"#e8a04c", exam:"#4ce8e8", vde:"#a0e84c",
};

export const AGENT_ICONS: Record<string, string> = {
  sap:"⬡", calendar:"◈", research:"◎", memory:"◉", email:"◆", general:"○",
  file:"▣", exam:"△", vde:"◐",
};

export function useOrchestrator({
  apiUrl, model, memoryFacts, onOrbState, onDelta, onDone, onError,
}: UseOrchestratorProps) {
  const [state, setState] = useState<OrchestratorState>({
    activeAgent:null, routing:null, toolLog:[], isRunning:false, lastAgent:null,
  });
  const accumulated = useRef("");
  const abortCtrl   = useRef<AbortController|null>(null);

  const run = useCallback(async (
    userInput: string,
    history: Array<{role:string;content:string}>,
  ) => {
    abortCtrl.current?.abort();
    abortCtrl.current = new AbortController();
    // Request-Timeout: 45 Sekunden, dann auto-abbruch
    const timeoutId = setTimeout(() => {
      console.warn("Orchestrator Timeout nach 45s");
      abortCtrl.current?.abort();
    }, 45000);
    accumulated.current = "";
    setState(s=>({...s, isRunning:true, activeAgent:null, routing:null, toolLog:[]}));
    onOrbState("thinking");

    try {
      let res: Response;
      let usingFallback = false;

      try {
        res = await fetch(`${apiUrl}/orchestrate/run`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          signal: abortCtrl.current.signal,
          body: JSON.stringify({
            user_input:userInput, api_url:apiUrl, model,
            memory_facts:memoryFacts, history:history.slice(-6),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch {
        // Fallback: direkt Ollama auf Port 11434
        console.warn("Orchestrator offline, Fallback auf Ollama");
        usingFallback = true;
        setState(s=>({...s, activeAgent:"general", lastAgent:"general",
          routing:{agent:"general",reason:"Fallback: Backend offline",confidence:1}}));
        res = await fetch("http://localhost:11434/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          signal: abortCtrl.current.signal,
          body: JSON.stringify({
            model, stream: true,
            messages: [
              {role:"system", content:"Du bist JARVIS, persoenlicher KI-Assistent. Deutsch, praezise, direkt."},
              ...history.slice(-6),
              {role:"user", content:userInput},
            ],
          }),
        });
        if (!res.ok) throw new Error("Ollama Fallback nicht erreichbar");
      }
      if (!res.body) throw new Error("Kein Stream");

      const reader = res.body.getReader();
      const dec    = new TextDecoder();

      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        for (const line of dec.decode(value,{stream:true}).split("\n")) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw==="[DONE]") break;
          let parsed: any;
          try { parsed=JSON.parse(raw); } catch { continue; }

          // Ollama/OpenAI Format: {"choices":[{"delta":{"content":"..."}}]}
          if (usingFallback || parsed.choices) {
            const delta = normalizeStreamContent(parsed.choices?.[0]?.delta?.content);
            if (delta) {
              accumulated.current += delta;
              onDelta(delta);
            }
            if (parsed.choices?.[0]?.finish_reason === "stop") {
              clearTimeout(timeoutId);
              setState(s=>({...s, isRunning:false, activeAgent:null, toolLog:["Fallback: Ollama direkt"]}));
              onDone(accumulated.current);
              onOrbState("idle");
            }
            continue;
          }

          // Orchestrator SSE Format
          const evt = parsed as AgentEvent;
          if (evt.event==="routing") {
            setState(s=>({...s, activeAgent:evt.agent??null, lastAgent:evt.agent??null,
              routing:{agent:evt.agent??null, reason:evt.reason??"", confidence:evt.confidence??0}}));
          } else if (evt.event==="thinking") {
            setState(s=>({...s, activeAgent:evt.agent??s.activeAgent}));
            onOrbState("thinking");
          } else if (evt.event==="delta") {
            const chunk = normalizeStreamContent(evt.content ?? evt.response ?? evt.text ?? "");
            accumulated.current += chunk;
            onDelta(chunk);
          } else if (evt.event==="done") {
            clearTimeout(timeoutId);
            setState(s=>({...s, isRunning:false, activeAgent:null,
              toolLog:[...s.toolLog,...(evt.tool_log??[])]}));
            onDone(accumulated.current);
            onOrbState("idle");
          } else if (evt.event==="error") {
            onError(evt.message??"Fehler");
            setState(s=>({...s, isRunning:false, activeAgent:null}));
            onOrbState("idle");
          }
        }
      }
    } catch(e:unknown) {
      if ((e as Error)?.name==="AbortError") return;
      onError(e instanceof Error ? e.message : "Verbindungsfehler");
      setState(s=>({...s, isRunning:false, activeAgent:null}));
      onOrbState("idle");
    }
  }, [apiUrl, model, memoryFacts, onOrbState, onDelta, onDone, onError]);

  const abort = useCallback(()=>{
    abortCtrl.current?.abort();
    setState(s=>({...s, isRunning:false, activeAgent:null}));
    onOrbState("idle");
  }, [onOrbState]);

  return {state, run, abort};
}
