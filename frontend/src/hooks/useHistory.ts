import { useState, useCallback } from "react";
import { ChatMessage, normalizeMessageContent } from "../components/ChatLayer";

const STORAGE_KEY = "jarvis_chat_history";
const MAX_MESSAGES = 50;

function loadFromStorage(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant"))
      .map((m: any) => ({ ...m, content: normalizeMessageContent(m.content) }));
  } catch {
    return [];
  }
}

function saveToStorage(messages: ChatMessage[]) {
  try {
    // Nur die letzten MAX_MESSAGES behalten
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage voll oder nicht verfügbar — still ignorieren
  }
}

export function useHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadFromStorage);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const safeMsg = { ...msg, content: normalizeMessageContent(msg.content) };
      const next = [...prev, safeMsg].slice(-MAX_MESSAGES);
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateLastAssistant = useCallback((content: unknown) => {
    setMessages((prev) => {
      const next = [...prev];
      // Letzten Assistant-Eintrag aktualisieren (für Streaming)
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "assistant") {
          next[i] = { ...next[i], content: normalizeMessageContent(content) };
          break;
        }
      }
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }, []);

  return { messages, addMessage, updateLastAssistant, clearHistory };
}
