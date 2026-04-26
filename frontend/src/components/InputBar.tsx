import { useState, useRef, useCallback, useEffect } from "react";
import { getMatchingCommands, SlashCommand } from "../hooks/useSlashCommands";
import { UploadedFile } from "../hooks/useFileUpload";

interface InputBarProps {
  onSend: (text: string) => void;
  onListening?: (active: boolean) => void;
  onNavigate?: (target: string) => void;
  onFileSelect?: (file: File) => void;
  uploadedFile?: UploadedFile | null;
  uploading?: boolean;
  uploadError?: string | null;
  onClearFile?: () => void;
  triggerVoice?: number; // Timestamp — ändert sich wenn Wake Word erkannt
  disabled?: boolean;
  onTypingActivity?: (v: number) => void;
}

interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null; onstart: (() => void) | null;
}
declare global { interface Window { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance; } }
function getSR() { return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null; }

export function InputBar({ onSend, onListening, onNavigate, onFileSelect, uploadedFile, uploading, uploadError, onClearFile, triggerVoice, disabled, onTypingActivity }: InputBarProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SlashCommand[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoSendRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevTriggerRef = useRef(triggerVoice);

  useEffect(() => { setSuggestions(getMatchingCommands(text)); setSelectedIdx(0); }, [text]);
  useEffect(() => { onListening?.(listening); }, [listening, onListening]);

  // Typing activity for Orb
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTypingActivity = useCallback(() => {
    onTypingActivity?.(1.0);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTypingActivity?.(0), 1500);
  }, [onTypingActivity]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort(); recognitionRef.current = null;
    if (autoSendRef.current) clearTimeout(autoSendRef.current);
    setListening(false); setInterimText("");
  }, []);

  const startListening = useCallback((autoSend = false) => {
    setMicError(null);
    const SR = getSR(); if (!SR) { setMicError("Nicht unterstützt"); return; }
    const rec = new SR();
    rec.lang = "de-DE"; rec.continuous = false; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onstart = () => { setListening(true); setInterimText(""); };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (final) {
        const combined = (text + " " + final).trim();
        setText(combined); setInterimText("");
        if (autoSend || autoSendRef.current !== undefined) {
          if (autoSendRef.current) clearTimeout(autoSendRef.current);
          autoSendRef.current = setTimeout(() => {
            if (combined.trim()) { onSend(combined.trim()); setText(""); }
            autoSendRef.current = null;
          }, 600);
        }
      } else { setInterimText(interim); }
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") setMicError("Mikrofon verweigert");
      else if (e.error !== "aborted") setMicError(`Fehler: ${e.error}`);
      setListening(false); setInterimText("");
    };
    rec.onend = () => { setListening(false); setInterimText(""); recognitionRef.current = null; };
    recognitionRef.current = rec; rec.start();
  }, [text, onSend]);

  // Wake Word Trigger — startet Sprachmodus automatisch mit Auto-Send
  useEffect(() => {
    if (triggerVoice !== undefined && triggerVoice !== prevTriggerRef.current) {
      prevTriggerRef.current = triggerVoice;
      if (!disabled && !listening) {
        stopListening();
        setTimeout(() => startListening(true), 300);
      }
    }
  }, [triggerVoice, disabled, listening, startListening, stopListening]);

  const toggleMic = useCallback(() => {
    if (listening) stopListening(); else if (!disabled) startListening(true);
  }, [listening, disabled, startListening, stopListening]);

  function applySuggestion(cmd: SlashCommand) {
    setSuggestions([]); setText("");
    if (cmd.action === "navigate" && cmd.target) onNavigate?.(cmd.target);
    else if (cmd.action === "message" && cmd.template) onSend(cmd.template);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((s) => Math.min(s + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((s) => Math.max(s - 1, 0)); return; }
      if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); applySuggestion(suggestions[selectedIdx]); return; }
      if (e.key === "Escape") { setSuggestions([]); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      stopListening(); onSend(trimmed); setText("");
    }
  }

  const displayText = listening && interimText ? text + (text ? " " : "") + interimText : text;

  return (
    <div className="jv-inputbar-wrap">
      {(uploadedFile || uploading || uploadError) && (
        <div className="jv-upload-preview">
          {uploading && <span className="jv-upload-status loading">Lese Datei...</span>}
          {uploadError && <span className="jv-upload-status error">{uploadError}</span>}
          {uploadedFile && (
            <>
              <span className="jv-upload-icon">{uploadedFile.type === "pdf" ? "PDF" : "IMG"}</span>
              <span className="jv-upload-name">{uploadedFile.name}</span>
              <span className="jv-upload-size">{(uploadedFile.size / 1024).toFixed(0)} KB</span>
              <button className="jv-upload-clear" onClick={onClearFile}>✕</button>
            </>
          )}
        </div>
      )}

      <div className="jv-inputbar">
        <button type="button" className={`jv-mic ${listening ? "active" : ""}`}
          onClick={toggleMic} disabled={disabled && !listening}>
          {listening ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="4" y1="12" x2="4" y2="12" className="jv-wave w1" />
              <line x1="8" y1="9" x2="8" y2="15" className="jv-wave w2" />
              <line x1="12" y1="6" x2="12" y2="18" className="jv-wave w3" />
              <line x1="16" y1="9" x2="16" y2="15" className="jv-wave w4" />
              <line x1="20" y1="12" x2="20" y2="12" className="jv-wave w5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" /><line x1="12" y1="18" x2="12" y2="22" />
            </svg>
          )}
        </button>

        <button type="button" className={`jv-upload-btn ${uploadedFile ? "has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()} disabled={disabled} title="PDF oder Bild hochladen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect?.(f); e.target.value = ""; }} />

        <div className="jv-input-wrap">
          {suggestions.length > 0 && (
            <div className="jv-slash-dropdown">
              {suggestions.map((cmd, i) => (
                <div key={cmd.trigger} className={`jv-slash-item ${i === selectedIdx ? "selected" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); applySuggestion(cmd); }}>
                  <span className="jv-slash-trigger">{cmd.trigger}</span>
                  <span className="jv-slash-desc">{cmd.description}</span>
                </div>
              ))}
              <div className="jv-slash-hint">Tab · Enter · Esc</div>
            </div>
          )}
          <input className={`jv-input ${listening ? "listening" : ""}`} value={displayText}
            onChange={(e) => { if (!listening) { setText(e.target.value); handleTypingActivity(); } }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Sprechen..." : "Frage, Befehl, /hilfe oder Datei hochladen..."}
            disabled={disabled && !listening} />
          {micError && <div className="jv-mic-error">{micError}</div>}
        </div>

        <button type="button" className="jv-send" disabled={disabled || (!text.trim() && !uploadedFile)}
          onClick={() => { const t = text.trim(); stopListening(); onSend(t || "[Datei analysieren]"); setText(""); }}>
          SENDEN
        </button>
      </div>
    </div>
  );
}
