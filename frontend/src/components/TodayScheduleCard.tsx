import { useEffect, useState } from "react";

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
  events?: CalendarEvent[];
  count?: number;
  empty_message?: string;
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

export function TodayScheduleCard({ onSend }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSchedule() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/calendar/today?limit=5", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as CalendarResponse;
      if (!response.ok) throw new Error(typeof data === "object" ? JSON.stringify(data) : `HTTP ${response.status}`);
      setEvents(data.events || []);
      setDate(data.date || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEvents([]);
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
        <button onClick={() => void loadSchedule()}>{loading ? "• LÄDT" : "• LIVE"}</button>
      </div>
      <div className="schedule-date-row">
        <span>{formatDate(date)}</span>
        <button onClick={() => onSend("Fasse mir meine heutigen Termine kurz zusammen")}>ZUSAMMENFASSEN</button>
      </div>
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
