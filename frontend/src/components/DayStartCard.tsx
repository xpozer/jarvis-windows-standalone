import { useEffect, useState } from "react";
import "./day-start-card.css";

type DayStartTask = { id?: string; title: string; due?: string; priority?: string };
type DayStartTopic = { title: string; detail?: string; priority?: string };
type DayStartEvent = { id: string; title: string; time: string; location?: string };
type DayStartWeather = {
  ok?: boolean;
  location?: string;
  temperature_c?: number | null;
  humidity_percent?: number | null;
  precipitation_mm?: number | null;
  wind_kmh?: number | null;
  label?: string;
};

type DayStartData = {
  ok?: boolean;
  headline?: string;
  important?: string[];
  tasks?: DayStartTask[];
  exam_topics?: DayStartTopic[];
  calendar?: { events?: DayStartEvent[]; count?: number; source?: string; active_provider?: string };
  weather?: DayStartWeather;
};

type Props = {
  onSend: (message: string) => void;
};

function fmt(value?: number | null, suffix = "") {
  return typeof value === "number" ? `${Math.round(value)}${suffix}` : "N/A";
}

export function DayStartCard({ onSend }: Props) {
  const [data, setData] = useState<DayStartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function loadDayStart() {
    setLoading(true);
    try {
      const response = await fetch("/api/day-start", { cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as DayStartData;
      if (response.ok) setData(payload);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDayStart();
  }, []);

  if (collapsed) {
    return (
      <section className="day-start-card day-start-card-collapsed">
        <button onClick={() => setCollapsed(false)}>TAGESSTART ÖFFNEN</button>
      </section>
    );
  }

  const events = data?.calendar?.events || [];
  const tasks = data?.tasks || [];
  const topics = data?.exam_topics || [];
  const weather = data?.weather || {};

  return (
    <section className="day-start-card">
      <div className="day-start-head">
        <div>
          <small>AUTOMATISCHER TAGESSTART</small>
          <h2>{data?.headline || "Start in den Tag"}</h2>
        </div>
        <div className="day-start-head-actions">
          <button onClick={() => void loadDayStart()}>{loading ? "LÄDT" : "AKTUALISIEREN"}</button>
          <button onClick={() => setCollapsed(true)}>MIN</button>
        </div>
      </div>

      <div className="day-start-important">
        {(data?.important || ["Kurzer Überblick wird geladen..."]).slice(0, 3).map((item) => <span key={item}>{item}</span>)}
      </div>

      <div className="day-start-grid">
        <div>
          <h3>Offene Aufgaben</h3>
          {tasks.slice(0, 3).map((task) => <p key={task.id || task.title}><b>{task.title}</b><em>{task.priority || "offen"}</em></p>)}
          {!tasks.length && <p><b>Keine offenen Aufgaben gefunden</b><em>ruhig</em></p>}
        </div>
        <div>
          <h3>Prüfung</h3>
          {topics.slice(0, 2).map((topic) => <p key={topic.title}><b>{topic.title}</b><em>{topic.priority || "mittel"}</em></p>)}
        </div>
        <div>
          <h3>Kalender</h3>
          {events.slice(0, 3).map((event) => <p key={event.id}><b>{event.time} · {event.title}</b><em>{event.location || data?.calendar?.active_provider || "Kalender"}</em></p>)}
          {!events.length && <p><b>Keine Termine heute</b><em>{data?.calendar?.active_provider || "lokal"}</em></p>}
        </div>
        <div className="day-start-weather">
          <h3>Wetter Telemetrie</h3>
          <div className="weather-row"><span>TEMP</span><b>{fmt(weather.temperature_c, "°")}</b></div>
          <div className="weather-row"><span>HUM</span><b>{fmt(weather.humidity_percent, "%")}</b></div>
          <div className="weather-row"><span>RAIN</span><b>{fmt(weather.precipitation_mm, "mm")}</b></div>
          <div className="weather-row"><span>WIND</span><b>{fmt(weather.wind_kmh, "km/h")}</b></div>
        </div>
      </div>

      <div className="day-start-footer">
        <button onClick={() => onSend("Fasse mir meinen Tagesstart kurz zusammen und sag mir, womit ich anfangen soll.")}>JARVIS PRIORISIEREN LASSEN</button>
        <span>{weather.location || "Leverkusen"} · {weather.label || "Telemetrie"}</span>
      </div>
    </section>
  );
}
