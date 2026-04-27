import { useEffect, useState } from "react";
import "./today-schedule-card.css";

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  start?: string | null;
  end?: string | null;
  location?: string;
  description?: string;
  source?: string;
  all_day?: boolean;
};

type CalendarResponse = {
  ok?: boolean;
  date?: string;
  source?: string;
  active_provider?: string;
  fallback_reason?: string;
  connector_ready?: boolean;
  sync?: string;
  events?: CalendarEvent[];
  count?: number;
  empty_message?: string;
};

type CalendarProvider = {
  id: string;
  label: string;
  connectable?: boolean;
  connected?: boolean;
  active?: boolean;
  description?: string;
};

type CalendarStatus = {
  ok?: boolean;
  active_provider?: string;
  providers?: CalendarProvider[];
};

type Props = {
  onSend: (message: string) => void;
};

function formatDate(value?: string) {
  if (!value) return new Date().toLocaleDateString([], { weekday: "short", day: "2-digit", month: "2-digit" });
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "2-digit" });
  } catch {
    return value;
  }
}

function providerLabel(provider?: string) {
  if (provider === "google") return "Google";
  if (provider === "outlook") return "Outlook";
  return "Lokal";
}

export function TodayScheduleCard({ onSend }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [date, setDate] = useState("");
  const [source, setSource] = useState("local");
  const [activeProvider, setActiveProvider] = useState("local");
  const [providers, setProviders] = useState<CalendarProvider[]>([]);
  const [connectHint, setConnectHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    try {
      const response = await fetch("/api/calendar/status", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as CalendarStatus;
      if (response.ok) {
        setProviders(data.providers || []);
        setActiveProvider(data.active_provider || "local");
      }
    } catch {
      // Keep schedule usable even if status fails.
    }
  }

  async function loadSchedule() {
    setLoading(true);
    setError("");
    try {
      await loadStatus();
      const response = await fetch("/api/calendar/today?limit=5", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as CalendarResponse;
      if (!response.ok) throw new Error(typeof data === "object" ? JSON.stringify(data) : `HTTP ${response.status}`);
      setEvents(data.events || []);
      setDate(data.date || "");
      setSource(data.source || "local");
      setActiveProvider(data.active_provider || data.source || "local");
      if (data.fallback_reason) setConnectHint("Connector nicht aktiv, lokaler Fallback läuft.");
      else if (data.sync === "not_implemented_yet") setConnectHint("Connector vorbereitet, Sync folgt.");
      else setConnectHint("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function connectProvider(provider: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/calendar/connect/${provider}`, { method: "POST" });
      const data = await response.json().catch(() => ({})) as { ok?: boolean; message?: string; env_key?: string };
      setConnectHint(data.message || "Kalenderstatus aktualisiert.");
      if (!response.ok || data.ok === false) {
        if (data.env_key) setConnectHint(`${data.message} Token fehlt: ${data.env_key}`);
      }
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedule();
    const id = window.setInterval(() => void loadSchedule(), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="jarvis-card schedule-card">
      <div className="jarvis-card-title">
        <h2>HEUTIGE TERMINE</h2>
        <button onClick={() => void loadSchedule()}>{loading ? "• LÄDT" : `• ${providerLabel(source)}`}</button>
      </div>
      <div className="schedule-date-row">
        <span>{formatDate(date)} · {providerLabel(activeProvider)}</span>
        <button onClick={() => onSend("Fasse mir meine heutigen Termine kurz zusammen")}>ZUSAMMENFASSEN</button>
      </div>
      <div className="schedule-provider-row">
        {(providers.length ? providers : [{ id: "local", label: "Lokal", connected: true }, { id: "google", label: "Google" }, { id: "outlook", label: "Outlook" }]).map((provider) => (
          <button key={provider.id} className={provider.id === activeProvider ? "active" : ""} onClick={() => void connectProvider(provider.id)}>
            {provider.id === "local" ? "LOCAL" : provider.id.toUpperCase()}
          </button>
        ))}
      </div>
      {connectHint && <div className="schedule-connect-hint">{connectHint}</div>}
      <div className="schedule-list">
        {events.map((event) => (
          <button key={event.id} className="schedule-row" onClick={() => onSend(`Was ist wichtig an meinem Termin: ${event.title}?`)}>
            <span>{event.time}</span>
            <em><b>{event.title}</b>{event.location && <small>{event.location}</small>}</em>
          </button>
        ))}
        {!events.length && !error && <div className="schedule-empty">Keine Termine für heute.</div>}
        {error && <div className="schedule-empty warn">Kalender nicht erreichbar.</div>}
      </div>
    </section>
  );
}
