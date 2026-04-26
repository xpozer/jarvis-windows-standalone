// JARVIS EmailAgent Hook
// Kommuniziert mit /email/* Backend-Endpoints

import { useState, useCallback } from "react";

export interface MailEntry {
  entryId:    string;
  sender:     string;
  subject:    string;
  received:   string;
  confidence: number;
  reason:     string;
}

export interface ScanResult {
  total_scanned: number;
  spam:          MailEntry[];
  legitimate:    MailEntry[];
  unknown:       MailEntry[];
  threshold:     number;
}

export type AgentStatus = "idle" | "scanning" | "done" | "error";

export function useEmailAgent(apiUrl: string) {
  const [status,     setStatus]     = useState<AgentStatus>("idle");
  const [result,     setResult]     = useState<ScanResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [progress,   setProgress]   = useState<string>("");
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [outlookOnline, setOutlookOnline] = useState<boolean | null>(null);

  // Outlook-Status pruefen
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/email/status`);
      const data = await res.json();
      setOutlookOnline(data.status === "online");
      return data.status === "online";
    } catch {
      setOutlookOnline(false);
      return false;
    }
  }, [apiUrl]);

  // Inbox scannen
  const scan = useCallback(async (maxMails = 30, threshold = 0.75) => {
    setStatus("scanning");
    setError(null);
    setResult(null);
    setSelected(new Set());
    setProgress("Verbinde mit Outlook...");

    try {
      const res = await fetch(`${apiUrl}/email/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_mails: maxMails,
          spam_threshold: threshold,
          api_url: apiUrl,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("Kein Stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.event === "start")   setProgress(evt.message);
            if (evt.event === "error")   { setError(evt.message); setStatus("error"); return; }
            if (evt.event === "summary") setProgress(evt.message);
            if (evt.event === "result") {
              setResult({
                total_scanned: evt.total_scanned,
                spam:          evt.spam          ?? [],
                legitimate:    evt.legitimate    ?? [],
                unknown:       evt.unknown       ?? [],
                threshold:     evt.threshold     ?? threshold,
              });
              // Alle Spam-Kandidaten vorauswählen
              setSelected(new Set((evt.spam ?? []).map((m: MailEntry) => m.entryId)));
            }
          } catch { /* ignore malformed */ }
        }
      }
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      setStatus("error");
    }
  }, [apiUrl]);

  // Auswahl loeschen
  const deleteSelected = useCallback(async (permanent = false) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setProgress(`Lösche ${ids.length} Mails...`);
    try {
      const res = await fetch(`${apiUrl}/email/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_ids: ids, permanent }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Aus Result entfernen
      setResult(prev => prev ? {
        ...prev,
        spam:    prev.spam.filter(m => !selected.has(m.entryId)),
        unknown: prev.unknown.filter(m => !selected.has(m.entryId)),
      } : null);
      setSelected(new Set());
      setProgress(`${data.count ?? ids.length} Mails gelöscht.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Löschen");
    }
  }, [apiUrl, selected]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!result) return;
    setSelected(new Set([...result.spam, ...result.unknown].map(m => m.entryId)));
  }, [result]);

  const selectNone = useCallback(() => setSelected(new Set()), []);

  return {
    status, result, error, progress, selected, outlookOnline,
    checkStatus, scan, deleteSelected, toggleSelect, selectAll, selectNone,
  };
}
